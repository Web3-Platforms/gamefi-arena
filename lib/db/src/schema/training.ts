import { pgTable, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainingTypeEnum = pgEnum("training_type", ["BASIC", "ADVANCED", "INTENSIVE", "AI_OPTIMIZED"]);

export const trainingSessionsTable = pgTable("training_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fighterId: text("fighter_id").notNull(),
  type: trainingTypeEnum("type").notNull(),
  statImproved: text("stat_improved"),
  improvement: real("improvement").notNull().default(0),
  cost: real("cost").notNull(),
  status: text("status").notNull().default("completed"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessionsTable).omit({ id: true, createdAt: true });
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type TrainingSession = typeof trainingSessionsTable.$inferSelect;
