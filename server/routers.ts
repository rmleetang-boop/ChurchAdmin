import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { addProjectContribution, createAttendanceDeclaration, createChurchProject, createCommunicationCampaign, deleteChurchProject, getChurchProject, listChurchProjects, updateChurchProject } from "./db";

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
  }),
  communications: router({
    create: adminProcedure.input(z.object({ title: z.string().min(2), body: z.string().min(2), channel: z.enum(["email", "whatsapp", "both"]), audience: z.string().default("active_members"), paymentLink: z.string().url().optional().or(z.literal("")), scheduledFor: z.date().optional() })).mutation(({ input, ctx }) => createCommunicationCampaign({ ...input, paymentLink: input.paymentLink || null, createdBy: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
