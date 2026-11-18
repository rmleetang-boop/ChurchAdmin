import { z } from "zod";
import { reportDay } from "./reports";

export const households = [
  "Individual",
  "Part of a family",
  "Prefer not to say",
] as const;
export const profileInput = z
  .object({
    fullName: z.string().trim().min(1).max(160),
    phone: z.string().trim().max(32),
    birthDate: z.union([
      z.literal(""),
      reportDay.refine(
        day =>
          day <=
          new Date().toLocaleDateString("sv-SE", {
            timeZone: "Africa/Johannesburg",
          }),
        "Choose a past or current birth date"
      ),
    ]),
    address: z.string().trim().max(350),
    household: z.enum(households),
    householdSize: z.number().int().positive().max(999).nullable(),
  })
  .transform(profile => ({
    ...profile,
    householdSize:
      profile.household === "Part of a family" ? profile.householdSize : null,
  }));
export type Profile = z.infer<typeof profileInput>;
