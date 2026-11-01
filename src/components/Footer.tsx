import Link from "next/link";
import { ShieldCheck, ExternalLink, Scale, FileText, AlertTriangle, MapPin, Sparkles } from "lucide-react";
import { LEGAL_DISCLAIMER, OFFICIAL_LINKS, STATES } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="no-print mt-20 border-t border-line bg-[#070D1B] text-slate-300">
      {/* Top Banner with Brand Personality */}
      <div className="border-b border-line/40 bg-[#0C1529]/60 px-4 py-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-royal via-electric to-accent text-white shadow-lg shadow-royal/20">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black text-white tracking-tight">DriveLegal</span>
                <span className="rounded-md bg-accent/20 px-1.5 py-0.5 text-xs font-black uppercase tracking-widest text-accent">AI</span>
              </div>
              <p className="text-xs text-slate-400">India's Unified AI-Powered Driving, Transport and Legal Intelligence Platform</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-bold text-accent">
              Every Road. Every Rule. Every Service. In Your Language.
            </div>
            <div className="rounded-xl border border-line bg-surface/50 px-3.5 py-1.5 text-xs font-semibold text-slate-300">
              Know the Law Before You Drive.
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Column 1: Core Navigation */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">Mobility Intelligence</p>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/services", "Unified Services Catalog"],
              ["/licence", "Driving Licence Guide (Sarathi)"],
              ["/vehicle", "Vehicle Registration & Fitness (Vahan)"],
              ["/fines", "Verified Fine Calculator"],
              ["/laws", "Driving Laws & Penalties Explorer"],
              ["/forest", "Forest & Wildlife Transit Rules"],
              ["/permits", "Commercial Vehicle Permits"],
              ["/location-checker", "Location Legal Checker"],
              ["/route-checker", "Multi-State Route Inspector"],
              ["/road-sign", "Road Sign AI Vision"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-slate-400 transition hover:text-white hover:translate-x-1 inline-block">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Legal AI & Governance */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">Verification & Transparency</p>
          <ul className="space-y-2.5 text-sm">
            {[
              ["/assistant", "AI Legal Assistant (Grounded RAG)"],
              ["/gaps", "Legal Gap & Conflict Detection"],
              ["/compliance", "Citizen Document Vault & Expiry"],
              ["/reports", "Compliance Audit Reports"],
              ["/challan", "Official eChallan Guidelines"],
              ["/admin", "Legal Review Console"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-slate-400 transition hover:text-white hover:translate-x-1 inline-block">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Independent Platform Notice</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-amber-200/80">
              DriveLegal AI is an independent guidance utility. All legal claims require official gazette verification.
            </p>
          </div>
        </div>

        {/* Column 3: Official Government Sources */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">Official Government Portals</p>
          <ul className="space-y-2 text-sm">
            {[
              ["India Code (Legislative Acts)", OFFICIAL_LINKS.indiacode],
              ["Ministry of Road Transport & Highways", OFFICIAL_LINKS.morth],
              ["Parivahan Sewa Portal", OFFICIAL_LINKS.parivahan],
              ["Sarathi (Driving Licence Services)", OFFICIAL_LINKS.sarathi],
              ["Vahan (Vehicle Registration Services)", OFFICIAL_LINKS.vahan],
              ["eChallan Digital Payment Portal", OFFICIAL_LINKS.echallan],
              ["Ministry of Environment, Forest & Climate", OFFICIAL_LINKS.moef],
            ].map(([name, url]) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-slate-400 transition hover:text-accent"
                >
                  <span>{name}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Legal Disclaimer & Jurisdiction */}
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-wider text-accent">Statutory Disclaimer</p>
          <p className="text-xs leading-relaxed text-slate-400">{LEGAL_DISCLAIMER}</p>
          <div className="mt-4 border-t border-line/40 pt-4 text-xs text-slate-400">
            <p className="font-semibold text-slate-200">28 States & 8 Union Territories</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Central Motor Vehicles Act applies nationally; State transport amendments and forest permits govern local jurisdiction.
            </p>
            <Link href="/gaps" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              <span>View platform audit & gap detection</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Rights Bar */}
      <div className="border-t border-line/40 bg-[#070D1B] px-4 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} DriveLegal AI. Every Road. Every Rule. Every Service. In Your Language.</p>
          <p className="text-[11px] text-slate-400">
            Engineered for high-integrity Indian mobility, compliance & legal intelligence.
          </p>
        </div>
      </div>
    </footer>
  );
}
