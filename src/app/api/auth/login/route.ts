import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ApiError, handle, parseBody, rateLimit } from "@/lib/api";
import { createSession, verifyPassword } from "@/lib/auth";

const Body = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(100) });

export const POST = handle(async (req) => {
  rateLimit(req, "login", 10);
  const b = await parseBody(req, Body);
  const [u] = await db.select().from(users).where(eq(users.email, b.email)).limit(1);
  if (!u || !u.isActive || !verifyPassword(b.password, u.passwordHash)) throw new ApiError(401, "Incorrect email or password.");
  await createSession(u.id);
  return { ok: true };
});
