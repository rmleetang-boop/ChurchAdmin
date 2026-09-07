import { z } from "zod";

export const FEATURE_STATUSES = ["submitted", "in_review", "planned", "in_progress", "delivered"] as const;
export const FEATURE_STATUS_LABELS: Record<typeof FEATURE_STATUSES[number], string> = {
  submitted: "Submitted", in_review: "In review", planned: "Planned", in_progress: "In progress", delivered: "Delivered",
};
export const featureInput = z.object({
  title: z.string().trim().min(3, "Give the feature a title of at least 3 characters").max(120),
  description: z.string().trim().min(10, "Describe the feature in at least 10 characters").max(2000),
  priority: z.enum(["low", "medium", "high"]),
});
export const departmentInput = z.object({
  name: z.string().trim().min(2, "Add a department name").max(160),
  leadName: z.string().trim().min(2, "Add the department leader").max(160),
  branchId: z.number().int().min(1).max(5),
  description: z.string().trim().max(1000).default(""),
  features: z.array(featureInput).min(1, "Describe at least one feature you need").max(10),
});
export type FeatureInput = z.infer<typeof featureInput>;
export type DepartmentInput = z.infer<typeof departmentInput>;
export type FeatureStatus = typeof FEATURE_STATUSES[number];
export type DepartmentFeature = FeatureInput & { id: number; status: FeatureStatus; teamNotes: string; createdAt: string };
export type DepartmentWorkspace = {
  id: number; name: string; leadName: string; branchId: number; description: string;
  memberCount: number; features: DepartmentFeature[];
};