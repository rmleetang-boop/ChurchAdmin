import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure } from "./_core/trpc";
import { upsertUser } from "./db";
import { database } from "./teamAccess";

const unavailable = () => new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Sign-in is unavailable. Please contact your ministry administrator." });
export const passwordLogin = publicProcedure
  .input(z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(1024) }))
  .mutation(async ({ ctx, input }) => {
    const host = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!host?.startsWith("https://") || !key || (process.env.JWT_SECRET?.length ?? 0) < 32 || !process.env.DATABASE_URL) throw unavailable();
    const response = await fetch(new URL("/auth/v1/token?grant_type=password", host), {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(8000),
      headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify(input),
    }).catch(() => { throw unavailable(); });
    if (response.status === 429) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait before trying again." });
    if (response.status >= 500) throw unavailable();
    const user = response.ok ? (await response.json()).user : undefined;
    if (!user?.email_confirmed_at || !z.string().uuid().safeParse(user.id).success || user.email?.toLowerCase() !== input.email.toLowerCase())
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Check your email and password and confirm your email address." });
    const openId = "ghop:" + user.id;
    const name = user.email;
    const maxAge = 8 * 60 * 60 * 1000;
    await database();
    await upsertUser({ openId, email: user.email, name, loginMethod: "password", lastSignedIn: new Date() });
    const token = await sdk.signSession({ openId, appId: "ghop-admin", name }, { expiresInMs: maxAge });
    ctx.res.cookie(COOKIE_NAME, token, { ...getSessionCookieOptions(ctx.req), sameSite: "lax", maxAge });
    return true;
  });
