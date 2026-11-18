import { z } from "zod";
import { teams, type Team } from "./reports";

export const roles = ["Leader", "Data capturer", "Viewer"] as const;
export const principals = ["Pastor Daniel", "Pastor Phiwe"] as const;
export type Role = (typeof roles)[number];
export const emailInput = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform(s => s.toLowerCase());
export const assignment = z.object({
  team: z.enum(teams),
  email: emailInput,
  role: z.enum(roles),
});
export const setupPlan = z
  .object({
    daniel: emailInput,
    pway: emailInput,
    assignments: z.array(assignment).max(500),
  })
  .superRefine((p, ctx) => {
    if (p.daniel === p.pway)
      ctx.addIssue({
        code: "custom",
        message: "Each pastor needs a separate email.",
      });
    const keys = p.assignments.map(a => a.team + "|" + a.email);
    if (new Set(keys).size !== keys.length)
      ctx.addIssue({
        code: "custom",
        message: "Use one role per email within each department.",
      });
  });
export type Plan = z.infer<typeof setupPlan>;
export type Rights = { pastor: boolean; roles: Partial<Record<Team, Role>> };
export function canDelegate(
  rights: Rights,
  team: Team,
  target: Role,
  previous?: Role
) {
  return (
    rights.pastor ||
    (rights.roles[team] === "Leader" &&
      target !== "Leader" &&
      previous !== "Leader")
  );
}
