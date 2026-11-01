import { eq } from "drizzle-orm";
import { db } from "@/db";
import { translations } from "@/db/schema";
import { handle } from "@/lib/api";

export const GET = handle(async (req) => {
  const lang = new URL(req.url).searchParams.get("lang") ?? "en";
  const rows = await db.select().from(translations).where(eq(translations.lang, lang));
  return {
    lang,
    values: Object.fromEntries(rows.map((r) => [r.key, r.value])),
    reviewed: rows.length > 0 && rows.every((r) => r.source === "human"),
    machineKeys: rows.filter((r) => r.source !== "human").length,
  };
});
