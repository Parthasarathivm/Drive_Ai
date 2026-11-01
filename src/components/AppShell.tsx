"use client";
import type { ReactNode } from "react";
import { NavList } from "@/components/nav";
import { useApp } from "@/components/Providers";
import { Combobox, STATE_OPTIONS } from "@/components/ui";
import { VEHICLE_CATEGORIES } from "@/lib/constants";

/** Global context bar: the selected state & vehicle category feed every module. */
export function ContextBar() {
  const { state, setState, vehicle, setVehicle, t } = useApp();
  return (
    <div className="no-print mb-6 grid gap-3 rounded-2xl border border-line bg-surface p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
      <div>
        <label className="mb-1 block text-xs font-medium text-muted" htmlFor="ctx-state">{t("hero.state")}</label>
        <Combobox id="ctx-state" label={t("hero.state")} options={STATE_OPTIONS(t("common.allStates"))} value={state} onChange={setState} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted" htmlFor="ctx-vehicle">{t("hero.vehicle")}</label>
        <select id="ctx-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30">
          <option value="">{t("common.allVehicles")}</option>
          {VEHICLE_CATEGORIES.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}
        </select>
      </div>
      <p className="self-end text-xs text-muted lg:max-w-[16rem]">Your state and vehicle selection filters laws, fines, permits and travel checks across the platform.</p>
    </div>
  );
}

export function AppShell({ children, noContext }: { children: ReactNode; noContext?: boolean }) {
  return (
    <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6">
      <aside className="no-print hidden w-60 shrink-0 lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1"><NavList /></div>
      </aside>
      <main className="min-w-0 flex-1">
        {!noContext && <ContextBar />}
        {children}
      </main>
    </div>
  );
}
