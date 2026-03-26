import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { walletsTable, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { StakeTokensBody } from "@workspace/api-zod";
import { requireUser } from "./fighters";

const router: IRouter = Router();

router.get("/wallet", async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    const wallet = await db.query.walletsTable.findFirst({
      where: eq(walletsTable.id, auth.walletId),
    });

    if (!wallet) return res.status(404).json({ error: "Wallet not found" });
    return res.json(wallet);
  } catch (err) {
    req.log.error({ err }, "Error getting wallet");
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/wallet/transactions", async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    const transactions = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.walletId, auth.walletId))
      .orderBy(desc(transactionsTable.createdAt));

    return res.json({ transactions });
  } catch (err) {
    req.log.error({ err }, "Error listing transactions");
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/wallet/stake", async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    const body = StakeTokensBody.parse(req.body);
    const { amount } = body;

    if (amount <= 0) return res.status(400).json({ error: "Amount must be positive" });

    // Atomic: wallet update + transaction insert
    const updated = await db.transaction(async (tx) => {
      const wallet = await tx.query.walletsTable.findFirst({
        where: eq(walletsTable.id, auth.walletId),
      });
      if (!wallet || wallet.balance < amount) {
        throw new Error("Insufficient balance");
      }

      const [w] = await tx
        .update(walletsTable)
        .set({
          balance: wallet.balance - amount,
          stakedAmount: wallet.stakedAmount + amount,
          updatedAt: new Date(),
        })
        .where(eq(walletsTable.id, auth.walletId))
        .returning();

      await tx.insert(transactionsTable).values({
        walletId: auth.walletId,
        type: "STAKE",
        amount: -amount,
        description: `Staked ${amount} ONE`,
      });

      return w;
    });

    return res.json(updated);
  } catch (err: unknown) {
    req.log.error({ err }, "Error staking");
    const message = err instanceof Error ? err.message : "Failed to stake";
    return res.status(400).json({ error: message });
  }
});

router.post("/wallet/unstake", async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    const body = StakeTokensBody.parse(req.body);
    const { amount } = body;

    if (amount <= 0) return res.status(400).json({ error: "Amount must be positive" });

    // Atomic: wallet update + transaction inserts
    const updated = await db.transaction(async (tx) => {
      const wallet = await tx.query.walletsTable.findFirst({
        where: eq(walletsTable.id, auth.walletId),
      });
      if (!wallet || wallet.stakedAmount < amount) {
        throw new Error("Insufficient staked amount");
      }

      const stakingReward = parseFloat((amount * 0.05).toFixed(4));

      const [w] = await tx
        .update(walletsTable)
        .set({
          balance: wallet.balance + amount + stakingReward,
          stakedAmount: wallet.stakedAmount - amount,
          stakingRewards: wallet.stakingRewards + stakingReward,
          totalEarned: wallet.totalEarned + stakingReward,
          updatedAt: new Date(),
        })
        .where(eq(walletsTable.id, auth.walletId))
        .returning();

      await tx.insert(transactionsTable).values([
        {
          walletId: auth.walletId,
          type: "UNSTAKE",
          amount,
          description: `Unstaked ${amount} ONE`,
        },
        {
          walletId: auth.walletId,
          type: "STAKING_REWARD",
          amount: stakingReward,
          description: `Staking reward: ${stakingReward} ONE`,
        },
      ]);

      return w;
    });

    return res.json(updated);
  } catch (err: unknown) {
    req.log.error({ err }, "Error unstaking");
    const message = err instanceof Error ? err.message : "Failed to unstake";
    return res.status(400).json({ error: message });
  }
});

export default router;
