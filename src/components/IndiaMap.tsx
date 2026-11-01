"use client";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";
import { cx } from "@/components/ui";
import { STATES } from "@/lib/constants";
import { useFetch } from "@/lib/client";

type Cov = { code: string; name: string; total: number; verified: number; level: "verified" | "partial" | "unverified" | "central_only" };
const COLOR: Record<Cov["level"], string> = {
  verified: "bg-green-600 text-white border-green-700",
  partial: "bg-lime-500/80 text-slate-900 border-lime-600",
  unverified: "bg-amber-400 text-slate-900 border-amber-500",
  central_only: "bg-slate-300 text-slate-800 border-slate-400 dark:bg-slate-600 dark:text-slate-100 dark:border-slate-500",
};
const LABEL: Record<Cov["level"], string> = { verified: "State data verified", partial: "Partly verified", unverified: "State data unverified (demo)", central_only: "Central law only — no state data" };

/** Interactive tile-grid map of India's 28 states and 8 UTs (approximate geography). Colour = real data coverage. */
export function IndiaMap({ navigateTo }: { navigateTo?: string }) {
  const { state, setState } = useApp();
  const router = useRouter();
  const { data } = useFetch<{ states: Cov[] }>("/api/states");
  const cov = new Map((data?.states ?? []).map((s) => [s.code, s]));
  return (
    <div>
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5" role="group" aria-label="Interactive map of Indian states and union territories">
        {STATES.map((s) => {
          const c = cov.get(s.code);
          const level = c?.level ?? "central_only";
          return (
            <button key={s.code} style={{ gridColumn: s.col + 1, gridRow: s.row + 1 }}
              onClick={() => { setState(s.code); if (navigateTo) router.push(navigateTo); }}
              title={`${s.name} — ${LABEL[level]}${c ? ` (${c.total} state-level records, ${c.verified} verified)` : ""}`}
              aria-label={`${s.name}: ${LABEL[level]}`} aria-pressed={state === s.code}
              className={cx("aspect-square rounded-md border text-[10px] font-bold transition hover:scale-110 sm:text-xs", COLOR[level], state === s.code && "ring-2 ring-royal ring-offset-2 ring-offset-surface", s.type === "ut" && "rounded-full")}>
              {s.code}
            </button>
          );
        })}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {(Object.keys(LABEL) as Cov["level"][]).map((k) => (
          <li key={k} className="flex items-center gap-1.5"><span className={cx("h-3 w-3 rounded-sm border", COLOR[k])} />{LABEL[k]}</li>
        ))}
        <li>Circles = Union Territories</li>
      </ul>
    </div>
  );
}
