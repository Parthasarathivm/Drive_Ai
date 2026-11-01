"use client";
import { useState } from "react";
import {
  TreePine,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Building2,
  Calendar,
  Camera,
  Car,
  FileText,
  Search,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import {
  Badge,
  Button,
  Card,
  GlassPanel,
  DemoBanner,
  EmptyState,
  Field,
  LoadingBlock,
  Notice,
  PageHeader,
  SourcePanel,
  StatusBadge,
  inputCls,
  List,
  cx,
} from "@/components/ui";
import { ReportActions } from "@/components/ReportActions";
import { api, useFetch } from "@/lib/client";
import { PROTECTED_CLASSES, stateName } from "@/lib/constants";

type Match = {
  id: number;
  name: string;
  classification: string;
  classificationGuide: string | null;
  district: string | null;
  authority: string | null;
  vehicleEntry: string | null;
  permitInfo: string | null;
  bookingInfo: string | null;
  entryConditions: string | null;
  timings: string | null;
  touristVehicleRestrictions: string | null;
  parkingRestrictions: string | null;
  cameraDroneRules: string | null;
  closures: string | null;
  ecoSensitiveZone: string | null;
  sources: { name: string; url: string }[];
  missingInformation: string[];
  verificationStatus: string;
  lastVerifiedAt: string | null;
  isDemo: boolean;
  notes: string | null;
};

type Result = { vehicleLabel: string; matches: Match[]; notices: string[] };
const NF = "Information not found — not verified";

const TOP_RESERVES = [
  "Bandipur National Park",
  "Jim Corbett National Park",
  "Kaziranga National Park",
  "Ranthambore Tiger Reserve",
  "Gir National Park",
  "Periyar Wildlife Sanctuary",
  "Sundarbans National Park",
];

export default function ForestPage() {
  const { state, vehicle, t, toast } = useApp();
  const [destination, setDestination] = useState("");
  const [purpose, setPurpose] = useState("Tourism / safari");
  const [date, setDate] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  const areas = useFetch<{
    areas: { id: number; name: string; classification: string; stateName: string | null; verificationStatus: string }[];
  }>("/api/protected-areas");

  async function check(dest = destination) {
    if (!dest.trim() && !state) return toast("Enter a destination or select a state.", "error");
    setBusy(true);
    try {
      const data = await api<Result>("/api/protected-areas/check", {
        body: {
          destination: dest || undefined,
          state: state || undefined,
          vehicle: vehicle || undefined,
          purpose,
          date: date || undefined,
        },
      });
      setRes(data);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Check failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const rows = (m: Match): [string, string | null][] => [
    ["Vehicle Entry Regulations", m.vehicleEntry],
    ["Required Transit / Safari Permits", m.permitInfo],
    ["Advance Online Booking System", m.bookingInfo],
    ["Entry Conditions & Mandatory Guides", m.entryConditions],
    ["Official Gate Timings & Speed Limits", m.timings],
    ["Commercial / Tourist Vehicle Rules", m.touristVehicleRestrictions],
    ["Designated Parking Restrictions", m.parkingRestrictions],
    ["Photography & Drone Regulations", m.cameraDroneRules],
    ["Monsoon / Seasonal Closures", m.closures],
    ["Eco-Sensitive Zone (ESZ) Buffer Rules", m.ecoSensitiveZone],
  ];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title={t("nav.forest")}
        icon={<TreePine className="h-5 w-5" />}
        description="Statutory transit rules, permit requirements, camera/drone bans, and vehicle restrictions for National Parks, Tiger Reserves, Sanctuaries, and Eco-Sensitive Zones across India. Regulations differ for every protected area — nothing is assumed."
      />

      <div className="space-y-3">
        <DemoBanner />
        <Notice tone="red" title="Zero Assumption Environmental Policy">
          Protected areas have unique statutory notifications issued by State Forest Departments and the MoEFCC. Entry fees, night driving bans, and safari permit requirements vary strictly by zone.
        </Notice>
      </div>

      {/* Check Destination Form */}
      <Card className="rounded-3xl p-6 sm:p-8 shadow-md border border-line">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal">Eco-Transit Clearance</span>
            <h2 className="text-xl font-black text-fg">Forest & Wildlife Legal Checker</h2>
          </div>
          <Badge tone="green">Wildlife Protection Act 1972</Badge>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Protected Area Destination (Park / Reserve / Sanctuary)" htmlFor="dest">
            <input
              id="dest"
              className={inputCls}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Bandipur, Jim Corbett, Kaziranga, Mudumalai"
              onKeyDown={(e) => e.key === "Enter" && check()}
            />
          </Field>

          <Field label="Journey Purpose" htmlFor="purpose">
            <select
              id="purpose"
              className={inputCls}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              {["Tourism / safari", "Transit through a highway", "Commercial / tourist vehicle operation", "Research / official duty", "Other"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>

          <Field label="Planned Travel Date" htmlFor="date" hint="Seasonal or monsoon closures are verified against official gazette orders.">
            <input
              id="date"
              type="date"
              className={inputCls}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>

          <Field label="Active State & Vehicle Context">
            <div className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm font-semibold text-fg">
              {state ? stateName(state) : "All States / India"} · {vehicle || "All Vehicle Classes"}
            </div>
          </Field>
        </div>

        {/* Quick Reserve Chips */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Featured Reserves:</span>
          {TOP_RESERVES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setDestination(name);
                check(name);
              }}
              className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-xs text-muted hover:border-teal/40 hover:text-teal transition"
            >
              {name}
            </button>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={() => check()} loading={busy} variant="teal" size="lg" className="font-bold shadow-md">
            <TreePine className="h-4 w-4" />
            <span>Check Transit & Permit Information</span>
          </Button>
        </div>
      </Card>

      {/* Results Display */}
      {busy ? (
        <LoadingBlock rows={2} />
      ) : (
        res && (
          <div className="space-y-6">
            {res.notices.map((n, i) => (
              <Notice key={i} tone="amber">
                {n}
              </Notice>
            ))}

            {!res.matches.length ? (
              <EmptyState
                icon={<TreePine className="h-10 w-10 text-teal/60" />}
                title="No database record for this destination"
                text="This does not mean vehicle entry is unrestricted. An explicit permit or eco-cess is often required. Confirm directly with the responsible State Forest Department."
              />
            ) : (
              res.matches.map((m) => (
                <Card key={m.id} className="rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge tone="teal">{m.classification}</Badge>
                        <StatusBadge status={m.verificationStatus} />
                        {m.isDemo && <Badge tone="amber">Demo Record (Unverified)</Badge>}
                      </div>
                      <h2 className="text-2xl font-black text-fg">{m.name}</h2>
                      <p className="text-xs text-muted mt-0.5">
                        {[m.district, m.authority && `Responsible Authority: ${m.authority}`].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>

                  {m.classificationGuide && (
                    <Notice tone="blue" title="Statutory Classification Overview">
                      {m.classificationGuide}
                    </Notice>
                  )}

                  <div className="rounded-2xl border border-line bg-surface-2 p-3.5 text-xs text-muted">
                    Journey Parameters: <span className="font-bold text-fg">{res.vehicleLabel}</span> ·{" "}
                    <span className="font-bold text-fg">{purpose}</span>
                    {date ? ` · Date: ${date}` : ""}
                  </div>

                  {/* Detailed Regulations Grid */}
                  <dl className="grid gap-3 sm:grid-cols-2 text-xs">
                    {rows(m).map(([k, v]) => (
                      <div key={k} className={cx("rounded-xl border border-line bg-surface p-3.5", !v && "opacity-75")}>
                        <dt className="font-bold uppercase tracking-wider text-muted text-[10px]">{k}</dt>
                        <dd className="mt-1 text-sm font-semibold text-fg">
                          {v ?? <span className="italic text-muted font-normal text-xs">{NF}</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Missing Information Callout */}
                  {m.missingInformation.length > 0 && (
                    <Notice tone="amber" title="Declared Statutory Information Gaps">
                      <p className="text-xs mb-1.5">
                        The following parameters are not verified in official publications. DriveLegal AI will never invent unverified guidelines:
                      </p>
                      <List items={m.missingInformation} />
                    </Notice>
                  )}

                  <SourcePanel sources={m.sources} status={m.verificationStatus} lastVerifiedAt={m.lastVerifiedAt} />

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <ReportActions
                      filename={`forest-${m.id}`}
                      report={{
                        reportType: "forest",
                        title: `Protected Area Clearance: ${m.name}`,
                        query: { destination, state, vehicle, purpose, date },
                        location: [m.district, m.name].filter(Boolean).join(", "),
                        vehicleCategory: res.vehicleLabel,
                        findings: rows(m).map(([k, v]) => `${k}: ${v ?? NF}`),
                        legalReferences: [m.classificationGuide ?? ""].filter(Boolean),
                        sources: m.sources,
                        missingInfo: m.missingInformation,
                        uncertaintyNotices: res.notices,
                      }}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        )
      )}

      {/* Database Protected Areas Directory */}
      <Card className="rounded-3xl p-6 sm:p-8">
        <div className="mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Indexed Sanctuaries & Parks</span>
          <h3 className="text-lg font-bold text-fg">Protected Areas Currently Monitored</h3>
        </div>

        {areas.loading ? (
          <LoadingBlock rows={2} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {areas.data?.areas.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setDestination(a.name);
                  check(a.name);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-teal/50 hover:bg-surface-2"
              >
                <div>
                  <p className="font-bold text-fg group-hover:text-teal transition-colors">{a.name}</p>
                  <p className="text-xs text-muted mt-1">
                    {PROTECTED_CLASSES[a.classification] ?? a.classification} · {a.stateName}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-teal">
                  <span>Inspect Transit Rules</span>
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
