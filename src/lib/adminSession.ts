import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";

function getSecret(): string {
  const secret = process.env.ADMIN_PORTAL_SECRET || process.env.ADMIN_PORTAL_PASSWORD;
  if (!secret) {
    throw new Error(
      "Missing ADMIN_PORTAL_SECRET (or ADMIN_PORTAL_PASSWORD). Set it in .env.local to enable admin API."
    );
  }
  return secret;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createAdminSessionToken(): string {
  const secret = getSecret();
  const issuedAt = Date.now().toString();
  const sig = sign(issuedAt, secret);
  return `${issuedAt}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [issuedAt, sig] = parts;
  if (!issuedAt || !sig) return false;

  // Optional expiry (7 days)
  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return false;
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - issuedAtMs > maxAgeMs) return false;

  const expected = sign(issuedAt, getSecret());
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function setAdminSessionCookie() {
  const token = createAdminSessionToken();
  const jar = await cookies();
  jar.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function clearAdminSessionCookie() {
  const jar = await cookies();
  jar.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!verifyAdminSessionToken(token)) {
    throw new Error("UNAUTHORIZED_ADMIN");
  }
}

export async function isAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return verifyAdminSessionToken(token);
}
