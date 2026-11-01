import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { legalSources, states } from "@/db/schema";
import { ApiError, handle, parseBody, sanitize } from "@/lib/api";
import { requireRole, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { slugify } from "@/lib/constants";
import { stateIdFromCode } from "@/lib/admin-server";

export const GET = handle(async () => {
  const u = await requireUser();
  if (!u.roles.some((r) => r !== "user")) throw new ApiError(403, "Staff access required.");
  const rows = await db.select().from(legalSources).orderBy(legalSources.id);
  const st = await db.select().from(states);
  const now = Date.now();
  return {
    sources: rows.map((s) => {
      const due = s.lastCheckedAt ? s.lastCheckedAt.getTime() + s.checkFrequencyDays * 86400_000 : null;
      const freshness = !s.lastCheckedAt ? "never_checked" : due! < now ? "overdue" : "fresh";
      return { ...s, stateName: s.stateId ? st.find((x) => x.id === s.stateId)?.name : null, freshness, nextCheckDue: due ? new Date(due).toISOString() : null };
    }),
  };
});

const httpUrl = z.string().trim().url().refine((u) => /^https?:\/\//.test(u), "URL must start with http(s)://");
const Create = z.object({
  name: z.string().trim().min(2).max(160), url: httpUrl, purpose: z.string().trim().max(300).optional(), authority: z.string().trim().max(160).optional(),
  jurisdictionLevel: z.enum(["central", "state", "district", "local"]).default("central"), stateCode: z.string().max(3).optional(),
  checkFrequencyDays: z.number().int().min(1).max(730).default(90), isOfficial: z.boolean().default(true),
});

export const POST = handle(async (req) => {
  const u = await requireRole("data_manager");
  const b = await parseBody(req, Create);
  const [row] = await db.insert(legalSources).values({
    slug: `${slugify(b.name)}-${Math.random().toString(36).slice(2, 6)}`, name: sanitize(b.name), url: b.url, purpose: b.purpose ? sanitize(b.purpose) : null,
    authority: b.authority ? sanitize(b.authority) : null, jurisdictionLevel: b.jurisdictionLevel, stateId: await stateIdFromCode(b.stateCode),
    checkFrequencyDays: b.checkFrequencyDays, isOfficial: b.isOfficial,
  }).returning();
  await audit(req, u, "register_source", "legal_source", row.id, { url: b.url });
  return { source: row };
});

const Patch = z.object({ id: z.number().int(), markChecked: z.boolean().optional(), checkFrequencyDays: z.number().int().min(1).max(730).optional() });
export const PATCH = handle(async (req) => {
  const u = await requireRole("data_manager");
  const b = await parseBody(req, Patch);
  const patch: Record<string, unknown> = {};
  if (b.markChecked) patch.lastCheckedAt = new Date();
  if (b.checkFrequencyDays) patch.checkFrequencyDays = b.checkFrequencyDays;
  if (!Object.keys(patch).length) throw new ApiError(400, "Nothing to update.");
  await db.update(legalSources).set(patch).where(eq(legalSources.id, b.id));
  await audit(req, u, b.markChecked ? "mark_source_checked" : "update_source", "legal_source", b.id);
  return { ok: true };
});
