"use client";
import { IdCard } from "lucide-react";
import { ServiceExplorer } from "@/components/ServiceExplorer";
import { useApp } from "@/components/Providers";

export default function Page() {
  const { t } = useApp();
  return <ServiceExplorer kind="license" title={t("nav.licence")} icon={<IdCard className="h-5 w-5" />} portalName="Sarathi Parivahan" portalUrl="https://sarathi.parivahan.gov.in/"
    description="Learner's licence, permanent licence, renewal, duplicate, address change, name correction, additional vehicle class, International Driving Permit, status and driving-test preparation." />;
}
