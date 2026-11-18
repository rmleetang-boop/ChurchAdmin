import type { DepartmentWorkspace } from "@shared/departmentFeatures";
import { DEPARTMENTS } from "./demo";

export const DEPARTMENT_SAMPLES: DepartmentWorkspace[] = DEPARTMENTS.map((name, index) => ({
  id: index + 1,
  name,
  branchId: 1,
  leadName: "Unassigned",
  description: "",
  memberCount: 0,
  features: [],
}));
