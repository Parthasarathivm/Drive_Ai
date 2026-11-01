"use client";
import { useState } from "react";
import { TreePine } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, DemoBanner, EmptyState, Field, LoadingBlock, Notice, PageHeader, SourcePanel, StatusBadge, inputCls, List } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch } from "@/lib/client";
import { PROTECTED_CLASSES, stateName } from "@/lib/constants";

type Match = {
  id: number; name: string; classification: string; classificationGuide: string | null; district: string | null; authority: string | null; vehicleEntry: string | null; permitInfo: string | null; bookingInfo: string | null;
  entryConditions: string | null; timings: string | null; touristVehicleRestrictions: string | null; parkingRestrictions: string | null; cameraDroneRules: string | null; closures: string | null; ecoSensitiveZone: string | null;
  sources: { name: string; url: string }[]; missingInformation: string[]; verificationStatus: string; lastVerifiedAt: string | null; isDemo: boolean; notes: string | null;
};
type Result = { vehicleLabel: string; matches: Match[]; notices: string[] };
const NF = "Information not found — not verified";

export default function ForestPage() {
  const { state, vehicle, t, toast } = useApp();
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("Tourism / safari");
  const [date, setDate] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const areas = useFetch<{ areas: { id: number; name: string; classification: string; stateName: string | null; verificationStatus: string }[] }>("/api/protected-areas");

  async function check(dest = destination) {
    if (!dest.trim() && !state) return toast("Enter a destination or select a state.", "error");
    setBusy(true);
    try { setRes(await api<Result>("/api/protected-areas/check", { body: { destination: dest || undefined, state: state || undefined, vehicle: vehicle || undefined, purpose, date: date || undefined } })); }
    catch (e) { toast(e instanceof Error ? e.message : "Check failed", "error"); }
    finally { setBusy(false); }
  }
  const rows = (m: Match): [string, string | null][] => [
    ["Vehicle entry information", m.vehicleEntry], ["Permit information", m.permitInfo], ["Advance booking", m.bookingInfo], ["Entry conditions", m.entryConditions], ["Official entry timings", m.timings],
    ["Tourist vehicle restrictions", m.touristVehicleRestrictions], ["Parking restrictions", m.parkingRestrictions], ["Photography / drone rules", m.cameraDroneRules], ["Temporary closures", m.closures], ["Eco-Sensitive Zone", m.ecoSensitiveZone],
  ];

  return (
    <>
      <PageHeader title={t("nav.forest")} icon={<TreePine className="h-5 w-5" />} description="Check what is known about vehicle entry, permits, booking, timings and restrictions for forests, sanctuaries, National Parks and tiger reserves. Rules differ for each area — nothing is assumed or invented." />
      <div className="mb-4 space-y-2"><DemoBanner /><Notice tone="red" title="Do not assume identical rules">Permits, fees, timings and vehicle access vary by area, by season and by order. Confirm with the responsible Forest Department before travelling.</Notice></div>
      <Card className="mb-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Destination (park, sanctuary or reserve)" htmlFor="dest"><input id="dest" className={inputCls} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Bandipur, Jim Corbett, Kaziranga" onKeyDown={(e) => e.key === "Enter" && check()} /></Field>
          <Field label="Journey purpose" htmlFor="purpose"><select id="purpose" className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value)}>{["Tourism / safari", "Transit through a highway", "Commercial / tourist vehicle operation", "Research / official duty", "Other"].map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Travel date" htmlFor="date" hint="Closures for a date can only be shown if officially verified."><input id="date" type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="State and vehicle (from the bar above)"><div className="rounded-lg border border-line bg-surface2 px-3 py-2 text-sm">{state ? stateName(state) : "Any state"} · {vehicle || "no vehicle selected"}</div></Field>
        </div>
        <div className="mt-4"><Button onClick={() => check()} loading={busy}><TreePine className="h-4 w-4" />Check entry information</Button></div>
      </Card>

      {busy ? <LoadingBlock rows={2} /> : res && (
        <div className="mb-6 space-y-4">
          {res.notices.map((n, i) => <Notice key={i} tone="amber">{n}</Notice>)}
          {!res.matches.length ? <EmptyState icon={<TreePine className="h-8 w-8" />} title="No stored record for this destination" text="This does not mean it is unrestricted. Contact the State Forest Department or the park authority for the current rules." /> : res.matches.map((m) => (
            <Card key={m.id} className="space-y-4">
              <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{m.name}</h2><Badge tone="teal">{m.classification}</Badge><StatusBadge status={m.verificationStatus} />{m.isDemo && <Badge tone="amber">Demo data</Badge>}</div>
              <p className="text-sm text-muted">{[m.district, m.authority && `Authority: ${m.authority}`].filter(Boolean).join(" · ")}</p>
              {m.classificationGuide && <Notice tone="blue" title="About this classification">{m.classificationGuide}</Notice>}
              <p className="text-xs text-muted">Journey: {res.vehicleLabel} · {purpose}{date ? ` · ${date}` : ""}</p>
              <dl className="grid gap-3 sm:grid-cols-2">{rows(m).map(([k, v]) => <div key={k} className={!v ? "opacity-70" : ""}><dt className="text-xs font-semibold uppercase text-muted">{k}</dt><dd className="text-sm">{v ?? <span className="italic text-muted">{NF}</span>}</dd></div>)}</dl>
              {m.missingInformation.length > 0 && <Notice tone="amber" title="Missing information"><List items={m.missingInformation} /></Notice>}
              <SourcePanel sources={m.sources} status={m.verificationStatus} lastVerifiedAt={m.lastVerifiedAt} />
              <ReportActions filename={`forest-${m.id}`} report={{ reportType: "forest", title: `Forest entry information — ${m.name}`, query: { destination, state, vehicle, purpose, date }, location: [m.district, m.name].filter(Boolean).join(", "), vehicleCategory: res.vehicleLabel, findings: rows(m).map(([k, v]) => `${k}: ${v ?? NF}`), legalReferences: [m.classificationGuide ?? ""].filter(Boolean), sources: m.sources, missingInfo: m.missingInformation, uncertaintyNotices: res.notices }} />
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-5">
        <h2 className="mb-3 font-semibold">Protected areas in the database</h2>
        {areas.loading ? <LoadingBlock rows={2} /> : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {areas.data?.areas.map((a) => (
              <button key={a.id} onClick={() => { setDestination(a.name); check(a.name); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-xl border border-line p-3 text-left text-sm hover:bg-surface2">
                <p className="font-medium">{a.name}</p><p className="text-xs text-muted">{PROTECTED_CLASSES[a.classification] ?? a.classification} · {a.stateName}</p></button>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted">Only a few areas are recorded so far. Admins can add and verify more under Admin → Data Management.</p>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Types of protected areas and regulations</h2>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">{Object.values(PROTECTED_CLASSES).map((c) => <li key={c} className="rounded-lg border border-line px-3 py-2">{c}</li>)}</ul>
        <p className="mt-2 text-xs text-muted">Each type has different legal basis and rules (Wildlife (Protection) Act, 1972; Indian Forest Act, 1927; MoEFCC Eco-Sensitive Zone notifications). Check the area-specific notification.</p>
      </Card>
    </>
  );
}
