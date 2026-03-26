import { Router, type IRouter } from "express";
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

router.get("/battles", async (req, res) => {
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

router.get("/battles/:id", async (req, res) => {
  try {
    const battle = await db.query.battlesTable.findFirst({
      where: eq(battlesTable.id, req.params.id),
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

router.post("/battles", async (req, res) => {
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

    if (f1.ownerId !== auth.userId) {
      return res.status(403).json({ error: "You don't own fighter 1" });
    }

    const wallet = await db.query.walletsTable.findFirst({
      where: eq(walletsTable.id, auth.walletId),
    });
    if (!wallet || wallet.balance < ENTRY_FEE) {
      return res.status(400).json({ error: `Insufficient balance. Entry fee is ${ENTRY_FEE} ONE.` });
    }

    const now = new Date();
    const result = simulateBattle(f1, f2);

    const [battle] = await db
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
        prizePool: ENTRY_FEE * 2,
        winnerReward: WIN_REWARD,
        status: "COMPLETED",
        startedAt: now,
        completedAt: now,
      })
      .returning();

    const winnerFighter = result.winnerId === fighter1Id ? f1 : f2;
    const loserFighter = result.winnerId === fighter1Id ? f2 : f1;

    await Promise.all([
      db
        .update(fightersTable)
        .set({
          wins: winnerFighter.wins + 1,
          totalBattles: winnerFighter.totalBattles + 1,
          experience: winnerFighter.experience + 50,
          level: Math.floor((winnerFighter.experience + 50) / 100) + 1,
          updatedAt: new Date(),
        })
        .where(eq(fightersTable.id, winnerFighter.id)),
      db
        .update(fightersTable)
        .set({
          losses: loserFighter.losses + 1,
          totalBattles: loserFighter.totalBattles + 1,
          experience: loserFighter.experience + 10,
          updatedAt: new Date(),
        })
        .where(eq(fightersTable.id, loserFighter.id)),
    ]);

    // Determine if the requester (who owns fighter1) won or lost
    const requesterWon = result.winnerId === fighter1Id;
    const balanceDelta = requesterWon ? WIN_REWARD - ENTRY_FEE : -ENTRY_FEE;

    await db
      .update(walletsTable)
      .set({
        balance: wallet.balance + balanceDelta,
        totalEarned: requesterWon ? wallet.totalEarned + WIN_REWARD : wallet.totalEarned,
        totalSpent: wallet.totalSpent + ENTRY_FEE,
        updatedAt: new Date(),
      })
      .where(eq(walletsTable.id, auth.walletId));

    // Always record entry fee transaction; only record win reward if requester won
    const transactions: Array<{
      walletId: string;
      type: "BATTLE_ENTRY" | "BATTLE_REWARD";
      amount: number;
      description: string;
      battleId: string;
    }> = [
      {
        walletId: auth.walletId,
        type: "BATTLE_ENTRY",
        amount: -ENTRY_FEE,
        description: `Battle entry: ${f1.name} vs ${f2.name}`,
        battleId: battle!.id,
      },
    ];

    if (requesterWon) {
      transactions.push({
        walletId: auth.walletId,
        type: "BATTLE_REWARD",
        amount: WIN_REWARD,
        description: `Victory reward: ${winnerFighter.name} won!`,
        battleId: battle!.id,
      });
    }

    await db.insert(transactionsTable).values(transactions);

    const fullBattle = await db.query.battlesTable.findFirst({
      where: eq(battlesTable.id, battle!.id),
      with: {
        fighter1: true,
        fighter2: true,
      },
    });

    return res.status(201).json(fullBattle);
  } catch (err) {
    req.log.error({ err }, "Error creating battle");
    return res.status(400).json({ error: "Failed to create battle" });
  }
});

export default router;
