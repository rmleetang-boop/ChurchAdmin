import { TRPCError } from "@trpc/server";
import { and, eq, like, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { shareInput, sharedDepartments } from "../shared/reportSharing";
import { ministryReports, reportShares } from "../drizzle/schema";
import {
  fields,
  teams,
  reportInput,
  monthInput,
  type Team,
} from "../shared/reports";

import { protectedProcedure, router } from "./_core/trpc";

import { database, rightsFor, forbidden, dashboardGrants } from "./teamAccess";
async function visibility(user: { openId: string; email: string | null }) {
  const rights = await rightsFor(user.openId);
  const own = teams.filter(t => rights.roles[t]);
  const grants = rights.pastor ? [] : await dashboardGrants();
  const shared = sharedDepartments(grants, own, user.openId.startsWith("ghop:") ? user.email ?? undefined : undefined);
  return { ...rights, teams: teams.filter(t => rights.pastor || own.includes(t) || shared.includes(t)), shared };
}
async function requireExecutive(openId: string) {
  if (!(await rightsFor(openId)).pastor) throw forbidden();
}
export const reportsRouter = router({
  access: protectedProcedure.query(async ({ ctx }) => {
    return visibility(ctx.user);
  }),
  shares: protectedProcedure.query(async ({ctx}) => {
    await requireExecutive(ctx.user.openId);
    return (await database()).select().from(reportShares);
  }),
  share: protectedProcedure.input(shareInput).mutation(async ({ctx,input}) => {
    await requireExecutive(ctx.user.openId);
    await (await database()).insert(reportShares).values({id:randomUUID(), ...input})
      .onDuplicateKeyUpdate({set:{ recipient:input.recipient }});
  }),
  unshare: protectedProcedure.input(z.string().uuid()).mutation(async ({ctx,input}) => {
    await requireExecutive(ctx.user.openId);
    await (await database()).delete(reportShares).where(eq(reportShares.id,input));
  }),
  services: protectedProcedure.input(z.enum(teams)).query(async ({ctx,input:team})=>{
    const rights=await rightsFor(ctx.user.openId);
    if(!rights.pastor && !rights.roles[team]) throw forbidden();
    const rows=await (await database()).selectDistinct({activity:ministryReports.activity}).from(ministryReports)
      .where(eq(ministryReports.team,team)).orderBy(ministryReports.activity).limit(200);
    return rows.map(row=>row.activity);
  }),
  approve: protectedProcedure
    .input(z.object({ key: z.string().uuid(), team: z.enum(teams) }))
    .mutation(async ({ ctx, input }) => {
      const rights = await rightsFor(ctx.user.openId);
      if (!rights.pastor && rights.roles[input.team] !== "Leader")
        throw forbidden();
      const [result] = await (
        await database()
      )
        .update(ministryReports)
        .set({ status: "submitted" })
        .where(
          and(
            eq(ministryReports.key, input.key),
            eq(ministryReports.team, input.team),
            eq(ministryReports.status, "draft")
          )
        );
      if (!result.affectedRows)
        throw new TRPCError({
          code: "CONFLICT",
          message: "This draft is no longer awaiting submission.",
        });
      return true;
    }),
  list: protectedProcedure
    .input(z.object({ month: monthInput, team: z.enum(teams).optional(), combined: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      const rights = await visibility(ctx.user);
      if (input.team ? !rights.teams.includes(input.team) : !rights.pastor && !input.combined)
        throw forbidden();
      if (!rights.teams.length) return [];
      const draftsVisible = input.team && (rights.pastor || rights.roles[input.team]);
      const rows = await (
        await database()
      )
        .select()
        .from(ministryReports)
        .where(
          and(
            like(ministryReports.day, input.month + "-%"),
            draftsVisible ? undefined : eq(ministryReports.status, "submitted"),
            input.team ? eq(ministryReports.team, input.team) : inArray(ministryReports.team,rights.teams)
          )
        )
        .orderBy(desc(ministryReports.day), ministryReports.team);
      return rows.map(row => ({
        ...row,
        details: JSON.parse(row.details) as Record<string, string>,
      }));
    }),
  submit: protectedProcedure
    .input(reportInput)
    .mutation(async ({ ctx, input }) => {
      const rights = await rightsFor(ctx.user.openId);
      const role = rights.roles[input.team];
      if (!rights.pastor && role !== "Data capturer" && role !== "Leader")
        throw forbidden();
      const db = await database();
      const details = JSON.stringify(
        Object.fromEntries(
          fields[input.team]
            .filter(k => input.details[k])
            .map(k => [k, input.details[k]])
        )
      );
      const status =
        rights.pastor || role === "Leader"
          ? ("submitted" as const)
          : ("draft" as const);
      const record = { ...input, status, author: ctx.user.id, details };
      await db
        .insert(ministryReports)
        .values(record)
        .onDuplicateKeyUpdate({ set: { key: input.key } });
      const [saved] = await db
        .select()
        .from(ministryReports)
        .where(eq(ministryReports.key, input.key));
      if (
        !saved ||
        Object.entries(record).some(
          ([k, v]) => saved[k as keyof typeof saved] !== v
        )
      )
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "This report has already been submitted with different entries.",
        });
      return { key: input.key, status };
    }),
});
