import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { passwordResets, users } from "@/db/schema";
import { handle, parseBody, rateLimit } from "@/lib/api";
import { sha256 } from "@/lib/auth";

const Body = z.object({ email: z.string().trim().toLowerCase().email() });

// No email provider is wired in yet (see README → incomplete features).
// The reset link is written to the server log; set AUTH_SHOW_RESET_LINK=true (non-production only) to return it in the response.
export const POST = handle(async (req) => {
  rateLimit(req, "forgot", 5);
  const { email } = await parseBody(req, Body);
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  let devLink: string | undefined;
  if (u) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.insert(passwordResets).values({ userId: u.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3600_000) });
    const link = `/reset-password?token=${token}`;
    console.log(`[password-reset] ${email}: ${link}`);
    if (process.env.AUTH_SHOW_RESET_LINK === "true") devLink = link;
  }
  return { ok: true, message: "If an account exists for that email, a reset link has been generated.", devLink };
});
