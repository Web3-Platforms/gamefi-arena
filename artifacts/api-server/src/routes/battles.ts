import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { battlesTable, fightersTable, walletsTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateBattleBody } from "@workspace/api-zod";
import { simulateBattle } from "../lib/combat";
import { requireUser } from "./fighters";

const router: IRouter = Router();

const ENTRY_FEE = 5;
const WIN_REWARD = 15;

async function getFighterWithOwner(id: string) {
  return db.query.fightersTable.findFirst({
    where: eq(fightersTable.id, id),
  });
}

router.get("/battles", async (req: Request, res: Response) => {
  try {
    const battles = await db.query.battlesTable.findMany({
      orderBy: (b, { desc }) => [desc(b.createdAt)],
      limit: 20,
      with: {
        fighter1: true,
        fighter2: true,
      },
    });
    res.json({ battles });
  } catch (err) {
    req.log.error({ err }, "Error listing battles");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/battles/:id", async (req: Request, res: Response) => {
  try {
    const battle = await db.query.battlesTable.findFirst({
      where: eq(battlesTable.id, String(req.params.id)),
      with: {
        fighter1: true,
        fighter2: true,
      },
    });
    if (!battle) return res.status(404).json({ error: "Battle not found" });
    return res.json(battle);
  } catch (err) {
    req.log.error({ err }, "Error getting battle");
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/battles", async (req: Request, res: Response) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    const body = CreateBattleBody.parse(req.body);
    const { fighter1Id, fighter2Id } = body;

    if (fighter1Id === fighter2Id) {
      return res.status(400).json({ error: "Fighters must be different" });
    }

    const [f1, f2] = await Promise.all([
      getFighterWithOwner(fighter1Id),
      getFighterWithOwner(fighter2Id),
    ]);

    if (!f1 || !f2) {
      return res.status(404).json({ error: "Fighter not found" });
    }

    // Requester must own fighter 1 OR may pit any two fighters as a demo/spectator mode
    // Allow same-owner battles to support single-wallet demo environments
    if (f1.ownerId !== auth.userId) {
      return res.status(403).json({ error: "You don't own fighter 1" });
    }

    const requesterWallet = await db.query.walletsTable.findFirst({
      where: eq(walletsTable.id, auth.walletId),
    });
    if (!requesterWallet || requesterWallet.balance < ENTRY_FEE) {
      return res.status(400).json({ error: `Insufficient balance. Entry fee is ${ENTRY_FEE} ONE.` });
    }

    const now = new Date();
    const result = simulateBattle(f1, f2);

    const winnerFighter = result.winnerId === fighter1Id ? f1 : f2;
    const loserFighter = result.winnerId === fighter1Id ? f2 : f1;

    // Same-owner battles are break-even (refund = entry fee) to prevent farming
    const isSelfBattle = f1.ownerId === f2.ownerId;
    const effectiveReward = isSelfBattle ? ENTRY_FEE : WIN_REWARD;
    const fullBattle = await db.transaction(async (tx) => {
      const [battle] = await tx
        .insert(battlesTable)
        .values({
          fighter1Id,
          fighter2Id,
          winnerId: result.winnerId,
          loserId: result.loserId,
          rounds: result.totalRounds,
          fighter1FinalHp: result.fighter1FinalHp,
          fighter2FinalHp: result.fighter2FinalHp,
          battleLog: result.rounds,
          prizePool: ENTRY_FEE,
          winnerReward: effectiveReward,
          status: "COMPLETED",
          startedAt: now,
          completedAt: now,
        })
        .returning();

      // Update both fighter records
      await Promise.all([
        tx
          .update(fightersTable)
          .set({
            wins: winnerFighter.wins + 1,
            totalBattles: winnerFighter.totalBattles + 1,
            experience: winnerFighter.experience + 50,
            level: Math.floor((winnerFighter.experience + 50) / 100) + 1,
            updatedAt: new Date(),
          })
          .where(eq(fightersTable.id, winnerFighter.id)),
        tx
          .update(fightersTable)
          .set({
            losses: loserFighter.losses + 1,
            totalBattles: loserFighter.totalBattles + 1,
            experience: loserFighter.experience + 10,
            updatedAt: new Date(),
          })
          .where(eq(fightersTable.id, loserFighter.id)),
      ]);

      // Deduct entry fee from requester
      await tx
        .update(walletsTable)
        .set({
          balance: requesterWallet.balance - ENTRY_FEE,
          totalSpent: requesterWallet.totalSpent + ENTRY_FEE,
          updatedAt: new Date(),
        })
        .where(eq(walletsTable.id, auth.walletId));

      await tx.insert(transactionsTable).values({
        walletId: auth.walletId,
        type: "BATTLE_ENTRY",
        amount: -ENTRY_FEE,
        description: `Battle entry: ${f1.name} vs ${f2.name}`,
        battleId: battle!.id,
      });

      const winnerWallet = await tx.query.walletsTable.findFirst({
        where: eq(walletsTable.userId, winnerFighter.ownerId),
      });

      if (winnerWallet) {
        await tx
          .update(walletsTable)
          .set({
            balance: winnerWallet.balance + effectiveReward,
            totalEarned: winnerWallet.totalEarned + effectiveReward,
            updatedAt: new Date(),
          })
          .where(eq(walletsTable.id, winnerWallet.id));

        await tx.insert(transactionsTable).values({
          walletId: winnerWallet.id,
          type: "BATTLE_REWARD",
          amount: effectiveReward,
          description: `Victory reward: ${winnerFighter.name} defeated ${loserFighter.name}${isSelfBattle ? " (self-battle)" : ""}`,
          battleId: battle!.id,
        });
      }

      // Return the battle with fighter details for the response
      return tx.query.battlesTable.findFirst({
        where: eq(battlesTable.id, battle!.id),
        with: {
          fighter1: true,
          fighter2: true,
        },
      });
    });

    return res.status(201).json(fullBattle);
  } catch (err) {
    req.log.error({ err }, "Error creating battle");
    return res.status(400).json({ error: "Failed to create battle" });
  }
});

export default router;
