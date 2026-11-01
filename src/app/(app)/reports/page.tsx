"use client";
import Link from "next/link";
import { useState } from "react";
import { FileText, Trash2 } from "lucide-react";
import { useApp } from "@/components/Providers";
import { RequireLogin } from "@/components/Guards";
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, LoadingBlock, PageHeader } from "@/components/ui";
import { api, useFetch } from "@/lib/client";

type R = { id: number; title: string; reportType: string; location: string | null; vehicleCategory: string | null; createdAt: string };

function List() {
  const { toast } = useApp();
  const { data, loading, error, reload } = useFetch<{ reports: R[] }>("/api/reports");
  const [del, setDel] = useState<R | null>(null);
  if (loading) return <LoadingBlock />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data?.reports.length) return <EmptyState icon={<FileText className="h-8 w-8" />} title="No saved reports" text="Use “Save report” on the Fine Calculator, Laws, Forest, Permit, Route or Gap Analysis pages." />;
  return (
    <>
      <div className="space-y-3">{data.reports.map((r) => (
        <Card key={r.id} className="flex items-center justify-between gap-3"><Link href={`/reports/${r.id}`} className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap gap-2"><Badge tone="blue">{r.reportType}</Badge>{r.location && <Badge>{r.location}</Badge>}</div><p className="truncate font-semibold hover:underline">{r.title}</p><p className="text-xs text-muted">{new Date(r.createdAt).toLocaleString("en-IN")}</p></Link>
          <Button size="sm" variant="ghost" aria-label="Delete report" onClick={() => setDel(r)}><Trash2 className="h-4 w-4 text-red-600" /></Button></Card>))}</div>
      <ConfirmDialog open={!!del} danger title="Delete report?" message={`“${del?.title}” will be permanently removed.`} confirmLabel="Delete" onCancel={() => setDel(null)}
        onConfirm={async () => { try { await api(`/api/reports/${del!.id}`, { method: "DELETE" }); toast("Report deleted.", "success"); setDel(null); reload(); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } }} />
    </>
  );
}

export default function ReportsPage() {
  return (<><PageHeader title="Reports" icon={<FileText className="h-5 w-5" />} description="Your saved fine, law, forest, permit, route, compliance and gap-analysis reports." /><RequireLogin message="Log in to save and view reports."><List /></RequireLogin></>);
}
