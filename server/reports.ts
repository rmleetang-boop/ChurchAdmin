import { TRPCError } from "@trpc/server";
import { and, eq, like, desc } from "drizzle-orm";
import { z } from "zod";
import { ministryReports } from "../drizzle/schema";
import {
  fields,
  teams,
  reportInput,
  monthInput,
  type Team,
} from "../shared/reports";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

import { database, rightsFor, forbidden } from "./teamAccess";
export const reportsRouter = router({
  access: protectedProcedure.query(async ({ ctx }) => {
    const rights = await rightsFor(ctx.user.openId);
    return {
      ...rights,
      teams: teams.filter(t => rights.pastor || rights.roles[t]),
    };
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
    .input(z.object({ month: monthInput, team: z.enum(teams).optional() }))
    .query(async ({ ctx, input }) => {
      const rights = await rightsFor(ctx.user.openId);
      if (!rights.pastor && (!input.team || !rights.roles[input.team]))
        throw forbidden();
      const rows = await (
        await database()
      )
        .select()
        .from(ministryReports)
        .where(
          and(
            like(ministryReports.day, input.month + "-%"),
            input.team ? undefined : eq(ministryReports.status, "submitted"),
            input.team ? eq(ministryReports.team, input.team) : undefined
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
