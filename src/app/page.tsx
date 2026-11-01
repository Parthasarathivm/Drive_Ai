"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Bot, Calculator, Car, FileCheck, IdCard, Route, ScanLine, Scale, SearchCheck, Search, ShieldCheck, TreePine, Truck, ExternalLink, MapPin } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Card, Combobox, LinkButton, STATE_OPTIONS, btnClass, cx } from "@/components/ui";
import { IndiaMap } from "@/components/IndiaMap";
import { LANGUAGES, OFFICIAL_LINKS, VEHICLE_CATEGORIES } from "@/lib/constants";
import { useFetch } from "@/lib/client";

const MODULES = [
  { href: "/licence", title: "Driving Licence", text: "Learner's, permanent, renewal, duplicate, IDP and test preparation guidance with Sarathi links.", icon: IdCard },
  { href: "/vehicle", title: "Vehicle Services", text: "Registration, RC, transfer, NOC, hypothecation, fitness and PUC guidance with Vahan links.", icon: Car },
  { href: "/fines", title: "Fine Calculator", text: "State and vehicle-specific penalties with legal sections — verified records only.", icon: Calculator },
  { href: "/laws", title: "Driving Laws Explorer", text: "Central and state rules with original references, conditions and exceptions.", icon: Scale },
  { href: "/forest", title: "Forest & Wildlife", text: "National Park, sanctuary and tiger reserve entry information — nothing invented.", icon: TreePine },
  { href: "/route-checker", title: "Route Legal Checker", text: "States, permits, restrictions and advisories relevant to your journey.", icon: Route },
  { href: "/location-checker", title: "Location Legal Checker", text: "Hill stations, islands and restricted zones: permits and local restrictions.", icon: MapPin },
  { href: "/permits", title: "Commercial Permits", text: "National, state, goods, tourist, contract and stage carriage permits.", icon: Truck },
  { href: "/compliance", title: "Insurance, PUC & Documents", text: "Track expiry dates and download a compliance report.", icon: FileCheck },
  { href: "/road-sign", title: "Road Sign AI", text: "Upload a sign for AI recognition with a confidence indicator, or browse the sign library.", icon: ScanLine },
  { href: "/assistant", title: "AI Legal Assistant", text: "Ask in 12 languages; answers cite sources and show uncertainty.", icon: Bot },
  { href: "/gaps", title: "Legal Gap & Conflict Detection", text: "See missing, outdated and potentially conflicting legal information.", icon: SearchCheck },
];

type Dash = { records: Record<string, Record<string, number>>; totals: { sources: number; documents: number } };

export default function Home() {
  const { t, state, setState, vehicle, setVehicle, lang, setLang, translationsReviewed } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const { data } = useFetch<Dash>("/api/dashboard");
  const sum = (k: string, s?: string) => Object.entries(data?.records[k] ?? {}).reduce((a, [st, n]) => a + (!s || st === s ? n : 0), 0);
  const legalTotal = sum("rules") + sum("penalties");
  const legalVerified = sum("rules", "verified") + sum("penalties", "verified");

  return (
    <>
      <section className="bg-gradient-to-br from-navy via-[#0f2c66] to-royal text-white">
        <div className="mx-auto max-w-[1100px] px-4 py-12 sm:py-16">
          <Badge tone="teal" className="mb-4">Every Road. Every Rule. Every Service. In Your Language.</Badge>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{t("hero.title")}</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">{t("hero.desc")}</p>

          <form className="mt-8 rounded-2xl bg-surface p-3 text-fg shadow-xl" onSubmit={(e) => { e.preventDefault(); router.push(q.trim() ? `/laws?q=${encodeURIComponent(q.trim())}` : "/laws"); }} role="search">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("hero.search")} aria-label={t("common.search")}
                  className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30" />
              </div>
              <button type="submit" className={btnClass("primary", "md")}>{t("common.search")}</button>
              <button type="button" onClick={() => router.push(`/assistant${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)} className={btnClass("accent", "md")}><Bot className="h-4 w-4" />{t("hero.askAi")}</button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <div><label className="mb-1 block text-xs text-muted">{t("hero.state")}</label><Combobox options={STATE_OPTIONS(t("common.allStates"))} value={state} onChange={setState} label={t("hero.state")} /></div>
              <div><label className="mb-1 block text-xs text-muted" htmlFor="h-veh">{t("hero.vehicle")}</label>
                <select id="h-veh" value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-royal focus:outline-none">
                  <option value="">{t("common.allVehicles")}</option>{VEHICLE_CATEGORIES.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}
                </select></div>
              <div><label className="mb-1 block text-xs text-muted" htmlFor="h-lang">{t("common.language")}</label>
                <select id="h-lang" value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-royal focus:outline-none">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>)}
                </select></div>
            </div>
            {!translationsReviewed && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t("common.machine")}</p>}
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/services" size="lg" className="!bg-white !text-navy hover:!bg-slate-100">{t("hero.explore")}<ArrowRight className="h-4 w-4" /></LinkButton>
            <LinkButton href="/fines" size="lg" variant="secondary" className="!border-white/40 !bg-white/10 !text-white hover:!bg-white/20">{t("nav.fines")}</LinkButton>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] space-y-14 px-4 py-12">
        <section aria-labelledby="cats">
          <h2 id="cats" className="mb-5 text-2xl font-bold">{t("section.categories")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m) => (
              <Link key={m.href} href={m.href} className="group">
                <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-royal/50 group-hover:shadow-md">
                  <div className="mb-3 inline-flex rounded-xl bg-royal/10 p-2.5 text-royal"><m.icon className="h-5 w-5" /></div>
                  <h3 className="font-semibold">{m.title}</h3>
                  <p className="mt-1 text-sm text-muted">{m.text}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-royal">Open<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid items-start gap-8 lg:grid-cols-[1fr_1.1fr]" aria-labelledby="map">
          <div>
            <h2 id="map" className="text-2xl font-bold">28 States · 8 Union Territories</h2>
            <p className="mt-2 text-sm text-muted">Select a state to filter laws, fines, permits and travel checks. Colours show how much state-specific legal data is actually stored — central law applies everywhere, but incomplete state datasets are never presented as verified.</p>
          </div>
          <Card><IndiaMap navigateTo="/laws" /></Card>
        </section>

        <section aria-labelledby="how">
          <h2 id="how" className="mb-5 text-2xl font-bold">{t("section.how")}</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {(["how.1", "how.2", "how.3"] as const).map((k, i) => (
              <li key={k}><Card className="h-full"><span className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-navy font-bold text-white">{i + 1}</span><p className="font-semibold">{t(k)}</p></Card></li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="trust">
          <h2 id="trust" className="mb-2 text-2xl font-bold">{t("section.trusted")}</h2>
          <p className="mb-5 max-w-3xl text-sm text-muted">Legal records stay <b>pending</b> until an authorised human reviewer approves them against the official source. Figures below are counted live from the database.</p>
          <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
            <Card>
              <div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-green-600" />
                <div><p className="text-3xl font-bold">{data ? legalVerified : "…"}<span className="text-lg font-medium text-muted"> / {data ? legalTotal : "…"}</span></p><p className="text-sm text-muted">legal rules &amp; penalties human-verified</p></div></div>
              <p className="mt-3 text-xs text-muted">{data ? `${data.totals.sources} registered official sources · ${data.totals.documents} registered legal documents` : ""}</p>
              <div className="mt-3 flex gap-2"><LinkButton href="/gaps" size="sm" variant="secondary">View information gaps</LinkButton><LinkButton href="/dashboard" size="sm" variant="secondary">Dashboard</LinkButton></div>
            </Card>
            <Card>
              <p className="mb-2 text-sm font-semibold">Official source links</p>
              <ul className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                {([["India Code", OFFICIAL_LINKS.indiacode], ["MoRTH", OFFICIAL_LINKS.morth], ["Parivahan", OFFICIAL_LINKS.parivahan], ["Sarathi — licences", OFFICIAL_LINKS.sarathi], ["Vahan — vehicles", OFFICIAL_LINKS.vahan], ["eChallan — challans", OFFICIAL_LINKS.echallan], ["MoEFCC — forests", OFFICIAL_LINKS.moef]] as const).map(([n, u]) => (
                  <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className={cx("inline-flex items-center gap-1 text-royal hover:underline")}>{n}<ExternalLink className="h-3 w-3" /></a></li>
                ))}
              </ul>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
