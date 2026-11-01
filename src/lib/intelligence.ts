import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import * as S from "@/db/schema";
import { STATES, VEHICLE_CATEGORIES } from "@/lib/constants";

// Legal Gap & Conflict Detection Engine.
// Deterministic rule-based checks over structured records. The engine NEVER decides which of two conflicting
// sources prevails — it lists factors for a human legal reviewer (issuing authority, jurisdiction, effective date, legal status).

type Gap = {
  gapKey: string; gapType: string; entityType: string; entityId?: number; title: string; explanation: string;
  sourceA?: Record<string, unknown>; documentDates?: Record<string, unknown>; legalProvisions?: string | null;
  reason: string; priority: "high" | "medium" | "low"; findingStatus: string; suggestedAction: string;
};

async function upsertGaps(gaps: Gap[]) {
  let created = 0;
  for (let i = 0; i < gaps.length; i += 100) {
    const chunk = gaps.slice(i, i + 100);
    const res = await db.insert(S.informationGaps).values(chunk).onConflictDoNothing().returning({ id: S.informationGaps.id });
    created += res.length;
  }
  return created;
}

/** Remove open auto-detected gaps whose condition no longer holds. */
async function pruneGaps(prefix: string, currentKeys: Set<string>) {
  const all = await db.select().from(S.informationGaps).where(and(eq(S.informationGaps.isExample, false), eq(S.informationGaps.reviewStatus, "open")));
  for (const g of all) if (g.gapKey.startsWith(prefix) && !currentKeys.has(g.gapKey)) await db.delete(S.informationGaps).where(eq(S.informationGaps.id, g.id));
}

export async function runGapDetection() {
  const [rules, pens, areas, lic, veh, locs, srcs, states] = await Promise.all([
    db.select().from(S.legalRules),
    db.select().from(S.penalties),
    db.select().from(S.protectedAreas),
    db.select().from(S.licenseServices),
    db.select().from(S.vehicleServices),
    db.select().from(S.locations),
    db.select().from(S.legalSources),
    db.select().from(S.states),
  ]);
  const gaps: Gap[] = [];
  const g = (x: Gap) => gaps.push(x);

  for (const r of rules) {
    const base = { entityType: "legal_rule", entityId: r.id, sourceA: { name: r.title, url: r.sourceUrl, reference: r.legalReference } };
    if (!r.legalReference) g({ ...base, gapKey: `rule-${r.id}-section`, gapType: "missing_legal_section", title: `Missing legal section: ${r.title}`, explanation: "The rule has no legal provision reference.", reason: "legal_reference is empty", priority: "high", findingStatus: "Information Not Found", suggestedAction: "Identify the Act/section/notification and record it." });
    if (!r.effectiveFrom) g({ ...base, gapKey: `rule-${r.id}-effective`, gapType: "missing_effective_date", title: `Missing effective date: ${r.title}`, explanation: "No verified effective date is recorded for this rule.", legalProvisions: r.legalReference, reason: "effective_from is empty", priority: "medium", findingStatus: "Needs Verification", suggestedAction: "Find the commencement/notification date in the official source." });
    if (!r.vehicleCategories?.length) g({ ...base, gapKey: `rule-${r.id}-vehicle`, gapType: "missing_vehicle_applicability", title: `Vehicle applicability missing: ${r.title}`, explanation: "It is unclear which vehicle categories this rule applies to.", reason: "vehicle_categories is empty", priority: "high", findingStatus: "Needs Verification", suggestedAction: "Specify applicable vehicle categories." });
    if (!r.stateId && r.jurisdictionLevel !== "central") g({ ...base, gapKey: `rule-${r.id}-jurisdiction`, gapType: "missing_jurisdiction", title: `Jurisdiction missing: ${r.title}`, explanation: "A non-central rule has no state/district jurisdiction.", reason: "state_id empty on non-central rule", priority: "high", findingStatus: "Needs Verification", suggestedAction: "Set the jurisdiction." });
    if (!r.originalText) g({ ...base, gapKey: `rule-${r.id}-original`, gapType: "missing_original_text", title: `Original legal text not loaded: ${r.title}`, explanation: "Only a plain-language summary exists; the verbatim legal provision has not been attached.", legalProvisions: r.legalReference, reason: "original_text is empty", priority: "low", findingStatus: "Needs Verification", suggestedAction: "Copy the original text from the official source and attach it." });
  }

  for (const p of pens) {
    const base = { entityType: "penalty", entityId: p.id, sourceA: { name: p.violationName, url: p.sourceUrl, reference: p.legalSection } };
    if (p.baseAmount == null && p.minAmount == null) g({ ...base, gapKey: `pen-${p.id}-amount`, gapType: "missing_penalty_amount", title: `No verified penalty amount: ${p.violationName}`, explanation: "No amount is recorded, so the fine calculator cannot compute this violation.", legalProvisions: p.legalSection, reason: "base_amount is empty", priority: "high", findingStatus: "Information Not Found", suggestedAction: "Locate the applicable section/notification and record the amount with its source." });
    if (!p.effectiveFrom && p.baseAmount != null) g({ ...base, gapKey: `pen-${p.id}-effective`, gapType: "missing_effective_date", title: `Penalty has no effective date: ${p.violationName}`, explanation: "An amount is recorded without an effective date.", legalProvisions: p.legalSection, reason: "effective_from is empty", priority: "medium", findingStatus: "Needs Verification", suggestedAction: "Record the date from which the penalty applies." });
    if (p.verificationStatus === "pending" && p.baseAmount != null) g({ ...base, gapKey: `pen-${p.id}-unverified`, gapType: "unverified_record", title: `Penalty awaiting human review: ${p.violationName}`, explanation: "This amount has not been approved by a legal reviewer and is excluded from verified calculations.", legalProvisions: p.legalSection, reason: "verification_status = pending", priority: "high", findingStatus: "Needs Verification", suggestedAction: "A Legal Reviewer should compare against the official text and approve or reject." });
  }

  for (const a of areas) {
    const missing = (["vehicleEntry", "permitInfo", "bookingInfo", "timings", "entryConditions"] as const).filter((f) => !a[f]);
    if (missing.length) g({ entityType: "protected_area", entityId: a.id, gapKey: `area-${a.id}-info`, gapType: "missing_information", title: `Entry information incomplete: ${a.name}`, explanation: `Missing: ${missing.join(", ")}. The platform will not guess permit rules, fees or timings.`, sourceA: { name: a.name, url: a.officialUrl, authority: a.authority }, reason: `${missing.length} required fields are empty`, priority: "high", findingStatus: "Information Not Found", suggestedAction: "Obtain the official entry notification from the responsible Forest Department." });
  }

  for (const s of [...lic.map((x) => ({ ...x, t: "license_service" })), ...veh.map((x) => ({ ...x, t: "vehicle_service" }))]) {
    if (!s.feeInfo) g({ entityType: s.t, entityId: s.id, gapKey: `svc-${s.t}-${s.id}-fee`, gapType: "missing_information", title: `Fee not verified: ${s.title}`, explanation: "No verified fee is recorded; users are directed to the official portal.", sourceA: { name: s.title, url: s.officialUrl }, reason: "fee_info is empty", priority: "low", findingStatus: "Information Not Found", suggestedAction: "Record the fee from the official fee schedule per state." });
  }

  for (const l of locs) {
    if (!l.permitInfo && !l.restrictions) g({ entityType: "location", entityId: l.id, gapKey: `loc-${l.id}-info`, gapType: "missing_information", title: `No restriction data: ${l.name}`, explanation: "No restriction or permit information is recorded for this destination.", reason: "restrictions and permit_info empty", priority: "low", findingStatus: "Information Not Found", suggestedAction: "Check local authority sources." });
  }

  for (const st of srcs) {
    if (!st.lastCheckedAt) g({ entityType: "legal_source", entityId: st.id, gapKey: `src-${st.id}-never`, gapType: "unanswered_freshness", title: `Source never checked: ${st.name}`, explanation: "No freshness check has been recorded for this official source.", sourceA: { name: st.name, url: st.url }, reason: "last_checked_at is empty", priority: "medium", findingStatus: "Needs Verification", suggestedAction: "Open the source, confirm it is current, then mark it as checked in Source Management." });
  }

  // State coverage (central-vs-state comparison)
  const stateRecordCount = new Map<number, number>();
  for (const x of [...rules, ...pens]) if (x.stateId) stateRecordCount.set(x.stateId, (stateRecordCount.get(x.stateId) ?? 0) + 1);
  for (const st of states) {
    if (!stateRecordCount.get(st.id)) g({ entityType: "state", entityId: st.id, gapKey: `state-${st.id}-coverage`, gapType: "no_state_data", title: `No state-specific rules or penalties: ${st.name}`, explanation: `Only central law is recorded for ${st.name}. State amendments, state rules and local regulations have not been loaded, so state-specific answers cannot be marked verified.`, reason: "0 state-level legal records", priority: "medium", findingStatus: "Information Not Found", suggestedAction: `Register ${st.name}'s transport department sources and add verified state records.` });
  }

  // Vehicle-category coverage for penalties
  const violationKeys = [...new Set(pens.map((p) => p.violationKey))];
  for (const vk of violationKeys) {
    const rows = pens.filter((p) => p.violationKey === vk && !p.stateId);
    if (rows.some((r) => r.vehicleCategories.includes("*"))) continue;
    const covered = new Set(rows.flatMap((r) => r.vehicleCategories));
    const uncovered = VEHICLE_CATEGORIES.filter((v) => !covered.has(v.slug)).map((v) => v.name);
    if (uncovered.length && uncovered.length < VEHICLE_CATEGORIES.length) g({ entityType: "penalty", gapKey: `penvehicle-${vk}`, gapType: "missing_vehicle_applicability", title: `Penalty coverage by vehicle: ${rows[0]?.violationName ?? vk}`, explanation: `No penalty record covers: ${uncovered.join(", ")}. This may be legitimately not applicable or may be missing.`, reason: "vehicle category not covered by any central record", priority: "low", findingStatus: "Needs Verification", suggestedAction: "Confirm applicability for the uncovered vehicle categories." });
  }

  const keys = new Set(gaps.map((x) => x.gapKey));
  const created = await upsertGaps(gaps);
  for (const pfx of ["rule-", "pen-", "area-", "svc-", "loc-", "src-", "state-", "penvehicle-"]) await pruneGaps(pfx, keys);
  return { detected: gaps.length, created };
}

export async function runConflictDetection() {
  const pens = await db.select().from(S.penalties);
  const states = await db.select().from(S.states);
  const srcs = await db.select().from(S.legalSources);
  const sName = (id: number | null) => srcs.find((s) => s.id === id)?.name ?? "Unknown source";
  const stName = (id: number | null) => (id ? states.find((s) => s.id === id)?.name ?? "State" : "Central (India)");
  const out: (typeof S.sourceConflicts.$inferInsert)[] = [];

  const groups = new Map<string, typeof pens>();
  for (const p of pens) {
    if (p.verificationStatus === "rejected") continue;
    for (const v of p.vehicleCategories) {
      const k = `${p.violationKey}|${v}`;
      groups.set(k, [...(groups.get(k) ?? []), p]);
    }
  }
  const seen = new Set<string>();
  for (const [k, rows] of groups) {
    if (rows.length < 2) continue;
    for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      const same = a.baseAmount === b.baseAmount && a.minAmount === b.minAmount && a.repeatAmount === b.repeatAmount;
      const pairKey = `penalty-${[a.id, b.id].sort().join("-")}`;
      if (same || seen.has(pairKey)) continue;
      seen.add(pairKey);
      const crossJur = (a.stateId ?? 0) !== (b.stateId ?? 0);
      out.push({
        conflictKey: pairKey,
        title: `${crossJur ? "Central vs state" : "Same-jurisdiction"} penalty difference: ${a.violationName}`,
        explanation: `Two records for "${a.violationName}" (${k.split("|")[1]}) show different amounts: ${a.baseAmount ?? "n/a"} (${stName(a.stateId)}) vs ${b.baseAmount ?? "n/a"} (${stName(b.stateId)}).`,
        sourceA: { name: sName(a.sourceId), jurisdiction: stName(a.stateId), section: a.legalSection, amount: a.baseAmount, url: a.sourceUrl },
        sourceB: { name: sName(b.sourceId), jurisdiction: stName(b.stateId), section: b.legalSection, amount: b.baseAmount, url: b.sourceUrl },
        documentDates: { sourceA: a.effectiveFrom, sourceB: b.effectiveFrom },
        legalProvisions: `${a.legalSection ?? "?"} | ${b.legalSection ?? "?"}`,
        reason: crossJur ? "Central and state records differ. A state amendment may validly override the central amount within its powers." : "Two active records in the same jurisdiction disagree.",
        priority: crossJur ? "medium" : "high",
        findingStatus: "Potential Conflict",
        suggestedAction: "Human review required: compare issuing authority, jurisdiction, effective dates and legal status (superseded/in force). The system does not choose a winner.",
      });
    }
  }
  if (out.length) await db.insert(S.sourceConflicts).values(out).onConflictDoNothing();
  return { detected: out.length };
}

export async function runOutdatedDetection(now = new Date()) {
  const docs = await db.select().from(S.legalDocuments);
  const srcs = await db.select().from(S.legalSources);
  const gaps: Gap[] = [];
  const staleMs = 365 * 86400_000;
  for (const d of docs) {
    if (d.status === "superseded") gaps.push({ entityType: "legal_document", entityId: d.id, gapKey: `doc-${d.id}-superseded`, gapType: "superseded_document", title: `Superseded document still registered: ${d.title}`, explanation: "This document is marked superseded. Rules extracted from it may no longer apply.", documentDates: { published: d.publishedDate, effective: d.effectiveDate }, reason: "status = superseded", priority: "high", findingStatus: "Outdated", suggestedAction: "Check rules linked to this document and mark them outdated if replaced." });
    else if (!d.lastVerifiedAt || now.getTime() - d.lastVerifiedAt.getTime() > staleMs) gaps.push({ entityType: "legal_document", entityId: d.id, gapKey: `doc-${d.id}-stale`, gapType: "outdated_document", title: `Document not verified in the last 12 months: ${d.title}`, explanation: "No recent verification of this document against the official source. It may have been amended or superseded.", documentDates: { published: d.publishedDate, effective: d.effectiveDate, lastVerified: d.lastVerifiedAt }, reason: d.lastVerifiedAt ? "last_verified_at older than 365 days" : "never verified", priority: "medium", findingStatus: "Needs Verification", suggestedAction: "Confirm on the official source whether newer amendments or notifications exist." });
    if (d.docType === "act" && !d.extractedText) gaps.push({ entityType: "legal_document", entityId: d.id, gapKey: `doc-${d.id}-notext`, gapType: "missing_information", title: `Full text not loaded: ${d.title}`, explanation: "The document is registered but no text has been uploaded/extracted, so AI answers cannot cite its wording.", reason: "extracted_text is empty", priority: "low", findingStatus: "Information Not Found", suggestedAction: "Upload the official PDF in Admin → Source Management." });
  }
  for (const s of srcs) {
    if (s.lastCheckedAt && now.getTime() - s.lastCheckedAt.getTime() > s.checkFrequencyDays * 86400_000) gaps.push({ entityType: "legal_source", entityId: s.id, gapKey: `src-${s.id}-stale`, gapType: "stale_source", title: `Source overdue for freshness check: ${s.name}`, explanation: `Not checked within its ${s.checkFrequencyDays}-day monitoring window.`, sourceA: { name: s.name, url: s.url }, reason: "last_checked_at older than check frequency", priority: "medium", findingStatus: "Outdated", suggestedAction: "Re-check the source for new notifications." });
  }
  // Potentially superseded: two documents with same title/type, later effective date
  for (const a of docs) for (const b of docs) {
    if (a.id < b.id && a.title === b.title && a.effectiveDate && b.effectiveDate && a.effectiveDate !== b.effectiveDate) {
      const [older, newer] = a.effectiveDate < b.effectiveDate ? [a, b] : [b, a];
      gaps.push({ entityType: "legal_document", entityId: older.id, gapKey: `doc-${older.id}-maybe-superseded-by-${newer.id}`, gapType: "potentially_superseded", title: `Potentially superseded: ${older.title}`, explanation: "A document with the same title and a later effective date exists. This is a hint only; the system does not decide legal supersession.", documentDates: { older: older.effectiveDate, newer: newer.effectiveDate }, reason: "same title, later effective date", priority: "high", findingStatus: "Potential Conflict", suggestedAction: "Reviewer to confirm legal status and set superseded_by if appropriate." });
    }
  }
  const created = gaps.length ? await upsertGaps(gaps) : 0;
  const keys = new Set(gaps.map((x) => x.gapKey));
  await pruneGaps("doc-", keys);
  return { detected: gaps.length, created };
}

export async function coverageByState() {
  const [states, rules, pens, areas, locs] = await Promise.all([
    db.select().from(S.states),
    db.select().from(S.legalRules),
    db.select().from(S.penalties),
    db.select().from(S.protectedAreas),
    db.select().from(S.locations),
  ]);
  return STATES.map((def) => {
    const st = states.find((s) => s.code === def.code);
    const id = st?.id;
    const recs = [
      ...rules.filter((r) => r.stateId === id).map((r) => r.verificationStatus),
      ...pens.filter((r) => r.stateId === id).map((r) => r.verificationStatus),
      ...areas.filter((r) => r.stateId === id).map((r) => r.verificationStatus),
      ...locs.filter((r) => r.stateId === id).map((r) => r.verificationStatus),
    ];
    const verified = recs.filter((r) => r === "verified").length;
    const level: "verified" | "partial" | "unverified" | "central_only" = !recs.length ? "central_only" : verified === recs.length ? "verified" : verified > 0 ? "partial" : "unverified";
    return { code: def.code, name: def.name, total: recs.length, verified, level };
  });
}

