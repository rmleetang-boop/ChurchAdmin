import { expect, it, vi } from "vitest";
import { profileInput } from "../shared/profile";
import { appRouter } from "./routers";
import * as access from "./teamAccess";
import type { TrpcContext } from "./_core/context";

it("validates profile dates and clears family size when household changes", () => {
  const basic = {
    fullName: " Member ",
    phone: "",
    address: "",
    birthDate: "",
    household: "Individual",
    householdSize: 3,
  };
  expect(profileInput.parse(basic)).toMatchObject({
    fullName: "Member",
    householdSize: null,
  });
  for (const birthDate of ["2025-02-30", "2999-01-01"])
    expect(profileInput.safeParse({ ...basic, birthDate }).success).toBe(false);
  expect(profileInput.safeParse({ ...basic, fullName: " " }).success).toBe(
    false
  );
});

it("restricts searching other member profiles to principal pastors", async () => {
  const rights = vi
    .spyOn(access, "rightsFor")
    .mockResolvedValue({ pastor: false, roles: { Choir: "Leader" } });
  try {
    await expect(
      appRouter
        .createCaller({
          user: { id: 2, role: "admin", openId: "choir" },
        } as TrpcContext)
        .profiles.findByEmail("member@example.org")
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      appRouter.createCaller({ user: null } as TrpcContext).profiles.mine()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  } finally {
    rights.mockRestore();
  }
});
