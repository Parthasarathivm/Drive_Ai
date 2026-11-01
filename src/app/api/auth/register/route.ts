import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { userRoles, users } from "@/db/schema";
import { ApiError, handle, parseBody, rateLimit, sanitize } from "@/lib/api";
import { createSession, hashPassword } from "@/lib/auth";
import { LANGUAGES, STATES } from "@/lib/constants";

const Body = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name cannot exceed 80 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(160, "Email cannot exceed 160 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password cannot exceed 100 characters"),
  preferredLanguage: z
    .string()
    .max(10)
    .optional()
    .refine(
      (val) => !val || LANGUAGES.some((l) => l.code === val),
      "Unsupported preferred language"
    ),
  preferredState: z
    .string()
    .max(10)
    .optional()
    .refine(
      (val) => !val || STATES.some((s) => s.code === val.toUpperCase()),
      "Invalid preferred state code"
    ),
});

export const POST = handle(async (req) => {
  rateLimit(req, "register", 30);
  const b = await parseBody(req, Body);

  // Check for duplicate email
  const exists = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, b.email))
    .limit(1);

  if (exists.length > 0) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const [{ n }] = await db.select({ n: count() }).from(users);

  try {
    const [u] = await db
      .insert(users)
      .values({
        name: sanitize(b.name),
        email: b.email,
        passwordHash: hashPassword(b.password),
        preferredLanguage: b.preferredLanguage ?? "en",
        preferredState: b.preferredState ? b.preferredState.toUpperCase() : null,
      })
      .returning({ id: users.id });

    // Bootstrap rule: the very first registered account becomes Super Admin (documented in README).
    const roles = n === 0 ? ["super_admin", "user"] : ["user"];
    await db.insert(userRoles).values(roles.map((role) => ({ userId: u.id, role })));
    await createSession(u.id);

    return { ok: true, firstUser: n === 0 };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      throw new ApiError(409, "An account with this email already exists.");
    }
    throw err;
  }
});
