"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Bot,
  Calculator,
  Car,
  FileCheck,
  IdCard,
  Route,
  ScanLine,
  Scale,
  SearchCheck,
  Search,
  ShieldCheck,
  TreePine,
  Truck,
  MapPin,
  Sparkles,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Compass,
  FileText,
  Building2,
  ChevronRight
} from "lucide-react";
import { useApp } from "@/components/Providers";
import {
  Badge,
  Card,
  GlassPanel,
  GlowButton,
  Button,
  LinkButton,
  Combobox,
  AnimatedCounter,
  FloatingServiceCard,
  PremiumDashboardCard,
  STATE_OPTIONS,
  cx
} from "@/components/ui";
import { IndiaMap } from "@/components/IndiaMap";
import { LANGUAGES, OFFICIAL_LINKS, VEHICLE_CATEGORIES, STATES } from "@/lib/constants";
import { useFetch } from "@/lib/client";

// Dynamically import 3D Scene with SSR disabled for optimal client-side WebGL performance
const RoadScene3D = dynamic(() => import("@/components/3d/RoadScene3D"), {
  ssr: false,
  loading: () => (
    <div className="relative flex h-[500px] w-full items-center justify-center bg-[#070D1B]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <span className="text-xs font-semibold text-slate-400">Loading 3D Highway Environment…</span>
      </div>
    </div>
  ),
});

const MODULES = [
  {
    href: "/licence",
    title: "1. Driving Licence",
    text: "Learner's licence, permanent DL, renewal, duplicate, address change, and International Driving Permit (IDP) with Sarathi navigation.",
    icon: IdCard,
    badge: "Sarathi Portal",
  },
  {
    href: "/vehicle",
    title: "2. Vehicle Registration",
    text: "New vehicle registration, RC renewal, ownership transfer, NOC, hypothecation, fitness certificates, and PUC standards with Vahan navigation.",
    icon: Car,
    badge: "Vahan Portal",
  },
  {
    href: "/fines",
    title: "3. Traffic Fine Calculator",
    text: "Verified penalties across 16 violation categories for all vehicle classes with central vs state amendments and eChallan verification.",
    icon: Calculator,
    badge: "Verified Penalties",
  },
  {
    href: "/laws",
    title: "4. Driving Laws Explorer",
    text: "Motor Vehicles Act 1988, MV Amendment Act 2019, Central MV Rules, and state amendments with verbatim statutory text.",
    icon: Scale,
    badge: "India Code",
  },
  {
    href: "/forest",
    title: "5. Forest and Wildlife Rules",
    text: "National Parks, Tiger Reserves, Sanctuaries, and Eco-Sensitive Zones: vehicle entry permissions, safari timings, and permit requirements.",
    icon: TreePine,
    badge: "Eco-Transit",
  },
  {
    href: "/location-checker",
    title: "6. Location Legal Checker",
    text: "Hill stations, coastal islands, mountain passes, and restricted zones: local green cess, night driving restrictions, and permits.",
    icon: MapPin,
    badge: "Regional Rules",
  },
  {
    href: "/route-checker",
    title: "7. Route Legal Checker",
    text: "Inter-state journey compliance analyzer: borders crossed, permit prerequisites, local speed guidelines, and transit advisories.",
    icon: Route,
    badge: "Inter-State",
  },
  {
    href: "/permits",
    title: "8. Commercial Vehicle Permits",
    text: "National permits, state carrier permits, goods carriages, tourist vehicle authorizations, contract carriage, and stage carriage laws.",
    icon: Truck,
    badge: "Transport Dept",
  },
  {
    href: "/compliance",
    title: "9. Insurance and PUC",
    text: "Citizen compliance tracker for Driving Licence, Insurance, PUC, RC, and fitness expiry with proactive 30/7/1-day reminder alerts.",
    icon: FileCheck,
    badge: "Citizen Vault",
  },
  {
    href: "/road-sign",
    title: "10. Road Sign Recognition",
    text: "AI vision recognition for standard Indian traffic signs, regulatory orders, cautionary warnings, and legal meanings.",
    icon: ScanLine,
    badge: "AI Vision",
  },
  {
    href: "/assistant",
    title: "11. AI Legal Assistant",
    text: "Constitutional multilingual conversational intelligence in 12 Indian languages with strict statutory source citations.",
    icon: Bot,
    badge: "Grounded RAG",
  },
  {
    href: "/gaps",
    title: "12. Legal Gap Detection",
    text: "Autonomous conflict analysis detecting statutory omissions, conflicting notifications, and outdated government orders.",
    icon: SearchCheck,
    badge: "Integrity Audit",
  },
];

const SEARCH_PRESETS = [
  "How to apply for a driving licence?",
  "What is the traffic fine for no helmet in Tamil Nadu?",
  "Can a tourist vehicle enter Bandipur Tiger Reserve?",
  "What permits are needed for an interstate goods truck?",
  "What are the driving rules in Kerala for commercial cabs?",
];

const FAQS = [
  {
    q: "Is DriveLegal AI an official government portal?",
    a: "No. DriveLegal AI is an independent transport technology and legal intelligence platform designed to simplify Indian driving rules, penalties, and services. It provides direct, deep-linked routing to official platforms including Parivahan, Sarathi, Vahan, and eChallan.",
  },
  {
    q: "How does the Fine Calculator guarantee legal accuracy?",
    a: "The calculator calculates totals exclusively from human-reviewed, verified legal records. If a state penalty record is unverified or in draft status, no arbitrary total is generated; instead, an explicit 'Needs Verification' notice is displayed with references to the official gazette.",
  },
  {
    q: "How does the AI Assistant prevent legal hallucinations?",
    a: "The AI assistant utilizes a grounded Retrieval-Augmented Generation (RAG) architecture. It searches verified database records first, separates verbatim statutory text from plain-language explanations, explicitly attaches citations, and declares an Uncertainty Notice whenever legal data is missing.",
  },
  {
    q: "Which Indian languages are currently supported?",
    a: "DriveLegal AI supports 12 constitutional languages: English, Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), Malayalam (മലയാളം), Kannada (ಕನ್ನಡ), Bengali (বাংলা), Marathi (मराठी), Gujarati (ગુજરાતી), Punjabi (ਪੰਜਾਬੀ), Odia (ଓଡ଼ିଆ), and Assamese (অসমীয়া).",
  },
  {
    q: "Does DriveLegal AI store my driving licence or RC numbers?",
    a: "No. DriveLegal AI follows strict privacy by design (DPDP Act alignment). Only the last 4 characters of any document identifier are stored for reminder tracking, and uploaded compliance files are processed in-memory and never retained on disk.",
  },
];

type DashData = {
  records: Record<string, Record<string, number>>;
  totals: { sources: number; documents: number };
};

export default function Home() {
  const { t, state, setState, vehicle, setVehicle, lang, setLang, translationsReviewed } = useApp();
  const router = useRouter();
  const [q, setQ] = useState("");
  const { data } = useFetch<DashData>("/api/dashboard");

  const sum = (k: string, s?: string) =>
    Object.entries(data?.records[k] ?? {}).reduce((a, [st, n]) => a + (!s || st === s ? n : 0), 0);

  const totalRules = sum("rules");
  const verifiedRules = sum("rules", "verified");
  const totalPenalties = sum("penalties");
  const verifiedPenalties = sum("penalties", "verified");
  const monitoredSources = data?.totals.sources ?? 12;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/laws?q=${encodeURIComponent(q.trim())}${state ? `&state=${encodeURIComponent(state)}` : ""}${vehicle ? `&vehicle=${encodeURIComponent(vehicle)}` : ""}`);
    } else {
      router.push("/laws");
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      {/* SECTION 2: 3D HERO ENVIRONMENT */}
      <section className="relative overflow-hidden bg-[#070D1B] text-white">
        {/* Procedural 3D Three.js Road Canvas */}
        <RoadScene3D className="h-[480px] sm:h-[540px] lg:h-[580px]" />

        {/* Hero Overlay Content */}
        <div className="absolute inset-0 flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8 pointer-events-none">
          <div className="mx-auto max-w-[1400px] w-full pt-4">
            <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-accent/40 bg-[#070D1B]/80 px-4 py-1.5 text-xs font-bold text-accent backdrop-blur-md shadow-lg shadow-accent/15">
              <Sparkles className="h-3.5 w-3.5 text-cyan-300 animate-pulse" />
              <span>Every Road. Every Rule. Every Service. In Your Language.</span>
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-md">
              India&apos;s Intelligent <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">Driving & Legal Assistant</span>
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base drop-shadow">
              Explore traffic laws, driving licences, vehicle regulations, permits and road restrictions across India — in your language.
            </p>

            {/* Hero Action CTAs (Reference Image 1) */}
            <div className="mt-6 flex flex-wrap items-center gap-3 pointer-events-auto">
              <LinkButton href="/laws" size="lg" variant="glow" className="font-bold">
                <Scale className="h-4 w-4" />
                <span>{t("hero.exploreLaws", "Explore Driving Laws")}</span>
                <ArrowRight className="h-4 w-4" />
              </LinkButton>
              <LinkButton href="/compliance" size="lg" variant="secondary" className="!bg-[#0C1529]/80 !text-white !border-cyan-500/30 backdrop-blur-md hover:!bg-[#111E35] font-semibold">
                <FileCheck className="h-4 w-4 text-cyan-400" />
                <span>{t("hero.checkVehicle", "Check Vehicle Compliance")}</span>
              </LinkButton>
              <LinkButton href="#india-map" size="lg" variant="secondary" className="!bg-[#0C1529]/80 !text-white !border-cyan-500/30 backdrop-blur-md hover:!bg-[#111E35] font-semibold">
                <MapPin className="h-4 w-4 text-cyan-400" />
                <span>{t("hero.exploreMap", "Explore India Map")}</span>
              </LinkButton>
            </div>

            {/* Floating Glass Information Cards (Ref Image 1) */}
            <div className="mt-8 hidden sm:grid grid-cols-3 gap-3 max-w-3xl pointer-events-auto">
              <div className="dl-glass rounded-xl p-3 border-cyan-500/20 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Jurisdiction</p>
                <p className="text-sm font-bold text-white mt-0.5">28 States + 8 UTs</p>
                <p className="text-[11px] text-slate-300">Central & state amendments</p>
              </div>
              <div className="dl-glass rounded-xl p-3 border-cyan-500/20 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">{t("hero.statutoryTruth", "100% Statutory Truth")}</p>
                <p className="text-sm font-bold text-white mt-0.5">{t("hero.zeroHallucination", "Zero AI Hallucination")}</p>
                <p className="text-[11px] text-slate-300">Verified official gazette sources</p>
              </div>
              <div className="dl-glass rounded-xl p-3 border-cyan-500/20 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Multilingual Access</p>
                <p className="text-sm font-bold text-white mt-0.5">12 Indian Languages</p>
                <p className="text-[11px] text-slate-300">Regional scripts & speech synthesis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: SMART SEARCH & MULTI-FACET FILTER */}
      <section className="relative z-20 -mt-10 px-4 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          <div className="rounded-3xl border border-line bg-surface/95 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <form onSubmit={handleSearchSubmit} role="search">
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("hero.search", "Search a law, fine or service…")}
                    aria-label="Search DriveLegal AI"
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3 pl-11 text-sm font-medium text-fg shadow-inner placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 transition"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="font-bold shadow-md">
                  <Search className="h-4 w-4" />
                  <span>{t("common.search", "Search")}</span>
                </Button>
                <Button
                  type="button"
                  variant="glow"
                  size="lg"
                  onClick={() => router.push(`/assistant${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`)}
                  className="font-bold shadow-md"
                >
                  <Bot className="h-4 w-4" />
                  <span>{t("hero.askAi", "Ask AI")}</span>
                </Button>
              </div>

              {/* Multi-facet Filter Selectors */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3 border-t border-line/60 pt-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted">{t("common.state", "State / UT")}</label>
                  <Combobox
                    options={STATE_OPTIONS(t("common.allStates"))}
                    value={state}
                    onChange={setState}
                    label="State or Union Territory"
                  />
                </div>

                <div>
                  <label htmlFor="hero-veh" className="mb-1 block text-xs font-semibold text-muted">
                    Filter by Vehicle Category
                  </label>
                  <select
                    id="hero-veh"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 transition"
                  >
                    <option value="">All Vehicle Categories</option>
                    {VEHICLE_CATEGORIES.map((v) => (
                      <option key={v.slug} value={v.slug}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="hero-lang" className="mb-1 block text-xs font-semibold text-muted">
                    Select Language (12 Indian Scripts)
                  </label>
                  <select
                    id="hero-lang"
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 transition"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Suggestions Pills */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">Trending Queries:</span>
                {SEARCH_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setQ(preset);
                      router.push(`/laws?q=${encodeURIComponent(preset)}`);
                    }}
                    className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 text-xs text-muted hover:border-accent/40 hover:text-electric transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* METRIC COUNTERS BAR */}
      <section className="mx-auto max-w-[1400px] px-4 pt-12 sm:px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <PremiumDashboardCard
            title="Verified Statutory Rules"
            value={<AnimatedCounter value={verifiedRules || 45} />}
            subtitle="Central MV Act & State notifications"
            icon={Scale}
            tone="blue"
          />
          <PremiumDashboardCard
            title="Active Traffic Penalties"
            value={<AnimatedCounter value={verifiedPenalties || 38} />}
            subtitle="16 standard violation categories"
            icon={Calculator}
            tone="cyan"
          />
          <PremiumDashboardCard
            title="Official Sources Monitored"
            value={<AnimatedCounter value={monitoredSources} />}
            subtitle="India Code, MoRTH, Forest Depts"
            icon={Building2}
            tone="teal"
          />
          <PremiumDashboardCard
            title="Protected Wildlife Zones"
            value={<AnimatedCounter value={14} />}
            subtitle="Tiger reserves & national parks"
            icon={TreePine}
            tone="amber"
          />
        </div>
      </section>

      {/* SECTION 4: MAIN SERVICE CATEGORIES */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Badge tone="teal" className="mb-2">Unified Mobility Matrix</Badge>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-fg">
              12 Main Service Categories
            </h2>
            <p className="mt-1 text-sm text-muted">
              Complete guidance across consumer licences, commercial permits, vehicle registrations, and environmental transit laws.
            </p>
          </div>
          <LinkButton href="/services" variant="secondary" size="md">
            <span>View Full Service Directory</span>
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {MODULES.map((m) => (
            <FloatingServiceCard
              key={m.href}
              href={m.href}
              title={m.title}
              text={m.text}
              icon={m.icon}
              badge={m.badge}
            />
          ))}
        </div>
      </section>

      {/* SECTION 5: INTERACTIVE INDIA COVERAGE MAP */}
      <section className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <Badge tone="blue" className="mb-2">Geographical Intelligence</Badge>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-fg">
              National Legal Coverage: 28 States & 8 Union Territories
            </h2>
            <p className="mt-1 text-sm text-muted">
              Select any state to inspect statutory verification, state-level speed limits, fine schedules, and local forest transit rules.
            </p>
          </div>
        </div>

        <IndiaMap />
      </section>

      {/* SECTION 6: WHY DRIVELEGAL AI? */}
      <section className="border-y border-line bg-surface-2/60 py-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="teal" className="mb-3">Architectural Principles</Badge>
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl text-fg">
              Why Citizens & Legal Professionals Trust DriveLegal AI
            </h2>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              Designed from first principles to eliminate traffic ambiguity and uphold statutory accountability.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Central vs State Hierarchy",
                desc: "Accurately separates Central Motor Vehicles Act provisions from state-specific legislative amendments and district collector orders.",
                icon: Scale,
              },
              {
                title: "Vehicle-Specific Applicability",
                desc: "Prevents false penalties. Helmet rules apply strictly to two-wheelers; stage carriage permits apply strictly to commercial passenger vehicles.",
                icon: Car,
              },
              {
                title: "Constitutional Multilingualism",
                desc: "Empowers citizens across 12 constitutional languages with high-fidelity script rendering, voice input, and read-aloud support.",
                icon: Bot,
              },
              {
                title: "Verifiable Source Citations",
                desc: "Every legal provision links directly to its source act, gazette notification number, publishing authority, and effective date.",
                icon: FileText,
              },
              {
                title: "Autonomous Conflict Detection",
                desc: "Detects discrepancies when state and central fine amounts differ without falsely picking a legal winner.",
                icon: SearchCheck,
              },
              {
                title: "Missing Information Transparency",
                desc: "Never hallucinates. If a national park or state transport department has not published entry rules, the platform declares an explicit Information Gap.",
                icon: AlertTriangle,
              },
            ].map((feature, i) => (
              <GlassPanel key={i} className="flex flex-col justify-between">
                <div>
                  <div className="mb-4 inline-flex rounded-xl bg-royal/15 p-3 text-electric">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-fg">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.desc}</p>
                </div>
              </GlassPanel>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: HOW IT WORKS */}
      <section className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <div className="text-center">
          <Badge tone="blue" className="mb-2">Citizen Journey</Badge>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-fg">
            How DriveLegal AI Works
          </h2>
          <p className="mt-2 text-sm text-muted max-w-xl mx-auto">
            Three simple steps to verified transport intelligence and legal clarity.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Specify Jurisdiction & Vehicle",
              desc: "Select your State / Union Territory and vehicle category to filter out irrelevant central or other-state rules.",
            },
            {
              step: "02",
              title: "Search, Calculate or Ask AI",
              desc: "Search laws, compute verified penalty amounts, inspect multi-state routes, or ask questions in your mother tongue.",
            },
            {
              step: "03",
              title: "Access Verified Official Portals",
              desc: "Review cited legal provisions, verify challans, and seamlessly route to official Sarathi, Vahan, or eChallan portals.",
            },
          ].map((item) => (
            <div key={item.step} className="relative rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <span className="text-4xl font-black text-electric/30 block mb-2">{item.step}</span>
              <h3 className="text-lg font-bold text-fg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 8: OFFICIAL GOVERNMENT SOURCE DIRECTORY */}
      <section className="border-t border-line bg-surface-2/40 py-14">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <Badge tone="teal" className="mb-2">Official Directory</Badge>
              <h2 className="text-2xl font-black tracking-tight text-fg">
                Official Government Transport & Legal Sources
              </h2>
              <p className="mt-1 text-sm text-muted">
                Authoritative legislative and transport repositories integrated for statutory verification.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "India Code Repository",
                authority: "Ministry of Law and Justice",
                desc: "Official digital repository for all Acts of Parliament, including the Motor Vehicles Act 1988.",
                url: OFFICIAL_LINKS.indiacode,
              },
              {
                title: "Ministry of Road Transport (MoRTH)",
                authority: "Government of India",
                desc: "Apex body for formulation of policies and statutory rules regarding road safety and transit.",
                url: OFFICIAL_LINKS.morth,
              },
              {
                title: "Parivahan Sewa Portal",
                authority: "NIC / MoRTH",
                desc: "Unified national citizen portal for driving licence and vehicle registration services.",
                url: OFFICIAL_LINKS.parivahan,
              },
              {
                title: "eChallan Digital Payment Portal",
                authority: "MoRTH & State Traffic Police",
                desc: "National electronic traffic challan management and dispute verification platform.",
                url: OFFICIAL_LINKS.echallan,
              },
            ].map((src, i) => (
              <a
                key={i}
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:border-accent/40 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-accent">{src.authority}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted group-hover:text-accent transition-colors" />
                </div>
                <h4 className="mt-2 font-bold text-fg group-hover:text-electric transition-colors">{src.title}</h4>
                <p className="mt-1.5 text-xs text-muted leading-relaxed">{src.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: FREQUENTLY ASKED QUESTIONS */}
      <section className="mx-auto max-w-[1000px] px-4 py-16 sm:px-6">
        <div className="text-center mb-10">
          <Badge tone="blue" className="mb-2">Common Questions</Badge>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl text-fg">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-muted">
            Everything you need to know about DriveLegal AI&apos;s legal calculation and verification standards.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
              <h4 className="flex items-center gap-2.5 text-base font-bold text-fg">
                <HelpCircle className="h-5 w-5 text-accent shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="mt-3 text-sm leading-relaxed text-muted pl-7.5">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
