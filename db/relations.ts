import { relations } from "drizzle-orm";
import {
  users,
  positions,
  candidates,
  workHistories,
  interviews,
  offers,
} from "./schema";

export const candidatesRelations = relations(candidates, ({ many }) => ({
  workHistories: many(workHistories),
  interviews: many(interviews),
  offers: many(offers),
}));

export const positionsRelations = relations(positions, ({ many }) => ({
  interviews: many(interviews),
  offers: many(offers),
}));

export const workHistoriesRelations = relations(workHistories, ({ one }) => ({
  candidate: one(candidates, {
    fields: [workHistories.candidateId],
    references: [candidates.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviews.candidateId],
    references: [candidates.id],
  }),
  position: one(positions, {
    fields: [interviews.positionId],
    references: [positions.id],
  }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  candidate: one(candidates, {
    fields: [offers.candidateId],
    references: [candidates.id],
  }),
  position: one(positions, {
    fields: [offers.positionId],
    references: [positions.id],
  }),
}));