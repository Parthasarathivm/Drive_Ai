"use client";
import { useState } from "react";
import { ExternalLink, FileUp, Globe2, Plus, Wand2 } from "lucide-react";
import { RequireStaff } from "@/components/Guards";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, Combobox, ErrorState, Field, LoadingBlock, Notice, PageHeader, STATE_OPTIONS, Tabs, inputCls } from "@/components/ui";
import { api, useFetch } from "@/lib/client";

type Src = { id: number; name: string; url: string; purpose: string | null; authority: string | null; jurisdictionLevel: string; stateName: string | null; isOfficial: boolean; checkFrequencyDays: number; lastCheckedAt: string | null; freshness: "fresh" | "overdue" | "never_checked"; nextCheckDue: string | null };
type Doc = { id: number; title: string; docType: string; issuingAuthority: string | null; publishedDate: string | null; effectiveDate: string | null; status: string; url: string | null; fileName: string | null; extractionStatus: string; hasText: boolean; linkedRules: number; pendingExtracted: number; stateName: string | null; isDemo: boolean };
const FRESH = { fresh: ["green", "Fresh"], overdue: ["red", "Overdue"], never_checked: ["amber", "Never checked"] } as const;

function Inner() {
  const { toast } = useApp();
  const [tab, setTab] = useState("sources");
  const src = useFetch<{ sources: Src[] }>("/api/admin/sources");
  const docs = useFetch<{ documents: Doc[] }>("/api/admin/documents");
  const [f, setF] = useState({ name: "", url: "", purpose: "", authority: "", jurisdictionLevel: "central", stateCode: "", checkFrequencyDays: 90 });
  const [d, setD] = useState({ title: "", docType: "pdf", issuingAuthority: "", publishedDate: "", effectiveDate: "", url: "", stateCode: "", sourceId: "", autoExtract: true });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function addSource(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await api("/api/admin/sources", { body: { ...f, stateCode: f.stateCode || undefined, purpose: f.purpose || undefined, authority: f.authority || undefined } }); toast("Source registered.", "success"); setF({ ...f, name: "", url: "", purpose: "", authority: "" }); src.reload(); }
    catch (err) { toast(err instanceof Error ? err.message : "Failed", "error"); } finally { setBusy(false); }
  }
  async function addDoc(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(d).forEach(([k, v]) => { if (v !== "" && v !== undefined) fd.append(k, String(v)); });
      if (file) fd.append("file", file);
      const r = await api<{ extracted: number; method: string | null; extractionStatus: string; message: string }>("/api/admin/documents", { form: fd });
      toast(`${r.message}${r.extracted ? ` ${r.extracted} candidate rules extracted (${r.method}).` : ""}`, "success");
      setFile(null); setD({ ...d, title: "", url: "" }); docs.reload();
    } catch (err) { toast(err instanceof Error ? err.message : "Upload failed", "error"); } finally { setBusy(false); }
  }
  async function patch(url: string, body: unknown, ok: string, reload: () => void) {
    try { await api(url, { method: "PATCH", body }); toast(ok, "success"); reload(); } catch (err) { toast(err instanceof Error ? err.message : "Failed", "error"); }
  }
  async function extract(id: number) {
    try { const r = await api<{ message: string }>("/api/admin/extract", { body: { documentId: id } }); toast(r.message, "success"); docs.reload(); } catch (err) { toast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  return (
    <>
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ value: "sources", label: "Official sources", count: src.data?.sources.length }, { value: "documents", label: "Legal documents", count: docs.data?.documents.length }]} /></div>
      {tab === "sources" ? (
        <div className="space-y-4">
          <Card><h2 className="mb-3 font-semibold">Register an official source</h2>
            <form onSubmit={addSource} className="grid gap-3 md:grid-cols-2">
              <Field label="Name" htmlFor="sn"><input id="sn" required className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="URL (https://…)" htmlFor="su"><input id="su" required type="url" className={inputCls} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
              <Field label="Issuing authority" htmlFor="sa"><input id="sa" className={inputCls} value={f.authority} onChange={(e) => setF({ ...f, authority: e.target.value })} /></Field>
              <Field label="Purpose" htmlFor="sp"><input id="sp" className={inputCls} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} /></Field>
              <Field label="Jurisdiction level" htmlFor="sj"><select id="sj" className={inputCls} value={f.jurisdictionLevel} onChange={(e) => setF({ ...f, jurisdictionLevel: e.target.value })}>{["central", "state", "district", "local"].map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="State / UT (if not central)"><Combobox options={STATE_OPTIONS("None")} value={f.stateCode} onChange={(v) => setF({ ...f, stateCode: v })} /></Field>
              <Field label="Re-check every (days)" htmlFor="sf"><input id="sf" type="number" min={1} max={730} className={inputCls} value={f.checkFrequencyDays} onChange={(e) => setF({ ...f, checkFrequencyDays: Number(e.target.value) || 90 })} /></Field>
              <div className="self-end"><Button type="submit" loading={busy}><Plus className="h-4 w-4" />Register source</Button></div>
            </form></Card>
          {src.loading ? <LoadingBlock /> : src.error ? <ErrorState message={src.error} onRetry={src.reload} /> : (
            <div className="space-y-3">{src.data?.sources.map((s) => (
              <Card key={s.id} className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b>{s.name}</b><Badge tone={FRESH[s.freshness][0]}>{FRESH[s.freshness][1]}</Badge><Badge>{s.jurisdictionLevel}{s.stateName ? ` · ${s.stateName}` : ""}</Badge></div>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 break-all text-sm text-royal hover:underline">{s.url}<ExternalLink className="h-3 w-3 shrink-0" /></a>
                <p className="text-xs text-muted">{s.purpose} · every {s.checkFrequencyDays} days · last checked {s.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleDateString("en-IN") : "never"}</p></div>
                <Button size="sm" variant="secondary" onClick={() => patch("/api/admin/sources", { id: s.id, markChecked: true }, "Marked as checked.", src.reload)}>Mark checked now</Button></Card>))}</div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <Card><h2 className="mb-1 font-semibold">Upload a government PDF / register a document URL</h2>
            <p className="mb-3 text-xs text-muted">PDFs must contain selectable text (max 8 MB). Extracted rules are created as <b>pending</b> and appear in Legal Rule Review.</p>
            <form onSubmit={addDoc} className="grid gap-3 md:grid-cols-2">
              <Field label="Title" htmlFor="dtl"><input id="dtl" required minLength={3} className={inputCls} value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
              <Field label="Type" htmlFor="dty"><select id="dty" className={inputCls} value={d.docType} onChange={(e) => setD({ ...d, docType: e.target.value })}>{["act", "rules", "notification", "circular", "pdf", "other"].map((x) => <option key={x}>{x}</option>)}</select></Field>
              <Field label="Issuing authority" htmlFor="dia"><input id="dia" className={inputCls} value={d.issuingAuthority} onChange={(e) => setD({ ...d, issuingAuthority: e.target.value })} /></Field>
              <Field label="Official URL (optional)" htmlFor="dur"><input id="dur" type="url" className={inputCls} value={d.url} onChange={(e) => setD({ ...d, url: e.target.value })} /></Field>
              <Field label="Published date" htmlFor="dpd" hint="Publication and effective dates are stored separately."><input id="dpd" type="date" className={inputCls} value={d.publishedDate} onChange={(e) => setD({ ...d, publishedDate: e.target.value })} /></Field>
              <Field label="Effective date" htmlFor="ded"><input id="ded" type="date" className={inputCls} value={d.effectiveDate} onChange={(e) => setD({ ...d, effectiveDate: e.target.value })} /></Field>
              <Field label="State / UT"><Combobox options={STATE_OPTIONS("Central")} value={d.stateCode} onChange={(v) => setD({ ...d, stateCode: v })} /></Field>
              <Field label="Linked source" htmlFor="dsr"><select id="dsr" className={inputCls} value={d.sourceId} onChange={(e) => setD({ ...d, sourceId: e.target.value })}><option value="">None</option>{src.data?.sources.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
              <div className="space-y-2 md:col-span-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface2"><FileUp className="h-4 w-4" />{file ? file.name : "Choose PDF / text file"}<input type="file" accept="application/pdf,text/plain" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.autoExtract} onChange={(e) => setD({ ...d, autoExtract: e.target.checked })} />Extract candidate rules after upload (AI if configured, otherwise heuristic)</label></div>
              <div><Button type="submit" loading={busy}><FileUp className="h-4 w-4" />Register document</Button></div>
            </form></Card>
          {docs.loading ? <LoadingBlock /> : docs.error ? <ErrorState message={docs.error} onRetry={docs.reload} /> : (
            <div className="space-y-3">{docs.data?.documents.map((x) => (
              <Card key={x.id} className="space-y-2"><div className="flex flex-wrap items-center gap-2"><b>{x.title}</b><Badge tone={x.status === "active" ? "green" : x.status === "superseded" ? "red" : "amber"}>{x.status}</Badge><Badge>{x.docType}</Badge>{x.isDemo && <Badge tone="amber">demo registration</Badge>}</div>
                <p className="text-xs text-muted">{x.issuingAuthority} · published {x.publishedDate ?? "—"} · effective {x.effectiveDate ?? "—"} · {x.fileName ?? "no file"} · text {x.hasText ? "extracted" : x.extractionStatus} · {x.linkedRules} linked rule(s), {x.pendingExtracted} extracted pending</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" disabled={!x.hasText} onClick={() => extract(x.id)}><Wand2 className="h-4 w-4" />Extract rules</Button>
                  <Button size="sm" variant="secondary" onClick={() => patch("/api/admin/documents", { id: x.id, markVerified: true, status: "active" }, "Marked verified & active.", docs.reload)}>Mark verified</Button>
                  <Button size="sm" variant="ghost" onClick={() => patch("/api/admin/documents", { id: x.id, status: x.status === "superseded" ? "active" : "superseded" }, "Status updated.", docs.reload)}>{x.status === "superseded" ? "Mark active" : "Mark superseded"}</Button>
                  {x.url && <a href={x.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-royal hover:underline">Open<ExternalLink className="h-3 w-3" /></a>}</div></Card>))}</div>
          )}
        </div>
      )}
    </>
  );
}
export default function SourcesPage() {
  return (<><PageHeader title="Source Management" icon={<Globe2 className="h-5 w-5" />} description="Register official sources, upload government documents, monitor freshness and trigger rule extraction." /><Notice tone="blue">Only data managers can add sources; extracted rules always require a Legal Reviewer’s approval.</Notice><div className="mt-4"><RequireStaff><Inner /></RequireStaff></div></>);
}
