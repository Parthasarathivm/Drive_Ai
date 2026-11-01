"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  ExternalLink,
  Info,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Car,
  FileText,
  Building2,
  Printer,
  Sparkles,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import {
  Badge,
  Button,
  Card,
  GlassPanel,
  DemoBanner,
  EmptyState,
  Field,
  LinkButton,
  Notice,
  PageHeader,
  SourcePanel,
  StatusBadge,
  Tabs,
  inputCls,
  cx,
} from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch, type ReportLike } from "@/lib/client";
import { OFFICIAL_LINKS, STATES, VEHICLE_CATEGORIES, VIOLATIONS, stateName } from "@/lib/constants";

type Rec = {
  id: number;
  violationName: string;
  legalSection: string | null;
  scope: "state" | "central";
  jurisdiction: string;
  baseAmountText: string | null;
  repeatAmountText: string | null;
  additionalPenalty: string | null;
  imprisonment: string | null;
  otherConsequences: string | null;
  repeatConditions: string | null;
  stateAmendment: string | null;
  effectiveFrom: string | null;
  sourceAuthority: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  verificationStatus: string;
  lastVerifiedAt: string | null;
  notes: string | null;
  isDemo: boolean;
  hasAmount: boolean;
  calculation: null | {
    first: { min: number; max: number } | null;
    repeat: number | null;
    additional: number;
    total: { min: number; max: number } | null;
    note: string;
  };
};

type Result = {
  violation: { key: string; name: string };
  state: { code: string; name: string } | null;
  vehicle: string | null;
  primary: Rec | null;
  records: Rec[];
  notices: string[];
  hasVerified: boolean;
};

type Cmp = {
  code: string;
  name: string;
  type: string;
  basis: string;
  amount: string;
  section: string | null;
  status: string;
}[];

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const range = (a: number, b: number) => (a === b ? inr(a) : `${inr(a)} – ${inr(b)}`);

export default function FinesPage() {
  const { t, state, setState, vehicle, setVehicle, toast } = useApp();
  const [violation, setViolation] = useState("no-helmet");
  const [repeat, setRepeat] = useState(false);
  const [units, setUnits] = useState(0);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("result");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  async function calc() {
    setBusy(true);
    setError("");
    try {
      const data = await api<Result>("/api/fines/calculate", {
        body: {
          state: state || null,
          vehicle: vehicle || null,
          violation,
          repeat,
          extraUnits: units,
        },
      });
      setRes(data);
      setTab("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation failed");
      toast("Calculation failed", "error");
    } finally {
      setBusy(false);
    }
  }

  // Clear stale results when inputs change
  useEffect(() => {
    setRes(null);
  }, [state, vehicle, violation]);

  const cmp = useFetch<{ comparison: Cmp; note: string }>(
    tab === "compare"
      ? `/api/fines?compare=1&violation=${violation}${vehicle ? `&vehicle=${vehicle}` : ""}`
      : null
  );

  const vName = VEHICLE_CATEGORIES.find((v) => v.slug === vehicle)?.name;
  const hasAdditional = violation === "overloading";

  const report: ReportLike | null = useMemo(() => {
    if (!res) return null;
    return {
      reportType: "fine",
      title: `Verified Penalty Assessment — ${res.violation.name}`,
      query: { state: state || null, vehicle: vehicle || null, violation, repeat, extraUnits: units },
      location: res.state?.name ?? "All India (Central Law)",
      vehicleCategory: vName ?? "All Classes",
      findings: res.records.map(
        (r) =>
          `${r.scope === "state" ? "State" : "Central"} statutory row — ${r.violationName}: ${
            r.calculation?.total
              ? range(r.calculation.total.min, r.calculation.total.max)
              : `UNVERIFIED / DRAFT (reference: ${r.baseAmountText ?? "none"})`
          }; status: ${r.verificationStatus}; effective: ${r.effectiveFrom ?? "unknown"}; section: ${
            r.legalSection ?? "unknown"
          }`
      ),
      legalReferences: res.records.map((r) => r.legalSection).filter(Boolean) as string[],
      sources: [
        ...new Map(
          res.records.filter((r) => r.sourceUrl).map((r) => [r.sourceUrl!, { name: r.sourceName ?? "Official Source", url: r.sourceUrl! }])
        ).values(),
        { name: "eChallan Digital Portal", url: OFFICIAL_LINKS.echallan },
      ],
      missingInfo: res.records.length ? [] : ["No statutory penalty row found for selected parameters"],
      uncertaintyNotices: res.notices,
    };
  }, [res, state, vehicle, violation, repeat, units, vName]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={t("nav.fines")}
        icon={<Calculator className="h-5 w-5" />}
        description="Statutory penalties calculated strictly from human-reviewed gazette notifications. Unverified amounts remain draft references and are excluded from official totals."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LinkButton href={OFFICIAL_LINKS.echallan} external size="sm" variant="accent" className="font-semibold shadow-md">
              <span>Official eChallan Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </LinkButton>
          </div>
        }
      />

      <DemoBanner />

      {/* Calculator Cockpit Card */}
      <Card className="rounded-3xl p-6 sm:p-8 shadow-lg border border-line bg-surface">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Fine Assessment Parameters</span>
            <h2 className="text-xl font-black text-fg">Traffic Violation & Penalty Calculator</h2>
          </div>
          <Badge tone="teal">Verified-Only Rule Active</Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* State / Jurisdiction Selector */}
          <Field label="Jurisdiction (State / UT)">
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputCls}
            >
              <option value="">All India — Central Law (MV Act 1988)</option>
              {STATES.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </Field>

          {/* Vehicle Category Selector */}
          <Field label="Applicable Vehicle Category">
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className={inputCls}
            >
              <option value="">All Vehicle Categories</option>
              {VEHICLE_CATEGORIES.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Violation Type */}
          <Field label="Violation Category" htmlFor="violation">
            <select
              id="violation"
              className={inputCls}
              value={violation}
              onChange={(e) => setViolation(e.target.value)}
            >
              {VIOLATIONS.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Repeat Offence & Extra Units Toggle */}
          <div className="flex flex-col justify-end space-y-3">
            <label className="flex items-center gap-2.5 text-sm font-semibold text-fg cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 rounded text-royal focus:ring-accent"
                checked={repeat}
                onChange={(e) => setRepeat(e.target.checked)}
              />
              <span>Repeat offence (where statutory repeat penalty applies)</span>
            </label>

            {hasAdditional && (
              <Field label="Excess load (tonnes over permissible registered weight)" htmlFor="units">
                <input
                  id="units"
                  type="number"
                  min={0}
                  max={1000}
                  className={inputCls}
                  value={units}
                  onChange={(e) => setUnits(Math.max(0, Number(e.target.value) || 0))}
                />
              </Field>
            )}
          </div>
        </div>

        {!vehicle && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted bg-surface-2 p-3 rounded-xl border border-line">
            <Info className="h-4 w-4 text-accent shrink-0" />
            <span>Select a vehicle category for category-specific fine schedules (e.g. Helmet applies strictly to two-wheelers).</span>
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={calc} loading={busy} variant="glow" size="lg" className="font-bold shadow-md">
            <Calculator className="h-4 w-4" />
            <span>Calculate Statutory Fine</span>
          </Button>
        </div>

        {error && (
          <div className="mt-4">
            <Notice tone="red">{error}</Notice>
          </div>
        )}
      </Card>

      {/* Result Display Section */}
      {!res ? (
        <EmptyState
          icon={<Calculator className="h-10 w-10 text-accent/60" />}
          title="Select parameters and calculate penalty"
          text="Inspect the statutory section under the Motor Vehicles Act, base and additional fines, imprisonment risks, state amendments, source notifications, and official eChallan verification."
        />
      ) : (
        <div className="space-y-6">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "result", label: "Calculation Result", count: res.records.length },
              { value: "compare", label: "State vs Central Comparison" },
            ]}
          />

          {tab === "compare" ? (
            <Card className="rounded-3xl p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-fg">State-by-State Penalty Comparison: {res.violation.name}</h3>
                <p className="text-xs text-muted mt-1">{cmp.data?.note ?? "Loading comparative breakdown…"}</p>
              </div>

              <input
                className={`${inputCls} mb-4 max-w-sm`}
                placeholder="Filter states or UTs…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter states"
              />

              {cmp.loading ? (
                <p className="text-sm text-muted">Loading comparative data…</p>
              ) : cmp.error ? (
                <Notice tone="red">{cmp.error}</Notice>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                      <tr>
                        <th className="py-2.5 pr-4">State / UT</th>
                        <th className="pr-4">Penalty Amount</th>
                        <th className="pr-4">Statutory Basis</th>
                        <th>Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line/60">
                      {cmp.data?.comparison
                        .filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()))
                        .map((c) => (
                          <tr key={c.code} className="hover:bg-surface-2/60 transition">
                            <td className="py-2.5 pr-4 font-semibold text-fg">{c.name}</td>
                            <td className="pr-4 font-bold text-electric">{c.amount}</td>
                            <td className="pr-4 text-xs text-muted">{c.basis}</td>
                            <td>
                              <StatusBadge status={c.status} />
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ) : (
            <>
              {/* Warnings & Notices */}
              {res.notices.map((n, i) => (
                <Notice key={i} tone={n.startsWith("VERIFICATION") || n.startsWith("No penalty") ? "red" : "amber"}>
                  {n}
                </Notice>
              ))}

              {/* Primary Verified Calculation Hero Box */}
              {res.primary?.calculation?.total && (
                <div className="rounded-3xl border-2 border-teal bg-gradient-to-br from-teal/15 via-teal/5 to-surface p-6 sm:p-8 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-teal font-black text-sm uppercase tracking-wider">
                      <ShieldCheck className="h-5 w-5" />
                      <span>Statutory Fine Determinable (Verified Record)</span>
                    </div>
                    <StatusBadge status="verified" />
                  </div>

                  <div className="mt-4 flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black text-fg tracking-tight">
                      {range(res.primary.calculation.total.min, res.primary.calculation.total.max)}
                    </span>
                    <span className="text-xs font-semibold uppercase text-muted">Indian Rupees (INR)</span>
                  </div>

                  <p className="mt-2 text-sm text-fg font-medium">
                    {res.violation.name} · {res.state?.name ?? "Central Law (All India)"} · {vName ?? "All Classes"}
                    {repeat ? " · Repeat Offence" : ""}
                  </p>

                  {res.primary.calculation.note && (
                    <p className="mt-2 text-xs font-medium text-amber-600 dark:text-amber-300">
                      {res.primary.calculation.note}
                    </p>
                  )}
                </div>
              )}

              {/* Records Breakdown Cards */}
              {res.records.map((r) => (
                <Card key={r.id} className="rounded-3xl p-6 sm:p-8 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                    <div className="flex items-center gap-2">
                      <Badge tone={r.scope === "state" ? "teal" : "blue"}>
                        {r.scope === "state" ? `State Record: ${r.jurisdiction}` : "Central Law (All India)"}
                      </Badge>
                      <StatusBadge status={r.verificationStatus} />
                    </div>
                    {r.isDemo && <Badge tone="amber">Demo Record (Pending Review)</Badge>}
                  </div>

                  <h3 className="text-xl font-bold text-fg">{r.violationName}</h3>

                  {!r.calculation && (
                    <Notice tone="amber">
                      <p>
                        {r.hasAmount
                          ? "Draft statutory reference only — excluded from total calculation until human legal reviewer approves."
                          : "No statutory fine amount is recorded in the database for this violation. Must be checked against official notifications."}
                      </p>
                    </Notice>
                  )}

                  <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 border-y border-line/60 py-4">
                    {[
                      ["Statutory Legal Section", r.legalSection ?? "Not recorded"],
                      [r.calculation ? "Base Penalty" : "Base Penalty (Draft / Unverified)", r.baseAmountText ?? "Not recorded"],
                      ["Additional Weight Penalty", r.additionalPenalty ?? "None recorded"],
                      ["Repeat Offence Amount", r.repeatAmountText ?? "Not recorded"],
                      ["Repeat Offence Conditions", r.repeatConditions ?? "Not recorded"],
                      ["Imprisonment / Court Trial", [r.imprisonment, r.otherConsequences].filter(Boolean).join(" · ") || "None recorded"],
                      ["State Legislative Amendment", r.stateAmendment ?? "None recorded"],
                      ["Commencement / Effective Date", r.effectiveFrom ?? "Not recorded"],
                      ["Issuing Authority", r.sourceAuthority ?? "Not recorded"],
                      ["Statutory Notes", r.notes ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k as string}>
                        <dt className="text-xs font-bold uppercase tracking-wider text-muted">{k as string}</dt>
                        <dd className="mt-0.5 font-semibold text-fg">{v as string}</dd>
                      </div>
                    ))}
                  </dl>

                  {r.calculation?.total && (
                    <div className="rounded-2xl bg-surface-2 p-4 text-xs space-y-1">
                      <span className="font-bold text-fg uppercase tracking-wider block mb-1">Detailed Penalty Breakdown</span>
                      <p>
                        First Offence: {r.calculation.first ? range(r.calculation.first.min, r.calculation.first.max) : "—"}
                        {r.calculation.repeat != null && ` · Repeat: ${inr(r.calculation.repeat)}`}
                        {r.calculation.additional > 0 && ` · Excess Load: ${inr(r.calculation.additional)}`}
                      </p>
                      <p className="font-extrabold text-sm text-teal pt-1">
                        Computed Total: {range(r.calculation.total.min, r.calculation.total.max)}
                      </p>
                    </div>
                  )}

                  <SourcePanel
                    sources={[{ name: r.sourceName ?? "Official Transport Gazette", url: r.sourceUrl }]}
                    status={r.verificationStatus}
                    lastVerifiedAt={r.lastVerifiedAt}
                  />
                </Card>
              ))}

              {/* Report Actions & Next Steps */}
              <Card className="rounded-3xl p-6">
                <span className="text-xs font-bold uppercase tracking-wider text-accent block mb-2">Next Actions</span>
                <div className="flex flex-wrap items-center gap-3">
                  {report && <ReportActions report={report} filename={`fine-${violation}`} />}
                  <LinkButton href={OFFICIAL_LINKS.echallan} external size="md" variant="accent" className="font-bold">
                    <span>Pay or Verify on eChallan</span>
                  </LinkButton>
                  <LinkButton href="/laws" size="md" variant="secondary">
                    <span>Read Motor Vehicles Act</span>
                  </LinkButton>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
