"use client";
import { useState } from "react";
import { Database, Pencil, Plus, Trash2 } from "lucide-react";
import { RequireStaff } from "@/components/Guards";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, Combobox, ConfirmDialog, EmptyState, ErrorState, Field, LoadingBlock, Modal, Notice, PageHeader, STATE_OPTIONS, StatusBadge, Tabs, inputCls } from "@/components/ui";
import { api, useFetch } from "@/lib/client";
import { ENTITY_CONFIGS, type EntityConfig, type Field as F } from "@/lib/admin-config";

/* eslint-disable @typescript-eslint/no-explicit-any */
function FieldInput({ f, value, onChange }: { f: F; value: any; onChange: (v: any) => void }) {
  const id = `f-${f.name}`;
  let input: React.ReactNode;
  if (f.type === "textarea" || f.type === "lines") input = <textarea id={id} rows={f.type === "lines" ? 4 : 3} className={inputCls} value={Array.isArray(value) ? value.join("\n") : value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  else if (f.type === "select") input = <select id={id} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)}><option value="">Select…</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
  else if (f.type === "multi") input = <div className="flex flex-wrap gap-x-4 gap-y-1">{f.options?.map((o) => { const arr: string[] = value ?? []; return <label key={o.value} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={arr.includes(o.value)} onChange={() => onChange(arr.includes(o.value) ? arr.filter((x) => x !== o.value) : [...arr, o.value])} />{o.label}</label>; })}</div>;
  else if (f.type === "boolean") input = <label className="flex items-center gap-2 text-sm"><input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />Enabled</label>;
  else if (f.type === "state") input = <Combobox options={STATE_OPTIONS("Central (no state)")} value={value ?? ""} onChange={onChange} />;
  else input = <input id={id} type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} min={f.type === "number" ? 0 : undefined} className={inputCls} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  return <Field label={`${f.label}${f.required ? " *" : ""}`} htmlFor={id}>{input}</Field>;
}

function Manager({ cfg }: { cfg: EntityConfig }) {
  const { toast, hasRole } = useApp();
  const { data, loading, error, reload } = useFetch<{ rows: any[] }>(`/api/admin/entity/${cfg.key}`);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [del, setDel] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const canWrite = hasRole(...(cfg.roles as any));

  const open = (row?: any) => { setEditing(row ?? {}); setForm(row ? Object.fromEntries(cfg.fields.map((f) => [f.name, f.type === "state" ? row.stateCode ?? "" : row[f.name]])) : { enabled: true }); };
  async function save() {
    setSaving(true);
    try {
      const payload: Record<string, any> = {};
      cfg.fields.forEach((f) => { if (f.name in form) payload[f.name] = f.type === "number" && form[f.name] !== "" && form[f.name] != null ? Number(form[f.name]) : f.type === "lines" && typeof form[f.name] === "string" ? form[f.name].split("\n") : form[f.name]; });
      if (editing?.id !== undefined || editing?.code) await api(`/api/admin/entity/${cfg.key}`, { method: "PATCH", body: { id: editing.id ?? editing.code, data: payload } });
      else await api(`/api/admin/entity/${cfg.key}`, { body: payload });
      toast(cfg.hasStatus ? "Saved — record is pending human review." : "Saved.", "success"); setEditing(null); reload();
    } catch (e) { toast(e instanceof Error ? e.message : "Save failed", "error"); } finally { setSaving(false); }
  }
  async function remove() {
    try { await api(`/api/admin/entity/${cfg.key}?id=${encodeURIComponent(del.id ?? del.code)}`, { method: "DELETE" }); toast("Deleted.", "success"); setDel(null); reload(); } catch (e) { toast(e instanceof Error ? e.message : "Delete failed", "error"); }
  }
  const cell = (r: any, c: string) => { const v = r[c]; if (c === "verificationStatus") return <StatusBadge status={v} />; if (typeof v === "boolean") return v ? "Yes" : "No"; return v == null ? "—" : String(v).slice(0, 60); };

  return (
    <>
      {cfg.hasStatus && <Notice tone="blue">New and edited records start as <b>pending</b>; a Legal Reviewer must approve them in Legal Rule Review before they count as verified.</Notice>}
      <div className="my-3 flex justify-between"><p className="text-sm text-muted">{data?.rows.length ?? 0} record(s){!canWrite && " · read-only for your role"}</p><Button size="sm" disabled={!canWrite} onClick={() => open()}><Plus className="h-4 w-4" />Add {cfg.label.toLowerCase()}</Button></div>
      {loading ? <LoadingBlock /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.rows.length ? <EmptyState title="No records yet" /> : (
        <Card className="overflow-x-auto !p-0"><table className="w-full min-w-[40rem] text-left text-sm"><thead className="border-b border-line bg-surface2 text-xs uppercase text-muted"><tr>{cfg.columns.map((c) => <th key={c} className="px-3 py-2">{c}</th>)}<th /></tr></thead>
          <tbody>{data.rows.map((r) => <tr key={r.id ?? r.code} className="border-b border-line/60">{cfg.columns.map((c) => <td key={c} className="px-3 py-2">{cell(r, c)}</td>)}<td className="whitespace-nowrap px-3 py-2 text-right"><Button size="sm" variant="ghost" disabled={!canWrite} aria-label="Edit" onClick={() => open(r)}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" disabled={!canWrite} aria-label="Delete" onClick={() => setDel(r)}><Trash2 className="h-4 w-4 text-red-600" /></Button></td></tr>)}</tbody></table></Card>
      )}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={`${editing?.id !== undefined || editing?.code ? "Edit" : "Add"} ${cfg.label.toLowerCase()}`} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button loading={saving} onClick={save}>Save</Button></>}>
        <div className="space-y-3">{cfg.fields.map((f) => <FieldInput key={f.name} f={f} value={form[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} />)}</div>
      </Modal>
      <ConfirmDialog open={!!del} danger title="Delete this record?" message="This permanently removes the record. Consider rejecting or marking it outdated instead to keep history." confirmLabel="Delete" onConfirm={remove} onCancel={() => setDel(null)} />
      <span className="hidden"><Badge>x</Badge></span>
    </>
  );
}

function Inner() {
  const [tab, setTab] = useState("penalties");
  const cfg = ENTITY_CONFIGS.find((c) => c.key === tab)!;
  return (<><div className="mb-3"><Tabs value={tab} onChange={setTab} tabs={ENTITY_CONFIGS.map((c) => ({ value: c.key, label: c.label }))} /></div><Manager key={tab} cfg={cfg} /></>);
}
export default function DataPage() {
  return (<><PageHeader title="Data Management" icon={<Database className="h-5 w-5" />} description="Manage penalties, rules, permits, protected areas, locations, services, districts and languages." /><RequireStaff><Inner /></RequireStaff></>);
}
