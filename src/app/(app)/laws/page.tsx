"use client";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Languages,
  Scale,
  Search,
  BookOpen,
  Copy,
  Check,
  Building2,
  Calendar,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import {
  Badge,
  Button,
  Card,
  GlassPanel,
  DemoBanner,
  EmptyState,
  ErrorState,
  LoadingBlock,
  Notice,
  PageHeader,
  SourcePanel,
  StatusBadge,
  inputCls,
  cx,
} from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch } from "@/lib/client";
import { LEGAL_TOPICS, VEHICLE_CATEGORIES, stateName } from "@/lib/constants";

type Rule = {
  id: number;
  title: string;
  topic: string;
  category: string;
  jurisdiction: string;
  vehicleCategories: string[];
  legalReference: string | null;
  originalText: string | null;
  explanation: string | null;
  conditions: string | null;
  exceptions: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  verificationStatus: string;
  lastVerifiedAt: string | null;
  version: number;
  extractedBy: string;
};

const CATEGORIES = [
  "Central Act",
  "Central Rules",
  "Road safety",
  "Documents",
  "Commercial",
  "Environment",
  "District and local",
  "Extracted (pending review)",
];

function RuleCard({ r }: { r: Rule }) {
  const { lang, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [tr, setTr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const vnames = r.vehicleCategories.includes("*")
    ? "All vehicle categories"
    : r.vehicleCategories.length
    ? r.vehicleCategories.map((v) => VEHICLE_CATEGORIES.find((x) => x.slug === v)?.name ?? v).join(", ")
    : "Not specified";

  async function translate() {
    setBusy(true);
    try {
      const res = await api<{ translated: string }>("/api/ai/translate", {
        body: { text: r.explanation ?? r.title, target: lang },
      });
      setTr(res.translated);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Translation unavailable", "error");
    } finally {
      setBusy(false);
    }
  }

  const copyCitation = () => {
    const text = `${r.title} — Provision: ${r.legalReference ?? "N/A"}. ${r.explanation ?? ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("Citation copied to clipboard", "success");
  };

  return (
    <Card className="rounded-2xl p-0 overflow-hidden border border-line bg-surface transition-all hover:border-accent/30 hover:shadow-md">
      <button
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition select-none"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={r.verificationStatus} />
            <Badge tone="blue">{r.jurisdiction}</Badge>
            <Badge tone="teal">{r.category}</Badge>
            {r.legalReference && (
              <span className="font-mono text-xs font-semibold text-electric bg-royal/10 px-2 py-0.5 rounded-md">
                {r.legalReference}
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-fg tracking-tight">{r.title}</h3>
          <p className="line-clamp-2 text-xs sm:text-sm text-muted leading-relaxed">{r.explanation}</p>
        </div>
        <div className="rounded-xl bg-surface-2 p-2 text-muted transition-transform">
          <ChevronDown className={cx("h-5 w-5 transition-transform duration-200", open && "rotate-180 text-accent")} />
        </div>
      </button>

      {open && (
        <div className="space-y-5 border-t border-line bg-surface-2/30 p-5 sm:p-6 text-sm">
          {/* Plain Language Summary */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Plain-Language Summary (English Master)</span>
              <button
                onClick={copyCitation}
                className="flex items-center gap-1 text-xs text-muted hover:text-fg font-medium transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-teal" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy Citation"}</span>
              </button>
            </div>
            <p className="text-sm leading-relaxed text-fg">{r.explanation ?? "Not recorded"}</p>

            {/* Regional Translation Support */}
            {lang !== "en" && (
              <div className="mt-3">
                {tr ? (
                  <div className="rounded-2xl border border-line bg-surface p-3.5">
                    <span className="text-[11px] font-bold text-muted block mb-1">Machine-generated translation ({lang.toUpperCase()}):</span>
                    <p className="text-xs leading-relaxed text-fg">{tr}</p>
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" onClick={translate} loading={busy}>
                    <Languages className="h-4 w-4" />
                    <span>Translate Explanation into Regional Script</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Verbatim Statutory Provision */}
          <div className="rounded-2xl border border-line bg-surface p-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">
              Verbatim Statutory Reference (Never Translated)
            </span>
            <p className="font-semibold text-sm text-fg">{r.legalReference ?? "Statutory reference not attached"}</p>
            {r.originalText ? (
              <blockquote className="mt-2 border-l-2 border-royal pl-3.5 italic text-xs leading-relaxed text-slate-300">
                &ldquo;{r.originalText}&rdquo;
              </blockquote>
            ) : (
              <p className="mt-1 text-xs text-muted">
                Original statutory text is pending upload from official gazette. Refer to India Code.
              </p>
            )}
          </div>

          {/* Rule Metadata Grid */}
          <dl className="grid gap-3 sm:grid-cols-2 text-xs">
            {[
              ["Territorial Jurisdiction", r.jurisdiction],
              ["Applicable Vehicle Categories", vnames],
              ["Statutory Conditions", r.conditions ?? "None recorded"],
              ["Exceptions / Exemptions", r.exceptions ?? "None recorded"],
              ["Commencement Date", r.effectiveFrom ? `${r.effectiveFrom}${r.effectiveUntil ? ` to ${r.effectiveUntil}` : ""}` : "Not recorded"],
              ["Revision History", `v${r.version} (${r.extractedBy})`],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-xl border border-line bg-surface p-3">
                <dt className="font-bold uppercase tracking-wider text-muted text-[10px]">{k as string}</dt>
                <dd className="mt-0.5 font-semibold text-fg">{v as string}</dd>
              </div>
            ))}
          </dl>

          <SourcePanel
            sources={[{ name: r.sourceName ?? "Official Government Gazette", url: r.sourceUrl }]}
            status={r.verificationStatus}
            lastVerifiedAt={r.lastVerifiedAt}
          />
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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("q");
    if (p) {
      setQ(p);
      setDq(p);
    }
  }, []);

  useEffect(() => {
    const h = setTimeout(() => setDq(q), 350);
    return () => clearTimeout(h);
  }, [q]);

  const params = new URLSearchParams({
    ...(dq ? { q: dq } : {}),
    ...(state ? { state } : {}),
    ...(vehicle ? { vehicle } : {}),
    ...(topic ? { topic } : {}),
    ...(category ? { category } : {}),
    ...(status ? { status } : {}),
    ...(district ? { district } : {}),
  });

  const { data, loading, error, reload } = useFetch<{
    rules: Rule[];
    total: number;
    coverageNote: string | null;
  }>(`/api/laws?${params}`);

  const districts = useFetch<{ districts: { id: number; name: string }[] }>(
    state ? `/api/districts?state=${state}` : null
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Driving Laws & Regulations Explorer"
        icon={<Scale className="h-5 w-5" />}
        description="Comprehensive directory of the Motor Vehicles Act 1988, Central Motor Vehicles Rules, and State-specific statutory amendments. Verbatim statutory provisions are strictly separated from plain-language summaries."
      />

      <div className="space-y-3">
        <DemoBanner />
        <Notice tone="blue" title="Statutory Principle">
          Plain-language explanations are informational summaries. In all enforcement and judicial proceedings, the verbatim gazette text prevails.
        </Notice>
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-3xl p-6 shadow-md border border-line">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-3">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted" />
            <input
              className={`${inputCls} pl-10`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search in English or Indian script — e.g. helmet, स्पीड लिमिट, ஹெல்மெட், ओव्हरलोडिंग"
              aria-label="Search laws"
            />
          </div>

          <select
            className={inputCls}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            aria-label="Legal topic"
          >
            <option value="">All Legal Topics ({LEGAL_TOPICS.length})</option>
            {LEGAL_TOPICS.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            className={inputCls}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Rule category"
          >
            <option value="">All Statutory Categories</option>
            {CATEGORIES.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>

          <select
            className={inputCls}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Verification status"
          >
            <option value="">Any Verification Status</option>
            <option value="verified">Verified (Human-Reviewed)</option>
            <option value="pending">Needs Verification</option>
            <option value="outdated">Outdated / Superseded</option>
          </select>

          <select
            className={inputCls}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            aria-label="District"
            disabled={!state}
          >
            <option value="">{state ? "All Districts" : "Select a state to filter by district"}</option>
            {districts.data?.districts.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Results List */}
      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data?.rules.length ? (
        <EmptyState
          icon={<Scale className="h-10 w-10 text-accent/60" />}
          title="No statutory provisions match filters"
          text="No stored rule matches these parameters. This does not indicate absence of regulation; the statutory row may not yet be indexed in this database."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <span className="text-xs font-bold text-muted">
              Showing {data.total} statutory rule(s) · Jurisdiction: {state ? stateName(state) : "All India"}
            </span>
            <ReportActions
              filename="laws-report"
              report={{
                reportType: "law",
                title: `Driving Laws Assessment${dq ? ` — ${dq}` : ""}`,
                query: { q: dq, state, vehicle, topic },
                location: state ? stateName(state) : "All India (Central Law)",
                vehicleCategory: vehicle || null,
                findings: data.rules.map(
                  (r) => `${r.title} [${r.legalReference ?? "no reference"}] — ${r.explanation} (status: ${r.verificationStatus})`
                ),
                legalReferences: data.rules.map((r) => r.legalReference).filter(Boolean) as string[],
                sources: [
                  ...new Map(
                    data.rules.filter((r) => r.sourceUrl).map((r) => [r.sourceUrl!, { name: r.sourceName ?? "Official Gazette", url: r.sourceUrl! }])
                  ).values(),
                ],
                missingInfo: data.rules.filter((r) => !r.effectiveFrom).map((r) => `Effective date missing: ${r.title}`),
                uncertaintyNotices: ["Rules are draft references unless marked Verified."],
              }}
            />
          </div>

          {data.coverageNote && <Notice tone="amber">{data.coverageNote}</Notice>}

          <div className="space-y-3">
            {data.rules.map((r) => (
              <RuleCard key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
