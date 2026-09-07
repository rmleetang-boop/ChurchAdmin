import { eq, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { departments, departmentFeatureRequests } from "../drizzle/schema";
import { getDb } from "./db";
import type { DepartmentInput, DepartmentWorkspace, FeatureInput, FeatureStatus } from "../shared/departmentFeatures";

const requireDb = async () => {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Connect the church database to save shared department requests." });
  return db;
};

export async function listDepartmentWorkspaces(): Promise<DepartmentWorkspace[]> {
  const db = await requireDb();
  const rows = await db.select().from(departments).orderBy(departments.name);
  const requests = rows.length ? await db.select().from(departmentFeatureRequests)
    .where(inArray(departmentFeatureRequests.departmentId, rows.map(row => row.id))).orderBy(desc(departmentFeatureRequests.createdAt)) : [];
  return rows.map(row => ({
    id: row.id, name: row.name, leadName: row.leadName || "Unassigned", branchId: row.branchId,
    description: row.description || "", memberCount: row.memberCount,
    features: requests.filter(request => request.departmentId === row.id).map(request => ({
      id: request.id, title: request.title, description: request.description, priority: request.priority,
      status: request.status, teamNotes: request.teamNotes || "", createdAt: request.createdAt.toISOString(),
    })),
  }));
}

export async function createDepartmentWorkspace(input: DepartmentInput, userId: number) {
  const db = await requireDb();
  return db.transaction(async tx => {
    const names = await tx.select({ name: departments.name }).from(departments).where(eq(departments.branchId, input.branchId));
    if (names.some(row => row.name.toLowerCase() === input.name.toLowerCase())) {
      throw new TRPCError({ code: "CONFLICT", message: "This department already exists in this branch." });
    }
    const [result] = await tx.insert(departments).values({ name: input.name, leadName: input.leadName, branchId: input.branchId, description: input.description, color: "#3e806d" });
    const id = Number(result.insertId);
    await tx.insert(departmentFeatureRequests).values(input.features.map(feature => ({ ...feature, departmentId: id, requestedBy: userId })));
    return { id };
  });
}

export async function addDepartmentFeature(departmentId: number, input: FeatureInput, userId: number) {
  const db = await requireDb();
  const [department] = await db.select({ id: departments.id }).from(departments).where(eq(departments.id, departmentId)).limit(1);
  if (!department) throw new TRPCError({ code: "NOT_FOUND", message: "Department not found" });
  const [result] = await db.insert(departmentFeatureRequests).values({ ...input, departmentId, requestedBy: userId });
  return { id: Number(result.insertId) };
}

export async function updateDepartmentFeature(id: number, status: FeatureStatus, teamNotes: string) {
  const db = await requireDb();
  const [request] = await db.select({ id: departmentFeatureRequests.id }).from(departmentFeatureRequests).where(eq(departmentFeatureRequests.id, id)).limit(1);
  if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found" });
  await db.update(departmentFeatureRequests).set({ status, teamNotes }).where(eq(departmentFeatureRequests.id, id));
  return { id, status, teamNotes };
}