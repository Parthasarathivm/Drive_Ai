"use client";
import { useState } from "react";
import { GitCompareArrows, RefreshCw } from "lucide-react";
import { RequireStaff } from "@/components/Guards";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingBlock, Notice, PageHeader, StatusBadge, Tabs, inputCls } from "@/components/ui";
import { api, useFetch } from "@/lib/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
function Inner() {
  const { toast } = useApp();
  const { data, loading, error, reload } = useFetch<{ gaps: any[]; conflicts: any[] }>("/api/intelligence/findings");
  const [tab, setTab] = useState("conflict");
  const [rs, setRs] = useState("open");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try { for (const p of ["gap", "conflict", "outdated"]) await api(`/api/intelligence/${p}-detection`, { method: "POST" }); toast("Detection finished.", "success"); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } finally { setRunning(false); }
  }
  async function review(kind: string, id: number, reviewStatus: string) {
    try { await api("/api/admin/findings", { method: "PATCH", body: { kind, id, reviewStatus, note: notes[`${kind}${id}`] || undefined } }); toast("Review saved.", "success"); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  const list = (tab === "conflict" ? data?.conflicts : data?.gaps)?.filter((f) => rs === "all" || f.reviewStatus === rs) ?? [];
  return (
    <>
      <Notice tone="amber" title="No automatic winner">When sources conflict, the system does not decide which prevails. Consider issuing authority, jurisdiction, effective date and legal status (in force / superseded), then record your decision and note. Uncertain cases must be escalated to a human legal reviewer.</Notice>
      <div className="my-4 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: "conflict", label: "Conflicts", count: data?.conflicts.filter((c) => c.reviewStatus === "open").length }, { value: "gap", label: "Missing information", count: data?.gaps.filter((c) => c.reviewStatus === "open").length }]} />
        <select className={`${inputCls} !w-auto`} value={rs} onChange={(e) => setRs(e.target.value)} aria-label="Review status"><option value="open">Open</option><option value="in_review">In review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="all">All</option></select>
        <Button size="sm" onClick={run} loading={running}><RefreshCw className="h-4 w-4" />Run detection</Button>
      </div>
      {loading ? <LoadingBlock /> : error ? <ErrorState message={error} onRetry={reload} /> : !list.length ? <EmptyState icon={<GitCompareArrows className="h-8 w-8" />} title="Nothing to review" /> : (
        <div className="space-y-3">{list.slice(0, 100).map((f) => {
          const k = `${tab}${f.id}`;
          return (
            <Card key={k} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={f.findingStatus} /><Badge tone={f.priority === "high" ? "red" : f.priority === "medium" ? "amber" : "blue"}>{f.priority}</Badge><Badge>{f.reviewStatus}</Badge>{f.isExample && <Badge tone="amber">EXAMPLE</Badge>}</div>
              <h3 className="font-semibold">{f.title}</h3><p className="text-sm">{f.explanation}</p>
              {(f.sourceA || f.sourceB) && <div className="grid gap-2 text-xs sm:grid-cols-2">{[f.sourceA, f.sourceB].map((s, i) => s && <pre key={i} className="overflow-x-auto rounded-lg bg-surface2 p-2">{JSON.stringify(s, null, 1)}</pre>)}</div>}
              <p className="text-xs text-muted">Reason: {f.reason}{f.documentDates ? ` · Dates: ${JSON.stringify(f.documentDates)}` : ""}</p>
              <p className="rounded-lg bg-royal/10 p-2 text-sm"><b>Suggested action:</b> {f.suggestedAction}</p>
              {f.reviewNote && <p className="text-xs">Reviewer note: {f.reviewNote}</p>}
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
                <input className={`${inputCls} !w-auto min-w-[14rem] flex-1`} placeholder="Review note / decision rationale" value={notes[k] ?? ""} onChange={(e) => setNotes({ ...notes, [k]: e.target.value })} aria-label="Review note" />
                <Button size="sm" variant="secondary" onClick={() => review(tab, f.id, "in_review")}>In review</Button>
                <Button size="sm" onClick={() => review(tab, f.id, "resolved")}>Resolve</Button>
                <Button size="sm" variant="ghost" onClick={() => review(tab, f.id, "dismissed")}>Dismiss</Button>
                {f.reviewStatus !== "open" && <Button size="sm" variant="ghost" onClick={() => review(tab, f.id, "open")}>Reopen</Button>}
              </div>
            </Card>);
        })}</div>
      )}
    </>
  );
}
export default function ConflictsPage() {
  return (<><PageHeader title="Conflict & Gap Review" icon={<GitCompareArrows className="h-5 w-5" />} description="Human review of detected conflicts, missing information, outdated and potentially superseded documents." /><RequireStaff><Inner /></RequireStaff></>);
}
