import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { attendanceDeclarations, churchProjects, communicationCampaigns, InsertUser, memberNotifications, prayerRequests, projectContributions, testimonies, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listChurchProjects() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(churchProjects).orderBy(desc(churchProjects.createdAt));
}

export async function getChurchProject(id: number) {
  const db = await getDb(); if (!db) return undefined;
  const result = await db.select().from(churchProjects).where(eq(churchProjects.id, id)).limit(1);
  return result[0];
}

export async function createChurchProject(input: typeof churchProjects.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  const result = await db.insert(churchProjects).values(input);
  return getChurchProject(Number(result[0].insertId));
}

export async function updateChurchProject(id: number, input: Partial<typeof churchProjects.$inferInsert>) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  await db.update(churchProjects).set(input).where(eq(churchProjects.id, id));
  return getChurchProject(id);
}

export async function deleteChurchProject(id: number) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  await db.delete(churchProjects).where(eq(churchProjects.id, id));
  return { success: true } as const;
}

export async function addProjectContribution(input: typeof projectContributions.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  await db.insert(projectContributions).values(input);
  await db.update(churchProjects).set({ raisedAmount: sql`${churchProjects.raisedAmount} + ${input.amount}` }).where(eq(churchProjects.id, input.projectId));
  return getChurchProject(input.projectId);
}

export async function createAttendanceDeclaration(input: typeof attendanceDeclarations.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  await db.insert(attendanceDeclarations).values(input);
  return { saved: true } as const;
}

export async function createCommunicationCampaign(input: typeof communicationCampaigns.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  const result = await db.insert(communicationCampaigns).values(input);
  return { id: Number(result[0].insertId), ...input };
}

export async function listMemberGiving(memberId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(projectContributions).where(eq(projectContributions.memberId, memberId)).orderBy(desc(projectContributions.createdAt));
}

export async function listMemberAttendance(memberId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(attendanceDeclarations).where(eq(attendanceDeclarations.memberId, memberId)).orderBy(desc(attendanceDeclarations.serviceDate));
}

export async function listMemberNotifications(memberId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(memberNotifications).where(eq(memberNotifications.memberId, memberId)).orderBy(desc(memberNotifications.createdAt));
}

export async function createPrayerRequest(input: typeof prayerRequests.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  const result = await db.insert(prayerRequests).values(input);
  return { id: Number(result[0].insertId), ...input };
}

export async function listMemberPrayerRequests(memberId: number) {
  const db = await getDb(); if (!db) return [];
  return db.select().from(prayerRequests).where(eq(prayerRequests.memberId, memberId)).orderBy(desc(prayerRequests.createdAt));
}

export async function createTestimony(input: typeof testimonies.$inferInsert) {
  const db = await getDb(); if (!db) throw new Error("Database is not configured");
  const result = await db.insert(testimonies).values(input);
  return { id: Number(result[0].insertId), ...input };
}

export async function listTestimonies() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(testimonies).orderBy(desc(testimonies.createdAt));
}

export async function listPrayerRequests() {
  const db = await getDb(); if (!db) return [];
  return db.select().from(prayerRequests).orderBy(desc(prayerRequests.createdAt));
}
