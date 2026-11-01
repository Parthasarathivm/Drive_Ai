import { eq } from "drizzle-orm";
import { db } from "@/db";
import { legalRules, legalSources, ruleVersions } from "@/db/schema";
import { ApiError, handle } from "@/lib/api";

export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id.");
  const [rule] = await db.select().from(legalRules).where(eq(legalRules.id, id)).limit(1);
  if (!rule) throw new ApiError(404, "Rule not found.");
  const [source] = rule.sourceId ? await db.select().from(legalSources).where(eq(legalSources.id, rule.sourceId)) : [];
  const versions = await db.select().from(ruleVersions).where(eq(ruleVersions.ruleId, id)).orderBy(ruleVersions.version);
  return { rule, source: source ?? null, versions };
});
