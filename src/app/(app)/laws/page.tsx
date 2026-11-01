"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Languages, Scale, Search } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, DemoBanner, EmptyState, ErrorState, LoadingBlock, Notice, PageHeader, SourcePanel, StatusBadge, inputCls, cx } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch } from "@/lib/client";
import { LEGAL_TOPICS, VEHICLE_CATEGORIES } from "@/lib/constants";

type Rule = {
  id: number; title: string; topic: string; category: string; jurisdiction: string; vehicleCategories: string[]; legalReference: string | null; originalText: string | null; explanation: string | null;
  conditions: string | null; exceptions: string | null; effectiveFrom: string | null; effectiveUntil: string | null; sourceUrl: string | null; sourceName: string | null; verificationStatus: string; lastVerifiedAt: string | null; version: number; extractedBy: string;
};
const CATEGORIES = ["Central Act", "Central Rules", "Road safety", "Documents", "Commercial", "Environment", "District and local", "Extracted (pending review)"];

function RuleCard({ r }: { r: Rule }) {
  const { lang, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [tr, setTr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const vnames = r.vehicleCategories.includes("*") ? "All vehicle categories" : r.vehicleCategories.length ? r.vehicleCategories.map((v) => VEHICLE_CATEGORIES.find((x) => x.slug === v)?.name ?? v).join(", ") : "Not specified";
  async function translate() {
    setBusy(true);
    try { setTr((await api<{ translated: string }>("/api/ai/translate", { body: { text: r.explanation ?? r.title, target: lang } })).translated); }
    catch (e) { toast(e instanceof Error ? e.message : "Translation unavailable", "error"); }
    finally { setBusy(false); }
  }
  return (
    <Card className="!p-0">
      <button className="flex w-full items-start justify-between gap-3 p-4 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <div><div className="mb-1 flex flex-wrap items-center gap-2"><StatusBadge status={r.verificationStatus} /><Badge tone="blue">{r.jurisdiction}</Badge><Badge>{r.category}</Badge></div>
          <h3 className="font-semibold">{r.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted">{r.explanation}</p></div>
        <ChevronDown className={cx("mt-1 h-5 w-5 shrink-0 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-line p-4 text-sm">
          <div><p className="text-xs font-semibold uppercase text-muted">Plain-language explanation <Badge tone="teal" className="ml-1">English summary</Badge></p><p className="mt-1">{r.explanation ?? "Not recorded"}</p>
            {lang !== "en" && <div className="mt-2">{tr ? <div className="rounded-lg border border-line bg-surface2 p-2"><p className="text-xs text-muted">Machine-generated translation — not human-reviewed:</p><p>{tr}</p></div> : <Button size="sm" variant="secondary" onClick={translate} loading={busy}><Languages className="h-4 w-4" />Translate (machine)</Button>}</div>}</div>
          <div className="rounded-lg border border-line bg-surface2 p-3"><p className="text-xs font-semibold uppercase text-muted">Original legal provision / reference (never translated)</p>
            <p className="mt-1 font-medium">{r.legalReference ?? "Not recorded"}</p>{r.originalText ? <blockquote className="mt-1 border-l-2 border-royal pl-3 italic">{r.originalText}</blockquote> : <p className="mt-1 text-xs text-muted">Original wording not yet attached — see the official source.</p>}</div>
          <dl className="grid gap-3 sm:grid-cols-2">
            {([["Jurisdiction", r.jurisdiction], ["Applicable vehicle category", vnames], ["Conditions", r.conditions ?? "None recorded"], ["Exceptions", r.exceptions ?? "None recorded"], ["Effective date", r.effectiveFrom ? `${r.effectiveFrom}${r.effectiveUntil ? ` → ${r.effectiveUntil}` : ""}` : "Not recorded"], ["Record version", `v${r.version} (${r.extractedBy})`]] as const).map(([k, v]) => <div key={k}><dt className="text-xs font-semibold uppercase text-muted">{k}</dt><dd>{v}</dd></div>)}
          </dl>
          <SourcePanel sources={[{ name: r.sourceName ?? "Official source", url: r.sourceUrl }]} status={r.verificationStatus} lastVerifiedAt={r.lastVerifiedAt} />
        </div>
      )}
    </Card>
  );
}

export default function LawsPage() {
  const { t, state, vehicle } = useApp();
  const [q, setQ] = useState("");
  const [dq, setDq] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [district, setDistrict] = useState("");
  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    const p = new URLSearchParams(window.location.search).get("q"); if (p) { setQ(p); setDq(p); } }, []);
  useEffect(() => { const h = setTimeout(() => setDq(q), 350); return () => clearTimeout(h); }, [q]);
  const params = new URLSearchParams({ ...(dq ? { q: dq } : {}), ...(state ? { state } : {}), ...(vehicle ? { vehicle } : {}), ...(topic ? { topic } : {}), ...(category ? { category } : {}), ...(status ? { status } : {}), ...(district ? { district } : {}) });
  const { data, loading, error, reload } = useFetch<{ rules: Rule[]; total: number; coverageNote: string | null }>(`/api/laws?${params}`);
  const districts = useFetch<{ districts: { id: number; name: string }[] }>(state ? `/api/districts?state=${state}` : null);

  return (
    <>
      <PageHeader title="Driving Laws & Traffic Rules Explorer" icon={<Scale className="h-5 w-5" />} description="Central Motor Vehicles Act and Rules, state rules and local regulations where available. Every rule shows its original reference, jurisdiction, conditions, exceptions, dates and verification status." />
      <div className="mb-4 space-y-2"><DemoBanner /><Notice tone="blue">Plain-language explanations are summaries. The original legal provision always prevails — check the official source before relying on any rule.</Notice></div>
      <Card className="mb-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className={`${inputCls} pl-9`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in English or an Indian language — e.g. helmet, हेलमेट, ஹெல்மெட்" aria-label="Search laws" /></div>
          <select className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Legal topic"><option value="">All legal topics</option>{LEGAL_TOPICS.map((x) => <option key={x}>{x}</option>)}</select>
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Rule category"><option value="">All rule categories</option>{CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Verification status"><option value="">Any verification status</option><option value="verified">Verified</option><option value="pending">Needs Verification</option><option value="outdated">Outdated</option></select>
          <select className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="District" disabled={!state}><option value="">{state ? "All districts" : "Select a state to filter districts"}</option>{districts.data?.districts.map((d) => <option key={d.id}>{d.name}</option>)}</select>
        </div>
      </Card>
      {loading ? <LoadingBlock /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.rules.length ? (
        <EmptyState icon={<Scale className="h-8 w-8" />} title="No matching rules" text="No stored rule matches these filters. That does not mean no law applies — the information is missing from this database." />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted">{data.total} rule(s) · {t("hero.state")}: {state || t("common.allStates")}</p><ReportActions filename="laws-report" report={{ reportType: "law", title: `Driving law report${dq ? ` — ${dq}` : ""}`, query: { q: dq, state, vehicle, topic }, location: state || "India (central law)", vehicleCategory: vehicle || null, findings: data.rules.map((r) => `${r.title} [${r.legalReference ?? "no reference"}] — ${r.explanation} (status: ${r.verificationStatus})`), legalReferences: data.rules.map((r) => r.legalReference).filter(Boolean) as string[], sources: [...new Map(data.rules.filter((r) => r.sourceUrl).map((r) => [r.sourceUrl!, { name: r.sourceName ?? "Source", url: r.sourceUrl! }])).values()], missingInfo: data.rules.filter((r) => !r.effectiveFrom).map((r) => `Effective date missing: ${r.title}`), uncertaintyNotices: ["Rules are demo data unless marked Verified."] }} /></div>
          {data.coverageNote && <Notice tone="amber">{data.coverageNote}</Notice>}
          {data.rules.map((r) => <RuleCard key={r.id} r={r} />)}
        </div>
      )}
    </>
  );
}
