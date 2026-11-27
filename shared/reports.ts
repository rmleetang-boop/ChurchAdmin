import { z } from "zod";

export const teams = [
  "Finance",
  "Attendance",
  "Usher",
  "Cleaning",
  "Choir",
  "Charity",
  "Fundraising",
  "Youth",
  "Men",
  "Women",
  "Media",
  "Hospitality",
  "Intercessor",
  "Sunday School",
  "Moderation",
] as const;
export type Team = (typeof teams)[number];
const attendance = ["Men present", "Women present", "Children present"];
const meeting = [
  "Meeting focus",
  "Activities",
  "Participation",
  "Contributions",
  "Meeting day",
  "Next meeting",
];
export const fields: Record<Team, string[]> = {
  Finance: [
    "Receipts category",
    "Expense category",
    "Allocation purpose",
    "Allocation destination",
    "Amount allocated",
  ],
  Attendance: ["Service or gathering", ...attendance],
  Usher: [
    "Team attendance",
    "Rent contribution",
    "Material contributions",
    "Duty positions",
    "Service observations",
    ...attendance,
  ],
  Cleaning: [
    "Team attendance",
    "Rent contribution",
    "Team on duty",
    "Areas completed",
    "Supplies needed",
  ],
  Choir: [
    "Team attendance",
    "Rent contribution",
    "Opportunities",
    "Service leader",
    "Repertoire",
    "Rehearsal and performance",
  ],
  Charity: [
    "Deputy",
    "Team attendance",
    "Rent contribution",
    "Distribution date",
    "Food",
    "Clothing",
    "Shoes",
    "Distribution activity",
    "Items distributed",
    "Households served",
    "Outstanding needs",
  ],
  Fundraising: [
    "Event date",
    "Fundraising activities",
    "Campaign or event",
    "Amount pledged",
    "Outstanding pledges",
  ],
  Youth: meeting,
  Men: meeting,
  Women: [...meeting, "Monthly contributions"],
  Media: [
    "Team attendance",
    "Duty assignments",
    "Equipment used",
    "Technical issues",
  ],
  Hospitality: [
    "Visitor details",
    "Rent contribution",
    "Visitors welcomed",
    "Welcome activities",
    "Follow-up required",
  ],
  Intercessor: [
    "Session time",
    "Team attendance",
    "Offering or contribution",
    "Prayer programme",
    "Teaching focus",
    "Prayer points",
  ],
  "Sunday School": [
    "Offering",
    "Rent contribution",
    "Teacher",
    "Class",
    "Lesson",
    "Children present",
    "Homework",
  ],
  Moderation: [
    "Team attendance",
    "Moderator",
    "Service time",
    "Programme",
    "Prayer points",
  ],
};
for (const team of teams)
  fields[team] = ["Department leader", ...fields[team].filter(f=>f !== "Service time"), "Service time", "Comments"];
export const dateFields = new Set([
  "Distribution date",
  "Event date",
  "Meeting day",
]);
export const numberFields = new Set([
  ...attendance,
  "Households served",
  "Visitors welcomed",
  "Participation",
]);
export const moneyFields = new Set([
  "Rent contribution",
  "Monthly contributions",
  "Offering",
  "Offering or contribution",
  "Amount pledged",
  "Outstanding pledges",
  "Contributions",
  "Amount allocated",
]);
export const reportDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(value => {
    const d = new Date(value + "T00:00:00Z");
    return Number.isFinite(+d) && d.toISOString().slice(0, 10) === value;
  }, "Choose a valid date");
export const monthInput = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
export const reportInput = z
  .object({
    key: z.string().uuid(),
    team: z.enum(teams),
    day: reportDay,
    activity: z.string().trim().min(1).max(200),
    details: z.record(z.string(), z.string().trim().max(1500)),
    needs: z.string().trim().max(2000),
    next: z.string().trim().max(2000),
    received: z.number().int().min(0).max(999999999),
    spent: z.number().int().min(0).max(999999999),
  })
  .superRefine((r, ctx) => {
    for (const [field, value] of Object.entries(r.details)) {
      if (
        !fields[r.team].includes(field) ||
        (value && field === "Service time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) ||
        (value &&
          dateFields.has(field) &&
          !reportDay.safeParse(value).success) ||
        (value && numberFields.has(field) && !/^\d{1,7}$/.test(value)) ||
        (value &&
          moneyFields.has(field) &&
          !/^\d{1,7}(\.\d{1,2})?$/.test(value))
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid " + field,
          path: ["details", field],
        });
      }
    }
  });
export type ReportInput = z.infer<typeof reportInput>;
export function attendanceCount(details: Record<string, string>) {
  return attendance.reduce(
    (total, key) => total + Number(details[key] || 0),
    0
  );
}
export function weekOf(day: string) {
  const date = new Date(day + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}
