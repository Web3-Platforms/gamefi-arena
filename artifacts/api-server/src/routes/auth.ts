import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, walletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ConnectWalletBody } from "@workspace/api-zod";
import { getWalletFromCookie, setWalletCookie, clearWalletCookie } from "../lib/session";

const router: IRouter = Router();

router.post("/auth/connect", async (req, res) => {
  try {
    const body = ConnectWalletBody.parse(req.body);
    const { walletAddress } = body;

    let user = await db.query.usersTable.findFirst({
      where: eq(usersTable.walletAddress, walletAddress),
    });

    let isNew = false;

    if (!user) {
      isNew = true;
      const [created] = await db
        .insert(usersTable)
        .values({ walletAddress })
        .returning();
      user = created!;
    }

    let wallet = await db.query.walletsTable.findFirst({
      where: eq(walletsTable.userId, user.id),
    });

    if (!wallet) {
      const [created] = await db
        .insert(walletsTable)
        .values({ userId: user.id, balance: 100.0 })
        .returning();
      wallet = created!;
    }

    setWalletCookie(res, walletAddress);
    res.json({ user, wallet, isNew });
  } catch (err) {
    req.log.error({ err }, "Error connecting wallet");
    res.status(400).json({ error: "Invalid request" });
  }
});

router.get("/auth/session", async (req, res) => {
  try {
    const walletAddress = getWalletFromCookie(req);
    if (!walletAddress) {
      return res.status(204).end();
    }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.walletAddress, walletAddress),
    });

    if (!user) {
      return res.status(204).end();
    }

    const wallet = await db.query.walletsTable.findFirst({
      where: eq(walletsTable.userId, user.id),
    });

    return res.json({ user, wallet: wallet ?? null });
  } catch (err) {
    req.log.error({ err }, "Error getting session");
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/disconnect", async (req, res) => {
  clearWalletCookie(res);
  res.json({ message: "Disconnected" });
});

export default router;
