import { randomBytes, randomUUID, createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { ministryAccess, reportShares } from "../drizzle/schema";
import {
  assignment,
  canDelegate,
  principals,
  setupPlan,
  roles,
  type Role,
  type Rights,
} from "../shared/access";
import { teams, type Team } from "../shared/reports";
import { designation } from "./designatedAccounts";
import { getUserByOpenId, getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

export const forbidden = () => new TRPCError({ code: "FORBIDDEN" });
export async function database() {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "The church database connection is pending.",
    });
  return db;
}
export async function dashboardGrants() {
  return (await database()).select().from(reportShares);
}
export async function rightsFor(openId: string): Promise<Rights> {
  const rows = await (await database())
    .select()
    .from(ministryAccess)
    .where(eq(ministryAccess.openId, openId));
  const designated = openId.startsWith("ghop:") ? designation(await getUserByOpenId(openId)) : undefined;
  const rights: Rights = { pastor: designated === "Pastor Daniel" || designated === "Pastor Phiwe", roles: {} };
  for (const row of rows) {
    if ((principals.some(p => p === row.scope) || row.scope === "Pastor Pway") && row.role === "Principal")
      rights.pastor = true;
    if (teams.includes(row.scope as Team) && roles.includes(row.role as Role))
      rights.roles[row.scope as Team] = row.role as Role;
  }
  return rights;
}
const hash = (code: string) => createHash("sha256").update(code).digest("hex");
function invite(
  scope: string,
  email: string,
  role: string,
  id = randomUUID() as string
) {
  const code = randomBytes(24).toString("hex");
  return {
    record: { id, scope, email, role, openId: null, invitation: hash(code) },
    code,
    email,
    scope,
  };
}
const publicTicket = ({
  email,
  scope,
  code,
}: {
  email: string;
  scope: string;
  code: string;
}) => ({ email, scope, code });
const owner = (openId: string) =>
  Boolean(openId) && process.env.OWNER_OPEN_ID === openId;
export const accessRouter = router({
  bootstrap: protectedProcedure
    .input(setupPlan)
    .mutation(async ({ ctx, input }) => {
      if (!owner(ctx.user.openId)) throw forbidden();
      const tickets = [
        invite(principals[0], input.daniel, "Principal", "principal-daniel"),
        invite(principals[1], input.pway, "Principal", "principal-pway"),
        ...input.assignments.map(a => invite(a.team, a.email, a.role)),
      ];
      // Fixed principal IDs prevent a second bootstrap, including simultaneous requests.
      await (await database())
        .insert(ministryAccess)
        .values(tickets.map(t => t.record));
      return tickets.map(publicTicket);
    }),
  claim: protectedProcedure
    .input(z.string().regex(/^[0-9a-f]{48}$/))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.email) throw forbidden();
      const [result] = await (
        await database()
      )
        .update(ministryAccess)
        .set({ openId: ctx.user.openId, invitation: null })
        .where(
          and(
            eq(ministryAccess.invitation, hash(input)),
            eq(ministryAccess.email, ctx.user.email.trim().toLowerCase())
          )
        );
      if (result.affectedRows !== 1)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation is invalid or belongs to a different email.",
        });
      return true;
    }),
  setupAvailable: protectedProcedure.query(async ({ ctx }) => {
    if (!owner(ctx.user.openId)) return false;
    const rows = await (await database())
      .select({ id: ministryAccess.id })
      .from(ministryAccess)
      .where(eq(ministryAccess.id, "principal-daniel"));
    return !rows.length;
  }),
  roster: protectedProcedure.query(async ({ ctx }) => {
    const rights = await rightsFor(ctx.user.openId);
    const managed = teams.filter(t => rights.roles[t] === "Leader");
    if (!rights.pastor && !managed.length) throw forbidden();
    const rows = await (
      await database()
    )
      .select({
        id: ministryAccess.id,
        team: ministryAccess.scope,
        email: ministryAccess.email,
        role: ministryAccess.role,
        identity: ministryAccess.openId,
      })
      .from(ministryAccess)
      .where(
        rights.pastor ? undefined : inArray(ministryAccess.scope, managed)
      );
    return rows.map(({ identity, ...r }) => ({
      ...r,
      team: r.team === "Pastor Pway" ? principals[1] : r.team,
      active: Boolean(identity),
    }));
  }),
  grant: protectedProcedure
    .input(assignment)
    .mutation(async ({ ctx, input }) => {
      const rights = await rightsFor(ctx.user.openId);
      if (!canDelegate(rights, input.team, input.role)) throw forbidden();
      return (await database()).transaction(async tx => {
        const [row] = await tx
          .select()
          .from(ministryAccess)
          .where(
            and(
              eq(ministryAccess.scope, input.team),
              eq(ministryAccess.email, input.email)
            )
          )
          .for("update");
        if (!canDelegate(rights, input.team, input.role, row?.role as Role))
          throw forbidden();
        if (row?.openId) {
          await tx
            .update(ministryAccess)
            .set({ role: input.role })
            .where(eq(ministryAccess.id, row.id));
          return [];
        }
        const ticket = invite(input.team, input.email, input.role, row?.id);
        if (row)
          await tx
            .update(ministryAccess)
            .set(ticket.record)
            .where(eq(ministryAccess.id, row.id));
        else await tx.insert(ministryAccess).values(ticket.record);
        return [publicTicket(ticket)];
      });
    }),
  revoke: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ ctx, input }) => {
      const rights = await rightsFor(ctx.user.openId);
      return (await database()).transaction(async tx => {
        const [row] = await tx
          .select()
          .from(ministryAccess)
          .where(eq(ministryAccess.id, input))
          .for("update");
        if (
          !row ||
          !teams.includes(row.scope as Team) ||
          !canDelegate(rights, row.scope as Team, row.role as Role)
        )
          throw forbidden();
        await tx.delete(ministryAccess).where(eq(ministryAccess.id, input));
        return true;
      });
    }),
});
