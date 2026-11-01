"use client";
import { useState } from "react";
import { ExternalLink, MapPin, Route as RouteIcon, X } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, Combobox, DemoBanner, EmptyState, Field, LinkButton, LoadingBlock, Notice, PageHeader, STATE_OPTIONS, StatusBadge, inputCls, List } from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api } from "@/lib/client";
import { VEHICLE_CATEGORIES, stateName } from "@/lib/constants";

type Adv = { id: number; name: string; type: string; state: string; district: string | null; permitInfo: string | null; restrictions: string | null; vehicleNotes: string | null; status: string; matched: boolean };
type Res = {
  applicableStates: { code: string; name: string; role: string; stateSpecificRecords: number }[]; applicableDistricts: string[];
  regulations: { id: number; title: string; reference: string | null; explanation: string | null; status: string; sourceUrl: string | null }[];
  vehicleRestrictions: Adv[]; permitInformation: Adv[]; protectedAreas: { id: number; name: string; classification: string; state: string; status: string; hasEntryInfo: boolean }[];
  commercialNotice: string | null; advisories: Adv[]; missingInformation: string[]; sources: { name: string; url: string }[]; notices: string[]; mapUrl: string | null;
};

export function TravelChecker({ mode }: { mode: "route" | "location" }) {
  const { state, vehicle, toast } = useApp();
  const [fromState, setFromState] = useState("");
  const [fromPlace, setFromPlace] = useState("");
  const [toState, setToState] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [via, setVia] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [purpose, setPurpose] = useState("Leisure travel");
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);
  const isRoute = mode === "route";
  const destState = toState || (!isRoute ? state : "");
  const origin = fromState || (isRoute ? state : "");

  async function run() {
    if (!destState && !toPlace.trim()) return toast("Choose a destination state or enter a destination place.", "error");
    setBusy(true);
    try {
      setRes(await api<Res>("/api/routes/analyze", { body: { fromState: isRoute ? origin || undefined : undefined, toState: destState || undefined, viaStates: via, fromPlace: isRoute ? fromPlace || undefined : undefined, toPlace: toPlace || undefined, date: date || undefined, vehicle: vehicle || undefined, purpose } }));
    } catch (e) { toast(e instanceof Error ? e.message : "Analysis failed", "error"); }
    finally { setBusy(false); }
  }
  const vName = VEHICLE_CATEGORIES.find((v) => v.slug === vehicle)?.name ?? "Not specified";
  const advCard = (a: Adv) => (
    <div key={a.id} className="rounded-xl border border-line p-3 text-sm">
      <div className="mb-1 flex flex-wrap items-center gap-2"><b>{a.name}</b><Badge tone="blue">{a.state}</Badge>{a.matched && <Badge tone="teal">Matches your place</Badge>}<StatusBadge status={a.status} /></div>
      {a.permitInfo && <p><span className="font-semibold">Permit: </span>{a.permitInfo}</p>}
      {a.restrictions && <p><span className="font-semibold">Restrictions: </span>{a.restrictions}</p>}
      {a.vehicleNotes && <p><span className="font-semibold">Vehicle notes: </span>{a.vehicleNotes}</p>}
    </div>
  );

  return (
    <>
      <PageHeader title={isRoute ? "Route Legal Checker" : "Location Legal Checker"} icon={isRoute ? <RouteIcon className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
        description={isRoute ? "Find the states, regulations, permits and advisories relevant to a journey. Intermediate states must be added manually — no routing service is connected." : "Check restrictions, permits and local rules recorded for hill stations, islands, coastal areas and restricted zones."} />
      <div className="mb-4 space-y-2"><DemoBanner /><Notice tone="blue" title="No live data">This tool does not provide live traffic, weather, road closures or route conditions. Always check official advisories before travelling.</Notice></div>
      <Card className="mb-5">
        <div className="grid gap-4 md:grid-cols-2">
          {isRoute && <><Field label="Starting state / UT"><Combobox options={STATE_OPTIONS("Use the bar's state / any")} value={fromState} onChange={setFromState} /></Field>
            <Field label="Starting place (optional)" htmlFor="fp"><input id="fp" className={inputCls} value={fromPlace} onChange={(e) => setFromPlace(e.target.value)} placeholder="e.g. Chennai" /></Field></>}
          <Field label={isRoute ? "Destination state / UT" : "State / UT of the location"}><Combobox options={STATE_OPTIONS(isRoute ? "Choose destination state" : "Use the bar's state")} value={toState} onChange={setToState} /></Field>
          <Field label={isRoute ? "Destination place" : "Place / destination"} htmlFor="tp"><input id="tp" className={inputCls} value={toPlace} onChange={(e) => setToPlace(e.target.value)} placeholder="e.g. Ooty, Manali, Tawang, Lakshadweep" onKeyDown={(e) => e.key === "Enter" && run()} /></Field>
          {isRoute && (
            <Field label="Via states (states you pass through)">
              <Combobox options={STATE_OPTIONS("Add a via state…").slice(1)} value="" onChange={(v) => v && !via.includes(v) && setVia([...via, v])} placeholder="Add a via state…" />
              <div className="mt-2 flex flex-wrap gap-1">{via.map((v) => <Badge key={v} tone="blue">{stateName(v)}<button aria-label={`Remove ${stateName(v)}`} onClick={() => setVia(via.filter((x) => x !== v))}><X className="h-3 w-3" /></button></Badge>)}</div>
            </Field>
          )}
          <Field label="Travel date" htmlFor="td"><input id="td" type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Journey purpose" htmlFor="jp"><select id="jp" className={inputCls} value={purpose} onChange={(e) => setPurpose(e.target.value)}>{["Leisure travel", "Pilgrimage", "Goods transport", "Passenger transport (commercial)", "Relocation", "Other"].map((p) => <option key={p}>{p}</option>)}</select></Field>
        </div>
        <p className="mt-3 text-xs text-muted">Vehicle category (from the bar above): <b>{vName}</b></p>
        <div className="mt-4"><Button onClick={run} loading={busy}>{isRoute ? <RouteIcon className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}Check legal requirements</Button></div>
      </Card>

      {busy ? <LoadingBlock /> : !res ? <EmptyState icon={<MapPin className="h-8 w-8" />} title="Enter a destination to begin" text="You will see applicable states and districts, regulations, vehicle restrictions, permit information, advisories, missing information and sources." /> : (
        <div className="space-y-4">
          {res.notices.map((n, i) => <Notice key={i} tone="amber">{n}</Notice>)}
          {res.commercialNotice && <Notice tone="red">{res.commercialNotice} <a className="underline" href="/permits">Open permits</a></Notice>}
          <Card><h2 className="mb-2 font-semibold">Applicable states</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{res.applicableStates.map((s) => <div key={s.code} className="rounded-xl border border-line p-3 text-sm"><p className="font-medium">{s.name}</p><p className="text-xs text-muted">{s.role} · {s.stateSpecificRecords} state-level records</p></div>)}</div>
            {res.applicableDistricts.length > 0 && <p className="mt-3 text-sm"><b>Districts with records:</b> {res.applicableDistricts.join("; ")}</p>}
          </Card>
          {res.permitInformation.length > 0 && <Card><h2 className="mb-2 font-semibold">Permit information</h2><div className="space-y-2">{res.permitInformation.map(advCard)}</div></Card>}
          {res.vehicleRestrictions.length > 0 && <Card><h2 className="mb-2 font-semibold">Vehicle restrictions &amp; local regulations</h2><div className="space-y-2">{res.vehicleRestrictions.map(advCard)}</div></Card>}
          {res.protectedAreas.length > 0 && <Card><h2 className="mb-2 font-semibold">Protected areas in these states</h2><div className="grid gap-2 sm:grid-cols-2">{res.protectedAreas.map((a) => <a key={a.id} href={`/forest`} className="rounded-xl border border-line p-3 text-sm hover:bg-surface2"><p className="font-medium">{a.name}</p><p className="text-xs text-muted">{a.classification} · {a.state} · {a.hasEntryInfo ? "entry info recorded" : "entry info NOT recorded"}</p></a>)}</div></Card>}
          <Card><h2 className="mb-2 font-semibold">Relevant regulations</h2>
            {res.regulations.length ? <ul className="space-y-2 text-sm">{res.regulations.map((r) => <li key={r.id} className="rounded-xl border border-line p-3"><div className="flex flex-wrap items-center gap-2"><b>{r.title}</b><StatusBadge status={r.status} /></div><p className="text-xs text-muted">{r.reference}</p><p>{r.explanation}</p></li>)}</ul> : <p className="text-sm text-muted">No applicable regulation records found.</p>}</Card>
          <Card><h2 className="mb-2 font-semibold">Missing information</h2><List items={res.missingInformation} /></Card>
          <Card className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">{res.sources.map((s) => <a key={s.url} className="inline-flex items-center gap-1 text-sm text-royal hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">{s.name}<ExternalLink className="h-3 w-3" /></a>)}{res.mapUrl && <LinkButton href={res.mapUrl} external size="sm" variant="secondary">View on OpenStreetMap</LinkButton>}</div>
            <ReportActions filename={isRoute ? "route-report" : "location-report"} report={{ reportType: "route", title: `${isRoute ? "Route" : "Location"} legal information — ${[fromPlace || stateName(origin), toPlace || stateName(destState)].filter(Boolean).join(" → ")}`, query: { fromState: origin, toState: destState, via, fromPlace, toPlace, date, vehicle, purpose }, location: [stateName(origin), stateName(destState)].filter(Boolean).join(" → "), vehicleCategory: vName, findings: [...res.permitInformation, ...res.vehicleRestrictions].map((a) => `${a.name}: ${[a.permitInfo, a.restrictions].filter(Boolean).join(" | ")}`), legalReferences: res.regulations.map((r) => r.reference ?? r.title), sources: res.sources, missingInfo: res.missingInformation, uncertaintyNotices: res.notices }} />
          </Card>
        </div>
      )}
    </>
  );
}
