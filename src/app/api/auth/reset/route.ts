import { and, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { passwordResets, sessions, users } from "@/db/schema";
import { ApiError, handle, parseBody, rateLimit } from "@/lib/api";
import { hashPassword, sha256 } from "@/lib/auth";

const Body = z.object({ token: z.string().min(20).max(200), password: z.string().min(8).max(100) });

export const POST = handle(async (req) => {
  rateLimit(req, "reset", 10);
  const b = await parseBody(req, Body);
  const [r] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, sha256(b.token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  if (!r) throw new ApiError(400, "This reset link is invalid or has expired.");
  await db.update(users).set({ passwordHash: hashPassword(b.password) }).where(eq(users.id, r.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, r.id));
  await db.delete(sessions).where(eq(sessions.userId, r.userId));
  return { ok: true };
});
