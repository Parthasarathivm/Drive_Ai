import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { userRoles, users } from "@/db/schema";
import { ApiError, handle, parseBody, rateLimit, sanitize } from "@/lib/api";
import { createSession, hashPassword } from "@/lib/auth";

const Body = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  preferredLanguage: z.string().max(5).optional(),
  preferredState: z.string().max(3).optional(),
});

export const POST = handle(async (req) => {
  rateLimit(req, "register", 8);
  const b = await parseBody(req, Body);
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, b.email)).limit(1);
  if (exists.length) throw new ApiError(409, "An account with this email already exists.");
  const [{ n }] = await db.select({ n: count() }).from(users);
  const [u] = await db
    .insert(users)
    .values({ name: sanitize(b.name), email: b.email, passwordHash: hashPassword(b.password), preferredLanguage: b.preferredLanguage ?? "en", preferredState: b.preferredState ?? null })
    .returning({ id: users.id });
  // Bootstrap rule: the very first registered account becomes Super Admin (documented in README).
  const roles = n === 0 ? ["super_admin", "user"] : ["user"];
  await db.insert(userRoles).values(roles.map((role) => ({ userId: u.id, role })));
  await createSession(u.id);
  return { ok: true, firstUser: n === 0 };
});
