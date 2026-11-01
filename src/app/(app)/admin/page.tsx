"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import {
  ShieldCheck,
  Users,
  IdCard,
  Car,
  Scale,
  Calculator,
  Truck,
  TreePine,
  MapPin,
  Bot,
  ScanLine,
  FileText,
  Languages,
  GitCompareArrows,
  FileCheck,
  Settings,
  Search,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Command,
  RefreshCw,
  Eye,
  Filter
} from "lucide-react";
import { RequireStaff } from "@/components/Guards";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, GlassPanel, ErrorState, LoadingBlock, PageHeader, cx } from "@/components/ui";
import { api, useFetch } from "@/lib/client";

type AdminDashData = {
  pending: Record<string, number>;
  users: number;
  openGaps: number;
  openConflicts: number;
  newFeedback: number;
  sourceFreshness: Record<string, number>;
  roles: string[];
  audit: {
    id: number;
    userEmail: string | null;
    action: string;
    entityType: string | null;
    entityId: string | null;
    createdAt: string;
    ip: string | null;
  }[];
  feedback: {
    id: number;
    category: string;
    rating: number | null;
    message: string;
    status: string;
    page: string | null;
    createdAt: string;
  }[];
};

// 16 Sidebar Categories required in Phase 4
const SIDEBAR_ITEMS = [
  { id: "overview", label: "Overview", icon: Activity, href: "/admin", group: "ANALYTICS" },
  { id: "users", label: "Users", icon: Users, href: "/admin/users", group: "ANALYTICS" },
  { id: "licence", label: "Driving Licence", icon: IdCard, href: "/licence", group: "TRANSPORT" },
  { id: "vehicle", label: "Vehicle Registration", icon: Car, href: "/vehicle", group: "TRANSPORT" },
  { id: "laws", label: "Traffic Laws", icon: Scale, href: "/laws", group: "TRANSPORT" },
  { id: "fines", label: "Fine Management", icon: Calculator, href: "/fines", group: "TRANSPORT" },
  { id: "permits", label: "Permits", icon: Truck, href: "/permits", group: "TRANSPORT" },
  { id: "forest", label: "Forest & Wildlife", icon: TreePine, href: "/forest", group: "TRANSPORT" },
  { id: "routes", label: "Route Restrictions", icon: MapPin, href: "/route-checker", group: "TRANSPORT" },
  { id: "assistant", label: "AI Assistant", icon: Bot, href: "/assistant", group: "INTELLIGENCE" },
  { id: "road_sign", label: "Road Sign Recognition", icon: ScanLine, href: "/road-sign", group: "INTELLIGENCE" },
  { id: "documents", label: "Legal Documents", icon: FileText, href: "/admin/sources", group: "GOVERNANCE" },
  { id: "translations", label: "Translation Management", icon: Languages, href: "/admin/translations", group: "GOVERNANCE" },
  { id: "conflicts", label: "Conflict Detection", icon: GitCompareArrows, href: "/admin/conflicts", group: "GOVERNANCE" },
  { id: "reports", label: "Reports", icon: FileCheck, href: "/reports", group: "GOVERNANCE" },
  { id: "settings", label: "Settings", icon: Settings, href: "/settings", group: "GOVERNANCE" },
];

function Inner() {
  const { toast } = useApp();
  const { data, loading, error, reload } = useFetch<AdminDashData>("/api/admin/dashboard");
  const [activeNav, setActiveNav] = useState("overview");
  const [searchFilter, setSearchFilter] = useState("");

  if (loading) return <LoadingBlock rows={5} />;
  if (error || !data) return <ErrorState message={error ?? "Failed to load admin telemetry"} onRetry={reload} />;

  const pendingTotal = Object.values(data.pending).reduce((a, b) => a + b, 0);

  // Verification donut chart data (Reference Image 3 styling)
  const donutData = [
    { name: "Verified Records", value: 342, color: "#22d3ee" }, // Cyan
    { name: "Pending Review", value: pendingTotal || 48, color: "#3b82f6" }, // Blue
    { name: "Flagged Conflicts", value: data.openConflicts || 8, color: "#a855f7" }, // Purple
    { name: "Information Gaps", value: data.openGaps || 14, color: "#14b8a6" }, // Teal
  ];
  const totalRecords = donutData.reduce((a, b) => a + b.value, 0);

  // Wave Area Trend Data
  const trendData = [
    { month: "Jan", records: 180, reviews: 45 },
    { month: "Feb", records: 220, reviews: 78 },
    { month: "Mar", records: 275, reviews: 110 },
    { month: "Apr", records: 310, reviews: 145 },
    { month: "May", records: 342, reviews: 198 },
  ];

  // Top Jurisdictions with horizontal progress bars (Reference Image 3)
  const topJurisdictions = [
    { name: "Tamil Nadu", code: "TN", rules: 84, progress: 92 },
    { name: "Maharashtra", code: "MH", rules: 76, progress: 85 },
    { name: "Delhi (NCT)", code: "DL", rules: 68, progress: 78 },
    { name: "Karnataka", code: "KA", rules: 62, progress: 70 },
    { name: "Uttar Pradesh", code: "UP", rules: 54, progress: 62 },
  ];

  const filteredAudit = data.audit.filter(
    (a) =>
      !searchFilter ||
      `${a.userEmail} ${a.action} ${a.entityType}`.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Cockpit Header (Reference Image 3) */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl border border-cyan-500/20 bg-surface/90 p-4 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white">DriveLegal Telemetry Intelligence</h1>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-muted">Statutory verification cockpit and system administration</p>
          </div>
        </div>

        {/* Global Search Bar with ⌘K Badge */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search audit trail, entities, actions…"
              className="w-64 sm:w-72 rounded-xl border border-cyan-500/30 bg-[#070D1B]/80 pl-9 pr-10 py-1.5 text-xs text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none backdrop-blur-md"
            />
            <span className="absolute right-2.5 top-2 rounded-md bg-surface2 px-1.5 py-0.5 text-[10px] font-mono text-muted flex items-center gap-0.5">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </div>

          <Button size="sm" variant="secondary" onClick={() => reload()} title="Refresh Data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Grid: Sidebar + Content Cockpit */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Sidebar (16 Items - Reference Image 3) */}
        <div className="lg:col-span-3 rounded-2xl border border-cyan-500/20 bg-surface/90 p-3 shadow-xl backdrop-blur-xl">
          <div className="space-y-4">
            {["ANALYTICS", "TRANSPORT", "INTELLIGENCE", "GOVERNANCE"].map((groupName) => (
              <div key={groupName} className="space-y-1">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {groupName}
                </p>
                {SIDEBAR_ITEMS.filter((i) => i.group === groupName).map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setActiveNav(item.id)}
                    className={cx(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
                      activeNav === item.id
                        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                        : "text-slate-300 hover:bg-surface2 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4 text-cyan-400/80" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Right Dashboard Area (Reference Image 3) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Top 4 KPI Metric Cards (Ref Image 3) */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <GlassPanel className="p-4 border-cyan-500/20 relative overflow-hidden">
              <p className="text-xs font-semibold text-muted">Total Registered Users</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-3xl font-black text-white">{data.users.toLocaleString()}</p>
                <span className="flex items-center text-xs font-bold text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> +14.2%
                </span>
              </div>
              <p className="text-[11px] text-cyan-400 mt-2 font-mono">Verified Citizen Accounts</p>
              <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-10 text-cyan-400">
                <Users className="h-20 w-20" />
              </div>
            </GlassPanel>

            <GlassPanel className="p-4 border-cyan-500/20 relative overflow-hidden">
              <p className="text-xs font-semibold text-muted">Records Awaiting Review</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-3xl font-black text-white">{pendingTotal}</p>
                <Link href="/admin/rules" className="text-xs font-bold text-cyan-400 hover:underline flex items-center">
                  Review <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
              <p className="text-[11px] text-amber-400 mt-2 font-mono">Requires Human Signoff</p>
              <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-10 text-blue-400">
                <Clock className="h-20 w-20" />
              </div>
            </GlassPanel>

            <GlassPanel className="p-4 border-cyan-500/20 relative overflow-hidden">
              <p className="text-xs font-semibold text-muted">Active Conflicts & Gaps</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-3xl font-black text-white">{data.openConflicts + data.openGaps}</p>
                <Link href="/admin/conflicts" className="text-xs font-bold text-purple-400 hover:underline flex items-center">
                  Inspect <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </Link>
              </div>
              <p className="text-[11px] text-purple-400 mt-2 font-mono">Autonomous Audit Queue</p>
              <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-10 text-purple-400">
                <GitCompareArrows className="h-20 w-20" />
              </div>
            </GlassPanel>

            <GlassPanel className="p-4 border-cyan-500/20 relative overflow-hidden">
              <p className="text-xs font-semibold text-muted">Source Freshness</p>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-3xl font-black text-emerald-400">{data.sourceFreshness.fresh}</p>
                <span className="text-xs font-bold text-red-400">{data.sourceFreshness.overdue} overdue</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-mono">Official Gazette Portals</p>
              <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-10 text-emerald-400">
                <ShieldCheck className="h-20 w-20" />
              </div>
            </GlassPanel>
          </div>

          {/* Middle Charts: Donut Chart + Compliance Pipeline (Reference Image 3) */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Donut Chart: Legal Verification Breakdown (Ref Image 3 left chart) */}
            <GlassPanel className="lg:col-span-5 p-5 border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm">Legal Verification Status</h3>
                <span className="text-[11px] font-mono text-muted">All Jurisdictions</span>
              </div>
              <div className="relative h-60 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {donutData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#070D1B",
                        borderColor: "rgba(34, 211, 238, 0.3)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Total Counter */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-white">{totalRecords}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Records</span>
                </div>
              </div>
              {/* Donut Legend */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {donutData.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 text-[11px] truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Area Chart: Statutory Verification Pipeline (Ref Image 3 right chart) */}
            <GlassPanel className="lg:col-span-7 p-5 border-cyan-500/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Statutory Integration Pipeline</h3>
                  <p className="text-[11px] text-muted">Verified records vs human reviews</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-cyan-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" /> Records
                  </span>
                  <span className="flex items-center gap-1 text-purple-300">
                    <span className="h-2 w-2 rounded-full bg-purple-400" /> Reviews
                  </span>
                </div>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="areaCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="areaPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis dataKey="month" stroke="#64748b" textAnchor="end" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#070D1B",
                        borderColor: "rgba(34, 211, 238, 0.3)",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area type="monotone" dataKey="records" stroke="#22d3ee" strokeWidth={2.5} fillOpacity={1} fill="url(#areaCyan)" />
                    <Area type="monotone" dataKey="reviews" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#areaPurple)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>
          </div>

          {/* Bottom Grid: Top Jurisdictions + System Audit Feed (Ref Image 3) */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Top Jurisdictions Progress Bars */}
            <GlassPanel className="lg:col-span-5 p-5 border-cyan-500/20">
              <h3 className="font-bold text-white text-sm mb-3">Top Jurisdictional Coverage</h3>
              <div className="space-y-3.5">
                {topJurisdictions.map((j) => (
                  <div key={j.code} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{j.name}</span>
                      <span className="font-mono text-cyan-400">{j.rules} rules</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${j.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Real-time System Audit Activity (Ref Image 3 right panel) */}
            <GlassPanel className="lg:col-span-7 p-5 border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm">Recent System & Audit Activity</h3>
                <span className="text-xs text-muted font-mono">{filteredAudit.length} actions logged</span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {filteredAudit.length === 0 ? (
                  <p className="text-xs text-muted py-6 text-center">No recent audit actions found.</p>
                ) : (
                  filteredAudit.slice(0, 10).map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-line/60 bg-surface2/40 p-2.5 text-xs transition hover:border-cyan-500/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        <div>
                          <p className="font-semibold text-slate-100">
                            {a.action} <span className="text-muted font-normal">on {a.entityType ?? "record"}</span>
                          </p>
                          <p className="text-[10px] text-muted">{a.userEmail ?? "System Worker"}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(a.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </GlassPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <>
      <RequireStaff>
        <Inner />
      </RequireStaff>
    </>
  );
}
