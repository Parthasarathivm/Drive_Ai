import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LEGAL_DISCLAIMER, OFFICIAL_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="no-print mt-12 border-t border-line bg-navy text-slate-300">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2 font-bold text-white"><ShieldCheck className="h-5 w-5 text-cyan-300" />DriveLegal AI</div>
          <p className="text-sm">Every Road. Every Rule. Every Service. In Your Language.</p>
          <p className="mt-3 inline-block rounded border border-amber-400/50 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-200">DEMO DATA - NOT VERIFIED LEGAL ADVICE</p>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-white">Official sources</p>
          <ul className="space-y-1">
            {([["India Code", OFFICIAL_LINKS.indiacode], ["MoRTH", OFFICIAL_LINKS.morth], ["Parivahan", OFFICIAL_LINKS.parivahan], ["Sarathi (licences)", OFFICIAL_LINKS.sarathi], ["Vahan (vehicles)", OFFICIAL_LINKS.vahan], ["eChallan", OFFICIAL_LINKS.echallan], ["MoEFCC", OFFICIAL_LINKS.moef]] as const).map(([n, u]) => (
              <li key={u}><a className="hover:text-white hover:underline" href={u} target="_blank" rel="noopener noreferrer">{n}</a></li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="mb-2 font-semibold text-white">Legal disclaimer</p>
          <p className="text-xs leading-relaxed">{LEGAL_DISCLAIMER}</p>
          <p className="mt-3 text-xs"><Link className="underline" href="/gaps">See known information gaps</Link></p>
        </div>
      </div>
    </footer>
  );
}
