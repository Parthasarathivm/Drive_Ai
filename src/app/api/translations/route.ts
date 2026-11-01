import { eq } from "drizzle-orm";
import { db } from "@/db";
import { translations } from "@/db/schema";
import { handle } from "@/lib/api";
import { builtInDict } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/constants";

export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const rawLang = url.searchParams.get("lang") ?? "en";
  const validLang = LANGUAGES.some((l) => l.code === rawLang) ? rawLang : "en";

  // Guaranteed full baseline dictionary: English fallback overlaid with requested language built-in keys
  const enDict = builtInDict("en");
  const langDict = builtInDict(validLang);
  const mergedValues: Record<string, string> = { ...enDict, ...langDict };

  let reviewed = validLang === "en";
  let machineKeys = validLang === "en" ? 0 : Object.keys(mergedValues).length;
  let source = "builtin";

  // Safely check for human-reviewed database overrides if database is connected
  try {
    const rows = await db.select().from(translations).where(eq(translations.lang, validLang));
    if (rows && rows.length > 0) {
      for (const r of rows) {
        if (r.value) {
          mergedValues[r.key] = r.value;
        }
      }
      reviewed = rows.every((r) => r.source === "human");
      machineKeys = rows.filter((r) => r.source !== "human").length;
      source = "database";
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[Translations API Notice] DB query skipped for lang=${validLang} (using built-in dictionary):`, msg);
  }

  return {
    success: true,
    lang: validLang,
    values: mergedValues,
    reviewed,
    machineKeys,
    source,
  };
});
