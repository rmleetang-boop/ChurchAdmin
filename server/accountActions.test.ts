import { afterEach, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
const auth = appRouter.createCaller({ user: null } as TrpcContext).auth;
const input = {
  email: "member@example.org",
  code: "123456",
  password: "new-password",
};
function provider() {
  vi.stubEnv("SUPABASE_URL", "https://auth.example.org");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "public-test");
  return vi.stubGlobal("fetch", vi.fn()).mocked(fetch);
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("requires successful email recovery before changing a password", async () => {
  const request = provider().mockResolvedValue(
    Response.json({}, { status: 403 })
  );
  await expect(auth.resetPassword(input)).rejects.toMatchObject({
    code: "BAD_REQUEST",
  });
  expect(request).toHaveBeenCalledTimes(1);
});
it("uses the verified recovery session for the password update", async () => {
  const request = provider()
    .mockResolvedValueOnce(
      Response.json({
        access_token: "recovery-session",
        user: { email: input.email },
      })
    )
    .mockResolvedValueOnce(Response.json({}));
  await expect(auth.resetPassword(input)).resolves.toBe(true);
  expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toEqual({
    type: "recovery",
    email: input.email,
    token: input.code,
  });
  expect(request.mock.calls[1][1]).toMatchObject({
    method: "PUT",
    headers: { Authorization: "Bearer recovery-session" },
    body: JSON.stringify({ password: input.password }),
  });
});
it("creates member credentials without allowing registration to assign privileges", async () => {
  const request = provider().mockResolvedValue(Response.json({}));
  await auth.register({ ...input, role: "Principal" } as typeof input);
  expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toEqual({
    email: input.email,
    password: input.password,
  });
});
