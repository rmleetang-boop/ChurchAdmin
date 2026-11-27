import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canDelegate, setupPlan } from "../shared/access";
import * as access from "./teamAccess";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { attendanceCount, reportInput, teams, weekOf } from "../shared/reports";

function caller(openId: string, role: "user" | "admin" = "user") {
  return appRouter.createCaller({
    user: { id: 1, openId, name: "Pastor Daniel", role },
  } as TrpcContext);
}
beforeEach(() => { vi.spyOn(access,"dashboardGrants").mockResolvedValue([]); });
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
describe("GHOP report permissions and summaries", () => {
  it("reserves church-wide reporting for the configured pastoral identities", async () => {
    vi.spyOn(access, "rightsFor").mockImplementation(async id => ({
      pastor: ["first", "second"].includes(id),
      roles: {},
    }));
    for (const id of ["first", "second"])
      expect((await caller(id).reports.access()).teams).toEqual([...teams]);
    await expect(
      caller("other", "admin").reports.list({ month: "2026-11" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller("other", "admin").network.overview()
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("blocks access to another department even for an authenticated reporter", async () => {
    vi.spyOn(access, "rightsFor").mockResolvedValue({
      pastor: false,
      roles: { Media: "Data capturer" },
    });
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
  it("gives Finance the shared Charity view without delegation or submission rights", async () => {
    vi.spyOn(access,"rightsFor").mockResolvedValue({pastor:false, roles:{Finance:"Leader"}});
    vi.mocked(access.dashboardGrants).mockResolvedValue([{id:"example",source:"Charity",kind:"department",recipient:"Finance"}]);
    const api = caller("finance").reports;
    expect((await api.access()).teams).toEqual(["Finance","Charity"]);
    await expect(api.share({source:"Charity",kind:"department",recipient:"Media"})).rejects.toMatchObject({code:"FORBIDDEN"});
    await expect(api.submit({key:"0479bc9a-2b2e-42cb-a2fc-81f6c34b00f1",team:"Charity",day:"2026-11-01",activity:"Meeting",received:0,spent:0,needs:"",next:"",details:{}})).rejects.toMatchObject({code:"FORBIDDEN"});
  });
  it("restricts leader delegation and draft approval to the department", async () => {
    const leader = { pastor: false, roles: { Media: "Leader" as const } };
    expect(canDelegate(leader, "Media", "Data capturer")).toBe(true);
    expect(canDelegate(leader, "Media", "Leader")).toBe(false);
    expect(canDelegate(leader, "Media", "Viewer", "Leader")).toBe(false);
    expect(canDelegate(leader, "Finance", "Viewer")).toBe(false);
    vi.spyOn(access, "rightsFor").mockResolvedValue({
      pastor: false,
      roles: { Media: "Data capturer" },
    });
    await expect(
      caller("capturer").reports.approve({
        team: "Media",
        key: "0479bc9a-2b2e-42cb-a2fc-81f6c34b00f1",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      setupPlan.safeParse({
        daniel: "a@example.com",
        pway: "A@example.com",
        assignments: [],
      }).success
    ).toBe(false);
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
