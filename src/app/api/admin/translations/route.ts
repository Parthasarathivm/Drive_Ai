import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { translations } from "@/db/schema";
import { ApiError, handle, parseBody, sanitize } from "@/lib/api";
import { requireRole, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { UI_KEYS } from "@/lib/i18n";

export const GET = handle(async (req) => {
  const u = await requireUser();
  if (!u.roles.some((r) => r !== "user")) throw new ApiError(403, "Staff access required.");
  const lang = new URL(req.url).searchParams.get("lang") ?? "hi";
  const en = await db.select().from(translations).where(eq(translations.lang, "en"));
  const rows = await db.select().from(translations).where(eq(translations.lang, lang));
  return {
    lang,
    items: UI_KEYS.map((key) => {
      const t = rows.find((r) => r.key === key);
      return { key, english: en.find((r) => r.key === key)?.value ?? "", value: t?.value ?? "", source: t?.source ?? "missing", reviewedAt: t?.reviewedAt ?? null };
    }),
  };
});

const Body = z.object({ lang: z.string().max(5), key: z.string().max(80), value: z.string().trim().min(1).max(500), markReviewed: z.boolean().default(true) });

// Saving a value as a translator marks it human-reviewed; the legal meaning must not be altered.
export const PUT = handle(async (req) => {
  const u = await requireRole("translator");
  const b = await parseBody(req, Body);
  if (!UI_KEYS.includes(b.key as (typeof UI_KEYS)[number])) throw new ApiError(400, "Unknown translation key.");
  const set = { value: sanitize(b.value), source: b.markReviewed ? "human" : "machine", reviewedBy: b.markReviewed ? u.id : null, reviewedAt: b.markReviewed ? new Date() : null, updatedAt: new Date() };
  const upd = await db.update(translations).set(set).where(and(eq(translations.lang, b.lang), eq(translations.key, b.key))).returning({ id: translations.id });
  if (!upd.length) await db.insert(translations).values({ lang: b.lang, key: b.key, ...set });
  await audit(req, u, "save_translation", "translation", `${b.lang}:${b.key}`, { reviewed: b.markReviewed });
  return { ok: true };
});
