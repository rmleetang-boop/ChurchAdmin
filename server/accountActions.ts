import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "./_core/trpc";
import { emailInput } from "../shared/access";

const password = z.string().min(8, "Use at least 8 characters.").max(1024);
const code = z
  .string()
  .trim()
  .regex(/^\d{6,10}$/, "Enter the code in your email.");
const unavailable = () =>
  new TRPCError({
    code: "SERVICE_UNAVAILABLE",
    message: "Account services are unavailable. Please try again later.",
  });
async function authRequest(path: string, body: unknown, token?: string) {
  const host = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!host?.startsWith("https://") || !key) throw unavailable();
  const response = await fetch(new URL("/auth/v1/" + path, host), {
    method: token ? "PUT" : "POST",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => {
    throw unavailable();
  });
  if (response.status === 429)
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Please wait before requesting another code.",
    });
  if (response.status >= 500 || (response.status === 401 && !token))
    throw unavailable();
  return response;
}
async function verify(
  email: string,
  token: string,
  type: "signup" | "recovery"
) {
  const response = await authRequest("verify", { email, token, type });
  if (!response.ok)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "That code is invalid or has expired. Request a new code.",
    });
  return response.json();
}
export const accountActions = {
  register: publicProcedure
    .input(z.object({ email: emailInput, password }))
    .mutation(async ({ input }) => {
      const response = await authRequest("signup", input);
      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        if (detail.code === "weak_password")
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Choose a stronger password and try again.",
          });
        if (!["user_already_exists", "email_exists"].includes(detail.code))
          throw unavailable();
      }
      return true;
    }),
  resendConfirmation: publicProcedure
    .input(z.object({ email: emailInput }))
    .mutation(async ({ input }) => {
      const response = await authRequest("resend", {
        type: "signup",
        email: input.email,
      });
      if (
        !response.ok &&
        !["email_exists", "user_not_found", "email_already_confirmed"].includes(
          (await response.json().catch(() => ({}))).code
        )
      )
        throw unavailable();
      return true;
    }),
  confirmRegistration: publicProcedure
    .input(z.object({ email: emailInput, code }))
    .mutation(async ({ input }) => {
      await verify(input.email, input.code, "signup");
      return true;
    }),
  requestReset: publicProcedure
    .input(z.object({ email: emailInput }))
    .mutation(async ({ input }) => {
      const response = await authRequest("recover", input);
      if (
        !response.ok &&
        (await response.json().catch(() => ({}))).code !== "user_not_found"
      )
        throw unavailable();
      return true;
    }),
  resetPassword: publicProcedure
    .input(z.object({ email: emailInput, code, password }))
    .mutation(async ({ input }) => {
      const session = await verify(input.email, input.code, "recovery");
      if (
        typeof session.access_token !== "string" ||
        !session.access_token ||
        session.user?.email?.toLowerCase() !== input.email
      )
        throw unavailable();
      const response = await authRequest(
        "user",
        { password: input.password },
        session.access_token
      );
      if (!response.ok)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Your password could not be updated. Request a new code and choose a different password.",
        });
      return true;
    }),
};
