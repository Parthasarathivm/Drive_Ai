"use client";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ShieldCheck } from "lucide-react";
import { RequireStaff } from "@/components/Guards";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, ErrorState, LoadingBlock, PageHeader } from "@/components/ui";
import { api, useFetch } from "@/lib/client";

type D = {
  pending: Record<string, number>; users: number; openGaps: number; openConflicts: number; newFeedback: number; sourceFreshness: Record<string, number>; roles: string[];
  audit: { id: number; userEmail: string | null; action: string; entityType: string | null; entityId: string | null; createdAt: string; ip: string | null }[];
  feedback: { id: number; category: string; rating: number | null; message: string; status: string; page: string | null; createdAt: string }[];
};

function Inner() {
  const { toast } = useApp();
  const { data, loading, error, reload } = useFetch<D>("/api/admin/dashboard");
  if (loading) return <LoadingBlock rows={4} />;
  if (error || !data) return <ErrorState message={error ?? "Failed"} onRetry={reload} />;
  const pendingTotal = Object.values(data.pending).reduce((a, b) => a + b, 0);
  const fresh = [{ name: "Fresh", v: data.sourceFreshness.fresh, c: "#16a34a" }, { name: "Overdue", v: data.sourceFreshness.overdue, c: "#dc2626" }, { name: "Never checked", v: data.sourceFreshness.never_checked, c: "#f59e0b" }];
  async function fb(id: number, reviewStatus: string) { try { await api("/api/admin/findings", { method: "PATCH", body: { kind: "feedback", id, reviewStatus } }); reload(); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } }
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {([["Records awaiting review", pendingTotal, "/admin/rules"], ["Open conflicts", data.openConflicts, "/admin/conflicts"], ["Open information gaps", data.openGaps, "/admin/conflicts"], ["Users", data.users, "/admin/users"], ["New feedback", data.newFeedback, "#feedback"]] as const).map(([l, v, h]) => (
          <Link key={l} href={h}><Card className="h-full transition hover:border-royal/50"><p className="text-sm text-muted">{l}</p><p className="mt-1 text-3xl font-bold">{v}</p></Card></Link>))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-2 font-semibold">Pending records by type</h2><ul className="space-y-1 text-sm">{Object.entries(data.pending).map(([k, v]) => <li key={k} className="flex justify-between border-b border-line pb-1"><span className="capitalize">{k}</span><b>{v}</b></li>)}</ul></Card>
        <Card><h2 className="mb-2 font-semibold">Source freshness</h2><div className="h-48"><ResponsiveContainer><BarChart data={fresh}><CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="v" name="Sources">{fresh.map((f) => <Cell key={f.name} fill={f.c} />)}</Bar></BarChart></ResponsiveContainer></div><Link href="/admin/sources" className="text-sm text-royal underline">Manage sources</Link></Card>
      </div>
      <Card id="feedback"><h2 className="mb-2 font-semibold">User feedback</h2>
        {!data.feedback.length ? <p className="text-sm text-muted">No feedback yet.</p> : <ul className="space-y-2">{data.feedback.map((f) => <li key={f.id} className="rounded-xl border border-line p-3 text-sm"><div className="mb-1 flex flex-wrap items-center gap-2"><Badge tone="blue">{f.category.replace("_", " ")}</Badge><Badge tone={f.status === "new" ? "amber" : "green"}>{f.status}</Badge><span className="text-xs text-muted">{f.page} · {new Date(f.createdAt).toLocaleString("en-IN")}</span></div><p>{f.message}</p>
          <div className="mt-2 flex gap-2">{f.status !== "reviewed" && <Button size="sm" variant="secondary" onClick={() => fb(f.id, "reviewed")}>Mark reviewed</Button>}{f.status !== "closed" && <Button size="sm" variant="ghost" onClick={() => fb(f.id, "closed")}>Close</Button>}</div></li>)}</ul>}</Card>
      <Card><h2 className="mb-2 font-semibold">Audit log (latest 25)</h2>
        <div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-xs"><thead className="border-b border-line uppercase text-muted"><tr><th className="py-1.5 pr-3">When</th><th className="pr-3">User</th><th className="pr-3">Action</th><th className="pr-3">Entity</th><th>IP</th></tr></thead>
          <tbody>{data.audit.map((a) => <tr key={a.id} className="border-b border-line/60"><td className="py-1.5 pr-3">{new Date(a.createdAt).toLocaleString("en-IN")}</td><td className="pr-3">{a.userEmail}</td><td className="pr-3 font-medium">{a.action}</td><td className="pr-3">{a.entityType} {a.entityId}</td><td>{a.ip}</td></tr>)}{!data.audit.length && <tr><td colSpan={5} className="py-3 text-muted">No audit entries yet.</td></tr>}</tbody></table></div></Card>
    </div>
  );
}
export default function AdminPage() {
  return (<><PageHeader title="Admin Dashboard" icon={<ShieldCheck className="h-5 w-5" />} description="Review queue, source freshness, feedback and audit trail." /><RequireStaff><Inner /></RequireStaff></>);
}
