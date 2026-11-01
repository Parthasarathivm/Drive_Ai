"use client";
import { useState } from "react";
import { FileUp, FolderOpen, Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/Providers";
import { RequireLogin } from "@/components/Guards";
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, LoadingBlock, Notice, PageHeader, inputCls, Tabs } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch } from "@/lib/client";
import { DOC_TYPES } from "@/lib/constants";
import { STATUS_TONE, docStatus, type DocStatus } from "@/lib/compliance";
import { DocStatusBadge, type UserDoc } from "@/components/DocBits";

function DocsInner() {
  const { toast } = useApp();
  const { data, loading, error, reload } = useFetch<{ documents: UserDoc[] }>("/api/documents");
  const [form, setForm] = useState({ docType: "insurance", label: "", number: "", issueDate: "", expiryDate: "", notes: "", consent: false });
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<UserDoc | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [hint, setHint] = useState("");
  const [tab, setTab] = useState("list");
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.consent) return toast("Please give consent to save document details.", "error");
    setSaving(true);
    try {
      await api("/api/documents", { body: { ...form, issueDate: form.issueDate || null, expiryDate: form.expiryDate || null, label: form.label || null, number: form.number || null, notes: form.notes || null } });
      toast("Document saved. Reminders were scheduled.", "success"); setForm({ ...form, label: "", number: "", issueDate: "", expiryDate: "", notes: "" }); setHint(""); setTab("list"); reload();
    } catch (err) { toast(err instanceof Error ? err.message : "Could not save", "error"); }
    finally { setSaving(false); }
  }
  async function analyze(file?: File) {
    if (!file) return;
    if (!form.consent) return toast("Give consent first — the file is processed only with your permission.", "error");
    setAnalyzing(true);
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("consent", "true");
      const r = await api<{ suggestedExpiry: string | null; suggestedType: string | null; notice: string }>("/api/ai/analyze-document", { form: fd });
      if (r.suggestedExpiry) set("expiryDate", r.suggestedExpiry);
      if (r.suggestedType) set("docType", r.suggestedType);
      setHint(r.suggestedExpiry ? `Suggested expiry ${r.suggestedExpiry}. ${r.notice}` : `No expiry date detected. ${r.notice}`);
    } catch (err) { toast(err instanceof Error ? err.message : "Could not process file", "error"); }
    finally { setAnalyzing(false); }
  }
  async function remove() {
    if (!del) return;
    try { await api(`/api/documents/${del.id}`, { method: "DELETE" }); toast("Document deleted.", "success"); setDel(null); reload(); }
    catch (err) { toast(err instanceof Error ? err.message : "Delete failed", "error"); }
  }

  const docs = data?.documents ?? [];
  const missing = Object.keys(DOC_TYPES).filter((t) => !docs.some((d) => d.docType === t));
  const statusLine = (d: UserDoc) => `${DOC_TYPES[d.docType]}${d.label ? ` (${d.label})` : ""}${d.maskedNumber ? ` ${d.maskedNumber}` : ""}: ${docStatus(d.expiryDate)}${d.expiryDate ? `, expires ${d.expiryDate}` : ""}`;

  return (
    <>
      <Notice tone="blue" title="Your privacy"><ul className="list-disc space-y-0.5 pl-5"><li>Everything here is optional and saved only with your explicit consent.</li><li>Only the last 4 characters of a number are kept; the full number is never stored.</li><li>Uploaded files are processed to suggest dates and then discarded.</li><li>You can delete any document at any time. We never ask for government-portal passwords or OTPs.</li></ul></Notice>
      <div className="my-4"><Tabs value={tab} onChange={setTab} tabs={[{ value: "list", label: "My documents", count: docs.length }, { value: "add", label: "Add document" }]} /></div>
      {tab === "add" ? (
        <Card><form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label="Document type" htmlFor="dt"><select id="dt" className={inputCls} value={form.docType} onChange={(e) => set("docType", e.target.value)}>{Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Label (optional)" htmlFor="lb"><input id="lb" className={inputCls} value={form.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. My Honda Activa" maxLength={80} /></Field>
          <Field label="Document number (optional)" htmlFor="nm" hint="Only the last 4 characters will be stored."><input id="nm" className={inputCls} value={form.number} onChange={(e) => set("number", e.target.value)} autoComplete="off" maxLength={30} /></Field>
          <Field label="Issue date" htmlFor="id"><input id="id" type="date" className={inputCls} value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} /></Field>
          <Field label="Expiry date" htmlFor="ed" hint="Without an expiry date the status shows as Verification unavailable."><input id="ed" type="date" className={inputCls} value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} /></Field>
          <Field label="Notes (optional)" htmlFor="nt"><input id="nt" className={inputCls} value={form.notes} onChange={(e) => set("notes", e.target.value)} maxLength={300} /></Field>
          <div className="space-y-2 md:col-span-2">
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" checked={form.consent} onChange={(e) => set("consent", e.target.checked)} />I consent to DriveLegal AI saving these document details (and processing an uploaded file, if I choose to upload one) to provide expiry reminders.</label>
            <div className="flex flex-wrap items-center gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface2"><FileUp className="h-4 w-4" />{analyzing ? "Reading…" : "Optional: read dates from a PDF / text file"}<input type="file" accept="application/pdf,text/plain" className="hidden" onChange={(e) => analyze(e.target.files?.[0])} /></label></div>
            {hint && <Notice tone="amber">{hint}</Notice>}
          </div>
          <div className="md:col-span-2"><Button type="submit" loading={saving}><Plus className="h-4 w-4" />Save document</Button></div>
        </form></Card>
      ) : loading ? <LoadingBlock rows={2} /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="space-y-4">
          {!docs.length ? <EmptyState icon={<FolderOpen className="h-8 w-8" />} title="No documents saved" text="Add your licence, RC, insurance, PUC, fitness or permit to get expiry reminders." action={<Button onClick={() => setTab("add")}><Plus className="h-4 w-4" />Add document</Button>} /> : (
            <>
              <div className="grid gap-3 md:grid-cols-2">{docs.map((d) => (
                <Card key={d.id} className="flex items-start justify-between gap-3"><div className="space-y-1"><p className="font-semibold">{DOC_TYPES[d.docType]}{d.label && <span className="font-normal text-muted"> — {d.label}</span>}</p><DocStatusBadge expiry={d.expiryDate} />
                  <p className="text-xs text-muted">{d.maskedNumber ? `Number: ${d.maskedNumber} · ` : ""}Expiry: {d.expiryDate ?? "not provided"}</p>{d.notes && <p className="text-xs">{d.notes}</p>}
                  <p className="text-xs text-muted">Official verification against government records: unavailable (no authorised integration).</p></div>
                  <Button variant="ghost" size="sm" aria-label={`Delete ${DOC_TYPES[d.docType]}`} onClick={() => setDel(d)}><Trash2 className="h-4 w-4 text-red-600" /></Button></Card>))}</div>
              <Card><h2 className="mb-2 font-semibold">Compliance checklist</h2><ul className="grid gap-1 text-sm sm:grid-cols-2">{Object.entries(DOC_TYPES).map(([k, v]) => { const d = docs.filter((x) => x.docType === k); const s: DocStatus = d.length ? (d.map((x) => docStatus(x.expiryDate)).sort().includes("Expired") ? "Expired" : docStatus(d[0].expiryDate)) : "Not provided"; return <li key={k} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5"><span>{v}</span><Badge tone={STATUS_TONE[s]}>{s}</Badge></li>; })}</ul>
                <div className="mt-3"><ReportActions filename="compliance-report" report={{ reportType: "compliance", title: "Vehicle & driver compliance report", query: {}, location: null, vehicleCategory: null, findings: [...docs.map(statusLine), ...missing.map((m) => `${DOC_TYPES[m]}: Not provided`)], legalReferences: ["Motor Vehicles Act, 1988 — Sections 3, 39, 56, 66, 146", "Central Motor Vehicles Rules, 1989 — Rule 115 (PUC)"], sources: [{ name: "Parivahan", url: "https://parivahan.gov.in/" }], missingInfo: missing.map((m) => `${DOC_TYPES[m]} not provided`), uncertaintyNotices: ["Statuses are calculated from the dates you entered; no government verification was performed."] }} /></div></Card>
            </>
          )}
        </div>
      )}
      <ConfirmDialog open={!!del} danger title="Delete this document?" message="The saved details and its reminders will be permanently removed." confirmLabel="Delete" onConfirm={remove} onCancel={() => setDel(null)} />
    </>
  );
}

export default function DocumentsPage() {
  return (<><PageHeader title="My Documents" icon={<FolderOpen className="h-5 w-5" />} description="Track expiry of your driving licence, RC, insurance, PUC, fitness certificate and permits." /><RequireLogin message="Log in to track your documents and receive expiry reminders."><DocsInner /></RequireLogin></>);
}
