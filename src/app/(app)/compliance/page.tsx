"use client";
import { FileCheck } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Card, DemoBanner, LinkButton, Notice, PageHeader, StatusBadge } from "@/components/ui";
import { useFetch } from "@/lib/client";
import { DOC_TYPES, OFFICIAL_LINKS } from "@/lib/constants";
import { docStatus } from "@/lib/compliance";
import { Badge } from "@/components/ui";
import { STATUS_TONE } from "@/lib/compliance";
import type { UserDoc } from "@/components/DocBits";

const INFO = [
  { t: "Driving Licence", ref: "Motor Vehicles Act, 1988 — Section 3", d: "Required to drive in a public place. Keep it valid and carry it (physical or an accepted digital copy).", link: OFFICIAL_LINKS.sarathi },
  { t: "Registration Certificate (RC)", ref: "Motor Vehicles Act, 1988 — Section 39", d: "Proof of registration. Keep the address and ownership details current.", link: OFFICIAL_LINKS.vahan },
  { t: "Insurance", ref: "Motor Vehicles Act, 1988 — Section 146", d: "Third-party insurance is compulsory for motor vehicles used in public places. Driving without it is penalised (Section 196).", link: OFFICIAL_LINKS.parivahan },
  { t: "PUC Certificate", ref: "Central Motor Vehicles Rules, 1989 — Rule 115", d: "Shows the vehicle meets emission norms. Validity depends on the vehicle type and state notification — check the certificate.", link: OFFICIAL_LINKS.parivahan },
  { t: "Fitness Certificate", ref: "Motor Vehicles Act, 1988 — Section 56", d: "Required for transport vehicles; validity varies by vehicle type and age.", link: OFFICIAL_LINKS.vahan },
  { t: "Permit", ref: "Motor Vehicles Act, 1988 — Section 66", d: "Required for transport vehicles operating for hire or reward, unless exempt.", link: OFFICIAL_LINKS.parivahan },
];

export default function CompliancePage() {
  const { user } = useApp();
  const docs = useFetch<{ documents: UserDoc[] }>(user ? "/api/documents" : null);
  return (
    <>
      <PageHeader title="Insurance, PUC & Vehicle Document Compliance" icon={<FileCheck className="h-5 w-5" />} description="What documents you need, why, and how your own documents are doing." actions={<LinkButton href="/documents" size="sm">Manage my documents</LinkButton>} />
      <div className="mb-4 space-y-2"><DemoBanner /><Notice tone="blue">Commercial vehicles have additional requirements (fitness, permits). Do not rely on private-car checklists for buses, trucks or taxis — see <a className="underline" href="/permits">Commercial Permits</a>.</Notice></div>
      <div className="grid gap-4 md:grid-cols-2">
        {INFO.map((i) => (
          <Card key={i.t} className="space-y-2"><div className="flex items-center justify-between"><h2 className="font-semibold">{i.t}</h2><StatusBadge status="pending" /></div><p className="text-sm">{i.d}</p><p className="text-xs text-muted">Legal reference: {i.ref}</p>
            <LinkButton href={i.link} external size="sm" variant="secondary">Official portal</LinkButton></Card>
        ))}
      </div>
      <Card className="mt-6"><h2 className="mb-2 font-semibold">Your compliance snapshot</h2>
        {!user ? <p className="text-sm text-muted">Log in to see the status of your saved documents.</p> : docs.loading ? <p className="text-sm text-muted">Loading…</p> : (
          <ul className="grid gap-1 text-sm sm:grid-cols-2">{Object.entries(DOC_TYPES).map(([k, v]) => { const d = docs.data?.documents.find((x) => x.docType === k); const s = d ? docStatus(d.expiryDate) : "Not provided"; return <li key={k} className="flex items-center justify-between rounded-lg border border-line px-3 py-1.5"><span>{v}</span><Badge tone={STATUS_TONE[s]}>{s}</Badge></li>; })}</ul>
        )}
      </Card>
    </>
  );
}
