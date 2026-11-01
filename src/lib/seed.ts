import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import * as S from "@/db/schema";
import { LANGUAGES, STATES, VEHICLE_CATEGORIES } from "@/lib/constants";
import { BUILTIN_LANGS, UI_KEYS, builtInDict } from "@/lib/i18n";
import * as D from "@/lib/seed-data";

const SEED_VERSION = "seed_v1";
let seedPromise: Promise<void> | null = null;

/** Idempotent, concurrency-safe seed. Called lazily from API handlers. */
export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((e) => {
      console.warn("[Database Seed Skipped/Pending]:", e instanceof Error ? e.message : String(e));
      seedPromise = null;
    });
  }
  return seedPromise;
}

async function runSeed() {
  const existing = await db.select().from(S.appMeta).where(eq(S.appMeta.key, SEED_VERSION));
  if (existing.length) return;

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(727001)`);
    const again = await tx.select().from(S.appMeta).where(eq(S.appMeta.key, SEED_VERSION));
    if (again.length) return;

    await tx.insert(S.states).values(STATES.map((s) => ({ code: s.code, name: s.name, type: s.type }))).onConflictDoNothing();
    await tx.insert(S.vehicleCategories).values(VEHICLE_CATEGORIES).onConflictDoNothing();
    await tx
      .insert(S.languages)
      .values(LANGUAGES.map((l) => ({ code: l.code, name: l.name, nativeName: l.nativeName, speechCode: l.speech })))
      .onConflictDoNothing();

    const stateRows = await tx.select().from(S.states);
    const stId = (code: string) => stateRows.find((s) => s.code === code)?.id ?? null;

    const dRows = Object.entries(D.DISTRICTS).flatMap(([code, names]) => names.map((name) => ({ stateId: stId(code)!, name })));
    await tx.insert(S.districts).values(dRows).onConflictDoNothing();

    await tx.insert(S.legalSources).values(D.SOURCES).onConflictDoNothing();
    const srcRows = await tx.select().from(S.legalSources);
    const src = (slug?: string) => srcRows.find((s) => s.slug === slug);
    const srcId = (slug?: string) => src(slug)?.id ?? null;

    await tx
      .insert(S.legalDocuments)
      .values(
        D.DOCUMENTS.map((d) => ({
          slug: d.slug,
          sourceId: srcId(d.source),
          title: d.title,
          docType: d.docType,
          issuingAuthority: d.issuingAuthority,
          publishedDate: d.publishedDate,
          effectiveDate: d.effectiveDate,
          url: src(d.source)?.url,
          isDemo: true,
        })),
      )
      .onConflictDoNothing();
    const docRows = await tx.select().from(S.legalDocuments);
    const docId = (slug?: string) => docRows.find((d) => d.slug === slug)?.id ?? null;

    await tx.insert(S.licenseServices).values(
      D.LICENCE_SERVICES.map((l) => ({ ...l, officialUrl: "https://sarathi.parivahan.gov.in/", sourceId: srcId("sarathi"), feeInfo: null })),
    ).onConflictDoNothing();

    await tx.insert(S.vehicleServices).values(
      D.VEHICLE_SERVICES.map((v) => ({
        slug: v.slug, title: v.title, category: v.category, description: v.description, eligibility: v.eligibility,
        documents: v.documents, steps: v.steps, vehicleCategories: v.vehicles, feeInfo: null,
        officialUrl: "https://vahan.parivahan.gov.in/", sourceId: srcId("vahan"),
      })),
    ).onConflictDoNothing();

    await tx.insert(S.permits).values(
      D.PERMITS.map((p) => ({
        slug: p.slug, name: p.name, permitType: p.permitType, scope: p.scope, legalReference: p.legalReference,
        description: p.description, applicableVehicles: p.applicableVehicles, requirements: p.requirements,
        officialUrl: "https://parivahan.gov.in/", sourceId: srcId("parivahan"),
      })),
    ).onConflictDoNothing();

    await tx.insert(S.protectedAreas).values(
      D.PROTECTED_AREAS.map((a) => ({
        slug: a.slug, name: a.name, classification: a.classification, stateId: stId(a.state), district: a.district,
        authority: a.authority, closures: a.closures ?? null, sourceId: srcId("moef"), officialUrl: "https://moef.gov.in/",
        notes: "Entry rules, permits, fees, timings and booking details have NOT been verified for this area. Confirm with the Forest Department.",
      })),
    ).onConflictDoNothing();

    await tx.insert(S.locations).values(
      D.LOCATIONS.map((l) => ({
        slug: l.slug, name: l.name, type: l.type, stateId: stId(l.state), district: l.district,
        permitInfo: l.permitInfo ?? null, restrictions: l.restrictions ?? null,
        vehicleNotes: (l as { vehicleNotes?: string }).vehicleNotes ?? null,
      })),
    ).onConflictDoNothing();

    await tx.insert(S.legalRules).values(
      D.RULES.map((r) => ({
        ruleKey: r.key, title: r.title, topic: r.topic, category: r.category, vehicleCategories: r.vehicles ?? ["*"],
        legalReference: r.ref, explanation: r.explanation, conditions: r.conditions ?? null, exceptions: r.exceptions ?? null,
        sourceId: srcId(r.src ?? "india-code"), documentId: docId(r.doc), sourceUrl: src(r.src ?? "india-code")?.url,
        extractedBy: "seed", isDemo: true,
      })),
    ).onConflictDoNothing();

    await tx.insert(S.penalties).values(
      D.PENALTIES.map((p) => ({
        recordKey: `central-${p.key}`, violationKey: p.vkey, violationName: p.name, legalSection: p.section,
        vehicleCategories: p.vehicles, baseAmount: p.base ?? null, minAmount: p.min ?? null, repeatAmount: p.repeat ?? null,
        additionalAmount: p.addl ?? null, additionalUnit: p.unit ?? null, imprisonment: p.prison ?? null,
        otherConsequences: p.other ?? null, repeatConditions: p.repeatCond ?? null, effectiveFrom: p.eff ?? null,
        sourceId: srcId("india-code"), sourceUrl: "https://www.indiacode.nic.in/", notes: p.notes ?? null,
        stateAmendment: "No state amendment recorded in the database for this violation.", isDemo: true,
      })),
    ).onConflictDoNothing();

    // Translations: built-in machine-generated dictionaries (English = source text)
    const tRows = BUILTIN_LANGS.flatMap((lang) => {
      const dict = builtInDict(lang);
      return UI_KEYS.map((key) => ({ lang, key, value: dict[key], source: lang === "en" ? "human" : "machine" }));
    });
    for (let i = 0; i < tRows.length; i += 200) await tx.insert(S.translations).values(tRows.slice(i, i + 200)).onConflictDoNothing();

    // Clearly labelled EXAMPLE conflicts (illustrative scenarios, not real findings)
    await tx.insert(S.sourceConflicts).values([
      {
        conflictKey: "example-signal-violation-sections",
        title: "EXAMPLE: Traffic signal violation charged under different sections",
        explanation: "Illustrative scenario. Enforcement practice and published summaries may refer to Section 177 (general penalty) or Section 184 (dangerous driving) for signal violations, with different amounts.",
        sourceA: { name: "Motor Vehicles Act, 1988 — Section 177 (general penalty)", authority: "Parliament of India", url: "https://www.indiacode.nic.in/" },
        sourceB: { name: "Motor Vehicles Act, 1988 — Section 184 (dangerous driving)", authority: "Parliament of India", url: "https://www.indiacode.nic.in/" },
        documentDates: { sourceA: "2019-09-01 (amendment effective)", sourceB: "2019-09-01 (amendment effective)" },
        legalProvisions: "Sections 119, 177, 184",
        reason: "Two provisions could apply to the same behaviour; amounts differ. The system does not decide which prevails.",
        priority: "high", findingStatus: "Potential Conflict", isExample: true,
        suggestedAction: "Check the latest MoRTH notification and the relevant state's challan schedule; have a legal reviewer record the applicable section per state.",
      },
      {
        conflictKey: "example-central-vs-state-helmet",
        title: "EXAMPLE: Central penalty vs a hypothetical state amendment",
        explanation: "Illustrative scenario only — no real state record is implied. If a state notifies a different helmet penalty, central and state records would be shown side-by-side for human review.",
        sourceA: { name: "Central provision — Section 194D", authority: "Parliament of India" },
        sourceB: { name: "Hypothetical state notification", authority: "State Government (example)" },
        documentDates: { sourceA: "2019-09-01", sourceB: "unknown (example)" },
        legalProvisions: "Section 194D; state amendment (if any)",
        reason: "Jurisdiction, issuing authority, effective date and legal status must all be weighed by a human reviewer.",
        priority: "medium", findingStatus: "Potential Conflict", isExample: true,
        suggestedAction: "Register the state notification as a source, add a state penalty record and run conflict detection.",
      },
    ]).onConflictDoNothing();

    await tx.insert(S.appMeta).values({ key: SEED_VERSION, value: new Date().toISOString() });
  });

  // Generate real gap/conflict findings from the seeded records
  try {
    const { runGapDetection, runConflictDetection, runOutdatedDetection } = await import("@/lib/intelligence");
    await runGapDetection();
    await runConflictDetection();
    await runOutdatedDetection();
  } catch (e) {
    console.error("[seed] intelligence run failed", e);
  }
}
