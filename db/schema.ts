import {
  mysqlTable,
  varchar,
  text,
  int,
  double,
  datetime,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const positions = mysqlTable("positions", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }),
  description: text("description"),
  requiredSkills: text("requiredSkills"),
  bonusSkills: text("bonusSkills"),
  minExperience: int("minExperience"),
  maxExperience: int("maxExperience"),
  minEducation: varchar("minEducation", { length: 50 }),
  salaryMin: int("salaryMin"),
  salaryMax: int("salaryMax"),
  salaryRange: varchar("salaryRange", { length: 100 }),
  status: varchar("status", { length: 20 }).default("active"),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type Position = typeof positions.$inferSelect;
export type InsertPosition = typeof positions.$inferInsert;

export const candidates = mysqlTable("candidates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 100 }).notNull(),
  avatar: varchar("avatar", { length: 500 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  location: varchar("location", { length: 100 }),
  position: varchar("position", { length: 255 }),
  company: varchar("company", { length: 255 }),
  experience: int("experience"),
  education: varchar("education", { length: 255 }),
  skills: text("skills"),
  status: varchar("status", { length: 50 }).default("active"),
  source: varchar("source", { length: 100 }),
  salary: varchar("salary", { length: 100 }),
  salaryExpectation: int("salaryExpectation"),
  matchScore: double("matchScore"),
  intentScore: double("intentScore"),
  stage: varchar("stage", { length: 50 }).default("初筛"),
  notes: text("notes"),
  resumeUrl: varchar("resumeUrl", { length: 500 }),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

export const workHistories = mysqlTable("workHistories", {
  id: int("id").primaryKey().autoincrement(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  company: varchar("company", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }),
  startDate: varchar("startDate", { length: 50 }),
  endDate: varchar("endDate", { length: 50 }),
  description: text("description"),
  isCurrent: int("isCurrent").default(0),
});

export type WorkHistory = typeof workHistories.$inferSelect;

export const interviews = mysqlTable("interviews", {
  id: int("id").primaryKey().autoincrement(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  positionId: int("positionId").references(() => positions.id),
  stage: varchar("stage", { length: 100 }),
  interviewer: varchar("interviewer", { length: 255 }),
  scheduledTime: varchar("scheduledTime", { length: 50 }),
  type: varchar("type", { length: 50 }),
  status: varchar("status", { length: 50 }).default("pending"),
  scoreSkill: int("scoreSkill"),
  scoreProblem: int("scoreProblem"),
  scoreCommunication: int("scoreCommunication"),
  scoreTeamwork: int("scoreTeamwork"),
  scoreCulture: int("scoreCulture"),
  totalScore: double("totalScore"),
  feedback: text("feedback"),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = typeof interviews.$inferInsert;

export const offers = mysqlTable("offers", {
  id: int("id").primaryKey().autoincrement(),
  candidateId: int("candidateId").notNull().references(() => candidates.id),
  positionId: int("positionId").references(() => positions.id),
  baseSalary: int("baseSalary"),
  bonus: double("bonus"),
  stock: int("stock"),
  totalPackage: int("totalPackage"),
  status: varchar("status", { length: 50 }).default("draft"),
  sentDate: varchar("sentDate", { length: 50 }),
  deadline: varchar("deadline", { length: 50 }),
  recruiter: varchar("recruiter", { length: 100 }),
  competitorOffers: int("competitorOffers").default(0),
  acceptanceProbability: int("acceptanceProbability"),
  notes: text("notes"),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
  updatedAt: datetime("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type Offer = typeof offers.$inferSelect;
export type InsertOffer = typeof offers.$inferInsert;

export const channels = mysqlTable("channels", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  applications: int("applications").default(0),
  interviews: int("interviews").default(0),
  offers: int("offers").default(0),
  conversionRate: double("conversionRate"),
  cost: int("cost").default(0),
  roi: double("roi"),
  status: varchar("status", { length: 20 }).default("active"),
});

export type Channel = typeof channels.$inferSelect;

export const alerts = mysqlTable("alerts", {
  id: int("id").primaryKey().autoincrement(),
  type: varchar("type", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  candidateId: int("candidateId").references(() => candidates.id),
  isRead: int("isRead").default(0),
  action: varchar("action", { length: 100 }),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type Alert = typeof alerts.$inferSelect;

export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").primaryKey().autoincrement(),
  action: varchar("action", { length: 20 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  userId: int("userId"),
  userName: varchar("userName", { length: 100 }),
  changes: text("changes"),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type AuditLog = typeof auditLogs.$inferSelect;

export const notificationSubscriptions = mysqlTable("notificationSubscriptions", {
  id: int("id").primaryKey().autoincrement(),
  channel: varchar("channel", { length: 50 }).notNull(),
  webhookUrl: varchar("webhookUrl", { length: 500 }).notNull(),
  enabled: int("enabled").default(1),
  createdBy: int("createdBy"),
  createdAt: datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP()`),
});

export type NotificationSubscription = typeof notificationSubscriptions.$inferSelect;