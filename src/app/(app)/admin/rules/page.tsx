"use client";
import { useState } from "react";
import { BookOpenCheck, Check, X } from "lucide-react";
import { RequireStaff } from "@/components/Guards";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingBlock, Notice, PageHeader, StatusBadge, inputCls } from "@/components/ui";
import { api, useFetch } from "@/lib/client";
import { REVIEW_ENTITIES } from "@/lib/admin-config";

/* eslint-disable @typescript-eslint/no-explicit-any */
const SHOW: Record<string, string[]> = {
  rule: ["legalReference", "originalText", "explanation", "conditions", "exceptions", "effectiveFrom", "sourceUrl", "extractedBy", "version"],
  penalty: ["legalSection", "baseAmount", "minAmount", "repeatAmount", "additionalAmount", "additionalUnit", "imprisonment", "repeatConditions", "effectiveFrom", "sourceUrl", "notes"],
  protected_area: ["classification", "district", "authority", "vehicleEntry", "permitInfo", "bookingInfo", "timings", "entryConditions", "officialUrl", "notes"],
  permit: ["permitType", "legalReference", "description", "feeInfo", "officialUrl"],
  location: ["type", "district", "permitInfo", "restrictions", "officialUrl"],
  license_service: ["category", "description", "eligibility", "feeInfo", "officialUrl"],
  vehicle_service: ["category", "description", "eligibility", "feeInfo", "officialUrl"],
};
const titleOf = (r: any) => r.title ?? r.violationName ?? r.name;

function Inner() {
  const { toast } = useApp();
  const [entity, setEntity] = useState("rule");
  const [status, setStatus] = useState("pending");
  const { data, loading, error, reload } = useFetch<{ rows: any[]; canReview: boolean }>(`/api/admin/review?entity=${entity}&status=${status}`);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function act(id: number, action: string) {
    setBusy(id);
    try { await api("/api/admin/rules/approve", { body: { entityType: entity, id, action, note: notes[id] || undefined } }); toast(`Record ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "updated"}.`, "success"); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); }
    finally { setBusy(null); }
  }
  return (
    <>
      <Notice tone="blue" title="Human approval rule">AI-extracted and newly entered legal records stay <b>pending</b> until a Legal Reviewer approves them against the official source. Only approved records are shown as Verified and used in fine calculations. Editing an approved record resets it to pending.</Notice>
      <div className="my-4 flex flex-wrap gap-3">
        <select className={`${inputCls} !w-auto`} value={entity} onChange={(e) => setEntity(e.target.value)} aria-label="Record type">{Object.entries(REVIEW_ENTITIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select className={`${inputCls} !w-auto`} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status"><option value="pending">Pending review</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="outdated">Outdated</option><option value="all">All</option></select>
      </div>
      {data && !data.canReview && <Notice tone="amber">You can view the queue, but only Legal Reviewers and Super Admins can approve or reject.</Notice>}
      {loading ? <LoadingBlock /> : error ? <ErrorState message={error} onRetry={reload} /> : !data?.rows.length ? <EmptyState icon={<BookOpenCheck className="h-8 w-8" />} title="Nothing in this queue" /> : (
        <div className="mt-3 space-y-3">{data.rows.map((r) => (
          <Card key={r.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={r.verificationStatus} /><Badge>{r.stateName ?? "Central"}</Badge>{r.extractedBy && r.extractedBy !== "manual" && <Badge tone={r.extractedBy === "seed" ? "amber" : "teal"}>{r.extractedBy === "seed" ? "demo seed" : `${r.extractedBy}-extracted`}</Badge>}{r.isDemo && <Badge tone="amber">Demo data</Badge>}</div>
            <h3 className="font-semibold">{titleOf(r)}</h3>
            <dl className="grid gap-2 text-sm md:grid-cols-2">{(SHOW[entity] ?? []).map((k) => <div key={k}><dt className="text-xs font-semibold uppercase text-muted">{k}</dt><dd className="break-words">{r[k] == null || r[k] === "" ? <span className="italic text-muted">empty</span> : String(r[k])}</dd></div>)}</dl>
            {data.canReview && (
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <input className={`${inputCls} !w-auto min-w-[14rem] flex-1`} placeholder="Reviewer note (required to reject)" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} aria-label="Reviewer note" />
                <Button size="sm" loading={busy === r.id} disabled={r.verificationStatus === "verified"} onClick={() => act(r.id, "approve")}><Check className="h-4 w-4" />Approve</Button>
                <Button size="sm" variant="danger" disabled={r.verificationStatus === "rejected"} onClick={() => act(r.id, "reject")}><X className="h-4 w-4" />Reject</Button>
                <Button size="sm" variant="secondary" disabled={r.verificationStatus === "outdated"} onClick={() => act(r.id, "outdated")}>Mark outdated</Button>
                {r.verificationStatus !== "pending" && <Button size="sm" variant="ghost" onClick={() => act(r.id, "reset")}>Reset to pending</Button>}
              </div>
            )}
          </Card>))}</div>
      )}
    </>
  );
}
export default function RulesReviewPage() {
  return (<><PageHeader title="Legal Rule Review" icon={<BookOpenCheck className="h-5 w-5" />} description="Compare each record with its official source, then approve, reject or mark it outdated." /><RequireStaff><Inner /></RequireStaff></>);
}
