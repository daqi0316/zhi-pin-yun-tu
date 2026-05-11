import bcrypt from "bcryptjs";
import * as cookie from "cookie";
import { eq } from "drizzle-orm";
import { getDb } from "../db/connection";
import { users } from "../db/schema";
import { signSessionToken } from "./auth/session";
import { getSessionCookieOptions } from "./lib/cookies";
import { Session } from "@contracts/constants";

/**
 * 本地密码登录
 * 验证用户名+密码，签发 JWT session token，通过 cookie 返回
 */
export async function loginLocal(
  username: string,
  password: string,
  headers: Headers,
  resHeaders: Headers
) {
  // 查找用户
  const db = getDb();
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = rows.at(0);

  if (!user) {
    throw new Error("用户名或密码错误");
  }

  // 验证密码（兼容明文和 bcrypt hash）
  const passwordValid = user.password.startsWith("$2")
    ? await bcrypt.compare(password, user.password)
    : user.password === password;

  if (!passwordValid) {
    throw new Error("用户名或密码错误");
  }

  // 签发 session token
  const token = await signSessionToken({
    unionId: String(user.id),
    clientId: "local",
  });

  // 设置 cookie
  const cookieOpts = getSessionCookieOptions(headers);
  resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: cookieOpts.httpOnly,
      path: cookieOpts.path,
      sameSite: (cookieOpts.sameSite?.toLowerCase() as "lax" | "none") || "lax",
      secure: cookieOpts.secure,
      maxAge: Session.maxAgeMs / 1000,
    })
  );

  return {
    id: user.id,
    name: user.name || user.username,
    role: user.role,
    username: user.username,
  };
}
