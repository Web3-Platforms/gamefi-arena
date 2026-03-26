import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, walletsTable, fightersTable, transactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { MintFighterBody } from "@workspace/api-zod";
import { getWalletFromCookie } from "../lib/session";

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

async function requireUser(req: any, res: any): Promise<{ userId: string; walletId: string } | null> {
  const walletAddress = getWalletFromCookie(req);
  if (!walletAddress) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.walletAddress, walletAddress),
  });
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return null;
  }
  const wallet = await db.query.walletsTable.findFirst({
    where: eq(walletsTable.userId, user.id),
  });
  if (!wallet) {
    res.status(401).json({ error: "Wallet not found" });
    return null;
  }
  return { userId: user.id, walletId: wallet.id };
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
      where: eq(fightersTable.id, req.params.id),
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

    const wallet = await db.query.walletsTable.findFirst({
      where: eq(walletsTable.id, auth.walletId),
    });
    if (!wallet || wallet.balance < MINT_COST) {
      return res.status(400).json({ error: `Insufficient balance. Minting costs ${MINT_COST} ONE.` });
    }

    const txHash = genTxHash();
    const tokenId = genTokenId();
    const color = body.color ?? `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

    const [fighter] = await db
      .insert(fightersTable)
      .values({
        tokenId,
        name: body.name,
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

    await db
      .update(walletsTable)
      .set({
        balance: wallet.balance - MINT_COST,
        totalSpent: wallet.totalSpent + MINT_COST,
        updatedAt: new Date(),
      })
      .where(eq(walletsTable.id, auth.walletId));

    await db.insert(transactionsTable).values({
      walletId: auth.walletId,
      type: "MINT_FIGHTER",
      amount: -MINT_COST,
      description: `Minted fighter: ${body.name}`,
      fighterId: fighter!.id,
    });

    return res.status(201).json(fighter);
  } catch (err) {
    req.log.error({ err }, "Error minting fighter");
    return res.status(400).json({ error: "Failed to mint fighter" });
  }
});

export default router;
export { requireUser };
