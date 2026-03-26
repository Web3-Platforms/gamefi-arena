import { pgTable, text, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const fightersTable = pgTable("fighters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tokenId: text("token_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  ownerId: text("owner_id").notNull().references(() => usersTable.id),
  aggression: real("aggression").notNull().default(0.5),
  defense: real("defense").notNull().default(0.5),
  speed: real("speed").notNull().default(0.5),
  power: real("power").notNull().default(0.5),
  intelligence: real("intelligence").notNull().default(0.5),
  level: integer("level").notNull().default(1),
  experience: integer("experience").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  totalBattles: integer("total_battles").notNull().default(0),
  trainingCount: integer("training_count").notNull().default(0),
  lastTrainedAt: timestamp("last_trained_at"),
  color: text("color").notNull().default("#3B82F6"),
  skinId: text("skin_id"),
  txHash: text("tx_hash"),
  isMinted: boolean("is_minted").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fightersRelations = relations(fightersTable, ({ one }) => ({
  owner: one(usersTable, {
    fields: [fightersTable.ownerId],
    references: [usersTable.id],
  }),
}));

export const insertFighterSchema = createInsertSchema(fightersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFighter = z.infer<typeof insertFighterSchema>;
export type Fighter = typeof fightersTable.$inferSelect;
