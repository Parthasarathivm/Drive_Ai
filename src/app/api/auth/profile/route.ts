import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { handle, parseBody, sanitize } from "@/lib/api";
import { getSessionUser, requireUser } from "@/lib/auth";

export const GET = handle(async () => ({ user: await getSessionUser() }));

const Patch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  preferredLanguage: z.string().max(5).optional(),
  preferredState: z.string().max(3).nullable().optional(),
  preferredVehicle: z.string().max(40).nullable().optional(),
  notifySettings: z.object({ documentExpiry: z.boolean(), reportUpdates: z.boolean(), sourceChanges: z.boolean() }).optional(),
});

export const PATCH = handle(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, Patch);
  await db.update(users).set({ ...b, ...(b.name ? { name: sanitize(b.name) } : {}) }).where(eq(users.id, u.id));
  return { user: await getSessionUser() };
});
