import { and, count, eq } from "drizzle-orm";
import { db } from "@/db";
import * as S from "@/db/schema";
import { handle } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { docStatus } from "@/lib/compliance";
import { coverageByState } from "@/lib/intelligence";

// Every number is computed from actual rows — nothing is hard-coded.
export const GET = handle(async () => {
  const tally = async (table: typeof S.legalRules | typeof S.penalties | typeof S.protectedAreas | typeof S.locations | typeof S.licenseServices | typeof S.vehicleServices | typeof S.permits) => {
    const rows = await db.select({ s: table.verificationStatus, n: count() }).from(table).groupBy(table.verificationStatus);
    return Object.fromEntries(rows.map((r) => [r.s, r.n])) as Record<string, number>;
  };
  const [rules, penalties, areas, locations, lic, veh, permits] = await Promise.all([
    tally(S.legalRules), tally(S.penalties), tally(S.protectedAreas), tally(S.locations), tally(S.licenseServices), tally(S.vehicleServices), tally(S.permits),
  ]);
  const [{ sources }] = await db.select({ sources: count() }).from(S.legalSources);
  const [{ docs }] = await db.select({ docs: count() }).from(S.legalDocuments);
  const gapRows = await db.select({ s: S.informationGaps.findingStatus, n: count() }).from(S.informationGaps).where(and(eq(S.informationGaps.isExample, false), eq(S.informationGaps.reviewStatus, "open"))).groupBy(S.informationGaps.findingStatus);
  const conflictRows = await db.select({ s: S.sourceConflicts.findingStatus, n: count() }).from(S.sourceConflicts).where(eq(S.sourceConflicts.reviewStatus, "open")).groupBy(S.sourceConflicts.findingStatus);
  const coverage = await coverageByState();
  const coverageCounts = coverage.reduce<Record<string, number>>((a, c) => ((a[c.level] = (a[c.level] ?? 0) + 1), a), {});
  const sourcesAll = await db.select().from(S.legalSources);
  const unchecked = sourcesAll.filter((s) => !s.lastCheckedAt).length;

  const user = await getSessionUser();
  let documents: Record<string, number> | null = null;
  if (user) {
    const d = await db.select().from(S.userDocuments).where(eq(S.userDocuments.userId, user.id));
    documents = d.reduce<Record<string, number>>((a, x) => ((a[docStatus(x.expiryDate)] = (a[docStatus(x.expiryDate)] ?? 0) + 1), a), {});
    documents.total = d.length;
  }
  return {
    records: { rules, penalties, areas, locations, licenceServices: lic, vehicleServices: veh, permits },
    totals: { sources, documents: docs, neverChecked: unchecked, stateCoverage: coverageCounts },
    findings: { gaps: Object.fromEntries(gapRows.map((r) => [r.s, r.n])), conflicts: Object.fromEntries(conflictRows.map((r) => [r.s, r.n])) },
    coverage,
    userDocuments: documents,
  };
});
