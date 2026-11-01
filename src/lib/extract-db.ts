import { createHash } from "node:crypto";
import { db } from "@/db";
import { legalRules } from "@/db/schema";
import { sanitize } from "@/lib/api";
import { extractRules } from "@/lib/extract";

export async function extractRulesIntoDb(documentId: number, text: string, _title: string, sourceId: number | null, url: string | null, _userId: number) {
  const { candidates, method } = await extractRules(text);
  let count = 0;
  for (const [i, c] of candidates.entries()) {
    const hash = createHash("sha1").update(`${documentId}-${i}-${c.excerpt}`).digest("hex").slice(0, 8);
    const res = await db.insert(legalRules).values({
      ruleKey: `doc${documentId}-${i}-${hash}`, title: sanitize(c.title).slice(0, 200), topic: "central-law", category: "Extracted (pending review)", vehicleCategories: [],
      legalReference: c.legalReference ? sanitize(c.legalReference) : null, originalText: c.excerpt.slice(0, 4000), explanation: c.explanation ? sanitize(c.explanation) : null,
      documentId, sourceId, sourceUrl: url, verificationStatus: "pending", extractedBy: method === "ai" ? "ai" : "heuristic", conditions: c.hasPenalty ? "Contains penalty wording — create/verify a penalty record separately." : null,
    }).onConflictDoNothing().returning({ id: legalRules.id });
    count += res.length;
  }
  return { count, method };
}

