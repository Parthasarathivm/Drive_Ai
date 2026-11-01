"use client";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  Search,
  CheckCircle2,
  Printer,
  FileCheck2,
  Clock,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Building2,
  Bot,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import {
  Card,
  DemoBanner,
  EmptyState,
  ErrorState,
  LinkButton,
  Button,
  LoadingBlock,
  Notice,
  PageHeader,
  SourcePanel,
  StatusBadge,
  Badge,
  inputCls,
  Section,
  cx,
} from "@/components/ui";
import { useFetch } from "@/lib/client";
import { stateName, VEHICLE_CATEGORIES } from "@/lib/constants";

type Service = {
  id: number;
  slug: string;
  title: string;
  category: string;
  description: string | null;
  eligibility: string | null;
  documents: string[];
  steps: string[];
  feeInfo: string | null;
  officialUrl: string | null;
  verificationStatus: string;
  lastVerifiedAt: string | null;
  stateNote: string | null;
  vehicleCategories?: string[];
};

export function ServiceExplorer({
  kind,
  title,
  description,
  icon,
  portalName,
  portalUrl,
}: {
  kind: "license" | "vehicle";
  title: string;
  description: string;
  icon: React.ReactNode;
  portalName: string;
  portalUrl: string;
}) {
  const { state, vehicle, setVehicle } = useApp();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const url = `/api/${kind}/services?${new URLSearchParams({
    ...(state ? { state } : {}),
    ...(kind === "vehicle" && vehicle ? { vehicle } : {}),
  })}`;

  const { data, loading, error, reload } = useFetch<{ services: Service[] }>(url);
  const list = useMemo(
    () =>
      (data?.services ?? []).filter((s) =>
        `${s.title} ${s.description ?? ""}`.toLowerCase().includes(q.toLowerCase())
      ),
    [data, q]
  );
  const active = list.find((s) => s.slug === sel) ?? list[0];

  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }));
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} className="no-print">
              <Printer className="h-4 w-4" />
              <span>Print Guide</span>
            </Button>
            <LinkButton href={portalUrl} external variant="accent" size="sm">
              <span>Open {portalName}</span>
            </LinkButton>
          </div>
        }
      />

      <div className="space-y-3">
        <DemoBanner />
        <Notice tone="blue" title="Independent Service Guidance">
          DriveLegal AI explains legal steps, document prerequisites, and links you to official Parivahan portals. It does not issue certificates or charge government fees{state ? `. Jurisdiction: ${stateName(state)}` : ""}.
        </Notice>
      </div>

      {/* Vehicle Category Filter Bar for Vehicle Services */}
      {kind === "vehicle" && (
        <div className="no-print flex flex-wrap items-center gap-2 border-b border-line pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted">Vehicle Filter:</span>
          <button
            onClick={() => setVehicle("")}
            className={cx(
              "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
              !vehicle ? "bg-royal text-white shadow-sm" : "bg-surface-2 text-muted hover:text-fg"
            )}
          >
            All Classes
          </button>
          {VEHICLE_CATEGORIES.map((v) => (
            <button
              key={v.slug}
              onClick={() => setVehicle(v.slug)}
              className={cx(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                vehicle === v.slug ? "bg-royal text-white shadow-sm" : "bg-surface-2 text-muted hover:text-fg"
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="relative max-w-md no-print">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
        <input
          className={`${inputCls} pl-10`}
          placeholder={`Search ${kind === "license" ? "licence" : "vehicle"} procedures…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search procedures"
        />
      </div>

      {loading ? (
        <LoadingBlock rows={4} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !list.length ? (
        <EmptyState
          title="No services found"
          text={
            kind === "vehicle" && vehicle
              ? "No services match the selected vehicle category. Try 'All Classes' or clear the search filter."
              : "Try a different search query."
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          {/* Sidebar Procedure Selector */}
          <div className="space-y-2 no-print">
            <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">Available Procedures ({list.length})</span>
            <ul className="space-y-1.5" aria-label="Procedures list">
              {list.map((s) => (
                <li key={s.slug}>
                  <button
                    onClick={() => setSel(s.slug)}
                    className={cx(
                      "flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm transition-all",
                      active?.slug === s.slug
                        ? "border-accent bg-royal/10 font-bold text-electric shadow-sm"
                        : "border-line bg-surface text-fg hover:border-line/80 hover:bg-surface-2"
                    )}
                  >
                    <span className="line-clamp-1">{s.title}</span>
                    <ChevronRight className={cx("h-4 w-4 shrink-0 transition-transform", active?.slug === s.slug ? "text-accent translate-x-0.5" : "text-muted")} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Active Procedure Detail Card */}
          {active && (
            <Card className="space-y-6 rounded-3xl p-6 sm:p-8">
              {/* Procedure Title & Status */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">Standard Operating Procedure</span>
                  <h2 className="text-2xl font-black text-fg tracking-tight">{active.title}</h2>
                </div>
                <StatusBadge status={active.verificationStatus} />
              </div>

              {active.description && (
                <p className="text-sm leading-relaxed text-muted">{active.description}</p>
              )}

              {/* State-specific Notice */}
              <Notice
                tone={active.stateNote ? "green" : "amber"}
                title={state ? `State Jurisdiction — ${stateName(state)}` : "State Jurisdiction Notes"}
              >
                {active.stateNote ? (
                  <p className="text-xs leading-relaxed">{active.stateNote}</p>
                ) : (
                  <p className="text-xs leading-relaxed">
                    {state
                      ? `No custom state amendment is stored for ${stateName(state)}. National standards apply. Confirm with the local RTO.`
                      : "Procedures, forms, and fees can vary by state. Select your State in the top bar to filter state-specific guidance."}
                  </p>
                )}
              </Notice>

              {/* Eligibility Criteria */}
              {active.eligibility && (
                <div className="rounded-2xl border border-line bg-surface-2/60 p-5">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-fg">
                    <CheckCircle2 className="h-4 w-4 text-teal" />
                    <span>Eligibility Requirements</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{active.eligibility}</p>
                </div>
              )}

              {/* Step-by-Step Visual Timeline */}
              {active.steps.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Application Progress Timeline</h3>
                  <div className="space-y-3">
                    {active.steps.map((st, i) => (
                      <div key={i} className="flex items-start gap-3.5 rounded-2xl border border-line/70 bg-surface p-4 shadow-sm">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-royal to-electric text-xs font-black text-white shadow-md">
                          {i + 1}
                        </span>
                        <div className="text-xs leading-relaxed text-fg pt-0.5">
                          {st}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Document Checklist with Checkboxes */}
              {active.documents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Required Documents Checklist</h3>
                    <span className="text-xs text-muted">
                      {Object.values(checkedDocs).filter(Boolean).length} of {active.documents.length} ready
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {active.documents.map((doc, idx) => {
                      const isReady = !!checkedDocs[doc];
                      return (
                        <label
                          key={idx}
                          className={cx(
                            "flex items-start gap-3 rounded-xl border p-3 text-xs cursor-pointer transition select-none",
                            isReady ? "border-teal/50 bg-teal/5 text-fg font-medium" : "border-line bg-surface text-muted hover:border-line/90"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isReady}
                            onChange={() => toggleDoc(doc)}
                            className="mt-0.5 h-4 w-4 rounded text-teal focus:ring-teal"
                          />
                          <span className={cx(isReady && "text-fg")}>{doc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fee Information Section */}
              <div className="rounded-2xl border border-line bg-surface p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">Official Fee Schedule</span>
                {active.feeInfo ? (
                  <p className="text-sm font-semibold text-fg">{active.feeInfo}</p>
                ) : (
                  <p className="text-xs text-muted leading-relaxed">
                    Fee not stated — unverified fee data is excluded from calculation. Check the official {portalName} portal for the exact fee applicable in your state.
                  </p>
                )}
              </div>

              {/* Source & Verification Metadata */}
              <SourcePanel
                sources={[{ name: `${portalName} — Official Government Portal`, url: active.officialUrl ?? portalUrl }]}
                status={active.verificationStatus}
                lastVerifiedAt={active.lastVerifiedAt}
              />

              {/* CTA Action Buttons */}
              <div className="no-print flex flex-wrap gap-3 pt-2">
                <LinkButton href={active.officialUrl ?? portalUrl} external variant="accent" size="md" className="font-bold shadow-md">
                  <span>Proceed on Official {portalName}</span>
                </LinkButton>
                <LinkButton
                  href={`/assistant?q=${encodeURIComponent(`How do I apply for ${active.title}${state ? " in " + stateName(state) : ""}?`)}`}
                  variant="secondary"
                  size="md"
                >
                  <Bot className="h-4 w-4 text-electric" />
                  <span>Ask AI Assistant</span>
                </LinkButton>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
