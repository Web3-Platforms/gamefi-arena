import { pgTable, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { walletsTable } from "./wallets";
import { relations } from "drizzle-orm";

export const transactionTypeEnum = pgEnum("transaction_type", [
  "MINT_FIGHTER",
  "TRAIN_FIGHTER",
  "BATTLE_REWARD",
  "BATTLE_ENTRY",
  "STAKE",
  "UNSTAKE",
  "STAKING_REWARD",
]);

export const transactionsTable = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  walletId: text("wallet_id").notNull().references(() => walletsTable.id),
  type: transactionTypeEnum("type").notNull(),
  amount: real("amount").notNull(),
  description: text("description"),
  battleId: text("battle_id"),
  fighterId: text("fighter_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  wallet: one(walletsTable, {
    fields: [transactionsTable.walletId],
    references: [walletsTable.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
