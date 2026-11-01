"use client";
import { Receipt, ShieldAlert } from "lucide-react";
import { Card, LinkButton, Notice, PageHeader } from "@/components/ui";
import { OFFICIAL_LINKS } from "@/lib/constants";

export default function ChallanPage() {
  return (
    <>
      <PageHeader title="Challan Information" icon={<Receipt className="h-5 w-5" />} description="How traffic challans work and how to reach the official eChallan portal. DriveLegal AI does not look up, pay or dispute challans on your behalf." actions={<LinkButton href={OFFICIAL_LINKS.echallan} external variant="accent" size="sm">Open eChallan portal</LinkButton>} />
      <div className="space-y-4">
        <Notice tone="red" title="Protect yourself from fake challan messages"><p>Only pay challans on the official government portal. Never share OTPs or passwords, and be careful with links received by SMS or WhatsApp. DriveLegal AI never asks for them.</p></Notice>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><h2 className="mb-2 font-semibold">What is a challan?</h2><p className="text-sm text-muted">A challan is a notice of a traffic violation issued by the traffic police or an enforcement authority, specifying the offence and the penalty. Penalties derive from the Motor Vehicles Act, 1988, as amended, and from any applicable state notifications.</p></Card>
          <Card><h2 className="mb-2 font-semibold">Check the amount before you pay</h2><p className="text-sm text-muted">Use the Fine Calculator to see the recorded central/state penalty with its legal section and verification status. If the calculator shows a verification warning, rely on the official source.</p><div className="mt-3"><LinkButton href="/fines" size="sm" variant="secondary">Open Fine Calculator</LinkButton></div></Card>
        </div>
        <Card>
          <h2 className="mb-3 font-semibold">Steps on the official portal</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>Open the official eChallan portal (button above) — check the address is <code>echallan.parivahan.nic.in</code>.</li>
            <li>Choose the option to check a challan status and enter the identifiers the portal asks for (challan, vehicle or licence number).</li>
            <li>Review the offence, section and amount. Compare with the recorded penalty here.</li>
            <li>Pay online through the portal, or follow the portal&apos;s instructions for contesting a challan or using virtual courts where your state offers them.</li>
            <li>Keep the payment receipt. Some states also run their own traffic-police portals — confirm which one applies to your challan.</li>
          </ol>
        </Card>
        <Notice tone="amber" title="Limits of this page"><p className="flex items-start gap-1"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />No live eChallan integration exists in this build. Real-time challan lookup would require an authorised data-sharing arrangement with the government.</p></Notice>
      </div>
    </>
  );
}
