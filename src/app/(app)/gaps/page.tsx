"use client";
import { useMemo, useState } from "react";
import { RefreshCw, SearchCheck } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingBlock, Notice, PageHeader, StatusBadge, Tabs, inputCls, cx } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch } from "@/lib/client";
import { FINDING_STATUSES } from "@/lib/constants";

type Src = { name?: string; url?: string; jurisdiction?: string; section?: string; amount?: number | null; authority?: string; reference?: string };
type Finding = {
  id: number; kind: "gap" | "conflict"; title: string; explanation: string; sourceA?: Src | null; sourceB?: Src | null; documentDates?: Record<string, unknown> | null; legalProvisions?: string | null;
  reason: string; priority: string; findingStatus: string; suggestedAction: string; isExample: boolean; reviewStatus: string; gapType?: string;
};
const PRIO_TONE: Record<string, "red" | "amber" | "blue"> = { high: "red", medium: "amber", low: "blue" };

function SrcView({ label, s }: { label: string; s?: Src | null }) {
  if (!s) return null;
  return <div className="rounded-lg border border-line bg-surface2 p-2 text-xs"><p className="font-semibold">{label}</p><p>{s.name ?? s.reference}</p>{s.jurisdiction && <p>Jurisdiction: {s.jurisdiction}</p>}{s.section && <p>{s.section}</p>}{s.amount != null && <p>Amount: ₹{s.amount}</p>}{s.url && <a className="text-royal underline" href={s.url} target="_blank" rel="noopener noreferrer">Source link</a>}</div>;
}

export default function GapsPage() {
  const { hasRole, toast } = useApp();
  const { data, loading, error, reload } = useFetch<{ gaps: Omit<Finding, "kind">[]; conflicts: Omit<Finding, "kind">[] }>("/api/intelligence/findings");
  const [status, setStatus] = useState("");
  const [prio, setPrio] = useState("");
  const [kind, setKind] = useState("all");
  const [running, setRunning] = useState(false);
  const [showExamples, setShowExamples] = useState(true);

  const all: Finding[] = useMemo(() => [...(data?.conflicts ?? []).map((c) => ({ ...c, kind: "conflict" as const })), ...(data?.gaps ?? []).map((g) => ({ ...g, kind: "gap" as const }))], [data]);
  const list = all.filter((f) => (!status || f.findingStatus === status) && (!prio || f.priority === prio) && (kind === "all" || f.kind === kind) && (showExamples || !f.isExample) && f.reviewStatus !== "dismissed" && f.reviewStatus !== "resolved");
  const counts = FINDING_STATUSES.map((s) => ({ s, n: all.filter((f) => f.findingStatus === s && f.reviewStatus === "open").length }));
  const checklist = [...new Map(list.filter((f) => f.reviewStatus === "open").map((f) => [f.suggestedAction, f])).values()].slice(0, 25);

  async function run() {
    setRunning(true);
    try {
      await api("/api/intelligence/gap-detection", { method: "POST" });
      await api("/api/intelligence/conflict-detection", { method: "POST" });
      await api("/api/intelligence/outdated-detection", { method: "POST" });
      toast("Analysis complete.", "success"); await reload();
    } catch (e) { toast(e instanceof Error ? e.message : "Analysis failed", "error"); }
    finally { setRunning(false); }
  }

  return (
    <>
      <PageHeader title="Legal Gap & Conflict Analysis" icon={<SearchCheck className="h-5 w-5" />} description="Automatic detection of missing, outdated and potentially conflicting legal information. The engine never decides which source prevails — it flags uncertain cases for human review."
        actions={hasRole("legal_reviewer", "data_manager") ? <Button size="sm" onClick={run} loading={running}><RefreshCw className="h-4 w-4" />Re-run analysis</Button> : undefined} />
      <Notice tone="blue" title="Why this matters">Information that is missing or conflicting is shown openly instead of being guessed. Findings marked EXAMPLE are illustrative scenarios, not real conflicts.</Notice>
      <div className="my-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{counts.map((c) => <button key={c.s} onClick={() => setStatus(status === c.s ? "" : c.s)} className={cx("rounded-xl border p-3 text-left transition", status === c.s ? "border-royal bg-royal/10" : "border-line bg-surface hover:bg-surface2")}><StatusBadge status={c.s} /><p className="mt-2 text-2xl font-bold">{c.n}</p><p className="text-xs text-muted">open</p></button>)}</div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={kind} onChange={setKind} tabs={[{ value: "all", label: "All" }, { value: "gap", label: "Information gaps" }, { value: "conflict", label: "Conflicts" }]} />
        <select className={`${inputCls} !w-auto`} value={prio} onChange={(e) => setPrio(e.target.value)} aria-label="Priority"><option value="">Any priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showExamples} onChange={(e) => setShowExamples(e.target.checked)} />Show EXAMPLE findings</label>
      </div>
      {loading ? <LoadingBlock /> : error ? <ErrorState message={error} onRetry={reload} /> : !list.length ? <EmptyState title="No findings match" text="Adjust the filters, or re-run analysis (staff only)." /> : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-muted">{list.length} finding(s)</p>
            <ReportActions filename="legal-gap-report" report={{ reportType: "gap", title: "Legal gap analysis report", query: { status, priority: prio, kind }, location: "India", vehicleCategory: null, findings: list.slice(0, 100).map((f) => `[${f.findingStatus} / ${f.priority}] ${f.title} — ${f.explanation} Action: ${f.suggestedAction}`), legalReferences: list.map((f) => f.legalProvisions).filter(Boolean).slice(0, 50) as string[], sources: [], missingInfo: list.filter((f) => f.findingStatus === "Information Not Found").slice(0, 50).map((f) => f.title), uncertaintyNotices: ["Findings are automatically generated and require human review.", ...(showExamples ? ["Items marked EXAMPLE are illustrative."] : [])] }} /></div>
          {list.slice(0, 120).map((f) => (
            <Card key={`${f.kind}-${f.id}`} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={f.findingStatus} /><Badge tone={PRIO_TONE[f.priority] ?? "grey"}>{f.priority} priority</Badge><Badge tone={f.kind === "conflict" ? "red" : "blue"}>{f.kind === "conflict" ? "Conflict" : "Gap"}</Badge>{f.isExample && <Badge tone="amber">EXAMPLE</Badge>}{f.reviewStatus !== "open" && <Badge>{f.reviewStatus}</Badge>}</div>
              <h3 className="font-semibold">{f.title}</h3><p className="text-sm">{f.explanation}</p>
              {(f.sourceA || f.sourceB) && <div className="grid gap-2 sm:grid-cols-2"><SrcView label="Source A" s={f.sourceA} /><SrcView label="Source B" s={f.sourceB} /></div>}
              <dl className="grid gap-2 text-xs sm:grid-cols-3">{f.documentDates && <div><dt className="font-semibold text-muted">Document dates</dt><dd>{Object.entries(f.documentDates).map(([k, v]) => `${k}: ${String(v ?? "unknown")}`).join(" · ")}</dd></div>}{f.legalProvisions && <div><dt className="font-semibold text-muted">Legal provisions</dt><dd>{f.legalProvisions}</dd></div>}<div><dt className="font-semibold text-muted">Reason for detection</dt><dd>{f.reason}</dd></div></dl>
              <p className="rounded-lg bg-royal/10 p-2 text-sm"><b>Suggested verification action:</b> {f.suggestedAction}</p>
            </Card>
          ))}
          <Card><h2 className="mb-2 font-semibold">Verification checklist</h2><ul className="space-y-1.5 text-sm">{checklist.map((f) => <li key={f.suggestedAction} className="flex gap-2"><input type="checkbox" aria-label={f.suggestedAction} className="mt-1" /><span>{f.suggestedAction} <span className="text-muted">— {f.title}</span></span></li>)}</ul></Card>
        </div>
      )}
    </>
  );
}
