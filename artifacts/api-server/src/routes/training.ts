import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { fightersTable, walletsTable, transactionsTable, trainingSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { TrainFighterBody } from "@workspace/api-zod";
import { requireUser } from "./fighters";

const router: IRouter = Router();

type TrainingType = "BASIC" | "ADVANCED" | "INTENSIVE" | "AI_OPTIMIZED";

const TRAINING_CONFIG: Record<TrainingType, { cost: number; improvement: number; label: string }> = {
  BASIC: { cost: 5, improvement: 0.02, label: "Basic Training" },
  ADVANCED: { cost: 15, improvement: 0.05, label: "Advanced Training" },
  INTENSIVE: { cost: 30, improvement: 0.12, label: "Intensive Training" },
  AI_OPTIMIZED: { cost: 50, improvement: 0.25, label: "AI-Optimized Training" },
};

router.post("/fighters/:id/train", async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    const body = TrainFighterBody.parse(req.body);
    const { type, stat } = body;

    const fighter = await db.query.fightersTable.findFirst({
      where: eq(fightersTable.id, req.params.id),
    });

    if (!fighter) {
      return res.status(404).json({ error: "Fighter not found" });
    }

    if (fighter.ownerId !== auth.userId) {
      return res.status(403).json({ error: "You don't own this fighter" });
    }

    const trainingType = type as TrainingType;
    const config = TRAINING_CONFIG[trainingType];
    if (!config) {
      return res.status(400).json({ error: "Invalid training type" });
    }

    const wallet = await db.query.walletsTable.findFirst({
      where: eq(walletsTable.id, auth.walletId),
    });

    if (!wallet || wallet.balance < config.cost) {
      return res.status(400).json({
        error: `Insufficient balance. ${config.label} costs ${config.cost} ONE.`,
      });
    }

    const currentVal = fighter[stat as keyof typeof fighter] as number;
    // Apply improvement with ±20% variance, no artificial cap
    const variance = config.improvement * (0.8 + Math.random() * 0.4);
    // Clamp so stat doesn't exceed 0.99
    const actualImprovement = parseFloat(Math.min(0.99 - currentVal, variance).toFixed(4));
    const newVal = parseFloat(Math.min(0.99, currentVal + actualImprovement).toFixed(4));

    const newExperience = fighter.experience + Math.ceil(config.cost / 2);
    const newLevel = Math.floor(newExperience / 100) + 1;

    const [updatedFighter] = await db
      .update(fightersTable)
      .set({
        [stat]: newVal,
        trainingCount: fighter.trainingCount + 1,
        lastTrainedAt: new Date(),
        experience: newExperience,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(fightersTable.id, fighter.id))
      .returning();

    await db
      .update(walletsTable)
      .set({
        balance: wallet.balance - config.cost,
        totalSpent: wallet.totalSpent + config.cost,
        updatedAt: new Date(),
      })
      .where(eq(walletsTable.id, auth.walletId));

    await db.insert(transactionsTable).values({
      walletId: auth.walletId,
      type: "TRAIN_FIGHTER",
      amount: -config.cost,
      description: `${config.label}: improved ${stat} for ${fighter.name}`,
      fighterId: fighter.id,
    });

    await db.insert(trainingSessionsTable).values({
      fighterId: fighter.id,
      type,
      statImproved: stat,
      improvement: actualImprovement,
      cost: config.cost,
      status: "completed",
      completedAt: new Date(),
    });

    return res.json({
      fighter: updatedFighter,
      improvement: actualImprovement,
      cost: config.cost,
      statImproved: stat,
    });
  } catch (err) {
    req.log.error({ err }, "Error training fighter");
    return res.status(400).json({ error: "Failed to train fighter" });
  }
});

export default router;
