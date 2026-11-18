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

export function isPastor(openId: string) {
  return (
    Boolean(openId) &&
    [process.env.GHOP_DANIEL_OPEN_ID, process.env.GHOP_PHIWE_OPEN_ID].includes(
      openId
    )
  );
}
export function assignedTeams(openId: string): Team[] {
  if (isPastor(openId)) return [...teams];
  const assignments = z
    .record(z.string(), z.array(z.enum(teams)))
    .parse(JSON.parse(process.env.GHOP_TEAM_ASSIGNMENTS || "{}"));
  return Object.hasOwn(assignments, openId) ? assignments[openId] : [];
}
const database = async () => {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "The church database connection is pending.",
    });
  return db;
};
function authorize(openId: string, team?: Team) {
  const allowed = team
    ? assignedTeams(openId).includes(team)
    : isPastor(openId);
  if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });
}
export const reportsRouter = router({
  access: protectedProcedure.query(({ ctx }) => ({
    pastor: isPastor(ctx.user.openId),
    teams: assignedTeams(ctx.user.openId),
  })),
  list: protectedProcedure
    .input(z.object({ month: monthInput, team: z.enum(teams).optional() }))
    .query(async ({ ctx, input }) => {
      authorize(ctx.user.openId, input.team);
      const rows = await (
        await database()
      )
        .select()
        .from(ministryReports)
        .where(
          and(
            like(ministryReports.day, input.month + "-%"),
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
      authorize(ctx.user.openId, input.team);
      const db = await database();
      const details = JSON.stringify(
        Object.fromEntries(
          fields[input.team]
            .filter(k => input.details[k])
            .map(k => [k, input.details[k]])
        )
      );
      const record = { ...input, author: ctx.user.id, details };
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
      return { key: input.key };
    }),
});
