"use client";
import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  Calculator,
  FileCheck,
  GitCompareArrows,
  SearchCheck,
  ShieldCheck,
  Building2,
  TreePine,
  ArrowRight,
  TrendingUp,
  MapPin,
  Compass,
  AlertTriangle,
  Car,
} from "lucide-react";
import {
  Card,
  GlassPanel,
  ErrorState,
  LinkButton,
  LoadingBlock,
  PageHeader,
  DemoBanner,
  AnimatedCounter,
  PremiumDashboardCard,
  Badge,
  cx,
} from "@/components/ui";
import { useApp } from "@/components/Providers";
import { useFetch } from "@/lib/client";
import { stateName, VEHICLE_CATEGORIES } from "@/lib/constants";

// Dynamically load 3D Vehicle viewer on dashboard
const VehicleModel3D = dynamic(() => import("@/components/3d/VehicleModel3D"), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full flex items-center justify-center bg-surface-2 rounded-2xl">
      <span className="text-xs text-muted">Loading 3D Vehicle Model…</span>
    </div>
  ),
});

type Dash = {
  records: Record<string, Record<string, number>>;
  totals: { sources: number; documents: number; neverChecked: number; stateCoverage: Record<string, number> };
  findings: { gaps: Record<string, number>; conflicts: Record<string, number> };
  coverage: { code: string; name: string; total: number; verified: number; level: string }[];
  userDocuments: Record<string, number> | null;
};

const SC: Record<string, string> = { verified: "#14b8a6", pending: "#f59e0b", rejected: "#ef4444", outdated: "#8b5cf6" };
const LC: Record<string, string> = { verified: "#14b8a6", partial: "#3b82f6", unverified: "#f59e0b", central_only: "#64748b" };
const LN: Record<string, string> = {
  verified: "Verified",
  partial: "Partly verified",
  unverified: "Unverified (demo)",
  central_only: "Central law only",
};

export default function DashboardPage() {
  const { t, user, state, vehicle, setVehicle } = useApp();
  const { data, loading, error, reload } = useFetch<Dash>("/api/dashboard");
  const [activeTab, setActiveTab] = useState<"overview" | "states" | "findings">("overview");

  if (loading)
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.dashboard")} />
        <LoadingBlock rows={4} />
      </div>
    );
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;

  const statusData = (key: string) =>
    Object.entries(data.records[key] ?? {}).map(([name, value]) => ({ name, value }));

  const combined: Record<string, number> = {};
  ["rules", "penalties", "areas", "locations", "licenceServices", "vehicleServices", "permits"].forEach((k) =>
    Object.entries(data.records[k] ?? {}).forEach(([s, n]) => (combined[s] = (combined[s] ?? 0) + n))
  );

  const pie = Object.entries(combined).map(([name, value]) => ({ name, value }));
  const total = pie.reduce((a, b) => a + b.value, 0);
  const cov = Object.entries(data.totals.stateCoverage).map(([k, v]) => ({ name: LN[k] ?? k, key: k, value: v }));

  const findingsBar = [...Object.entries(data.findings.gaps).map(([k, v]) => ({ name: k, gaps: v, conflicts: 0 }))];
  Object.entries(data.findings.conflicts).forEach(([k, v]) => {
    const e = findingsBar.find((x) => x.name === k);
    if (e) e.conflicts = v;
    else findingsBar.push({ name: k, gaps: 0, conflicts: v });
  });

  const selected = state ? data.coverage.find((c) => c.code === state) : null;
  const verifiedCount = combined.verified ?? 0;
  const pendingCount = combined.pending ?? 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Dashboard Cockpit Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-royal text-white">
              <Compass className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">{t("nav.dashboard")}</h1>
          </div>
          <p className="mt-1 text-sm text-muted">
            Real-time transport intelligence, database record metrics, statutory integrity and personal compliance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <LinkButton href="/fines" size="sm" variant="accent" className="font-semibold shadow-md">
            <Calculator className="h-4 w-4" />
            <span>{t("nav.fines")}</span>
          </LinkButton>
          <LinkButton href="/assistant" size="sm" variant="secondary">
            <span>AI Legal Query</span>
          </LinkButton>
        </div>
      </div>

      <DemoBanner />

      {/* Top 4 Cockpit Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PremiumDashboardCard
          title="Total Stored Records"
          value={<AnimatedCounter value={total} />}
          subtitle={`${verifiedCount} human-verified records`}
          icon={FileCheck}
          tone="blue"
        />
        <PremiumDashboardCard
          title="Statutory Rules & Fines"
          value={
            <AnimatedCounter
              value={
                (data.records.rules ? Object.values(data.records.rules).reduce((a, b) => a + b, 0) : 0) +
                (data.records.penalties ? Object.values(data.records.penalties).reduce((a, b) => a + b, 0) : 0)
              }
            />
          }
          subtitle={`${(data.records.rules?.verified ?? 0) + (data.records.penalties?.verified ?? 0)} verified by legal reviewers`}
          icon={Calculator}
          tone="teal"
        />
        <PremiumDashboardCard
          title="Detected Information Gaps"
          value={<AnimatedCounter value={Object.values(data.findings.gaps).reduce((a, b) => a + b, 0)} />}
          subtitle="Omissions identified for gazette review"
          icon={SearchCheck}
          tone="amber"
        />
        <PremiumDashboardCard
          title="Potential Legal Conflicts"
          value={<AnimatedCounter value={Object.values(data.findings.conflicts).reduce((a, b) => a + b, 0)} />}
          subtitle="Central vs State notification variances"
          icon={GitCompareArrows}
          tone="cyan"
        />
      </div>

      {/* Hero 3D Vehicle & Compliance Widget */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* 3D Interactive Vehicle Preview Card */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface to-surface-2 p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">Vehicle Class Simulation</span>
              <h3 className="text-lg font-bold text-fg">Active Category: {VEHICLE_CATEGORIES.find((v) => v.slug === vehicle)?.name ?? "Private Car"}</h3>
            </div>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-fg focus:border-accent focus:outline-none"
            >
              {VEHICLE_CATEGORIES.map((v) => (
                <option key={v.slug} value={v.slug}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <VehicleModel3D category={vehicle || "private-car"} className="h-52 w-full" />

          <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-4 text-xs text-muted">
            <span>Rotating 3D interactive preview</span>
            <Link href="/vehicle" className="font-semibold text-electric hover:underline flex items-center gap-1">
              <span>View Vehicle Services</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Citizen Compliance Tracker Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-teal" />
                <h3 className="text-lg font-bold text-fg">Citizen Document Vault</h3>
              </div>
              <Badge tone="teal">DPDP Compliant</Badge>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Automated expiry tracking with 30-day, 7-day, and 1-day reminders. Identifying numbers are masked to the last 4 characters.
            </p>

            <div className="mt-5 space-y-2.5">
              {!user ? (
                <div className="rounded-2xl border border-dashed border-line p-5 text-center bg-surface-2/40">
                  <p className="text-xs text-muted mb-3">Log in to track your Driving Licence, RC, Insurance, PUC, and Fitness validities.</p>
                  <LinkButton href="/login" size="sm" variant="accent">
                    Log in to Vault
                  </LinkButton>
                </div>
              ) : data.userDocuments && data.userDocuments.total ? (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(data.userDocuments)
                    .filter(([k]) => k !== "total")
                    .map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-line bg-surface-2 p-3">
                        <span className="text-xs text-muted capitalize">{k}</span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-fg">{v}</span>
                          <span className="text-[10px] text-muted">saved</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-line p-5 text-center bg-surface-2/40">
                  <p className="text-xs text-muted mb-3">No compliance documents registered yet.</p>
                  <LinkButton href="/compliance" size="sm" variant="primary">
                    Add Document to Tracker
                  </LinkButton>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-4 flex items-center justify-between text-xs">
            <span className="text-muted">Proactive Alerts Active</span>
            <Link href="/compliance" className="font-semibold text-electric hover:underline flex items-center gap-1">
              <span>Manage Documents</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Verification Status Breakdown */}
        <Card className="rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-fg">Verification Status (All Records)</h3>
              <p className="text-xs text-muted">Proportion of verified vs draft records across all modules</p>
            </div>
            <Badge tone="blue">{total} Total</Badge>
          </div>
          <div className="h-64" role="img" aria-label="Pie chart of verification status">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4} label>
                  {pie.map((p) => (
                    <Cell key={p.name} fill={SC[p.name] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#111e35", borderColor: "rgba(148,163,184,0.2)", borderRadius: "12px", color: "#f8fafc" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* State Data Coverage (36 States & UTs) */}
        <Card className="rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-fg">State Coverage Distribution (36 States / UTs)</h3>
              <p className="text-xs text-muted">Actual jurisdictional breakdown recorded in the database</p>
            </div>
          </div>
          <div className="h-64" role="img" aria-label="Bar chart of state coverage">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cov}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8292ab" }} />
                <YAxis allowDecimals={false} tick={{ fill: "#8292ab" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111e35", borderColor: "rgba(148,163,184,0.2)", borderRadius: "12px", color: "#f8fafc" }}
                />
                <Bar dataKey="value" name="States / UTs" radius={[8, 8, 0, 0]}>
                  {cov.map((c) => (
                    <Cell key={c.key} fill={LC[c.key] ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Findings: Gaps & Conflicts */}
        <Card className="rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-fg">Statutory Gaps &amp; Conflict Findings</h3>
              <p className="text-xs text-muted">Identified discrepancies awaiting human legal review</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={findingsBar}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8292ab" }} />
                <YAxis allowDecimals={false} tick={{ fill: "#8292ab" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111e35", borderColor: "rgba(148,163,184,0.2)", borderRadius: "12px", color: "#f8fafc" }}
                />
                <Legend />
                <Bar dataKey="gaps" name="Information Gaps" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="conflicts" name="Statutory Conflicts" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Selected State Drilldown / Modules Registry */}
        <Card className="rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-fg">{selected ? `State Drilldown: ${stateName(state)}` : "Records by Legal Module"}</h3>
            {selected && <Badge tone="teal">Active Jurisdiction</Badge>}
          </div>
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-line bg-surface-2 p-4">
                <span className="text-xs text-muted block mb-1">State-level Records Stored</span>
                <span className="text-2xl font-black text-fg">{selected.total}</span>
                <span className="text-xs text-teal font-medium ml-2">({selected.verified} verified)</span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                {selected.total === 0
                  ? "Only Central law (MV Act 1988) is currently loaded for this state. State notifications and regional RTO rules have not been loaded."
                  : "State-specific rules are stored. Unverified records remain in draft until reviewed against official state transport gazettes."}
              </p>
              <div className="flex gap-2">
                <LinkButton href={`/laws?state=${encodeURIComponent(state)}`} size="sm" variant="accent">
                  Explore {stateName(state)} Laws
                </LinkButton>
                <LinkButton href={`/fines?state=${encodeURIComponent(state)}`} size="sm" variant="secondary">
                  Compare Penalties
                </LinkButton>
              </div>
            </div>
          ) : (
            <ul className="space-y-2.5 text-xs">
              {[
                ["Statutory Rules", "rules"],
                ["Penalties & Fines", "penalties"],
                ["Protected Forest Areas", "areas"],
                ["Travel Locations", "locations"],
                ["Commercial Permits", "permits"],
                ["Driving Licence Services", "licenceServices"],
                ["Vehicle Services", "vehicleServices"],
              ].map(([l, k]) => (
                <li key={k} className="flex items-center justify-between rounded-xl border border-line/60 bg-surface-2/60 p-2.5">
                  <span className="font-semibold text-fg">{l}</span>
                  <span className="text-muted">{statusData(k).map((s) => `${s.value} ${s.name}`).join(" · ") || "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
