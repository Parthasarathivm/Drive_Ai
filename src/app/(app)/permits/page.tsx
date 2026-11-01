"use client";
import { useState } from "react";
import {
  Truck,
  ShieldCheck,
  FileCheck2,
  ExternalLink,
  AlertTriangle,
  Building2,
  Sparkles,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import {
  Badge,
  Button,
  Card,
  GlassPanel,
  Combobox,
  DemoBanner,
  ErrorState,
  Field,
  LoadingBlock,
  Notice,
  PageHeader,
  SourcePanel,
  StatusBadge,
  STATE_OPTIONS,
  Tabs,
  inputCls,
  List,
  EmptyState,
  cx,
} from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch } from "@/lib/client";
import { VEHICLE_CATEGORIES, stateName } from "@/lib/constants";

type Permit = {
  id: number;
  slug: string;
  name: string;
  permitType: string;
  scope: string;
  legalReference: string | null;
  description: string | null;
  requirements: string[];
  renewalInfo: string | null;
  feeInfo: string | null;
  officialUrl: string | null;
  verificationStatus: string;
  lastVerifiedAt: string | null;
  why?: string;
};

type Res = {
  vehicleLabel: string;
  interstate: boolean;
  permits: Permit[];
  notices: string[];
  missingInformation: string[];
  sources: { name: string; url: string }[];
};

function PermitCard({ p }: { p: Permit }) {
  return (
    <Card className="rounded-3xl p-6 sm:p-7 space-y-4 border border-line bg-surface shadow-sm transition hover:border-accent/40 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <Badge tone="blue">{p.scope.toUpperCase()}</Badge>
          <StatusBadge status={p.verificationStatus} />
        </div>
        {p.legalReference && (
          <span className="font-mono text-xs font-semibold text-electric bg-royal/10 px-2 py-0.5 rounded-md">
            {p.legalReference}
          </span>
        )}
      </div>

      <h3 className="text-xl font-bold text-fg">{p.name}</h3>

      {p.why && (
        <Notice tone="blue" title="Applicability Basis">
          {p.why}
        </Notice>
      )}

      <p className="text-xs sm:text-sm text-muted leading-relaxed">{p.description}</p>

      {p.requirements.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">Prerequisite Documents & Conditions</span>
          <List items={p.requirements} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-xs border-t border-line/60 pt-3">
        <div>
          <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Statutory Fee</span>
          <span className="font-semibold text-fg">{p.feeInfo ?? "Unverified — check portal"}</span>
        </div>
        <div>
          <span className="text-muted block text-[10px] uppercase font-bold tracking-wider">Renewal Cycle</span>
          <span className="font-semibold text-fg">{p.renewalInfo ?? "5 Years standard"}</span>
        </div>
      </div>

      <SourcePanel
        sources={[{ name: "Parivahan Transport Portal", url: p.officialUrl }]}
        status={p.verificationStatus}
        lastVerifiedAt={p.lastVerifiedAt}
      />
    </Card>
  );
}

export default function PermitsPage() {
  const { vehicle, state, toast } = useApp();
  const [tab, setTab] = useState("check");
  const [v, setV] = useState(vehicle && vehicle !== "two-wheeler" ? vehicle : "goods-truck");
  const [usage, setUsage] = useState("goods");
  const [weight, setWeight] = useState("na");
  const [origin, setOrigin] = useState(state);
  const [dest, setDest] = useState("");
  const [purpose, setPurpose] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);

  const dir = useFetch<{ permits: Permit[] }>(
    tab === "directory" ? `/api/permits${vehicle ? `?vehicle=${vehicle}` : ""}` : null
  );

  async function run() {
    setBusy(true);
    try {
      const data = await api<Res>("/api/permits/check", {
        body: {
          vehicle: v,
          usage,
          weight,
          originState: origin || undefined,
          destState: dest || undefined,
          purpose: purpose || undefined,
        },
      });
      setRes(data);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Check failed", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Commercial Vehicle Permits & Transit Clearance"
        icon={<Truck className="h-5 w-5" />}
        description="National permits (NP), State goods carriage, All-India Tourist Vehicle permits (AITP), contract carriages, and stage carriage laws. Private vehicle rules are never conflated with commercial transport obligations."
      />

      <DemoBanner />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "check", label: "Permit Requirements Checker" },
          { value: "directory", label: "National Permit Directory" },
        ]}
      />

      {tab === "directory" ? (
        dir.loading ? (
          <LoadingBlock rows={4} />
        ) : dir.error ? (
          <ErrorState message={dir.error} onRetry={dir.reload} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {dir.data?.permits.map((p) => (
              <PermitCard key={p.id} p={p} />
            ))}
          </div>
        )
      ) : (
        <>
          <Card className="rounded-3xl p-6 sm:p-8 shadow-md border border-line">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-accent">Commercial Verification</span>
                <h2 className="text-xl font-black text-fg">Commercial Vehicle Transit Parameters</h2>
              </div>
              <Badge tone="teal">Separated Private vs Commercial Rules</Badge>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Vehicle Class" htmlFor="pv">
                <select
                  id="pv"
                  className={inputCls}
                  value={v}
                  onChange={(e) => setV(e.target.value)}
                >
                  {VEHICLE_CATEGORIES.map((x) => (
                    <option key={x.slug} value={x.slug}>
                      {x.name} {x.isCommercial ? "(Commercial)" : "(Private)"}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Operational Usage" htmlFor="pu">
                <select
                  id="pu"
                  className={inputCls}
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                >
                  <option value="private">Private (No hire or reward)</option>
                  <option value="goods">Goods carriage transport</option>
                  <option value="stage">Stage carriage (Fixed passenger route)</option>
                  <option value="contract">Contract carriage / Rental cab / Charter</option>
                  <option value="tourist">Tourist vehicle operation (AITP)</option>
                </select>
              </Field>

              <Field label="Gross Vehicle Weight (GVW) Category" htmlFor="pw">
                <select
                  id="pw"
                  className={inputCls}
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                >
                  <option value="na">Not applicable / Unknown</option>
                  <option value="light">Light Motor Vehicle (LMV ≤ 7,500 kg)</option>
                  <option value="medium">Medium Goods Vehicle (7,501 kg – 12,000 kg)</option>
                  <option value="heavy">Heavy Goods Vehicle (HGV &gt; 12,000 kg)</option>
                </select>
              </Field>

              <Field label="Specific Journey Purpose" htmlFor="pp">
                <input
                  id="pp"
                  className={inputCls}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Interstate commercial freight delivery"
                />
              </Field>

              <Field label="Origin State / RTO">
                <Combobox
                  options={STATE_OPTIONS("Select origin state")}
                  value={origin}
                  onChange={setOrigin}
                />
              </Field>

              <Field label="Destination State / RTO">
                <Combobox
                  options={STATE_OPTIONS("Select destination state")}
                  value={dest}
                  onChange={setDest}
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4">
              <span className="text-xs text-muted">Statutory basis: Motor Vehicles Act 1988 Chapter V (Control of Transport Vehicles)</span>
              <Button onClick={run} loading={busy} variant="glow" size="lg" className="font-bold shadow-md">
                <Truck className="h-4 w-4" />
                <span>Check Permit Requirements</span>
              </Button>
            </div>
          </Card>

          {busy ? (
            <LoadingBlock rows={3} />
          ) : !res ? (
            <EmptyState
              icon={<Truck className="h-10 w-10 text-accent/60" />}
              title="Specify commercial parameters to inspect permits"
              text="Identifies required National Permits, State Permits, speed governor mandates, fitness certificates, and border tax agreements."
            />
          ) : (
            <div className="space-y-6">
              {res.notices.map((n, i) => (
                <Notice key={i} tone={i === 0 ? "red" : "amber"}>
                  {n}
                </Notice>
              ))}

              {res.interstate && (
                <Notice tone="blue" title="Inter-State Transit Detected">
                  Interstate freight/passenger carriage requires National Permit Authorization (Form 47/48) or reciprocal inter-state tax agreements.
                </Notice>
              )}

              {res.permits.length === 0 ? (
                <EmptyState
                  title="No commercial transport permit identified"
                  text="For private non-hire personal transport, commercial carrier permits are not applicable under Section 66 of the MV Act."
                />
              ) : (
                <div className="grid gap-6 lg:grid-cols-2">
                  {res.permits.map((p) => (
                    <PermitCard key={p.id} p={p} />
                  ))}
                </div>
              )}

              {res.missingInformation.length > 0 && (
                <Card className="rounded-3xl p-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-2">Declared Missing Information</h3>
                  <List items={res.missingInformation} />
                </Card>
              )}

              <Card className="rounded-3xl p-6">
                <ReportActions
                  filename="permit-checklist"
                  report={{
                    reportType: "permit",
                    title: `Commercial Permit Assessment: ${res.vehicleLabel}`,
                    query: { v, usage, weight, origin, dest, purpose },
                    location: [origin, dest].filter(Boolean).join(" → ") || null,
                    vehicleCategory: res.vehicleLabel,
                    findings: res.permits.map(
                      (p) => `${p.name} [${p.legalReference ?? "no reference"}]: ${p.why}. Requirements: ${p.requirements.join("; ")}`
                    ),
                    legalReferences: res.permits.map((p) => p.legalReference).filter(Boolean) as string[],
                    sources: res.sources,
                    missingInfo: res.missingInformation,
                    uncertaintyNotices: res.notices,
                  }}
                />
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
