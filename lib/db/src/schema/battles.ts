import { pgTable, text, integer, real, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { fightersTable } from "./fighters";
import { relations } from "drizzle-orm";

export const battleStatusEnum = pgEnum("battle_status", ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

export const battlesTable = pgTable("battles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fighter1Id: text("fighter1_id").notNull().references(() => fightersTable.id),
  fighter2Id: text("fighter2_id").notNull().references(() => fightersTable.id),
  winnerId: text("winner_id"),
  loserId: text("loser_id"),
  rounds: integer("rounds").notNull().default(0),
  fighter1FinalHp: integer("fighter1_final_hp").notNull().default(0),
  fighter2FinalHp: integer("fighter2_final_hp").notNull().default(0),
  battleLog: json("battle_log"),
  prizePool: real("prize_pool").notNull().default(0),
  winnerReward: real("winner_reward").notNull().default(0),
  status: battleStatusEnum("status").notNull().default("PENDING"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const battlesRelations = relations(battlesTable, ({ one }) => ({
  fighter1: one(fightersTable, {
    fields: [battlesTable.fighter1Id],
    references: [fightersTable.id],
  }),
  fighter2: one(fightersTable, {
    fields: [battlesTable.fighter2Id],
    references: [fightersTable.id],
  }),
}));

export const insertBattleSchema = createInsertSchema(battlesTable).omit({ id: true, createdAt: true });
export type InsertBattle = z.infer<typeof insertBattleSchema>;
export type Battle = typeof battlesTable.$inferSelect;
