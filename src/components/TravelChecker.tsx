"use client";
import { useState } from "react";
import {
  ExternalLink,
  MapPin,
  Route as RouteIcon,
  X,
  Compass,
  Building2,
  AlertTriangle,
  TreePine,
  ShieldCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import {
  Badge,
  Button,
  Card,
  GlassPanel,
  Combobox,
  DemoBanner,
  EmptyState,
  Field,
  LinkButton,
  LoadingBlock,
  Notice,
  PageHeader,
  STATE_OPTIONS,
  StatusBadge,
  inputCls,
  List,
  cx,
} from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api } from "@/lib/client";
import { VEHICLE_CATEGORIES, stateName } from "@/lib/constants";

type Adv = {
  id: number;
  name: string;
  type: string;
  state: string;
  district: string | null;
  permitInfo: string | null;
  restrictions: string | null;
  vehicleNotes: string | null;
  status: string;
  matched: boolean;
};

type Res = {
  applicableStates: { code: string; name: string; role: string; stateSpecificRecords: number }[];
  applicableDistricts: string[];
  regulations: { id: number; title: string; reference: string | null; explanation: string | null; status: string; sourceUrl: string | null }[];
  vehicleRestrictions: Adv[];
  permitInformation: Adv[];
  protectedAreas: { id: number; name: string; classification: string; state: string; status: string; hasEntryInfo: boolean }[];
  commercialNotice: string | null;
  advisories: Adv[];
  missingInformation: string[];
  sources: { name: string; url: string }[];
  notices: string[];
  mapUrl: string | null;
};

const LOCATION_PRESETS = [
  { name: "Ooty (Nilgiris)", state: "TN", desc: "E-pass mandatory, commercial vehicle check posts" },
  { name: "Manali & Rohtang Pass", state: "HP", desc: "Green tax / NGT permit required for Rohtang" },
  { name: "Leh Ladakh & Pangong", state: "LA", desc: "Inner Line Permit (ILP) required for designated circuits" },
  { name: "Tawang", state: "AR", desc: "Protected Area Permit / Inner Line Permit mandatory" },
  { name: "Munnar", state: "KL", desc: "Hill station transit restrictions & night forest guidelines" },
  { name: "Lakshadweep", state: "LD", desc: "Entry permit under Laccadive Regulation 1967" },
];

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
    if (!destState && !toPlace.trim()) {
      return toast("Choose a destination state or enter a destination place.", "error");
    }
    setBusy(true);
    try {
      const data = await api<Res>("/api/routes/analyze", {
        body: {
          fromState: isRoute ? origin || undefined : undefined,
          toState: destState || undefined,
          viaStates: via,
          fromPlace: isRoute ? fromPlace || undefined : undefined,
          toPlace: toPlace || undefined,
          date: date || undefined,
          vehicle: vehicle || undefined,
          purpose,
        },
      });
      setRes(data);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Analysis failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const vName = VEHICLE_CATEGORIES.find((v) => v.slug === vehicle)?.name ?? "Not specified (All Classes)";

  const advCard = (a: Adv) => (
    <div key={a.id} className="rounded-2xl border border-line bg-surface p-4 text-xs space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-fg">{a.name}</span>
          <Badge tone="blue">{a.state}</Badge>
          {a.matched && <Badge tone="teal">Direct Place Match</Badge>}
        </div>
        <StatusBadge status={a.status} />
      </div>
      {a.permitInfo && (
        <p className="leading-relaxed">
          <span className="font-bold text-fg">Permit Requirement: </span>
          <span className="text-muted">{a.permitInfo}</span>
        </p>
      )}
      {a.restrictions && (
        <p className="leading-relaxed">
          <span className="font-bold text-fg">Local Restrictions: </span>
          <span className="text-muted">{a.restrictions}</span>
        </p>
      )}
      {a.vehicleNotes && (
        <p className="leading-relaxed">
          <span className="font-bold text-fg">Vehicle Specifics: </span>
          <span className="text-muted">{a.vehicleNotes}</span>
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={isRoute ? "Route Legal & Multi-State Checker" : "Location Legal & Restricted Zone Checker"}
        icon={isRoute ? <RouteIcon className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
        description={
          isRoute
            ? "Analyze multi-state transit compliance: state borders crossed, statutory commercial permits, regional night curfews, and local wildlife corridor restrictions."
            : "Inspect statutory travel restrictions, Inner Line Permits (ILP), green cess requirements, and local rules for hill stations, coastal zones, islands, and border areas."
        }
      />

      <div className="space-y-3">
        <DemoBanner />
        <Notice tone="blue" title="Statutory Guidance Notice">
          This system provides statutory transport and permit compliance analysis. It does not claim real-time live traffic, GPS road closures, or temporary police barricades. Always confirm official advisories.
        </Notice>
      </div>

      {/* Main Parameters Card */}
      <Card className="rounded-3xl p-6 sm:p-8 shadow-md border border-line">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              {isRoute ? "Inter-State Transit Inspector" : "Restricted Destination Inspector"}
            </span>
            <h2 className="text-xl font-black text-fg">{isRoute ? "Journey Parameters" : "Destination Parameters"}</h2>
          </div>
          <Badge tone="teal">{isRoute ? "Multi-State Jurisdictions" : "Location Rules"}</Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {isRoute && (
            <>
              <Field label="Origin State / UT">
                <Combobox
                  options={STATE_OPTIONS("Select origin state")}
                  value={fromState}
                  onChange={setFromState}
                />
              </Field>
              <Field label="Starting City / Place (Optional)" htmlFor="fp">
                <input
                  id="fp"
                  className={inputCls}
                  value={fromPlace}
                  onChange={(e) => setFromPlace(e.target.value)}
                  placeholder="e.g. Chennai, Bengaluru, Delhi"
                />
              </Field>
            </>
          )}

          <Field label={isRoute ? "Destination State / UT" : "State / UT Jurisdiction"}>
            <Combobox
              options={STATE_OPTIONS(isRoute ? "Select destination state" : "Use selected state")}
              value={toState}
              onChange={setToState}
            />
          </Field>

          <Field label={isRoute ? "Destination City / Place" : "Destination Location / Circuit"} htmlFor="tp">
            <input
              id="tp"
              className={inputCls}
              value={toPlace}
              onChange={(e) => setToPlace(e.target.value)}
              placeholder="e.g. Ooty, Manali, Rohtang Pass, Tawang, Munnar"
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
          </Field>

          {isRoute && (
            <Field label="Via States (Intermediate States Crossed)">
              <Combobox
                options={STATE_OPTIONS("Select an intermediate state…").slice(1)}
                value=""
                onChange={(v) => v && !via.includes(v) && setVia([...via, v])}
                placeholder="Add intermediate state…"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {via.map((v) => (
                  <Badge key={v} tone="blue">
                    <span>{stateName(v)}</span>
                    <button
                      aria-label={`Remove ${stateName(v)}`}
                      onClick={() => setVia(via.filter((x) => x !== v))}
                      className="ml-1 text-muted hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </Field>
          )}

          <Field label="Travel Date" htmlFor="td" hint="Date-specific closures and seasonal bans are verified against notifications.">
            <input
              id="td"
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>

          <Field label="Journey Purpose" htmlFor="jp">
            <select
              id="jp"
              className={inputCls}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              {["Leisure travel", "Pilgrimage", "Goods transport", "Passenger transport (commercial)", "Relocation", "Other"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Location Presets for Location Checker */}
        {!isRoute && (
          <div className="mt-5 border-t border-line/60 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">Popular Hill Stations & Special Zones:</span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {LOCATION_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setToPlace(preset.name);
                    setToState(preset.state);
                  }}
                  className="rounded-xl border border-line bg-surface-2 p-2.5 text-left text-xs transition hover:border-accent/40"
                >
                  <p className="font-bold text-fg">{preset.name}</p>
                  <p className="text-[11px] text-muted truncate">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4">
          <p className="text-xs text-muted">
            Selected Vehicle Category: <span className="font-bold text-fg">{vName}</span>
          </p>
          <Button onClick={run} loading={busy} variant="glow" size="lg" className="font-bold shadow-md">
            {isRoute ? <RouteIcon className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            <span>Analyze Legal Requirements</span>
          </Button>
        </div>
      </Card>

      {/* Results View */}
      {busy ? (
        <LoadingBlock rows={3} />
      ) : !res ? (
        <EmptyState
          icon={isRoute ? <RouteIcon className="h-10 w-10 text-accent/60" /> : <MapPin className="h-10 w-10 text-accent/60" />}
          title={`Enter a ${isRoute ? "route" : "destination"} to inspect compliance`}
          text="Displays applicable states, statutory regulations, permits, commercial prerequisites, wildlife corridors, and official source links."
        />
      ) : (
        <div className="space-y-6">
          {/* Statutory Notices */}
          {res.notices.map((n, i) => (
            <Notice key={i} tone="amber">
              {n}
            </Notice>
          ))}

          {/* Commercial Notice */}
          {res.commercialNotice && (
            <Notice tone="red" title="Commercial Vehicle Mandate">
              <p className="mb-2 text-xs leading-relaxed">{res.commercialNotice}</p>
              <LinkButton href="/permits" size="sm" variant="secondary">
                Inspect Commercial Permits Directory
              </LinkButton>
            </Notice>
          )}

          {/* Applicable States Jurisdiction Card */}
          <Card className="rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-fg mb-3">Applicable State Jurisdictions</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {res.applicableStates.map((s) => (
                <div key={s.code} className="rounded-2xl border border-line bg-surface-2 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-fg">{s.name}</span>
                    <Badge tone="blue">{s.role}</Badge>
                  </div>
                  <p className="text-xs text-muted">{s.stateSpecificRecords} state-level statutory records</p>
                </div>
              ))}
            </div>

            {res.applicableDistricts.length > 0 && (
              <p className="mt-4 text-xs text-muted border-t border-line pt-3">
                <span className="font-bold text-fg">Districts with specific local orders: </span>
                {res.applicableDistricts.join("; ")}
              </p>
            )}
          </Card>

          {/* Required Permits */}
          {res.permitInformation.length > 0 && (
            <Card className="rounded-3xl p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal" />
                <h3 className="text-lg font-bold text-fg">Special Entry & Transit Permits</h3>
              </div>
              <div className="space-y-3">{res.permitInformation.map(advCard)}</div>
            </Card>
          )}

          {/* Vehicle Restrictions */}
          {res.vehicleRestrictions.length > 0 && (
            <Card className="rounded-3xl p-6 sm:p-8">
              <h3 className="text-lg font-bold text-fg mb-3">Vehicle Restrictions &amp; Local Orders</h3>
              <div className="space-y-3">{res.vehicleRestrictions.map(advCard)}</div>
            </Card>
          )}

          {/* Protected Areas Crossed or Adjacent */}
          {res.protectedAreas.length > 0 && (
            <Card className="rounded-3xl p-6 sm:p-8">
              <div className="mb-3 flex items-center gap-2">
                <TreePine className="h-5 w-5 text-teal" />
                <h3 className="text-lg font-bold text-fg">Protected Wildlife Zones En Route</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {res.protectedAreas.map((a) => (
                  <a
                    key={a.id}
                    href="/forest"
                    className="rounded-2xl border border-line bg-surface p-4 transition hover:border-teal/50 hover:bg-surface-2"
                  >
                    <p className="font-bold text-fg">{a.name}</p>
                    <p className="text-xs text-muted mt-1">
                      {a.classification} · {a.state} · {a.hasEntryInfo ? "Entry rules verified" : "Rules pending verification"}
                    </p>
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Statutory Regulations */}
          <Card className="rounded-3xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-fg mb-3">Relevant Statutory Regulations</h3>
            {res.regulations.length ? (
              <ul className="space-y-3">
                {res.regulations.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-line bg-surface-2 p-4 text-xs space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-sm text-fg">{r.title}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.reference && <p className="font-mono text-[11px] text-electric">{r.reference}</p>}
                    <p className="text-muted leading-relaxed">{r.explanation}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">No specific local statutory restrictions recorded.</p>
            )}
          </Card>

          {/* Declared Missing Information */}
          {res.missingInformation.length > 0 && (
            <Card className="rounded-3xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-2">Declared Missing Information</h3>
              <List items={res.missingInformation} />
            </Card>
          )}

          {/* Official Sources & Report Action */}
          <Card className="rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {res.sources.map((s) => (
                <a
                  key={s.url}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-royal hover:underline"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>{s.name}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
              {res.mapUrl && (
                <LinkButton href={res.mapUrl} external size="sm" variant="secondary">
                  <span>View on OpenStreetMap</span>
                </LinkButton>
              )}
            </div>

            <ReportActions
              filename={isRoute ? "route-report" : "location-report"}
              report={{
                reportType: "route",
                title: `${isRoute ? "Route Legal Assessment" : "Location Clearance"}: ${[
                  fromPlace || stateName(origin),
                  toPlace || stateName(destState),
                ]
                  .filter(Boolean)
                  .join(" → ")}`,
                query: { fromState: origin, toState: destState, via, fromPlace, toPlace, date, vehicle, purpose },
                location: [stateName(origin), stateName(destState)].filter(Boolean).join(" → "),
                vehicleCategory: vName,
                findings: [...res.permitInformation, ...res.vehicleRestrictions].map(
                  (a) => `${a.name}: ${[a.permitInfo, a.restrictions].filter(Boolean).join(" | ")}`
                ),
                legalReferences: res.regulations.map((r) => r.reference ?? r.title),
                sources: res.sources,
                missingInfo: res.missingInformation,
                uncertaintyNotices: res.notices,
              }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
