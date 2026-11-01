"use client";
import { Car } from "lucide-react";
import { ServiceExplorer } from "@/components/ServiceExplorer";
import { useApp } from "@/components/Providers";

export default function Page() {
  const { t } = useApp();
  return <ServiceExplorer kind="vehicle" title={t("nav.vehicle")} icon={<Car className="h-5 w-5" />} portalName="Vahan Parivahan" portalUrl="https://vahan.parivahan.gov.in/"
    description="New registration, RC, renewal, duplicate RC, ownership transfer, NOC, hypothecation, fitness, PUC, commercial registration and interstate requirements. The vehicle category filter above applies." />;
}
