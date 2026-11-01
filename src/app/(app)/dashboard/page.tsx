"use client";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Calculator, FileCheck, GitCompareArrows, SearchCheck } from "lucide-react";
import { Card, ErrorState, LinkButton, LoadingBlock, PageHeader, DemoBanner } from "@/components/ui";
import { useApp } from "@/components/Providers";
import { useFetch } from "@/lib/client";
import { stateName } from "@/lib/constants";

type Dash = {
  records: Record<string, Record<string, number>>;
  totals: { sources: number; documents: number; neverChecked: number; stateCoverage: Record<string, number> };
  findings: { gaps: Record<string, number>; conflicts: Record<string, number> };
  coverage: { code: string; name: string; total: number; verified: number; level: string }[];
  userDocuments: Record<string, number> | null;
};
const SC: Record<string, string> = { verified: "#16a34a", pending: "#f59e0b", rejected: "#dc2626", outdated: "#7c3aed" };
const LC: Record<string, string> = { verified: "#16a34a", partial: "#84cc16", unverified: "#f59e0b", central_only: "#94a3b8" };
const LN: Record<string, string> = { verified: "Verified", partial: "Partly verified", unverified: "Unverified (demo)", central_only: "Central law only" };

export default function DashboardPage() {
  const { t, user, state } = useApp();
  const { data, loading, error, reload } = useFetch<Dash>("/api/dashboard");
  if (loading) return <><PageHeader title={t("nav.dashboard")} /><LoadingBlock rows={4} /></>;
  if (error || !data) return <ErrorState message={error ?? "No data"} onRetry={reload} />;

  const statusData = (key: string) => Object.entries(data.records[key] ?? {}).map(([name, value]) => ({ name, value }));
  const combined: Record<string, number> = {};
  ["rules", "penalties", "areas", "locations", "licenceServices", "vehicleServices", "permits"].forEach((k) => Object.entries(data.records[k] ?? {}).forEach(([s, n]) => (combined[s] = (combined[s] ?? 0) + n)));
  const pie = Object.entries(combined).map(([name, value]) => ({ name, value }));
  const total = pie.reduce((a, b) => a + b.value, 0);
  const cov = Object.entries(data.totals.stateCoverage).map(([k, v]) => ({ name: LN[k] ?? k, key: k, value: v }));
  const findingsBar = [...Object.entries(data.findings.gaps).map(([k, v]) => ({ name: k, gaps: v, conflicts: 0 }))];
  Object.entries(data.findings.conflicts).forEach(([k, v]) => { const e = findingsBar.find((x) => x.name === k); if (e) e.conflicts = v; else findingsBar.push({ name: k, gaps: 0, conflicts: v }); });
  const selected = state ? data.coverage.find((c) => c.code === state) : null;

  return (
    <>
      <PageHeader title={t("nav.dashboard")} description="Live statistics calculated from the records in the database — nothing here is hard-coded." actions={<LinkButton href="/fines" size="sm"><Calculator className="h-4 w-4" />{t("nav.fines")}</LinkButton>} />
      <div className="mb-4"><DemoBanner /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Records in database", String(total), `${combined.verified ?? 0} human-verified`, FileCheck],
          ["Legal rules + penalties", String((data.records.rules ? Object.values(data.records.rules).reduce((a, b) => a + b, 0) : 0) + (data.records.penalties ? Object.values(data.records.penalties).reduce((a, b) => a + b, 0) : 0)), `${(data.records.rules?.verified ?? 0) + (data.records.penalties?.verified ?? 0)} verified`, Calculator],
          ["Open information gaps", String(Object.values(data.findings.gaps).reduce((a, b) => a + b, 0)), "auto-detected", SearchCheck],
          ["Open conflicts", String(Object.values(data.findings.conflicts).reduce((a, b) => a + b, 0)), "need human review", GitCompareArrows],
        ].map(([label, value, sub, Icon]) => {
          const I = Icon as typeof FileCheck;
          return (<Card key={label as string}><div className="flex items-start justify-between"><div><p className="text-sm text-muted">{label as string}</p><p className="mt-1 text-3xl font-bold">{value as string}</p><p className="text-xs text-muted">{sub as string}</p></div><I className="h-5 w-5 text-royal" /></div></Card>);
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-semibold">Verification status of all records</h2>
          <div className="h-64" role="img" aria-label="Pie chart of verification status">
            <ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} label>{pie.map((p) => <Cell key={p.name} fill={SC[p.name] ?? "#64748b"} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">State data coverage (36 states/UTs)</h2>
          <div className="h-64" role="img" aria-label="Bar chart of state coverage">
            <ResponsiveContainer><BarChart data={cov}><CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" name="States / UTs">{cov.map((c) => <Cell key={c.key} fill={LC[c.key] ?? "#64748b"} />)}</Bar></BarChart></ResponsiveContainer>
          </div>
          <p className="mt-1 text-xs text-muted">Most states currently have central-law coverage only; add and verify state sources in Admin to improve this.</p>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Legal gap &amp; conflict findings</h2>
          <div className="h-64">
            <ResponsiveContainer><BarChart data={findingsBar}><CartesianGrid strokeDasharray="3 3" stroke="#94a3b855" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="gaps" name="Gaps" fill="#f59e0b" /><Bar dataKey="conflicts" name="Conflicts" fill="#dc2626" /></BarChart></ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">{selected ? `Selected: ${stateName(state)}` : "Records by type"}</h2>
          {selected ? (
            <div className="space-y-2 text-sm"><p>State-level records stored: <b>{selected.total}</b> ({selected.verified} verified)</p><p className="text-muted">{selected.total === 0 ? "Only central law is available for this state. State rules, amendments and local regulations have not been loaded." : "Records for this state are demo data until verified."}</p></div>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {[["Legal rules", "rules"], ["Penalties", "penalties"], ["Protected areas", "areas"], ["Travel locations", "locations"], ["Permits", "permits"], ["Licence services", "licenceServices"], ["Vehicle services", "vehicleServices"]].map(([l, k]) => (
                <li key={k} className="flex justify-between border-b border-line pb-1"><span>{l}</span><span className="text-muted">{statusData(k).map((s) => `${s.value} ${s.name}`).join(" · ") || "—"}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-2 font-semibold">My document compliance</h2>
        {!user ? <p className="text-sm text-muted"><Link className="text-royal underline" href="/login">Log in</Link> to track your licence, RC, insurance, PUC, fitness and permit expiry dates.</p>
          : data.userDocuments && data.userDocuments.total ? <div className="flex flex-wrap gap-4 text-sm">{Object.entries(data.userDocuments).filter(([k]) => k !== "total").map(([k, v]) => <span key={k}><b className="text-xl">{v}</b> {k}</span>)}</div>
          : <p className="text-sm text-muted">No documents saved yet. <Link className="text-royal underline" href="/documents">Add a document</Link>.</p>}
      </Card>
    </>
  );
}
