import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { fightersTable, battlesTable, usersTable, walletsTable } from "@workspace/db";
import { sql, desc, sum } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats", async (req, res) => {
  try {
    const [
      fightersCount,
      battlesCount,
      usersCount,
      totalEarned,
      topFighters,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(fightersTable),
      db.select({ count: sql<number>`count(*)` }).from(battlesTable),
      db.select({ count: sql<number>`count(*)` }).from(usersTable),
      db.select({ total: sum(walletsTable.totalEarned) }).from(walletsTable),
      db.query.fightersTable.findMany({
        orderBy: [desc(fightersTable.wins)],
        limit: 5,
      }),
    ]);

    res.json({
      totalFighters: Number(fightersCount[0]?.count ?? 0),
      totalBattles: Number(battlesCount[0]?.count ?? 0),
      totalUsers: Number(usersCount[0]?.count ?? 0),
      totalOneDistributed: parseFloat(String(totalEarned[0]?.total ?? 0)),
      topFighters,
    });
  } catch (err) {
    req.log.error({ err }, "Error getting stats");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
