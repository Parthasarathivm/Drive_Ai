import crypto from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, userRoles, users } from "@/db/schema";
import { ApiError } from "@/lib/api";
import type { Role } from "@/lib/constants";

const COOKIE = "dl_session";
const SESSION_DAYS = 14;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const known = Buffer.from(hash, "hex");
  return known.length === test.length && crypto.timingSafeEqual(known, test);
}

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ tokenHash: sha256(token), userId, expiresAt });
  try {
    const jar = await cookies();
    jar.set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // set true behind HTTPS-only deployments via SESSION_COOKIE_SECURE=true
      path: "/",
      expires: expiresAt,
      ...(process.env.SESSION_COOKIE_SECURE === "true" ? { secure: true } : {}),
    });
  } catch (err: unknown) {
    // Next.js request store is not present in non-request environments (e.g. test scripts)
    console.warn("[Session Cookie skipped - outside Next.js request store]:", err instanceof Error ? err.message : String(err));
  }
}

export async function destroySession() {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
    jar.delete(COOKIE);
  } catch (err: unknown) {
    console.warn("[destroySession skipped - outside Next.js request store]:", err instanceof Error ? err.message : String(err));
  }
}

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  preferredLanguage: string;
  preferredState: string | null;
  preferredVehicle: string | null;
  notifySettings: { documentExpiry: boolean; reportUpdates: boolean; sourceChanges: boolean };
  roles: Role[];
};

export async function getSessionUser(): Promise<SessionUser | null> {
  let token: string | undefined;
  try {
    const jar = await cookies();
    token = jar.get(COOKIE)?.value;
  } catch {
    return null;
  }
  if (!token) return null;
  const rows = await db
    .select({ u: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date()), eq(users.isActive, true)))
    .limit(1);
  if (!rows[0]) return null;
  const u = rows[0].u;
  const roleRows = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, u.id));
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    preferredLanguage: u.preferredLanguage,
    preferredState: u.preferredState,
    preferredVehicle: u.preferredVehicle,
    notifySettings: u.notifySettings,
    roles: roleRows.map((r) => r.role as Role),
  };
}

export async function requireUser() {
  const u = await getSessionUser();
  if (!u) throw new ApiError(401, "Please log in to continue.");
  return u;
}

/** super_admin always passes. */
export async function requireRole(...allowed: Role[]) {
  const u = await requireUser();
  if (!u.roles.includes("super_admin") && !allowed.some((r) => u.roles.includes(r))) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }
  return u;
}

export function isStaff(u: SessionUser | null) {
  return !!u && u.roles.some((r) => r !== "user");
}
