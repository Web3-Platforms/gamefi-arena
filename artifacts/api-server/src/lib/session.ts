import { Request, Response } from "express";

const COOKIE_NAME = "ai_arena_wallet";

export function getWalletFromCookie(req: Request): string | null {
  const cookieHeader = req.headers.cookie ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k?.trim() ?? "", v.join("=")];
    })
  );
  return cookies[COOKIE_NAME] ? decodeURIComponent(cookies[COOKIE_NAME]!) : null;
}

const isProduction = process.env.NODE_ENV === "production";
const SECURE_FLAG = isProduction ? "; Secure" : "";

export function setWalletCookie(res: Response, walletAddress: string): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(walletAddress)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${SECURE_FLAG}`
  );
}

export function clearWalletCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${SECURE_FLAG}`
  );
}
