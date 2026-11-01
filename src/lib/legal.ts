import { and, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import * as S from "@/db/schema";
import { PROTECTED_CLASSES, STATES, VEHICLE_CATEGORIES, VIOLATIONS } from "@/lib/constants";

export const inr = (n: number | null | undefined) => (n == null ? "—" : `₹${n.toLocaleString("en-IN")}`);

export function appliesToVehicle(cats: string[] | null | undefined, vehicle?: string | null) {
  if (!vehicle) return true;
  if (!cats || !cats.length) return false;
  return cats.includes("*") || cats.includes(vehicle);
}

export async function stateByCode(code?: string | null) {
  if (!code) return null;
  const r = await db.select().from(S.states).where(eq(S.states.code, code.toUpperCase())).limit(1);
  return r[0] ?? null;
}

async function sourceMap() {
  const rows = await db.select().from(S.legalSources);
  return new Map(rows.map((r) => [r.id, r]));
}

// ---------------- Fines ----------------
export type FineInput = { state?: string | null; vehicle?: string | null; violation: string; repeat?: boolean; extraUnits?: number };

function amountText(p: typeof S.penalties.$inferSelect, repeat = false) {
  const base = repeat && p.repeatAmount != null ? p.repeatAmount : p.baseAmount;
  if (base == null) return null;
  if (!repeat && p.minAmount != null && p.minAmount !== base) return `${inr(p.minAmount)} – ${inr(base)}`;
  return inr(base);
}

export async function calculateFine(input: FineInput) {
  const v = VIOLATIONS.find((x) => x.key === input.violation);
  const st = await stateByCode(input.state);
  const sources = await sourceMap();
  const rows = await db.select().from(S.penalties).where(eq(S.penalties.violationKey, input.violation));
  const applicable = rows.filter((p) => appliesToVehicle(p.vehicleCategories, input.vehicle) && p.verificationStatus !== "rejected");
  const decorate = (p: (typeof rows)[number]) => {
    const verified = p.verificationStatus === "verified";
    const repeat = !!input.repeat;
    const units = Math.max(0, input.extraUnits ?? 0);
    let calc: null | { first: { min: number; max: number } | null; repeat: number | null; additional: number; total: { min: number; max: number } | null; note: string } = null;
    if (verified && (p.baseAmount != null)) {
      const useRepeat = repeat && p.repeatAmount != null;
      const maxBase = useRepeat ? p.repeatAmount! : p.baseAmount;
      const minBase = !useRepeat && p.minAmount != null ? p.minAmount : maxBase;
      const add = (p.additionalAmount ?? 0) * units;
      calc = {
        first: { min: p.minAmount ?? p.baseAmount, max: p.baseAmount },
        repeat: p.repeatAmount,
        additional: add,
        total: { min: minBase + add, max: maxBase + add },
        note: repeat && p.repeatAmount == null ? "Repeat-offence amount is not recorded; first-offence amount used. Verify repeat-offence conditions." : "",
      };
    }
    const src = p.sourceId ? sources.get(p.sourceId) : undefined;
    return {
      id: p.id,
      violationName: p.violationName,
      legalSection: p.legalSection,
      scope: p.stateId ? ("state" as const) : ("central" as const),
      jurisdiction: p.stateId ? st?.name ?? "State" : "Central (all India)",
      baseAmountText: amountText(p, false),
      repeatAmountText: p.repeatAmount != null ? inr(p.repeatAmount) : null,
      additionalPenalty: p.additionalAmount != null ? `${inr(p.additionalAmount)} ${p.additionalUnit ?? ""}`.trim() : null,
      imprisonment: p.imprisonment,
      otherConsequences: p.otherConsequences,
      repeatConditions: p.repeatConditions,
      stateAmendment: p.stateAmendment,
      effectiveFrom: p.effectiveFrom,
      sourceAuthority: src?.authority ?? src?.name ?? null,
      sourceName: src?.name ?? null,
      sourceUrl: p.sourceUrl ?? src?.url ?? null,
      verificationStatus: p.verificationStatus,
      lastVerifiedAt: p.lastVerifiedAt,
      notes: p.notes,
      isDemo: p.isDemo,
      hasAmount: p.baseAmount != null,
      calculation: calc,
    };
  };
  const stateRecs = st ? applicable.filter((p) => p.stateId === st.id).map(decorate) : [];
  const centralRecs = applicable.filter((p) => !p.stateId).map(decorate);
  const all = [...stateRecs, ...centralRecs];
  const verified = all.filter((r) => r.calculation);
  const notices: string[] = [];
  if (!all.length) notices.push("No penalty record exists for this violation and vehicle category. This does not mean there is no penalty — the information is missing. Check the official challan portal.");
  if (all.length && !verified.length) notices.push("VERIFICATION WARNING: No human-verified penalty record is available for this selection, so no fine has been calculated. Any amounts shown are draft references that must be checked against the official source.");
  if (st && !stateRecs.length) notices.push(`No state-specific penalty record is stored for ${st.name}. Central-law records are shown; the state may have notified different amounts.`);
  if (all.some((r) => r.isDemo)) notices.push("DEMO DATA - NOT VERIFIED LEGAL ADVICE");
  const primary = verified.find((r) => r.scope === "state") ?? verified[0] ?? null;
  return { violation: v ?? { key: input.violation, name: input.violation }, state: st ? { code: st.code, name: st.name } : null, vehicle: input.vehicle ?? null, primary, records: all, notices, hasVerified: verified.length > 0 };
}

export async function compareStates(violation: string, vehicle?: string | null) {
  const stateRows = await db.select().from(S.states);
  const rows = (await db.select().from(S.penalties).where(eq(S.penalties.violationKey, violation))).filter((p) => appliesToVehicle(p.vehicleCategories, vehicle) && p.verificationStatus !== "rejected");
  const central = rows.filter((p) => !p.stateId);
  return STATES.map((def) => {
    const st = stateRows.find((s) => s.code === def.code);
    const own = rows.filter((p) => p.stateId === st?.id);
    const used = own.length ? own : central;
    const first = used[0];
    return {
      code: def.code, name: def.name, type: def.type,
      basis: own.length ? "State record" : central.length ? "Central law (no state record stored)" : "No record",
      amount: first ? amountText(first) ?? "Not recorded" : "No record",
      section: first?.legalSection ?? null,
      status: first ? first.verificationStatus : "none",
    };
  });
}

export async function listPenalties(f: { state?: string; vehicle?: string; violation?: string; status?: string; q?: string }) {
  const st = await stateByCode(f.state);
  const conds: SQL[] = [];
  if (f.violation) conds.push(eq(S.penalties.violationKey, f.violation));
  if (f.status) conds.push(eq(S.penalties.verificationStatus, f.status as "pending"));
  if (st) conds.push(or(eq(S.penalties.stateId, st.id), isNull(S.penalties.stateId))!);
  if (f.q) conds.push(ilike(S.penalties.violationName, `%${f.q}%`));
  const rows = await db.select().from(S.penalties).where(conds.length ? and(...conds) : undefined).orderBy(S.penalties.violationName);
  return rows.filter((p) => appliesToVehicle(p.vehicleCategories, f.vehicle));
}

// ---------------- Laws ----------------
export type LawFilter = { q?: string; state?: string; district?: string; vehicle?: string; topic?: string; category?: string; status?: string; limit?: number };

export async function searchRules(f: LawFilter) {
  const st = await stateByCode(f.state);
  const conds: SQL[] = [];
  if (st) conds.push(or(eq(S.legalRules.stateId, st.id), isNull(S.legalRules.stateId))!);
  if (f.topic) conds.push(eq(S.legalRules.topic, f.topic));
  if (f.category) conds.push(eq(S.legalRules.category, f.category));
  if (f.status) conds.push(eq(S.legalRules.verificationStatus, f.status as "pending"));
  if (f.district) conds.push(ilike(S.legalRules.district, `%${f.district}%`));
  const tokens = (f.q ?? "").split(/\s+/).filter((t) => t.length > 1).slice(0, 6);
  if (tokens.length) {
    const like = tokens.map((t) => {
      const p = `%${t.replace(/[%_]/g, "")}%`;
      return or(ilike(S.legalRules.title, p), ilike(S.legalRules.explanation, p), ilike(S.legalRules.legalReference, p), ilike(S.legalRules.topic, p))!;
    });
    conds.push(or(...like)!);
  }
  const rows = await db
    .select({ r: S.legalRules, stateName: S.states.name, sourceName: S.legalSources.name, sourceAuthority: S.legalSources.authority })
    .from(S.legalRules)
    .leftJoin(S.states, eq(S.states.id, S.legalRules.stateId))
    .leftJoin(S.legalSources, eq(S.legalSources.id, S.legalRules.sourceId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(S.legalRules.verificationStatus), S.legalRules.title)
    .limit(f.limit ?? 100);
  return rows
    .filter((x) => appliesToVehicle(x.r.vehicleCategories, f.vehicle))
    .map((x) => ({
      ...x.r,
      jurisdiction: x.stateName ?? "India (Central)",
      sourceName: x.sourceName,
      sourceAuthority: x.sourceAuthority,
    }));
}

// ---------------- Protected areas ----------------
const GUIDE: Record<string, string> = {
  national_park: "National Parks are constituted under the Wildlife (Protection) Act, 1972 and have stricter protection than sanctuaries; entry and vehicle access are usually regulated by the park management.",
  wildlife_sanctuary: "Wildlife Sanctuaries are notified under the Wildlife (Protection) Act, 1972; activities are regulated and entry is generally permitted only as allowed by the Chief Wildlife Warden.",
  tiger_reserve: "Tiger Reserves are notified under the Wildlife (Protection) Act, 1972 and have core/critical tiger habitat and buffer zones with different access rules.",
  reserved_forest: "Reserved Forests are constituted under the Indian Forest Act, 1927 (or state forest laws); entry is generally prohibited unless permitted.",
  protected_forest: "Protected Forests are notified under the Indian Forest Act, 1927; rights and restrictions are recorded in the notification.",
  conservation_reserve: "Conservation Reserves are declared under the Wildlife (Protection) Act, 1972 on government land adjoining protected areas.",
  community_reserve: "Community Reserves are declared under the Wildlife (Protection) Act, 1972 on community/private land.",
  eco_sensitive_zone: "Eco-Sensitive Zones are areas around protected areas notified by the MoEFCC; permitted/regulated/prohibited activities are listed in each zone's notification, which is specific to that area.",
};

export async function checkProtectedArea(i: { destination?: string; state?: string; vehicle?: string; purpose?: string; date?: string }) {
  const st = await stateByCode(i.state);
  const tokens = (i.destination ?? "").split(/[\s,]+/).filter((t) => t.length > 2).slice(0, 5);
  const conds: SQL[] = [];
  if (tokens.length) conds.push(or(...tokens.map((t) => ilike(S.protectedAreas.name, `%${t.replace(/[%_]/g, "")}%`)))!);
  else if (st) conds.push(eq(S.protectedAreas.stateId, st.id));
  const rows = await db.select().from(S.protectedAreas).where(conds.length ? and(...conds, st ? eq(S.protectedAreas.stateId, st.id) : undefined) : undefined).limit(20);
  const sources = await sourceMap();
  const label = VEHICLE_CATEGORIES.find((v) => v.slug === i.vehicle)?.name ?? "Not specified";
  const matches = rows.map((a) => {
    const missing: string[] = [];
    (
      [["vehicleEntry", "Vehicle entry rules"], ["permitInfo", "Permit requirements"], ["bookingInfo", "Advance booking requirements"], ["entryConditions", "Entry conditions"], ["timings", "Official entry timings"], ["touristVehicleRestrictions", "Tourist vehicle restrictions"], ["parkingRestrictions", "Parking restrictions"], ["cameraDroneRules", "Photography/drone rules"]] as const
    ).forEach(([f, l]) => { if (!a[f]) missing.push(l); });
    const src = a.sourceId ? sources.get(a.sourceId) : undefined;
    return {
      id: a.id, slug: a.slug, name: a.name, classification: PROTECTED_CLASSES[a.classification] ?? a.classification,
      classificationGuide: GUIDE[a.classification] ?? null, district: a.district, authority: a.authority,
      vehicleEntry: a.vehicleEntry, permitInfo: a.permitInfo, bookingInfo: a.bookingInfo, entryConditions: a.entryConditions,
      timings: a.timings, touristVehicleRestrictions: a.touristVehicleRestrictions, parkingRestrictions: a.parkingRestrictions,
      cameraDroneRules: a.cameraDroneRules, closures: a.closures, ecoSensitiveZone: a.ecoSensitiveZone,
      sources: [src ? { name: src.name, url: src.url } : null, a.officialUrl ? { name: "Area page", url: a.officialUrl } : null].filter(Boolean) as { name: string; url: string }[],
      missingInformation: missing, verificationStatus: a.verificationStatus, lastVerifiedAt: a.lastVerifiedAt, isDemo: a.isDemo, notes: a.notes,
    };
  });
  const notices = [
    "Rules differ between forests, sanctuaries, National Parks and Eco-Sensitive Zones. Nothing here assumes identical rules, and no permit, fee, restriction or timing has been invented.",
    "Closures and entry timings for a specific travel date cannot be confirmed without a verified live source. Confirm with the responsible authority before travelling.",
  ];
  if (i.purpose) notices.push(`Journey purpose noted: ${i.purpose}. Commercial/tourist-vehicle restrictions may differ from private-vehicle rules.`);
  if (!matches.length) notices.push("No matching protected area is stored in the database for this destination. This does not mean it is unrestricted — check with the State Forest Department.");
  return { query: i, vehicleLabel: label, matches, notices };
}

// ---------------- Permits ----------------
export async function checkPermits(i: { vehicle: string; usage: string; weight?: string; originState?: string; destState?: string; purpose?: string }) {
  const all = await db.select().from(S.permits);
  const cat = VEHICLE_CATEGORIES.find((v) => v.slug === i.vehicle);
  const interstate = !!i.originState && !!i.destState && i.originState !== i.destState;
  const reasons = new Map<string, string>();
  const add = (slug: string, why: string) => { if (!reasons.has(slug)) reasons.set(slug, why); };
  const notices: string[] = [
    "Commercial vehicles (buses, trucks, taxis, tourist vehicles) are governed by transport-vehicle provisions. Private-car rules are NOT applied automatically to them.",
  ];
  const missing = ["Permit fees and validity periods have not been verified for any state.", "State-specific conditions for the selected origin/destination are not available unless a verified state record exists."];

  if (!cat?.isCommercial && i.usage === "private") {
    notices.push("For purely private, non-hire use, a transport permit is generally not required — but the vehicle must not be used for hire or reward. Check location-specific restrictions on the Travel Checker.");
  } else {
    const u = i.usage;
    if (i.vehicle === "goods-truck" || i.vehicle === "heavy-commercial" || u === "goods") {
      add(interstate ? "national-goods-permit" : "state-goods-permit", interstate ? "Goods vehicle operating between states" : "Goods vehicle operating within one state");
      if (interstate) add("interstate-reciprocal-permit", "Interstate operation may need counter-signature/agreement-based authorisation");
      add("overloading-regulations", "Goods vehicles are subject to weight limits");
    }
    if (i.vehicle === "bus" || u === "stage") {
      if (u === "stage" || i.vehicle === "bus") add("stage-carriage-permit", "Buses on fixed routes need a stage carriage permit");
      if (u === "contract" || u === "tourist") add("contract-carriage-permit", "Buses hired as a whole are contract carriages");
      if (interstate) add("interstate-reciprocal-permit", "Interstate bus operation");
      add("overloading-regulations", "Passenger overloading and weight limits apply");
    }
    if (i.vehicle === "taxi" || u === "contract") add("contract-carriage-permit", "Taxis/rental cabs are generally contract carriages");
    if (i.vehicle === "tourist-vehicle" || u === "tourist") {
      add("tourist-vehicle-permit", "Tourist vehicle operation");
      if (interstate) add("interstate-reciprocal-permit", "Multi-state tourist travel");
    }
    add("fitness-requirement", "Transport vehicles need a valid fitness certificate");
    add("permit-renewal", "Permits are time-limited");
    add("commercial-documents", "Document checklist for commercial operation");
  }
  if (i.weight === "heavy") notices.push("Heavy goods/passenger vehicles may need additional driver-licence class endorsements and fitness requirements — confirm with the RTO.");
  const permits = [...reasons.entries()].map(([slug, why]) => {
    const p = all.find((x) => x.slug === slug)!;
    return p ? { ...p, why } : null;
  }).filter(Boolean);
  return {
    input: i, vehicleLabel: cat?.name ?? i.vehicle, interstate, permits, notices, missingInformation: missing,
    sources: [{ name: "Parivahan", url: "https://parivahan.gov.in/" }, { name: "India Code (Motor Vehicles Act)", url: "https://www.indiacode.nic.in/" }],
  };
}

// ---------------- Travel / route ----------------
export async function analyzeRoute(i: { fromState?: string; toState?: string; viaStates?: string[]; fromPlace?: string; toPlace?: string; date?: string; vehicle?: string; purpose?: string }) {
  const codes = [...new Set([i.fromState, ...(i.viaStates ?? []), i.toState].filter(Boolean) as string[])];
  const stateRows = await db.select().from(S.states);
  const involved = codes.map((c) => stateRows.find((s) => s.code === c)).filter(Boolean) as (typeof stateRows)[number][];
  const ids = involved.map((s) => s.id);
  const role = (c: string) => (c === i.fromState ? "Origin" : c === i.toState ? "Destination" : "Via");

  const [locRows, areaRows, ruleRows, penStateCount] = await Promise.all([
    ids.length ? db.select().from(S.locations) : [],
    ids.length ? db.select().from(S.protectedAreas) : [],
    db.select().from(S.legalRules),
    db.select().from(S.penalties),
  ]);
  const placeTokens = [i.fromPlace, i.toPlace].flatMap((p) => (p ?? "").toLowerCase().split(/[\s,]+/)).filter((t) => t.length > 2);
  const nameMatch = (name: string) => placeTokens.some((t) => name.toLowerCase().includes(t));
  const locs = locRows.filter((l) => (l.stateId && ids.includes(l.stateId)) || nameMatch(l.name));
  const areas = areaRows.filter((a) => (a.stateId && ids.includes(a.stateId)) || nameMatch(a.name));
  const matchedPlaces = locs.filter((l) => nameMatch(l.name)).map((l) => l.id);
  const sName = (id: number | null) => stateRows.find((s) => s.id === id)?.name ?? "";

  const commercial = !!VEHICLE_CATEGORIES.find((v) => v.slug === i.vehicle)?.isCommercial;
  const regs = ruleRows
    .filter((r) => (!r.stateId || ids.includes(r.stateId)) && ["interstate", "commercial", "permit", "highway", "central-law"].includes(r.topic))
    .filter((r) => appliesToVehicle(r.vehicleCategories, i.vehicle))
    .filter((r) => (r.topic === "commercial" || r.topic === "permit" ? commercial : true))
    .map((r) => ({ id: r.id, title: r.title, reference: r.legalReference, explanation: r.explanation, status: r.verificationStatus, sourceUrl: r.sourceUrl }));

  const stateRecs = involved.map((s) => ({
    code: s.code, name: s.name, role: role(s.code),
    stateSpecificRecords: ruleRows.filter((r) => r.stateId === s.id).length + penStateCount.filter((p) => p.stateId === s.id).length,
  }));
  const missing: string[] = [];
  stateRecs.forEach((s) => { if (!s.stateSpecificRecords) missing.push(`No state-specific rules/penalties are stored for ${s.name}; only central law is available.`); });
  if (!i.viaStates?.length && i.fromState && i.toState && i.fromState !== i.toState) missing.push("Intermediate states cannot be determined automatically (no routing integration). Add states you pass through under 'Via states'.");
  if (i.toPlace && !matchedPlaces.length) missing.push(`No stored destination record matches "${i.toPlace}". Showing restrictions recorded for the selected states instead.`);
  missing.push("Local parking regulations, district-level regulations and current official travel advisories are not available unless recorded below.");

  const advisories = locs.filter((l) => l.permitInfo || l.restrictions).map((l) => ({
    id: l.id, name: l.name, type: l.type, state: sName(l.stateId), district: l.district, permitInfo: l.permitInfo, restrictions: l.restrictions,
    vehicleNotes: l.vehicleNotes, status: l.verificationStatus, matched: matchedPlaces.includes(l.id),
  }));

  const from = encodeURIComponent([i.fromPlace, sName(stateRows.find((s) => s.code === i.fromState)?.id ?? null)].filter(Boolean).join(", "));
  const to = encodeURIComponent([i.toPlace, sName(stateRows.find((s) => s.code === i.toState)?.id ?? null)].filter(Boolean).join(", "));
  const mapUrl = from && to ? `https://www.openstreetmap.org/directions?from=${from}&to=${to}` : to ? `https://www.openstreetmap.org/search?query=${to}` : null;

  return {
    query: i,
    applicableStates: stateRecs,
    applicableDistricts: [...new Set([...locs, ...areas].filter((x) => x.district).map((x) => `${x.district}, ${sName(x.stateId)}`))],
    regulations: regs,
    vehicleRestrictions: advisories.filter((a) => a.restrictions || a.vehicleNotes),
    permitInformation: advisories.filter((a) => a.permitInfo),
    protectedAreas: areas.map((a) => ({ id: a.id, slug: a.slug, name: a.name, classification: PROTECTED_CLASSES[a.classification] ?? a.classification, state: sName(a.stateId), status: a.verificationStatus, hasEntryInfo: !!(a.vehicleEntry || a.permitInfo) })),
    commercialNotice: commercial ? "Commercial vehicle selected: check the Commercial Permits module for permit requirements for this journey. Private-vehicle rules do not apply automatically." : null,
    advisories,
    missingInformation: missing,
    sources: [{ name: "Parivahan", url: "https://parivahan.gov.in/" }, { name: "MoRTH", url: "https://morth.nic.in/" }, { name: "MoEFCC", url: "https://moef.gov.in/" }],
    notices: [
      "This platform does NOT provide live traffic, weather, road-closure or route-condition data. Check official sources and local authorities before travelling.",
      "All location records are demo data awaiting human verification unless marked Verified.",
    ],
    mapUrl,
  };
}
