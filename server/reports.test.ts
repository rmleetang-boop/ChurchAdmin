import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { attendanceCount, reportInput, teams, weekOf } from "../shared/reports";

function caller(openId: string, role: "user" | "admin" = "user") {
  return appRouter.createCaller({
    user: { id: 1, openId, name: "Pastor Daniel", role },
  } as TrpcContext);
}
afterEach(() => vi.unstubAllEnvs());
describe("GHOP report permissions and summaries", () => {
  it("reserves church-wide reporting for the configured pastoral identities", async () => {
    vi.stubEnv("GHOP_DANIEL_OPEN_ID", "first");
    vi.stubEnv("GHOP_PHIWE_OPEN_ID", "second");
    for (const id of ["first", "second"])
      expect(await caller(id).reports.access()).toEqual({
        pastor: true,
        teams: [...teams],
      });
    await expect(
      caller("other", "admin").reports.list({ month: "2026-11" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller("other", "admin").network.overview()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks access to another department even for an authenticated reporter", async () => {
    vi.stubEnv(
      "GHOP_TEAM_ASSIGNMENTS",
      JSON.stringify({ reporter: ["Media"] })
    );
    expect((await caller("reporter").reports.access()).teams).toEqual([
      "Media",
    ]);
    await expect(
      caller("reporter").reports.list({ team: "Finance", month: "2026-11" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      appRouter.createCaller({ user: null } as TrpcContext).reports.access()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("handles calendar boundaries and rejects invalid and unrelated fields", () => {
    expect(weekOf("2026-11-01")).toBe("2026-10-26");
    expect(
      attendanceCount({
        "Men present": "2",
        "Women present": "3",
        "Children present": "0",
      })
    ).toBe(5);
    const base = {
      key: "0479bc9a-2b2e-42cb-a2fc-81f6c34b00f1",
      team: "Attendance",
      day: "2026-11-01",
      activity: "Test",
      details: {},
      received: 0,
      spent: 0,
      needs: "",
      next: "",
    };
    expect(reportInput.safeParse(base).success).toBe(true);
    for (const change of [
      { day: "2026-02-30" },
      { details: { "Children present": "-1" } },
      { details: { "Amount pledged": "1" } },
    ])
      expect(reportInput.safeParse({ ...base, ...change }).success).toBe(false);
  });
});
