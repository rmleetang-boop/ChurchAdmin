import { eq } from "drizzle-orm";
import { emailInput } from "../shared/access";
import { memberProfiles, users } from "../drizzle/schema";
import { profileInput } from "../shared/profile";
import { protectedProcedure, router } from "./_core/trpc";
import { database, forbidden, rightsFor } from "./teamAccess";

export const profilesRouter = router({
  findByEmail: protectedProcedure
    .input(emailInput)
    .query(async ({ ctx, input }) => {
      if (!(await rightsFor(ctx.user.openId)).pastor) throw forbidden();
      const [record] = await (await database())
        .select({ profile: memberProfiles, email: users.email })
        .from(users)
        .innerJoin(memberProfiles, eq(memberProfiles.userId, users.id))
        .where(eq(users.email, input))
        .limit(1);
      return record ?? null;
    }),
  mine: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await (await database())
      .select()
      .from(memberProfiles)
      .where(eq(memberProfiles.userId, ctx.user.id))
      .limit(1);
    return profile ?? null;
  }),
  save: protectedProcedure
    .input(profileInput)
    .mutation(async ({ ctx, input }) => {
      await (
        await database()
      )
        .insert(memberProfiles)
        .values({ userId: ctx.user.id, ...input })
        .onDuplicateKeyUpdate({ set: input });
      return true;
    }),
});
