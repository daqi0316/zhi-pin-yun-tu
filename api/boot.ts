import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { writeFile, mkdir, access, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createReadStream } from "node:fs";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./auth/session";
import { getDb } from "../db/connection";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { parseResumeText } from "./resume-parser";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

async function requireLogin(c: any, next: any) {
  const cookies = cookie.parse(c.req.header("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) return c.json({ error: "未授权，请先登录" }, 401);
  const claim = await verifySessionToken(token);
  if (!claim) return c.json({ error: "未授权，请先登录" }, 401);
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(claim.unionId)))
    .limit(1);
  const user = rows.at(0);
  if (!user || user.status === "disabled")
    return c.json({ error: "未授权，请先登录" }, 401);
  c.set("user", user);
  await next();
}

app.use("/api/upload/*", requireLogin);

app.use("/api/trpc/*", async c => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

const UPLOAD_DIR = path.resolve(import.meta.dirname, "../uploads/resumes");

const MIME_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/msword": ".doc",
  "text/plain": ".txt",
};

app.post("/api/upload/resume", async c => {
  try {
    const body = await c.req.parseBody();
    const file = body.file as File | undefined;
    if (!file) return c.json({ error: "请选择文件" }, 400);

    const ext = MIME_EXT[file.type] || path.extname(file.name) || ".pdf";
    if (!Object.values(MIME_EXT).includes(ext)) {
      return c.json({ error: "仅支持 PDF / DOCX / DOC / TXT 格式" }, 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "文件大小不能超过 10MB" }, 400);
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return c.json({
      url: `/api/uploads/resumes/${filename}`,
      filename: file.name,
      size: file.size,
    });
  } catch (e) {
    return c.json({ error: "上传失败，请检查文件格式" }, 400);
  }
});

app.post("/api/upload/resume/parse", async c => {
  try {
    const body = await c.req.parseBody();
    const file = body.file as File | undefined;
    if (!file) return c.json({ error: "请选择文件" }, 400);

    const ext = MIME_EXT[file.type] || path.extname(file.name) || ".pdf";
    if (!Object.values(MIME_EXT).includes(ext)) {
      return c.json({ error: "仅支持 PDF / DOCX / DOC / TXT 格式" }, 400);
    }
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: "文件大小不能超过 10MB" }, 400);
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    const url = `/api/uploads/resumes/${filename}`;
    let parsed: ReturnType<typeof parseResumeText> | undefined;
    if (ext === ".txt") {
      parsed = parseResumeText(buffer.toString("utf-8"));
    }

    return c.json({
      url,
      filename: file.name,
      size: file.size,
      parsed: parsed || null,
    });
  } catch (e) {
    return c.json({ error: "解析失败，请检查文件格式" }, 400);
  }
});

app.get("/api/uploads/resumes/:filename", async c => {
  const filename = c.req.param("filename");
  if (!filename || filename.includes(".."))
    return c.json({ error: "非法文件名" }, 400);

  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    await access(filePath);
    const ext = path.extname(filename).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".doc": "application/msword",
      ".txt": "text/plain; charset=utf-8",
    };
    const headers = new Headers();
    headers.set("Content-Type", mimeMap[ext] || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${filename}"`);
    const stream = createReadStream(filePath);
    return new Response(stream as any, { headers });
  } catch {
    return c.json({ error: "文件不存在" }, 404);
  }
});

app.post("/api/upload/resume/delete/:filename", async c => {
  const filename = c.req.param("filename");
  if (!filename || filename.includes(".."))
    return c.json({ error: "非法文件名" }, 400);
  try {
    const filePath = path.join(UPLOAD_DIR, filename);
    await access(filePath);
    await unlink(filePath);
    return c.json({ success: true });
  } catch {
    return c.json({ error: "文件不存在或删除失败" }, 404);
  }
});

app.all("/api/*", c => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStatic } = await import("@hono/node-server/serve-static");
  app.get("*", serveStatic({ root: "./dist/public" }));

  const port = parseInt(process.env.PORT || "3001");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
