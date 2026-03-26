import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { fightersTable, transactionsTable, walletsTable } from "@workspace/db";
import { eq, and, like } from "drizzle-orm";
import { MintFighterBody } from "@workspace/api-zod";
import { getSessionUser } from "../lib/session";

const router: IRouter = Router();

const MINT_COST = 10;

const FIGHTER_NAMES = [
  "Nexus", "Cipher", "Vortex", "Quantum", "Axiom", "Blaze", "Spectre", "Titan",
  "Nova", "Zephyr", "Apex", "Matrix", "Forge", "Volt", "Phantom", "Reaper",
];

function genTokenId(): string {
  return `ONE-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function genTxHash(): string {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
}

function randomStat(base = 0.3): number {
  return parseFloat(Math.min(0.95, Math.max(0.1, base + Math.random() * 0.5)).toFixed(3));
}

async function requireUser(req: Request, res: Response): Promise<{ userId: string; walletId: string } | null> {
  const auth = await getSessionUser(req);
  if (!auth) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return auth;
}

router.get("/fighters", async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    const fighters = await db.query.fightersTable.findMany({
      where: eq(fightersTable.ownerId, auth.userId),
      orderBy: (f, { desc }) => [desc(f.createdAt)],
    });

    res.json({ fighters });
  } catch (err) {
    req.log.error({ err }, "Error listing fighters");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/fighters/all", async (req, res) => {
  try {
    const fighters = await db.query.fightersTable.findMany({
      orderBy: (f, { desc }) => [desc(f.wins)],
      limit: 50,
    });
    res.json({ fighters });
  } catch (err) {
    req.log.error({ err }, "Error listing all fighters");
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/fighters/:id", async (req, res) => {
  try {
    const fighter = await db.query.fightersTable.findFirst({
      where: eq(fightersTable.id, String(req.params.id)),
    });
    if (!fighter) return res.status(404).json({ error: "Fighter not found" });
    return res.json(fighter);
  } catch (err) {
    req.log.error({ err }, "Error getting fighter");
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/fighters", async (req, res) => {
  try {
    const auth = await requireUser(req, res);
    if (!auth) return;

    const body = MintFighterBody.parse(req.body);

    const txHash = genTxHash();
    const tokenId = genTokenId();
    const color = body.color ?? `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

    // Auto-suffix name to ensure uniqueness per owner (e.g. "Zeus" → "Zeus #2")
    const baseName = body.name.trim();
    const existingCount = await db
      .select()
      .from(fightersTable)
      .where(and(eq(fightersTable.ownerId, auth.userId), like(fightersTable.name, `${baseName}%`)));
    const uniqueName = existingCount.length > 0 ? `${baseName} #${existingCount.length + 1}` : baseName;

    const fighter = await db.transaction(async (tx) => {
      const wallet = await tx.query.walletsTable.findFirst({
        where: eq(walletsTable.id, auth.walletId),
      });
      if (!wallet || wallet.balance < MINT_COST) {
        throw new Error(`Insufficient balance. Minting costs ${MINT_COST} ONE.`);
      }

      const [newFighter] = await tx
        .insert(fightersTable)
        .values({
          tokenId,
          name: uniqueName,
          description: body.description ?? null,
          ownerId: auth.userId,
          aggression: randomStat(),
          defense: randomStat(),
          speed: randomStat(),
          power: randomStat(),
          intelligence: randomStat(),
          color,
          txHash,
          isMinted: true,
          updatedAt: new Date(),
        })
        .returning();

      await tx
        .update(walletsTable)
        .set({
          balance: wallet.balance - MINT_COST,
          totalSpent: wallet.totalSpent + MINT_COST,
          updatedAt: new Date(),
        })
        .where(eq(walletsTable.id, auth.walletId));

      await tx.insert(transactionsTable).values({
        walletId: auth.walletId,
        type: "MINT_FIGHTER",
        amount: -MINT_COST,
        description: `Minted fighter: ${uniqueName}`,
        fighterId: newFighter!.id,
      });

      return newFighter;
    });

    return res.status(201).json(fighter);
  } catch (err: unknown) {
    req.log.error({ err }, "Error minting fighter");
    const message = err instanceof Error ? err.message : "Failed to mint fighter";
    return res.status(400).json({ error: message });
  }
});

export default router;
export { requireUser };
