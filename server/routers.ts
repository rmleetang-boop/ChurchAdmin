import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, overseerProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addProjectContribution, createAttendanceDeclaration, createChurchProject, createCommunicationCampaign, createDepartment, createPrayerRequest, createSermon, createTestimony, deleteChurchProject, getChurchProject, listChurchNetwork, listDepartments, listMemberAttendance, listMemberGiving, listMemberNotifications, listMemberPrayerRequests, listPrayerRequests, listSermons, listTestimonies, listChurchProjects, markSermonDistributed, updateChurchProject } from "./db";
import { storageGetSignedUrl, storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import { pickSermonHighlights } from "../shared/sermonUtils";

const projectInput = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  targetAmount: z.number().int().positive(),
  paymentLink: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "active", "completed", "archived"]).default("active"),
  deadline: z.date().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  projects: router({
    list: protectedProcedure.query(() => listChurchProjects()),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => getChurchProject(input.id)),
    create: adminProcedure.input(projectInput).mutation(({ input, ctx }) => createChurchProject({ ...input, leaderId: ctx.user.id, paymentLink: input.paymentLink || null })),
    update: adminProcedure.input(z.object({ id: z.number().int().positive(), changes: projectInput.partial() })).mutation(({ input }) => updateChurchProject(input.id, { ...input.changes, paymentLink: input.changes.paymentLink || null })),
    delete: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => deleteChurchProject(input.id)),
    contribute: protectedProcedure.input(z.object({ projectId: z.number().int().positive(), amount: z.number().int().positive(), contributorName: z.string().optional(), reference: z.string().optional() })).mutation(({ input }) => addProjectContribution(input)),
  }),
  attendance: router({
    declare: protectedProcedure.input(z.object({ serviceDate: z.date(), response: z.enum(["attending", "online", "not_attending", "undecided"]), source: z.enum(["app", "email", "whatsapp", "leader"]).default("app") })).mutation(({ input, ctx }) => createAttendanceDeclaration({ ...input, memberId: ctx.user.id })),
    history: protectedProcedure.query(({ ctx }) => listMemberAttendance(ctx.user.id)),
  }),
  member: router({
    givingHistory: protectedProcedure.query(({ ctx }) => listMemberGiving(ctx.user.id)),
    notifications: protectedProcedure.query(({ ctx }) => listMemberNotifications(ctx.user.id)),
    prayerRequests: protectedProcedure.query(({ ctx }) => listMemberPrayerRequests(ctx.user.id)),
    submitPrayer: protectedProcedure.input(z.object({ title: z.string().min(2), request: z.string().min(5), isPrivate: z.boolean().default(true) })).mutation(({ input, ctx }) => createPrayerRequest({ ...input, memberId: ctx.user.id, isPrivate: input.isPrivate ? 1 : 0 })),
    submitTestimony: protectedProcedure.input(z.object({ title: z.string().min(2), story: z.string().min(10), permissionToShare: z.boolean().default(false) })).mutation(({ input, ctx }) => createTestimony({ ...input, memberId: ctx.user.id, permissionToShare: input.permissionToShare ? 1 : 0 })),
  }),
  admin: router({
    prayerRequests: adminProcedure.query(() => listPrayerRequests()),
    testimonies: adminProcedure.query(() => listTestimonies()),
    departments: router({
      list: adminProcedure.input(z.object({ branchId: z.number().int().positive().optional() }).optional()).query(({ input }) => listDepartments(input?.branchId)),
      create: adminProcedure.input(z.object({ branchId: z.number().int().positive(), name: z.string().min(2), leadName: z.string().optional(), memberCount: z.number().int().nonnegative().default(0), color: z.string().default("#6958d9") })).mutation(({ input }) => createDepartment(input)),
    }),
  }),
  network: router({
    overview: overseerProcedure.query(() => listChurchNetwork()),
  }),
  sermons: router({
    list: protectedProcedure.query(() => listSermons()),
    record: adminProcedure.input(z.object({ title: z.string().min(2), preacher: z.string().min(2), serviceDate: z.date(), audioBase64: z.string().min(10), audioMimeType: z.string().default("audio/webm"), videoUrl: z.string().url().optional().or(z.literal("")), videoBase64: z.string().optional(), videoMimeType: z.string().optional() })).mutation(async ({ input, ctx }) => {
      const raw = input.audioBase64.replace(/^data:[^;]+;base64,/, "");
      const audio = Buffer.from(raw, "base64");
      if (audio.byteLength > 16 * 1024 * 1024) throw new Error("Audio must be 16MB or smaller");
      const ext = input.audioMimeType.includes("mp4") ? "m4a" : input.audioMimeType.includes("wav") ? "wav" : "webm";
      const uploaded = await storagePut(`sermons/${ctx.user.id}-${Date.now()}.${ext}`, audio, input.audioMimeType);
      let savedVideoUrl = input.videoUrl || null;
      if (input.videoBase64) {
        const video = Buffer.from(input.videoBase64.replace(/^data:[^;]+;base64,/, ""), "base64");
        if (video.byteLength > 100 * 1024 * 1024) throw new Error("Video must be 100MB or smaller");
        const videoUpload = await storagePut(`sermons/${ctx.user.id}-${Date.now()}.video`, video, input.videoMimeType || "video/mp4");
        savedVideoUrl = videoUpload.url;
      }
      const signedUrl = await storageGetSignedUrl(uploaded.key);
      const transcriptResult = await transcribeAudio({ audioUrl: signedUrl, language: "en", prompt: "Transcribe a church sermon with clear speaker wording and key teachings." });
      if ("error" in transcriptResult) throw new Error(transcriptResult.error);
      const segments = pickSermonHighlights(transcriptResult.segments ?? []);
      return createSermon({ title: input.title, preacher: input.preacher, serviceDate: input.serviceDate, audioUrl: uploaded.url, videoUrl: savedVideoUrl, transcript: transcriptResult.text, highlights: JSON.stringify(segments), status: "ready", createdBy: ctx.user.id });
    }),
    distribute: adminProcedure.input(z.object({ id: z.number().int().positive(), channel: z.enum(["email", "whatsapp", "both"]), paymentLink: z.string().url().optional().or(z.literal("")) })).mutation(({ input }) => markSermonDistributed(input.id)),
  }),
  communications: router({
    create: adminProcedure.input(z.object({ title: z.string().min(2), body: z.string().min(2), channel: z.enum(["email", "whatsapp", "both"]), audience: z.string().default("active_members"), paymentLink: z.string().url().optional().or(z.literal("")), scheduledFor: z.date().optional() })).mutation(({ input, ctx }) => createCommunicationCampaign({ ...input, paymentLink: input.paymentLink || null, createdBy: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
