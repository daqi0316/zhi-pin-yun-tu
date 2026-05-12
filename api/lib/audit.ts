import { getDb } from "../../db/connection";
import { auditLogs } from "../../db/schema";
import { desc, eq, and } from "drizzle-orm";

export interface AuditEntry {
  action: "create" | "update" | "delete";
  entityType:
    | "candidate"
    | "interview"
    | "offer"
    | "position"
    | "channel"
    | "alert";
  entityId: number;
  userId?: number;
  userName?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

export async function recordAudit(entry: AuditEntry) {
  const db = getDb();
  await db.insert(auditLogs).values({
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    userId: entry.userId ?? null,
    userName: entry.userName ?? null,
    changes: entry.changes ? JSON.stringify(entry.changes) : null,
  });
}
