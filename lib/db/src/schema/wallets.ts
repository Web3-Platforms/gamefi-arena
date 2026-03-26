import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { relations } from "drizzle-orm";

export const walletsTable = pgTable("wallets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => usersTable.id).unique(),
  balance: real("balance").notNull().default(100.0),
  totalEarned: real("total_earned").notNull().default(0),
  totalSpent: real("total_spent").notNull().default(0),
  stakedAmount: real("staked_amount").notNull().default(0),
  stakingRewards: real("staking_rewards").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletsRelations = relations(walletsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [walletsTable.userId],
    references: [usersTable.id],
  }),
}));

export const insertWalletSchema = createInsertSchema(walletsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof walletsTable.$inferSelect;
