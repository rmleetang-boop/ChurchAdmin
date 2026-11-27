import { z } from "zod";
import { emailInput } from "./access";
import { teams, type Team } from "./reports";

export const shareInput = z
  .discriminatedUnion("kind", [
    z.object({
      source: z.enum(teams),
      kind: z.literal("department"),
      recipient: z.enum(teams),
    }),
    z.object({
      source: z.enum(teams),
      kind: z.literal("email"),
      recipient: emailInput,
    }),
  ])
  .refine(
    s => s.kind !== "department" || s.source !== s.recipient,
    "Choose a different department."
  );

export function sharedDepartments(
  grants: { source: string; kind: string; recipient: string }[],
  memberships: Team[],
  verifiedEmail?: string
) {
  const allowed = grants.filter(g =>
    g.kind === "department"
      ? memberships.some(t => t === g.recipient)
      : g.kind === "email" &&
        !!verifiedEmail &&
        g.recipient === verifiedEmail.trim().toLowerCase()
  );
  return teams.filter(t => allowed.some(g => g.source === t));
}
