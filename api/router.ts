import { createRouter, publicQuery } from "./middleware";
import { z } from "zod";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import {
  candidateRouter,
  interviewRouter,
  offerRouter,
  channelRouter,
  alertRouter,
  dashboardRouter,
  positionRouter,
} from "./routers";
import {
  scoringRouter,
  relationRouter,
  positionMatchRouter,
} from "./routers/scoring";
import { analyticsRouter } from "./routers/analytics";
import { searchRouter } from "./routers/search";
import { aiRouter } from "./routers/ai";
import { loginLocal } from "./auth-local";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),

  auth: createRouter({
    login: publicQuery
      .input(
        z.object({
          username: z.string().min(1),
          password: z.string().min(1),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const user = await loginLocal(
          input.username,
          input.password,
          ctx.req.headers,
          ctx.resHeaders
        );
        return { user };
      }),

    me: publicQuery.query(async ({ ctx }) => {
      return ctx.user ?? false;
    }),

    logout: publicQuery.mutation(async ({ ctx }) => {
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, "", {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: (opts.sameSite?.toLowerCase() as "lax" | "none") || "lax",
          secure: opts.secure,
          maxAge: 0,
        })
      );
      return { success: true };
    }),
  }),

  candidate: candidateRouter,
  interview: interviewRouter,
  offer: offerRouter,
  channel: channelRouter,
  alert: alertRouter,
  dashboard: dashboardRouter,
  position: positionRouter,
  scoring: scoringRouter,
  relation: relationRouter,
  positionMatch: positionMatchRouter,
  analytics: analyticsRouter,
  search: searchRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
