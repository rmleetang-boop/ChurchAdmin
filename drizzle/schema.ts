import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "overseer"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const churches = mysqlTable("churches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 180 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ZAR").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const churchBranches = mysqlTable("church_branches", {
  id: int("id").autoincrement().primaryKey(),
  churchId: int("churchId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  city: varchar("city", { length: 120 }),
  pastorName: varchar("pastorName", { length: 160 }),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const userBranchAccess = mysqlTable("user_branch_access", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  branchId: int("branchId").notNull(),
  accessLevel: mysqlEnum("accessLevel", ["pastor", "manager", "overseer"]).default("manager").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  leadName: varchar("leadName", { length: 160 }),
  memberCount: int("memberCount").default(0).notNull(),
  color: varchar("color", { length: 16 }).default("#6958d9").notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const churchMembers = mysqlTable("church_members", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  branchId: int("branchId"),
  phone: varchar("phone", { length: 32 }),
  whatsappOptIn: int("whatsappOptIn").default(1).notNull(),
  emailOptIn: int("emailOptIn").default(1).notNull(),
  status: mysqlEnum("status", ["visitor", "member", "leader", "inactive"]).default("visitor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const churchProjects = mysqlTable("church_projects", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  targetAmount: int("targetAmount").notNull(),
  raisedAmount: int("raisedAmount").default(0).notNull(),
  paymentLink: varchar("paymentLink", { length: 500 }),
  leaderId: int("leaderId").notNull(),
  status: mysqlEnum("status", ["draft", "active", "completed", "archived"]).default("active").notNull(),
  deadline: timestamp("deadline"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projectContributions = mysqlTable("project_contributions", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  projectId: int("projectId").notNull(),
  memberId: int("memberId"),
  contributorName: varchar("contributorName", { length: 160 }),
  amount: int("amount").notNull(),
  reference: varchar("reference", { length: 120 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const attendanceDeclarations = mysqlTable("attendance_declarations", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  memberId: int("memberId").notNull(),
  serviceDate: timestamp("serviceDate").notNull(),
  response: mysqlEnum("response", ["attending", "online", "not_attending", "undecided"]).default("undecided").notNull(),
  source: mysqlEnum("source", ["app", "email", "whatsapp", "leader"]).default("app").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const communicationCampaigns = mysqlTable("communication_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
  channel: mysqlEnum("channel", ["email", "whatsapp", "both"]).default("both").notNull(),
  audience: varchar("audience", { length: 120 }).default("active_members").notNull(),
  paymentLink: varchar("paymentLink", { length: 500 }),
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const memberNotifications = mysqlTable("member_notifications", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  memberId: int("memberId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["message", "event", "giving", "care", "system"]).default("message").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const prayerRequests = mysqlTable("prayer_requests", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  memberId: int("memberId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  request: text("request").notNull(),
  isPrivate: int("isPrivate").default(1).notNull(),
  status: mysqlEnum("status", ["new", "praying", "answered", "archived"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const testimonies = mysqlTable("testimonies", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  memberId: int("memberId").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  story: text("story").notNull(),
  permissionToShare: int("permissionToShare").default(0).notNull(),
  status: mysqlEnum("status", ["submitted", "reviewing", "published", "declined"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const sermons = mysqlTable("sermons", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId"),
  title: varchar("title", { length: 180 }).notNull(),
  preacher: varchar("preacher", { length: 160 }).notNull(),
  serviceDate: timestamp("serviceDate").notNull(),
  audioUrl: varchar("audioUrl", { length: 500 }),
  videoUrl: varchar("videoUrl", { length: 500 }),
  transcript: text("transcript"),
  highlights: text("highlights"),
  status: mysqlEnum("status", ["recorded", "transcribing", "ready", "distributed"]).default("recorded").notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Church = typeof churches.$inferSelect;
export type ChurchBranch = typeof churchBranches.$inferSelect;
export type UserBranchAccess = typeof userBranchAccess.$inferSelect;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;
export type ChurchProject = typeof churchProjects.$inferSelect;
export type InsertChurchProject = typeof churchProjects.$inferInsert;
export type ProjectContribution = typeof projectContributions.$inferSelect;
export type AttendanceDeclaration = typeof attendanceDeclarations.$inferSelect;
export type MemberNotification = typeof memberNotifications.$inferSelect;
export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type Testimony = typeof testimonies.$inferSelect;
export type Sermon = typeof sermons.$inferSelect;
