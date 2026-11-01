"use client";
import { useEffect, useMemo, useState } from "react";
import { Calculator, ExternalLink, Info } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, DemoBanner, EmptyState, Field, LinkButton, Notice, PageHeader, SourcePanel, StatusBadge, Tabs, inputCls } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch, type ReportLike } from "@/lib/client";
import { OFFICIAL_LINKS, STATES, VEHICLE_CATEGORIES, VIOLATIONS, stateName } from "@/lib/constants";

type Rec = {
  id: number; violationName: string; legalSection: string | null; scope: "state" | "central"; jurisdiction: string; baseAmountText: string | null; repeatAmountText: string | null;
  additionalPenalty: string | null; imprisonment: string | null; otherConsequences: string | null; repeatConditions: string | null; stateAmendment: string | null; effectiveFrom: string | null;
  sourceAuthority: string | null; sourceName: string | null; sourceUrl: string | null; verificationStatus: string; lastVerifiedAt: string | null; notes: string | null; isDemo: boolean; hasAmount: boolean;
  calculation: null | { first: { min: number; max: number } | null; repeat: number | null; additional: number; total: { min: number; max: number } | null; note: string };
};
type Result = { violation: { key: string; name: string }; state: { code: string; name: string } | null; vehicle: string | null; primary: Rec | null; records: Rec[]; notices: string[]; hasVerified: boolean };
type Cmp = { code: string; name: string; type: string; basis: string; amount: string; section: string | null; status: string }[];
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const range = (a: number, b: number) => (a === b ? inr(a) : `${inr(a)} – ${inr(b)}`);

export default function FinesPage() {
  const { t, state, vehicle, toast } = useApp();
  const [violation, setViolation] = useState("no-helmet");
  const [repeat, setRepeat] = useState(false);
  const [units, setUnits] = useState(0);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("result");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  async function calc() {
    setBusy(true); setError("");
    try {
      setRes(await api<Result>("/api/fines/calculate", { body: { state: state || null, vehicle: vehicle || null, violation, repeat, extraUnits: units } }));
      setTab("result");
    } catch (e) { setError(e instanceof Error ? e.message : "Calculation failed"); toast("Calculation failed", "error"); }
    finally { setBusy(false); }
  }
  // clear stale results when inputs change
  useEffect(() => { setRes(null); }, [state, vehicle, violation]); // eslint-disable-line react-hooks/set-state-in-effect

  const cmp = useFetch<{ comparison: Cmp; note: string }>(tab === "compare" ? `/api/fines?compare=1&violation=${violation}${vehicle ? `&vehicle=${vehicle}` : ""}` : null);
  const vName = VEHICLE_CATEGORIES.find((v) => v.slug === vehicle)?.name;
  const hasAdditional = violation === "overloading";

  const report: ReportLike | null = useMemo(() => {
    if (!res) return null;
    return {
      reportType: "fine", title: `Fine calculation — ${res.violation.name}`, query: { state: state || null, vehicle: vehicle || null, violation, repeat, extraUnits: units },
      location: res.state?.name ?? "India (central law)", vehicleCategory: vName ?? "All / not specified",
      findings: res.records.map((r) => `${r.scope === "state" ? "State" : "Central"} record — ${r.violationName}: ${r.calculation?.total ? range(r.calculation.total.min, r.calculation.total.max) : `NOT CALCULATED (draft reference ${r.baseAmountText ?? "none"})`}; status: ${r.verificationStatus}; effective: ${r.effectiveFrom ?? "unknown"}; section: ${r.legalSection ?? "unknown"}`),
      legalReferences: res.records.map((r) => r.legalSection).filter(Boolean) as string[],
      sources: [...new Map(res.records.filter((r) => r.sourceUrl).map((r) => [r.sourceUrl!, { name: r.sourceName ?? "Source", url: r.sourceUrl! }])).values(), { name: "eChallan", url: OFFICIAL_LINKS.echallan }],
      missingInfo: res.records.length ? [] : ["No penalty record for this violation/vehicle"],
      uncertaintyNotices: res.notices,
    };
  }, [res, state, vehicle, violation, repeat, units, vName]);

  return (
    <>
      <PageHeader title={t("nav.fines")} icon={<Calculator className="h-5 w-5" />} description="Penalties are calculated only from human-verified records. Missing or unverified information is flagged — amounts are never guessed."
        actions={<LinkButton href={OFFICIAL_LINKS.echallan} external size="sm" variant="accent">Official eChallan portal</LinkButton>} />
      <div className="mb-4"><DemoBanner /></div>

      <Card className="mb-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="State / UT (from the bar above)"><div className="rounded-lg border border-line bg-surface2 px-3 py-2 text-sm">{state ? stateName(state) : "All India — central law only"}</div></Field>
          <Field label="Vehicle category (from the bar above)"><div className="rounded-lg border border-line bg-surface2 px-3 py-2 text-sm">{vName ?? "Not selected — all vehicle categories"}</div></Field>
          <Field label="Violation" htmlFor="violation">
            <select id="violation" className={inputCls} value={violation} onChange={(e) => setViolation(e.target.value)}>{VIOLATIONS.map((v) => <option key={v.key} value={v.key}>{v.name}</option>)}</select>
          </Field>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />Repeat offence (where a repeat amount is recorded)</label>
            {hasAdditional && <Field label="Excess load (tonnes over permissible)" htmlFor="units"><input id="units" type="number" min={0} max={1000} className={inputCls} value={units} onChange={(e) => setUnits(Math.max(0, Number(e.target.value) || 0))} /></Field>}
          </div>
        </div>
        {!vehicle && <p className="mt-3 flex items-center gap-1 text-xs text-muted"><Info className="h-3.5 w-3.5" />Select a vehicle category above for vehicle-specific results.</p>}
        <div className="mt-4"><Button onClick={calc} loading={busy}><Calculator className="h-4 w-4" />Calculate fine</Button></div>
        {error && <div className="mt-3"><Notice tone="red">{error}</Notice></div>}
      </Card>

      {!res ? <EmptyState icon={<Calculator className="h-8 w-8" />} title="Choose a violation and calculate" text="You will see the legal section, base and additional penalty, repeat-offence conditions, state amendment information, effective date, source and verification status." /> : (
        <div className="space-y-4">
          <Tabs value={tab} onChange={setTab} tabs={[{ value: "result", label: "Result", count: res.records.length }, { value: "compare", label: "Compare states" }]} />
          {tab === "compare" ? (
            <Card>
              <h2 className="mb-1 font-semibold">State penalty comparison — {res.violation.name}</h2>
              <p className="mb-3 text-xs text-muted">{cmp.data?.note ?? "Loading…"}</p>
              <input className={`${inputCls} mb-3 max-w-xs`} placeholder="Filter states…" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter states" />
              {cmp.loading ? <p className="text-sm text-muted">Loading…</p> : cmp.error ? <Notice tone="red">{cmp.error}</Notice> : (
                <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm">
                  <thead className="border-b border-line text-xs uppercase text-muted"><tr><th className="py-2 pr-3">State / UT</th><th className="pr-3">Amount</th><th className="pr-3">Basis</th><th>Status</th></tr></thead>
                  <tbody>{cmp.data?.comparison.filter((c) => c.name.toLowerCase().includes(filter.toLowerCase())).map((c) => (
                    <tr key={c.code} className="border-b border-line/60"><td className="py-1.5 pr-3">{c.name}</td><td className="pr-3 font-medium">{c.amount}</td><td className="pr-3 text-muted">{c.basis}</td><td><StatusBadge status={c.status} /></td></tr>
                  ))}</tbody></table></div>
              )}
              <p className="mt-2 text-xs text-muted">{STATES.length} states/UTs listed. A state shown as &quot;Central law&quot; may still have its own notified amount that is not yet in this database.</p>
            </Card>
          ) : (
            <>
              {res.notices.map((n, i) => <Notice key={i} tone={n.startsWith("VERIFICATION") || n.startsWith("No penalty") ? "red" : "amber"}>{n}</Notice>)}
              {res.primary?.calculation?.total && (
                <Card className="border-green-500/40">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-green-700 dark:text-green-300">Calculated from a human-verified record</p><StatusBadge status="verified" /></div>
                  <p className="mt-1 text-4xl font-bold">{range(res.primary.calculation.total.min, res.primary.calculation.total.max)}</p>
                  <p className="text-sm text-muted">{res.violation.name} · {res.state?.name ?? "Central law"} · {vName ?? "All vehicles"}{repeat ? " · repeat offence" : ""}</p>
                  {res.primary.calculation.note && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{res.primary.calculation.note}</p>}
                </Card>
              )}
              {res.records.map((r) => (
                <Card key={r.id}>
                  <div className="mb-3 flex flex-wrap items-center gap-2"><Badge tone={r.scope === "state" ? "teal" : "blue"}>{r.scope === "state" ? `State record — ${r.jurisdiction}` : "Central law (all India)"}</Badge><StatusBadge status={r.verificationStatus} />{r.isDemo && <Badge tone="amber">Demo data</Badge>}</div>
                  <h3 className="font-semibold">{r.violationName}</h3>
                  {!r.calculation && <Notice tone="amber"><p>{r.hasAmount ? "Draft reference only — not calculated because this record has not been approved by a human reviewer." : "No amount is recorded for this violation. The applicable section and amount must be confirmed from the official source."}</p></Notice>}
                  <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                    {([
                      ["Applicable legal section", r.legalSection ?? "Not recorded"],
                      [r.calculation ? "Base penalty" : "Base penalty (draft, unverified)", r.baseAmountText ?? "Not recorded"],
                      ["Additional penalty", r.additionalPenalty ?? "None recorded"],
                      ["Repeat-offence amount", r.repeatAmountText ?? "Not recorded"],
                      ["Repeat-offence conditions", r.repeatConditions ?? "Not recorded"],
                      ["Imprisonment / other", [r.imprisonment, r.otherConsequences].filter(Boolean).join(" · ") || "None recorded"],
                      ["State amendment", r.stateAmendment ?? "None recorded"],
                      ["Effective date", r.effectiveFrom ?? "Not recorded"],
                      ["Source authority", r.sourceAuthority ?? "Not recorded"],
                      ["Notes", r.notes ?? "—"],
                    ] as const).map(([k, v]) => <div key={k}><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt><dd>{v}</dd></div>)}
                  </dl>
                  {r.calculation?.total && <div className="mt-3 rounded-lg bg-surface2 p-3 text-sm"><p className="mb-1 font-semibold">Penalty breakdown</p>
                    <p>First offence: {r.calculation.first ? range(r.calculation.first.min, r.calculation.first.max) : "—"}{r.calculation.repeat != null && <> · Repeat: {inr(r.calculation.repeat)}</>}{r.calculation.additional > 0 && <> · Additional: {inr(r.calculation.additional)}</>}</p>
                    <p className="font-semibold">Total: {range(r.calculation.total.min, r.calculation.total.max)}</p></div>}
                  <div className="mt-3"><SourcePanel sources={[{ name: r.sourceName ?? "Source", url: r.sourceUrl }]} status={r.verificationStatus} lastVerifiedAt={r.lastVerifiedAt} /></div>
                </Card>
              ))}
              <Card><h3 className="mb-2 text-sm font-semibold">Next steps</h3><div className="flex flex-wrap items-center gap-2">{report && <ReportActions report={report} filename={`fine-${violation}`} />}<LinkButton href={OFFICIAL_LINKS.echallan} external size="sm" variant="secondary">Check / pay on eChallan<ExternalLink className="hidden" /></LinkButton><LinkButton href="/laws?q=" size="sm" variant="ghost">Read the related law</LinkButton></div></Card>
            </>
          )}
        </div>
      )}
    </>
  );
}
