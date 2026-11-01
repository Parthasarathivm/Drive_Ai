"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { RequireLogin } from "@/components/Guards";
import { ReportActions } from "@/components/ReportActions";
import { Badge, Card, DemoBanner, ErrorState, LoadingBlock, Notice, PageHeader, Section, List } from "@/components/ui";
import { useFetch, type ReportLike } from "@/lib/client";

function View({ id }: { id: string }) {
  const { data, loading, error, reload } = useFetch<{ report: ReportLike & { id: number; createdAt: string } }>(`/api/reports/${id}`);
  if (loading) return <LoadingBlock />;
  if (error || !data) return <ErrorState message={error ?? "Not found"} onRetry={reload} />;
  const r = data.report;
  return (
    <div className="space-y-4">
      <DemoBanner />
      <Card className="space-y-5">
        <div className="flex flex-wrap items-center gap-2"><Badge tone="blue">{r.reportType}</Badge><span className="text-xs text-muted">{new Date(r.createdAt).toLocaleString("en-IN")}</span></div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3"><div><dt className="text-xs font-semibold uppercase text-muted">Location</dt><dd>{r.location ?? "India (central law)"}</dd></div><div><dt className="text-xs font-semibold uppercase text-muted">Vehicle category</dt><dd>{r.vehicleCategory ?? "Not specified"}</dd></div><div><dt className="text-xs font-semibold uppercase text-muted">Query</dt><dd className="break-words text-xs">{JSON.stringify(r.query)}</dd></div></dl>
        <Section title="Findings"><ol className="list-decimal space-y-1 pl-5 text-sm">{r.findings.map((f, i) => <li key={i}>{typeof f === "string" ? f : JSON.stringify(f)}</li>)}</ol></Section>
        <Section title="Legal references">{r.legalReferences.length ? <List items={r.legalReferences} /> : <p className="text-sm text-muted">None recorded</p>}</Section>
        <Section title="Official source links">{r.sources.length ? <ul className="space-y-1 text-sm">{r.sources.map((s) => <li key={s.url}><a className="inline-flex items-center gap-1 text-royal hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.name}<ExternalLink className="h-3 w-3" /></a></li>)}</ul> : <p className="text-sm text-muted">None</p>}</Section>
        <Section title="Missing information">{r.missingInfo.length ? <List items={r.missingInfo} /> : <p className="text-sm text-muted">None identified</p>}</Section>
        {r.uncertaintyNotices.length > 0 && <Notice tone="amber" title="Uncertainty notices"><List items={r.uncertaintyNotices} /></Notice>}
      </Card>
      <div className="flex items-center justify-between"><Link href="/reports" className="text-sm text-royal hover:underline">← All reports</Link><ReportActions filename={`report-${id}`} report={{ ...r }} /></div>
    </div>
  );
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  return (<><PageHeader title="Report" icon={<FileText className="h-5 w-5" />} /><RequireLogin><View id={id} /></RequireLogin></>);
}
