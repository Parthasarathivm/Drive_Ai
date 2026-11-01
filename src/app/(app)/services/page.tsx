"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bot, Calculator, Car, FileCheck, IdCard, MapPin, Receipt, Route, Scale, ScanLine, SearchCheck, TreePine, Truck, Search } from "lucide-react";
import { Card, EmptyState, PageHeader, inputCls } from "@/components/ui";
import { useApp } from "@/components/Providers";

const ALL = [
  { href: "/licence", t: "Driving Licence", d: "Learner's, permanent, renewal, duplicate, address change, IDP and test preparation.", i: IdCard, g: "Driving" },
  { href: "/vehicle", t: "Vehicle Registration & Transport Services", d: "New registration, RC, transfer, NOC, hypothecation, fitness, PUC and interstate requirements.", i: Car, g: "Vehicles" },
  { href: "/fines", t: "Smart Traffic Fine Calculator", d: "State-wise penalties with legal sections, repeat-offence conditions and comparison.", i: Calculator, g: "Fines" },
  { href: "/challan", t: "Challan Information", d: "How challans work and how to reach the official eChallan portal safely.", i: Receipt, g: "Fines" },
  { href: "/laws", t: "Driving Laws & Traffic Rules Explorer", d: "Central and state rules with original references, conditions and exceptions.", i: Scale, g: "Laws" },
  { href: "/forest", t: "Forest, Wildlife & Protected Areas", d: "Check National Park, sanctuary and tiger reserve entry information.", i: TreePine, g: "Travel" },
  { href: "/location-checker", t: "Location Legal Checker", d: "Hill stations, islands, coastal and restricted zones.", i: MapPin, g: "Travel" },
  { href: "/route-checker", t: "Route Legal Checker", d: "States, permits and advisories for your journey.", i: Route, g: "Travel" },
  { href: "/permits", t: "Commercial Vehicle & Permit Services", d: "Permit guidance for buses, trucks, taxis and tourist vehicles.", i: Truck, g: "Commercial" },
  { href: "/compliance", t: "Insurance, PUC & Compliance", d: "What documents you need and how to stay compliant.", i: FileCheck, g: "Compliance" },
  { href: "/documents", t: "My Documents", d: "Track expiry dates with reminders. Optional and consent-based.", i: FileCheck, g: "Compliance" },
  { href: "/road-sign", t: "AI Road Sign Recognition", d: "Upload a road sign image or browse the sign library.", i: ScanLine, g: "AI" },
  { href: "/assistant", t: "AI Legal Assistant", d: "Ask in 12 Indian languages with voice input and read-aloud.", i: Bot, g: "AI" },
  { href: "/gaps", t: "Legal Gap & Conflict Analysis", d: "Missing, outdated and potentially conflicting information.", i: SearchCheck, g: "AI" },
];

export default function ServicesPage() {
  const { t } = useApp();
  const [q, setQ] = useState("");
  const list = useMemo(() => ALL.filter((s) => `${s.t} ${s.d} ${s.g}`.toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <>
      <PageHeader title={t("nav.services")} description="Everything you need for driving, vehicles, traffic law and travel compliance in India — in one place." />
      <div className="relative mb-5 max-w-md"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className={`${inputCls} pl-9`} placeholder="Filter services…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter services" /></div>
      {list.length === 0 ? <EmptyState title="No services match" text="Try a different keyword." /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((s) => (
            <Link key={s.href} href={s.href} className="group"><Card className="h-full transition group-hover:border-royal/50 group-hover:shadow-md">
              <div className="mb-2 flex items-center justify-between"><span className="rounded-xl bg-royal/10 p-2 text-royal"><s.i className="h-5 w-5" /></span><span className="text-xs text-muted">{s.g}</span></div>
              <h2 className="font-semibold">{s.t}</h2><p className="mt-1 text-sm text-muted">{s.d}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-royal">Open<ArrowRight className="h-3.5 w-3.5" /></span></Card></Link>
          ))}
        </div>
      )}
    </>
  );
}
