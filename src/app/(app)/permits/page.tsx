"use client";
import { useState } from "react";
import { Truck } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, Combobox, DemoBanner, ErrorState, Field, LoadingBlock, Notice, PageHeader, SourcePanel, StatusBadge, STATE_OPTIONS, Tabs, inputCls, List, EmptyState } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch } from "@/lib/client";
import { VEHICLE_CATEGORIES } from "@/lib/constants";

type Permit = { id: number; slug: string; name: string; permitType: string; scope: string; legalReference: string | null; description: string | null; requirements: string[]; renewalInfo: string | null; feeInfo: string | null; officialUrl: string | null; verificationStatus: string; lastVerifiedAt: string | null; why?: string };
type Res = { vehicleLabel: string; interstate: boolean; permits: Permit[]; notices: string[]; missingInformation: string[]; sources: { name: string; url: string }[] };

function PermitCard({ p }: { p: Permit }) {
  return (
    <Card className="space-y-2">
      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{p.name}</h3><Badge tone="blue">{p.scope}</Badge><StatusBadge status={p.verificationStatus} /></div>
      {p.why && <Notice tone="blue">{p.why}</Notice>}
      <p className="text-sm">{p.description}</p>
      {p.legalReference && <p className="text-xs text-muted">Legal reference: {p.legalReference}</p>}
      {p.requirements.length > 0 && <div><p className="text-xs font-semibold uppercase text-muted">Requirements</p><List items={p.requirements} /></div>}
      <p className="text-sm text-muted">Fee: {p.feeInfo ?? "not verified — see official portal"} · Renewal: {p.renewalInfo ?? "not recorded"}</p>
      <SourcePanel sources={[{ name: "Parivahan", url: p.officialUrl }]} status={p.verificationStatus} lastVerifiedAt={p.lastVerifiedAt} />
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
  const dir = useFetch<{ permits: Permit[] }>(tab === "directory" ? `/api/permits${vehicle ? `?vehicle=${vehicle}` : ""}` : null);

  async function run() {
    setBusy(true);
    try { setRes(await api<Res>("/api/permits/check", { body: { vehicle: v, usage, weight, originState: origin || undefined, destState: dest || undefined, purpose: purpose || undefined } })); }
    catch (e) { toast(e instanceof Error ? e.message : "Check failed", "error"); }
    finally { setBusy(false); }
  }
  return (
    <>
      <PageHeader title="Commercial Vehicle & Permit Services" icon={<Truck className="h-5 w-5" />} description="National, state, goods, tourist, contract carriage and stage carriage permits, plus fitness, overloading and document requirements. Private-car rules are never applied automatically to commercial vehicles." />
      <div className="mb-4"><DemoBanner /></div>
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ value: "check", label: "Permit checker" }, { value: "directory", label: "Permit directory" }]} /></div>
      {tab === "directory" ? (dir.loading ? <LoadingBlock /> : dir.error ? <ErrorState message={dir.error} onRetry={dir.reload} /> : <div className="grid gap-4 lg:grid-cols-2">{dir.data?.permits.map((p) => <PermitCard key={p.id} p={p} />)}</div>) : (
        <>
          <Card className="mb-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Vehicle type" htmlFor="pv"><select id="pv" className={inputCls} value={v} onChange={(e) => setV(e.target.value)}>{VEHICLE_CATEGORIES.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select></Field>
              <Field label="Vehicle usage" htmlFor="pu"><select id="pu" className={inputCls} value={usage} onChange={(e) => setUsage(e.target.value)}><option value="private">Private (no hire or reward)</option><option value="goods">Goods carriage</option><option value="stage">Stage carriage (fixed route)</option><option value="contract">Contract carriage / hire</option><option value="tourist">Tourist operation</option></select></Field>
              <Field label="Weight category" htmlFor="pw"><select id="pw" className={inputCls} value={weight} onChange={(e) => setWeight(e.target.value)}><option value="na">Not applicable / unknown</option><option value="light">Light</option><option value="medium">Medium</option><option value="heavy">Heavy</option></select></Field>
              <Field label="Journey purpose" htmlFor="pp"><input id="pp" className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Interstate goods delivery" /></Field>
              <Field label="Origin state"><Combobox options={STATE_OPTIONS("Select origin")} value={origin} onChange={setOrigin} /></Field>
              <Field label="Destination state"><Combobox options={STATE_OPTIONS("Select destination")} value={dest} onChange={setDest} /></Field>
            </div>
            <div className="mt-4"><Button onClick={run} loading={busy}><Truck className="h-4 w-4" />Check permit requirements</Button></div>
          </Card>
          {busy ? <LoadingBlock /> : !res ? <EmptyState icon={<Truck className="h-8 w-8" />} title="Describe your vehicle and journey" text="You will get the permit types and compliance items that may apply, each with legal references and verification status." /> : (
            <div className="space-y-4">
              {res.notices.map((n, i) => <Notice key={i} tone={i === 0 ? "red" : "amber"}>{n}</Notice>)}
              {res.interstate && <Notice tone="blue">Interstate journey detected — permit authorisation or reciprocal arrangements between the two states may apply.</Notice>}
              {res.permits.length === 0 ? <EmptyState title="No transport permit identified" text="For private, non-hire use a transport permit is generally not required. Check location-specific restrictions on the Travel Checker." /> : <div className="grid gap-4 lg:grid-cols-2">{res.permits.map((p) => <PermitCard key={p.id} p={p} />)}</div>}
              <Card><h3 className="mb-1 font-semibold">Missing information</h3><List items={res.missingInformation} /></Card>
              <ReportActions filename="permit-checklist" report={{ reportType: "permit", title: `Permit checklist — ${res.vehicleLabel}`, query: { v, usage, weight, origin, dest, purpose }, location: [origin, dest].filter(Boolean).join(" → ") || null, vehicleCategory: res.vehicleLabel, findings: res.permits.map((p) => `${p.name} (${p.legalReference ?? "no reference"}): ${p.why}. Requirements: ${p.requirements.join("; ")}`), legalReferences: res.permits.map((p) => p.legalReference).filter(Boolean) as string[], sources: res.sources, missingInfo: res.missingInformation, uncertaintyNotices: res.notices }} />
            </div>
          )}
        </>
      )}
    </>
  );
}
