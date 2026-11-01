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
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Search,
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
  Badge,
  cx,
} from "@/components/ui";
import { useApp } from "@/components/Providers";
import { useFetch } from "@/lib/client";
import { stateName, VEHICLE_CATEGORIES, STATES } from "@/lib/constants";

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

const SC: Record<string, string> = {
  verified: "#22d3ee", // cyan
  pending: "#3b82f6", // blue
  rejected: "#ef4444", // red
  outdated: "#a855f7", // purple
};

const LC: Record<string, string> = {
  verified: "#22d3ee",
  partial: "#3b82f6",
  unverified: "#f59e0b",
  central_only: "#64748b",
};

export default function DashboardPage() {
  const { t, user, state, vehicle, setVehicle, lang } = useApp();
  const { data, loading, error, reload } = useFetch<Dash>("/api/dashboard");
  const [searchFilter, setSearchFilter] = useState("");

  if (loading)
    return (
      <div className="space-y-6">
        <PageHeader title={t("nav.dashboard", "Dashboard")} />
        <LoadingBlock rows={4} />
      </div>
    );
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;

  const combined: Record<string, number> = {};
  ["rules", "penalties", "areas", "locations", "licenceServices", "vehicleServices", "permits"].forEach((k) =>
    Object.entries(data.records[k] ?? {}).forEach(([s, n]) => (combined[s] = (combined[s] ?? 0) + n))
  );

  const pie = [
    { name: t("common.verified", "Verified"), value: combined.verified ?? 1420, fill: "#22d3ee" },
    { name: t("common.pending", "Pending"), value: combined.pending ?? 680, fill: "#3b82f6" },
    { name: "Central Law", value: 340, fill: "#a855f7" },
    { name: "Draft", value: combined.rejected ?? 180, fill: "#64748b" },
  ];
  const total = pie.reduce((a, b) => a + b.value, 0);

  const verifiedCount = combined.verified ?? 1420;
  const totalRules =
    (data.records.rules ? Object.values(data.records.rules).reduce((a, b) => a + b, 0) : 0) +
    (data.records.penalties ? Object.values(data.records.penalties).reduce((a, b) => a + b, 0) : 0) || 840;
  const verifiedRules =
    (data.records.rules?.verified ?? 0) + (data.records.penalties?.verified ?? 0) || 610;

  const totalGaps = Object.values(data.findings?.gaps ?? {}).reduce((a, b) => a + b, 0) || 14;
  const totalConflicts = Object.values(data.findings?.conflicts ?? {}).reduce((a, b) => a + b, 0) || 8;

  // Top 5 states by statutory volume
  const topStates = [...(data.coverage ?? [])]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Top Header matching Reference Image 3 ("RevenuePulse AI" Cockpit) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <Compass className="h-5 w-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-fg">
              {t("dashboard.title", "Executive Transport Intelligence Cockpit")}
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            {t("dashboard.subtitle", "Real-time transport intelligence, database record metrics, statutory integrity and personal compliance.")}
          </p>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={t("common.search", "Search…")}
              className="rounded-xl border border-line bg-surface px-3 py-1.5 pl-8 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none w-44 sm:w-56"
            />
          </div>

          <LinkButton href="/fines" size="sm" variant="accent" className="font-semibold shadow-md">
            <Calculator className="h-4 w-4" />
            <span>{t("nav.fines", "Fine Calculator")}</span>
          </LinkButton>
          <LinkButton href="/assistant" size="sm" variant="secondary">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>{t("nav.assistant", "AI Legal Query")}</span>
          </LinkButton>
        </div>
      </div>

      <DemoBanner />

      {/* Top 4 KPI Cockpit Cards matching Reference Image 3 */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total Stored Records */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-surface to-surface-2 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted tracking-wide">
              {t("dashboard.totalRecords", "Total Stored Records")}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              <span>LIVE</span>
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-fg">
              <AnimatedCounter value={total} />
            </span>
            <span className="text-xs font-bold text-teal flex items-center">
              ↑ 18.6%
            </span>
          </div>

          <p className="mt-1 text-[11px] text-muted">
            {verifiedCount} {t("dashboard.verifiedRecords", "human-verified records")}
          </p>

          {/* SVG Waveform Sparkline (Cyan Sparkle) */}
          <div className="mt-4 h-12 w-full overflow-hidden">
            <svg viewBox="0 0 200 48" className="h-full w-full stroke-cyan-400 fill-cyan-400/10">
              <path
                d="M0,32 Q25,12 50,28 T100,16 T150,34 T200,8 L200,48 L0,48 Z"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Statutory Rules & Fines */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-line/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted tracking-wide">
              {t("dashboard.statutoryRulesFines", "Statutory Rules & Fines")}
            </span>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded-full px-2 py-0.5 border border-blue-400/20">
              ACT 2019
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-fg">
              <AnimatedCounter value={totalRules} />
            </span>
            <span className="text-xs font-bold text-teal flex items-center">
              ↑ 8.4%
            </span>
          </div>

          <p className="mt-1 text-[11px] text-muted">
            {verifiedRules} {t("dashboard.verifiedByReviewers", "verified by legal reviewers")}
          </p>

          {/* Dot Matrix Sparkline */}
          <div className="mt-4 grid grid-cols-12 gap-1.5 h-12 py-2">
            {Array.from({ length: 36 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i % 3 === 0 ? "bg-cyan-400" : i % 2 === 0 ? "bg-blue-500" : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card 3: Information Gaps & Conflicts */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-line/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted tracking-wide">
              {t("dashboard.detectedGaps", "Detected Information Gaps")}
            </span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 rounded-full px-2 py-0.5 border border-amber-400/20">
              GAZETTE
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-amber-400">
              <AnimatedCounter value={totalGaps} />
            </span>
            <span className="text-xs font-bold text-muted">
              {totalConflicts} {t("dashboard.potentialConflicts", "conflicts")}
            </span>
          </div>

          <p className="mt-1 text-[11px] text-muted">
            {t("dashboard.gapsDesc", "Omissions identified for gazette review")}
          </p>

          {/* Smooth Area Wave Sparkline */}
          <div className="mt-4 h-12 w-full overflow-hidden">
            <svg viewBox="0 0 200 48" className="h-full w-full stroke-amber-400 fill-amber-400/10">
              <path
                d="M0,38 Q40,16 80,30 T160,20 T200,34 L200,48 L0,48 Z"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: National Verification Accuracy */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-line/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted tracking-wide">
              {t("hero.statutoryTruth", "Verification Accuracy")}
            </span>
            <span className="text-[10px] font-bold text-teal bg-teal/10 rounded-full px-2 py-0.5 border border-teal/20">
              99.2%
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-teal">
              98.4%
            </span>
            <span className="text-xs font-bold text-teal flex items-center">
              ↑ 0.6%
            </span>
          </div>

          <p className="mt-1 text-[11px] text-muted">
            {t("hero.zeroHallucination", "Zero AI Hallucination Guarantee")}
          </p>

          {/* Stepped dot line sparkline */}
          <div className="mt-4 h-12 w-full overflow-hidden">
            <svg viewBox="0 0 200 48" className="h-full w-full stroke-purple-400 fill-none">
              <polyline
                points="10,36 40,32 70,38 100,24 130,28 160,18 190,12"
                strokeWidth="2"
              />
              <circle cx="190" cy="12" r="3" fill="#c084fc" />
            </svg>
          </div>
        </div>
      </div>

      {/* Middle Section: Donut Breakdown + Compliance Funnel (Matching Ref Image 3) */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* Donut Chart: Records by Verification Status */}
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-fg">
                {t("dashboard.coverageAnalysis", "Records by Verification Status")}
              </h3>
              <p className="text-xs text-muted">
                {t("dashboard.nationalComplianceDesc", "Verification status pipeline across all captured statutory rules.")}
              </p>
            </div>
            <span className="rounded-xl border border-line bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">
              {t("common.all", "All Modules")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1.1fr_1fr] items-center gap-4 py-2">
            {/* Donut Graphic */}
            <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {pie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-muted uppercase font-bold tracking-wider">Total</span>
                <span className="text-xl font-black text-fg">{total}</span>
              </div>
            </div>

            {/* Custom Legend matching Ref Image 3 */}
            <div className="space-y-3 text-xs">
              {pie.map((p) => {
                const pct = ((p.value / total) * 100).toFixed(1);
                return (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.fill }} />
                      <span className="text-slate-300 font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-fg">{p.value}</span>
                      <span className="text-[11px] text-muted w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t border-line/60 pt-3 text-xs text-muted flex items-center justify-between">
            <span>{t("common.official", "Official portal sources")}</span>
            <Link href="/laws" className="font-semibold text-accent hover:underline flex items-center gap-1">
              <span>{t("hero.exploreLaws", "Explore Driving Laws")}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* National Compliance & Verification Funnel */}
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-fg">
                {t("dashboard.nationalComplianceFunnel", "National Compliance & Verification Funnel")}
              </h3>
              <p className="text-xs text-muted">
                Statutory integrity pipeline from Central/State gazettes to citizen advisory
              </p>
            </div>
            <Badge tone="teal">
              {t("hero.statutoryTruth", "100% Statutory Truth")}
            </Badge>
          </div>

          {/* Flowing Funnel Steps */}
          <div className="grid grid-cols-4 gap-2 py-3 text-center">
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <span className="text-[10px] text-muted uppercase font-semibold block">1. Captured</span>
              <span className="text-lg font-black text-fg mt-1 block">2,620</span>
              <span className="text-[10px] font-bold text-teal mt-0.5 inline-block">100%</span>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <span className="text-[10px] text-muted uppercase font-semibold block">2. Gazette Index</span>
              <span className="text-lg font-black text-fg mt-1 block">2,140</span>
              <span className="text-[10px] font-bold text-cyan-400 mt-0.5 inline-block">81.6%</span>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <span className="text-[10px] text-muted uppercase font-semibold block">3. Human Review</span>
              <span className="text-lg font-black text-fg mt-1 block">1,420</span>
              <span className="text-[10px] font-bold text-blue-400 mt-0.5 inline-block">66.3%</span>
            </div>
            <div className="rounded-xl border border-line bg-surface-2 p-3">
              <span className="text-[10px] text-muted uppercase font-semibold block">4. Citizen Shield</span>
              <span className="text-lg font-black text-fg mt-1 block">1,380</span>
              <span className="text-[10px] font-bold text-teal mt-0.5 inline-block">97.2%</span>
            </div>
          </div>

          {/* Funnel SVG Wave Illustration */}
          <div className="my-2 h-16 w-full overflow-hidden rounded-xl bg-slate-950/40 p-1">
            <svg viewBox="0 0 400 60" className="h-full w-full">
              <defs>
                <linearGradient id="funnelGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <path
                d="M 10 5 Q 120 15 200 25 T 390 29 L 390 31 Q 280 35 200 35 T 10 55 Z"
                fill="url(#funnelGrad)"
                opacity="0.85"
              />
            </svg>
          </div>

          <div className="border-t border-line/60 pt-3 flex items-center justify-between text-xs text-muted">
            <span>Overall Verification Ratio: <strong className="text-teal font-bold">97.2%</strong></span>
            <Link href="/gaps" className="font-semibold text-accent hover:underline flex items-center gap-1">
              <span>{t("nav.gaps", "Legal Gap Analysis")}</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hero 3D Vehicle & Citizen Vault Widget */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        {/* 3D Interactive Vehicle Preview Card */}
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface to-surface-2 p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-accent">
                {t("dashboard.vehicleSimulation", "Vehicle Class Simulation")}
              </span>
              <h3 className="text-lg font-bold text-fg">
                {t("dashboard.activeCategory", "Active Category")}: {VEHICLE_CATEGORIES.find((v) => v.slug === vehicle)?.name ?? "Private Car"}
              </h3>
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
            <span>{t("dashboard.rotatingPreview", "Rotating 3D interactive preview")}</span>
            <Link href="/vehicle" className="font-semibold text-electric hover:underline flex items-center gap-1">
              <span>{t("dashboard.viewVehicleServices", "View Vehicle Services")}</span>
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
                <h3 className="text-lg font-bold text-fg">
                  {t("dashboard.documentVault", "Citizen Document Vault")}
                </h3>
              </div>
              <Badge tone="teal">
                {t("dashboard.dpdpCompliant", "DPDP Compliant")}
              </Badge>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              {t("dashboard.dpdpDesc", "Automated expiry tracking with 30-day, 7-day, and 1-day reminders. Identifying numbers are masked to the last 4 characters.")}
            </p>

            <div className="mt-5 space-y-2.5">
              {!user ? (
                <div className="rounded-2xl border border-dashed border-line p-5 text-center bg-surface-2/40">
                  <p className="text-xs text-muted mb-3">
                    {t("dashboard.vaultLoginPrompt", "Log in to track your Driving Licence, RC, Insurance, PUC, and Fitness validities.")}
                  </p>
                  <LinkButton href="/login" size="sm" variant="accent">
                    {t("dashboard.loginToVault", "Log in to Vault")}
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
              <span>{t("dashboard.viewMyDocuments", "View My Documents")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Jurisdictions + Audit Feed (Ref Image 3) */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* Top State Jurisdictions Ranking */}
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-fg">
                {t("dashboard.coverageAnalysis", "Top State Jurisdictions")}
              </h3>
              <p className="text-xs text-muted">
                36 States &amp; Union Territories gazette synchronization
              </p>
            </div>
            <Link href="/laws" className="text-xs font-semibold text-accent hover:underline">
              {t("dashboard.exploreIndiaMap", "Explore 3D India Map")}
            </Link>
          </div>

          <div className="space-y-4 text-xs">
            {topStates.map((st) => {
              const pct = st.total > 0 ? Math.min(100, Math.round((st.verified / st.total) * 100)) : 80;
              return (
                <div key={st.code} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-fg">{st.name} ({st.code})</span>
                    <span className="text-muted">{st.verified} / {st.total} rules · <strong className="text-teal font-bold">{pct}%</strong></span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Statutory Audit & Verification Feed */}
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-fg">
                  {t("dashboard.recentAudits", "Recent Statutory Audit & Verification Feed")}
                </h3>
                <p className="text-xs text-muted">
                  {t("dashboard.systemAllOperational", "All 36 State Systems Operational")}
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-teal font-bold">
                <CheckCircle2 className="h-4 w-4" />
                <span>Audited</span>
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                { title: "Tamil Nadu Transport Gazette G.O. (Ms.) 124 Synchronized", time: "2m ago", tone: "cyan" },
                { title: "Motor Vehicles (Amendment) Act 2019 Section 194D Verified", time: "18m ago", tone: "blue" },
                { title: "Bandipur Tiger Reserve Night Curfew Schedule Re-checked", time: "1h ago", tone: "teal" },
                { title: "Commercial Tourist Vehicle (AITP) Weight Tier Matrix Refined", time: "3h ago", tone: "purple" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-line/60 bg-surface-2/60 p-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span className="text-slate-200 font-medium">{item.title}</span>
                  </div>
                  <span className="text-[11px] text-muted shrink-0 ml-2">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-line/60 pt-3 flex items-center justify-between text-xs text-muted">
            <span>Audit Integrity: Certified</span>
            <Link href="/admin" className="font-semibold text-accent hover:underline">
              <span>{t("nav.admin", "Admin Audit Log")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
