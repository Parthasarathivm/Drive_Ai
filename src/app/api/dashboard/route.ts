import { and, count, eq } from "drizzle-orm";
import { db, checkDbConnection } from "@/db";
import * as S from "@/db/schema";
import { handle } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { docStatus } from "@/lib/compliance";
import { coverageByState } from "@/lib/intelligence";
import { STATES } from "@/lib/constants";

// Every statistic is computed from actual database rows when available.
// If the database is disconnected or unmigrated, returns a structured baseline with dbConnected=false.
export const GET = handle(async () => {
  const dbHealth = await checkDbConnection();

  // Baseline empty structure
  const emptyRecords = {
    rules: {} as Record<string, number>,
    penalties: {} as Record<string, number>,
    areas: {} as Record<string, number>,
    locations: {} as Record<string, number>,
    licenceServices: {} as Record<string, number>,
    vehicleServices: {} as Record<string, number>,
    permits: {} as Record<string, number>,
  };

  type CoverageLevel = "verified" | "partial" | "unverified" | "central_only";

  const emptyCoverage: { code: string; name: string; total: number; verified: number; level: CoverageLevel }[] = STATES.map((def) => ({
    code: def.code,
    name: def.name,
    total: 0,
    verified: 0,
    level: "central_only",
  }));

  if (!dbHealth.connected) {
    console.warn("[Dashboard API]: Database currently unreachable. Returning baseline empty state:", dbHealth.error);
    return {
      success: true,
      dbConnected: false,
      message: "Database connection unavailable. Displaying baseline state until database service is started.",
      records: emptyRecords,
      totals: { sources: 0, documents: 0, neverChecked: 0, stateCoverage: { central_only: 36 } },
      findings: { gaps: {}, conflicts: {} },
      coverage: emptyCoverage,
      userDocuments: null,
    };
  }

  // Safe table tally function that will not throw even if a specific table is empty or missing
  const tally = async (
    table:
      | typeof S.legalRules
      | typeof S.penalties
      | typeof S.protectedAreas
      | typeof S.locations
      | typeof S.licenseServices
      | typeof S.vehicleServices
      | typeof S.permits
  ): Promise<Record<string, number>> => {
    try {
      const rows = await db
        .select({ s: table.verificationStatus, n: count() })
        .from(table)
        .groupBy(table.verificationStatus);
      return Object.fromEntries(rows.map((r) => [r.s, r.n])) as Record<string, number>;
    } catch (err: unknown) {
      console.warn("[Dashboard tally query skipped]:", err instanceof Error ? err.message : String(err));
      return {};
    }
  };

  try {
    const [rules, penalties, areas, locations, lic, veh, permits] = await Promise.all([
      tally(S.legalRules),
      tally(S.penalties),
      tally(S.protectedAreas),
      tally(S.locations),
      tally(S.licenseServices),
      tally(S.vehicleServices),
      tally(S.permits),
    ]);

    let sourcesCount = 0;
    let docsCount = 0;
    let uncheckedCount = 0;

    try {
      const srcRows = await db.select({ sources: count() }).from(S.legalSources);
      sourcesCount = srcRows[0]?.sources ?? 0;
      const allSrcs = await db.select().from(S.legalSources);
      uncheckedCount = allSrcs.filter((s) => !s.lastCheckedAt).length;
    } catch (e) {
      console.warn("[Dashboard sources count skipped]:", (e as Error).message);
    }

    try {
      const docRows = await db.select({ docs: count() }).from(S.legalDocuments);
      docsCount = docRows[0]?.docs ?? 0;
    } catch (e) {
      console.warn("[Dashboard docs count skipped]:", (e as Error).message);
    }

    const gapRecord: Record<string, number> = {};
    try {
      const gapRows = await db
        .select({ s: S.informationGaps.findingStatus, n: count() })
        .from(S.informationGaps)
        .where(and(eq(S.informationGaps.isExample, false), eq(S.informationGaps.reviewStatus, "open")))
        .groupBy(S.informationGaps.findingStatus);
      gapRows.forEach((r) => {
        if (r.s) gapRecord[r.s] = r.n;
      });
    } catch (e) {
      console.warn("[Dashboard gapRows skipped]:", (e as Error).message);
    }

    const conflictRecord: Record<string, number> = {};
    try {
      const conflictRows = await db
        .select({ s: S.sourceConflicts.findingStatus, n: count() })
        .from(S.sourceConflicts)
        .where(eq(S.sourceConflicts.reviewStatus, "open"))
        .groupBy(S.sourceConflicts.findingStatus);
      conflictRows.forEach((r) => {
        if (r.s) conflictRecord[r.s] = r.n;
      });
    } catch (e) {
      console.warn("[Dashboard conflictRows skipped]:", (e as Error).message);
    }

    let coverage = emptyCoverage;
    try {
      coverage = await coverageByState();
    } catch (e) {
      console.warn("[Dashboard coverageByState skipped]:", (e as Error).message);
    }

    const coverageCounts = coverage.reduce<Record<string, number>>((a, c) => {
      a[c.level] = (a[c.level] ?? 0) + 1;
      return a;
    }, {});

    let userDocsSummary: Record<string, number> | null = null;
    try {
      const user = await getSessionUser();
      if (user) {
        const userDocs = await db.select().from(S.userDocuments).where(eq(S.userDocuments.userId, user.id));
        userDocsSummary = userDocs.reduce<Record<string, number>>((a, x) => {
          const st = docStatus(x.expiryDate);
          a[st] = (a[st] ?? 0) + 1;
          return a;
        }, {});
        userDocsSummary.total = userDocs.length;
      }
    } catch (e) {
      console.warn("[Dashboard user documents skipped]:", (e as Error).message);
    }

    return {
      success: true,
      dbConnected: true,
      records: { rules, penalties, areas, locations, licenceServices: lic, vehicleServices: veh, permits },
      totals: { sources: sourcesCount, documents: docsCount, neverChecked: uncheckedCount, stateCoverage: coverageCounts },
      findings: { gaps: gapRecord, conflicts: conflictRecord },
      coverage,
      userDocuments: userDocsSummary,
    };
  } catch (err: unknown) {
    console.error("[Dashboard Load Fatal Exception]:", err);
    return {
      success: false,
      message: "Unable to load dashboard data.",
      code: "DASHBOARD_LOAD_FAILED",
      records: emptyRecords,
      totals: { sources: 0, documents: 0, neverChecked: 0, stateCoverage: { central_only: 36 } },
      findings: { gaps: {}, conflicts: {} },
      coverage: emptyCoverage,
      userDocuments: null,
    };
  }
});
