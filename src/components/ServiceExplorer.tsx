"use client";
import { useMemo, useState } from "react";
import { ChevronRight, ExternalLink, Search } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Card, DemoBanner, EmptyState, ErrorState, LinkButton, LoadingBlock, Notice, PageHeader, SourcePanel, StatusBadge, inputCls, Section, List, cx } from "@/components/ui";
import { useFetch } from "@/lib/client";
import { stateName } from "@/lib/constants";

type Service = {
  id: number; slug: string; title: string; category: string; description: string | null; eligibility: string | null; documents: string[]; steps: string[];
  feeInfo: string | null; officialUrl: string | null; verificationStatus: string; lastVerifiedAt: string | null; stateNote: string | null; vehicleCategories?: string[];
};

export function ServiceExplorer({ kind, title, description, icon, portalName, portalUrl }: { kind: "license" | "vehicle"; title: string; description: string; icon: React.ReactNode; portalName: string; portalUrl: string }) {
  const { state, vehicle } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const url = `/api/${kind}/services?${new URLSearchParams({ ...(state ? { state } : {}), ...(kind === "vehicle" && vehicle ? { vehicle } : {}) })}`;
  const { data, loading, error, reload } = useFetch<{ services: Service[] }>(url);
  const list = useMemo(() => (data?.services ?? []).filter((s) => `${s.title} ${s.description}`.toLowerCase().includes(q.toLowerCase())), [data, q]);
  const active = list.find((s) => s.slug === sel) ?? list[0];

  return (
    <>
      <PageHeader title={title} description={description} icon={icon} actions={<LinkButton href={portalUrl} external variant="accent" size="sm">Open {portalName}</LinkButton>} />
      <div className="mb-4 space-y-2">
        <DemoBanner />
        <Notice tone="blue" title="Guidance only">DriveLegal AI explains procedures and links you to the official portal. It does not submit applications or issue documents{state ? `. Selected: ${stateName(state)}` : ""}.</Notice>
      </div>
      <div className="relative mb-4 max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className={`${inputCls} pl-9`} placeholder="Search services…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search services" /></div>
      {loading ? <LoadingBlock rows={4} /> : error ? <ErrorState message={error} onRetry={reload} /> : !list.length ? (
        <EmptyState title="No services found" text={kind === "vehicle" && vehicle ? "No services match the selected vehicle category. Try 'All vehicles'." : "Try a different search."} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <ul className="space-y-1.5" aria-label="Services">
            {list.map((s) => (
              <li key={s.slug}><button onClick={() => setSel(s.slug)} className={cx("flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition", active?.slug === s.slug ? "border-royal bg-royal/10 font-semibold" : "border-line bg-surface hover:bg-surface2")}>
                <span>{s.title}</span><ChevronRight className="h-4 w-4 shrink-0 text-muted" /></button></li>
            ))}
          </ul>
          {active && (
            <Card className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-xl font-bold">{active.title}</h2><StatusBadge status={active.verificationStatus} /></div>
              {active.description && <p className="text-sm">{active.description}</p>}
              <Notice tone={active.stateNote ? "green" : "amber"} title={state ? `State-specific procedure — ${stateName(state)}` : "State-specific procedure"}>
                {active.stateNote ? <p>{active.stateNote}</p> : <p>{state ? `No verified procedure for ${stateName(state)} is stored yet. Open the official portal and select ${stateName(state)} — steps, forms and fees can differ by state.` : "Select a state in the bar above to see state-specific notes. Procedures can differ by state."}</p>}
              </Notice>
              {active.eligibility && <Section title="Eligibility"><p className="text-sm">{active.eligibility}</p></Section>}
              {active.documents.length > 0 && <Section title="Required documents"><List items={active.documents} /></Section>}
              {active.steps.length > 0 && (
                <Section title="Application steps"><ol className="space-y-2 text-sm">{active.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">{i + 1}</span><span>{s}</span></li>)}</ol></Section>
              )}
              <Section title="Fee information">{active.feeInfo ? <p className="text-sm">{active.feeInfo}</p> : <p className="text-sm text-muted">Fee not stated — verified fee data is not available. Check the official portal for the current fee in your state.</p>}</Section>
              <SourcePanel sources={[{ name: `${portalName} — official portal`, url: active.officialUrl ?? portalUrl }]} status={active.verificationStatus} lastVerifiedAt={active.lastVerifiedAt} />
              <div className="no-print flex flex-wrap gap-2"><LinkButton href={active.officialUrl ?? portalUrl} external>Continue on {portalName}<ExternalLink className="hidden" /></LinkButton><LinkButton href={`/assistant?q=${encodeURIComponent(`How do I do: ${active.title}${state ? " in " + stateName(state) : ""}?`)}`} variant="secondary">Ask the AI assistant</LinkButton></div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
