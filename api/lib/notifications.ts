import { getDb } from "../../db/connection";
import { notificationSubscriptions } from "../../db/schema";
import { eq } from "drizzle-orm";

interface AlertData {
  id: number;
  type: string;
  title: string;
  description: string | null;
  candidateId: number | null;
  action: string | null;
}

export async function sendNotifications(alert: AlertData) {
  const db = getDb();
  const subs = await db
    .select()
    .from(notificationSubscriptions)
    .where(eq(notificationSubscriptions.enabled, 1));

  const enabled = subs;

  for (const sub of enabled) {
    try {
      if (sub.channel === "webhook") {
        await fetch(sub.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "alert.created",
            alert: {
              id: alert.id,
              type: alert.type,
              title: alert.title,
              description: alert.description,
              candidateId: alert.candidateId,
              action: alert.action,
              url: `${process.env.APP_URL || "http://localhost:3001"}/alerts`,
            },
            timestamp: new Date().toISOString(),
          }),
        });
      }
      if (sub.channel === "dingtalk") {
        await fetch(sub.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            msgtype: "markdown",
            markdown: {
              title: `[${alert.type}] ${alert.title}`,
              text: `## 智聘云图预警\n\n**类型**: ${alert.type}\n**标题**: ${alert.title}\n**详情**: ${alert.description || "无"}\n**候选人ID**: ${alert.candidateId || "无"}\n**建议操作**: ${alert.action || "无"}\n\n[查看详情](${process.env.APP_URL || "http://localhost:3001"}/alerts)`,
            },
          }),
        });
      }
    } catch (e) {
      console.error(`Notification webhook (${sub.channel}) failed:`, e);
    }
  }
}
