"use client";
import { Bell, BellOff } from "lucide-react";
import { useApp } from "@/components/Providers";
import { RequireLogin } from "@/components/Guards";
import { Button, Card, EmptyState, ErrorState, LinkButton, LoadingBlock, Notice, PageHeader, Badge } from "@/components/ui";
import { api, useFetch } from "@/lib/client";

type Item = { id: number; severity: "red" | "amber"; title: string; detail: string; documentId: number };

function Inner() {
  const { toast } = useApp();
  const { data, loading, error, reload } = useFetch<{ items: Item[]; settings: { documentExpiry: boolean }; note: string }>("/api/notifications");
  if (loading) return <LoadingBlock rows={2} />;
  if (error || !data) return <ErrorState message={error ?? "Failed"} onRetry={reload} />;
  return (
    <div className="space-y-3">
      {!data.settings.documentExpiry && <Notice tone="amber">Document-expiry notifications are turned off in Settings.</Notice>}
      {!data.items.length ? <EmptyState icon={<BellOff className="h-8 w-8" />} title="You're all caught up" text="Reminders appear here 30, 7 and 1 day(s) before a saved document expires, and after it expires." action={<LinkButton href="/documents" variant="secondary" size="sm">Manage documents</LinkButton>} /> : data.items.map((n) => (
        <Card key={n.id} className="flex items-start justify-between gap-3"><div><Badge tone={n.severity}>{n.severity === "red" ? "Expired" : "Expiring"}</Badge><p className="mt-1 font-semibold">{n.title}</p><p className="text-sm text-muted">{n.detail}</p></div>
          <Button size="sm" variant="secondary" onClick={async () => { await api("/api/notifications", { body: { id: n.id } }); toast("Dismissed.", "success"); reload(); }}>Dismiss</Button></Card>
      ))}
      <p className="text-xs text-muted">{data.note}</p>
    </div>
  );
}
export default function NotificationsPage() {
  return (<><PageHeader title="Notifications" icon={<Bell className="h-5 w-5" />} description="Reminders generated from your own saved documents." /><RequireLogin><Inner /></RequireLogin></>);
}
