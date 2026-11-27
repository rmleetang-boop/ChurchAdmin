import { describe, expect, it } from "vitest";
import { shareInput, sharedDepartments } from "../shared/reportSharing";
const grants = [
  { source: "Charity", kind: "department", recipient: "Finance" },
  { source: "Choir", kind: "department", recipient: "Charity" },
  { source: "Media", kind: "email", recipient: "review@example.org" },
];
describe("dashboard sharing", () => {
  it("uses direct memberships only and drops revoked grants", () => {
    expect(sharedDepartments(grants, ["Finance"])).toEqual(["Charity"]);
    expect(sharedDepartments(grants.slice(1), ["Finance"])).toEqual([]);
  });
  it("matches only the verified recipient", () => {
    expect(sharedDepartments(grants, [], "REVIEW@example.org")).toEqual([
      "Media",
    ]);
    expect(sharedDepartments(grants, [])).toEqual([]);
  });
  it("validates dashboard recipients", () => {
    expect(
      shareInput.safeParse({
        source: "Finance",
        kind: "department",
        recipient: "Finance",
      }).success
    ).toBe(false);
    expect(
      shareInput.safeParse({
        source: "Finance",
        kind: "email",
        recipient: "Member@Example.org",
      }).data?.recipient
    ).toBe("member@example.org");
  });
});
