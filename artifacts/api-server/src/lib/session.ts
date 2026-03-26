import { Request, Response } from "express";
import { db } from "@workspace/db";
import { sessionsTable, walletsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const COOKIE_NAME = "ai_arena_sid";
const SESSION_TTL_DAYS = 7;
const isProduction = process.env.NODE_ENV === "production";
const SECURE_FLAG = isProduction ? "; Secure" : "";

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const [session] = await db
    .insert(sessionsTable)
    .values({ userId, expiresAt })
    .returning();
  return session!.id;
}

export async function getSessionUser(
  req: Request
): Promise<{ userId: string; walletId: string } | null> {
  const sessionId = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!sessionId) return null;

  const now = new Date();
  const session = await db.query.sessionsTable.findFirst({
    where: and(eq(sessionsTable.id, sessionId), gt(sessionsTable.expiresAt, now)),
  });
  if (!session) return null;

  const wallet = await db.query.walletsTable.findFirst({
    where: eq(walletsTable.userId, session.userId),
  });
  if (!wallet) return null;

  return { userId: session.userId, walletId: wallet.id };
}

export async function deleteSession(req: Request): Promise<void> {
  const sessionId = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (sessionId) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, sessionId));
  }
}

export function setSessionCookie(res: Response, sessionId: string): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL_DAYS * 86400}${SECURE_FLAG}`
  );
}

export function clearSessionCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${SECURE_FLAG}`
  );
}
