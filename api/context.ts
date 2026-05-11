import * as cookie from "cookie";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { Session } from "@contracts/constants";
import { verifySessionToken } from "./auth/session";
import { getDb } from "../db/connection";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: { id: number; name: string; role: string; username?: string };
};

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const cookies = cookie.parse(opts.req.headers.get("cookie") || "");
  const token = cookies[Session.cookieName];

  if (!token) {
    return { req: opts.req, resHeaders: opts.resHeaders };
  }

  try {
    const claim = await verifySessionToken(token);
    if (!claim) {
      return { req: opts.req, resHeaders: opts.resHeaders };
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, Number(claim.unionId)))
      .limit(1);
    const user = rows.at(0);

    if (!user) {
      return { req: opts.req, resHeaders: opts.resHeaders };
    }

    return {
      req: opts.req,
      resHeaders: opts.resHeaders,
      user: {
        id: user.id,
        name: user.name || user.username,
        role: user.role,
        username: user.username,
      },
    };
  } catch {
    return { req: opts.req, resHeaders: opts.resHeaders };
  }
}
