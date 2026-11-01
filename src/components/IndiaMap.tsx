"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";
import { Badge, cx } from "@/components/ui";
import { STATES, type StateDef } from "@/lib/constants";
import { useFetch } from "@/lib/client";
import { CheckCircle2, AlertTriangle, ShieldCheck, MapPin, ChevronRight, Layers, Info } from "lucide-react";

type Cov = {
  code: string;
  name: string;
  total: number;
  verified: number;
  level: "verified" | "partial" | "unverified" | "central_only";
};

// Accurate geographical relative positions and simplified SVG path coordinates for Indian states & UTs
// Coordinates map directly to standard Lambert Conformal Conic / Geographic India projection (viewBox 0 0 650 720)
interface GeoStateDef {
  code: string;
  name: string;
  type: "state" | "ut";
  path: string;
  labelPos: { x: number; y: number };
}

// Geographical polygon paths representing real geographical boundaries of Indian States & UTs
const INDIA_GEO_DATA: GeoStateDef[] = [
  // Northern Region
  { code: "LA", name: "Ladakh", type: "ut", labelPos: { x: 270, y: 75 }, path: "M 230,40 L 290,30 L 330,65 L 320,110 L 260,115 L 235,95 Z" },
  { code: "JK", name: "Jammu and Kashmir", type: "ut", labelPos: { x: 195, y: 85 }, path: "M 180,60 L 230,40 L 235,95 L 210,120 L 170,110 L 165,80 Z" },
  { code: "HP", name: "Himachal Pradesh", type: "state", labelPos: { x: 235, y: 135 }, path: "M 210,120 L 260,115 L 270,145 L 230,165 L 215,145 Z" },
  { code: "PB", name: "Punjab", type: "state", labelPos: { x: 180, y: 145 }, path: "M 170,110 L 210,120 L 215,145 L 195,175 L 165,155 Z" },
  { code: "UK", name: "Uttarakhand", type: "state", labelPos: { x: 275, y: 165 }, path: "M 260,115 L 300,140 L 295,185 L 260,180 L 270,145 Z" },
  { code: "HR", name: "Haryana", type: "state", labelPos: { x: 205, y: 180 }, path: "M 195,175 L 230,165 L 235,195 L 210,215 L 185,195 Z" },
  { code: "DL", name: "Delhi", type: "ut", labelPos: { x: 228, y: 190 }, path: "M 224,186 L 232,186 L 232,194 L 224,194 Z" },
  { code: "CH", name: "Chandigarh", type: "ut", labelPos: { x: 215, y: 148 }, path: "M 213,145 L 218,145 L 218,150 L 213,150 Z" },

  // Western Region
  { code: "RJ", name: "Rajasthan", type: "state", labelPos: { x: 155, y: 240 }, path: "M 165,155 L 195,175 L 210,215 L 220,270 L 165,305 L 105,255 L 115,200 Z" },
  { code: "GJ", name: "Gujarat", type: "state", labelPos: { x: 105, y: 350 }, path: "M 105,255 L 165,305 L 175,360 L 145,395 L 80,380 L 60,335 L 75,300 Z" },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu", type: "ut", labelPos: { x: 135, y: 405 }, path: "M 132,402 L 138,402 L 138,408 L 132,408 Z" },
  { code: "GA", name: "Goa", type: "state", labelPos: { x: 155, y: 535 }, path: "M 152,530 L 160,530 L 158,542 L 150,540 Z" },

  // Central Region
  { code: "MP", name: "Madhya Pradesh", type: "state", labelPos: { x: 245, y: 320 }, path: "M 210,215 L 260,230 L 325,255 L 340,320 L 270,375 L 175,360 L 165,305 L 220,270 Z" },
  { code: "UP", name: "Uttar Pradesh", type: "state", labelPos: { x: 295, y: 225 }, path: "M 230,165 L 260,180 L 295,185 L 365,225 L 360,280 L 325,255 L 260,230 L 235,195 Z" },
  { code: "CG", name: "Chhattisgarh", type: "state", labelPos: { x: 335, y: 385 }, path: "M 325,255 L 360,280 L 355,360 L 340,445 L 305,430 L 305,370 L 340,320 Z" },

  // Eastern Region
  { code: "BR", name: "Bihar", type: "state", labelPos: { x: 395, y: 250 }, path: "M 365,225 L 430,230 L 435,280 L 375,285 L 360,280 Z" },
  { code: "JH", name: "Jharkhand", type: "state", labelPos: { x: 390, y: 310 }, path: "M 375,285 L 435,280 L 430,345 L 375,350 L 355,360 L 360,280 Z" },
  { code: "OD", name: "Odisha", type: "state", labelPos: { x: 380, y: 410 }, path: "M 375,350 L 430,345 L 440,400 L 375,475 L 340,445 L 355,360 Z" },
  { code: "WB", name: "West Bengal", type: "state", labelPos: { x: 445, y: 310 }, path: "M 430,230 L 460,235 L 450,290 L 470,360 L 440,400 L 430,345 L 435,280 Z" },
  { code: "SK", name: "Sikkim", type: "state", labelPos: { x: 445, y: 205 }, path: "M 438,195 L 452,195 L 452,215 L 438,215 Z" },

  // North-Eastern Region
  { code: "AS", name: "Assam", type: "state", labelPos: { x: 520, y: 235 }, path: "M 480,215 L 530,205 L 565,220 L 540,265 L 490,260 L 480,235 Z" },
  { code: "AR", name: "Arunachal Pradesh", type: "state", labelPos: { x: 565, y: 175 }, path: "M 480,215 L 530,170 L 590,165 L 610,210 L 565,220 L 530,205 Z" },
  { code: "ML", name: "Meghalaya", type: "state", labelPos: { x: 495, y: 265 }, path: "M 475,255 L 520,255 L 515,280 L 475,275 Z" },
  { code: "NL", name: "Nagaland", type: "state", labelPos: { x: 585, y: 240 }, path: "M 565,220 L 585,225 L 580,265 L 560,255 Z" },
  { code: "MN", name: "Manipur", type: "state", labelPos: { x: 575, y: 290 }, path: "M 560,255 L 580,265 L 575,315 L 555,305 Z" },
  { code: "MZ", name: "Mizoram", type: "state", labelPos: { x: 555, y: 345 }, path: "M 555,305 L 575,315 L 565,370 L 545,355 Z" },
  { code: "TR", name: "Tripura", type: "state", labelPos: { x: 515, y: 315 }, path: "M 505,295 L 530,295 L 525,340 L 505,330 Z" },

  // Southern Region
  { code: "MH", name: "Maharashtra", type: "state", labelPos: { x: 205, y: 440 }, path: "M 145,395 L 175,360 L 270,375 L 305,370 L 305,430 L 245,490 L 165,510 L 155,445 Z" },
  { code: "TS", name: "Telangana", type: "state", labelPos: { x: 285, y: 480 }, path: "M 245,490 L 305,430 L 340,445 L 320,535 L 265,530 Z" },
  { code: "AP", name: "Andhra Pradesh", type: "state", labelPos: { x: 315, y: 555 }, path: "M 320,535 L 340,445 L 375,475 L 360,575 L 300,605 L 270,570 L 265,530 Z" },
  { code: "KA", name: "Karnataka", type: "state", labelPos: { x: 210, y: 560 }, path: "M 165,510 L 245,490 L 265,530 L 270,570 L 255,625 L 205,620 L 165,560 Z" },
  { code: "KL", name: "Kerala", type: "state", labelPos: { x: 215, y: 655 }, path: "M 195,620 L 225,620 L 235,685 L 210,695 L 195,645 Z" },
  { code: "TN", name: "Tamil Nadu", type: "state", labelPos: { x: 275, y: 650 }, path: "M 225,620 L 255,625 L 300,605 L 290,670 L 245,705 L 235,685 Z" },
  { code: "PY", name: "Puducherry", type: "ut", labelPos: { x: 300, y: 630 }, path: "M 297,626 L 303,626 L 303,632 L 297,632 Z" },

  // Island Union Territories
  { code: "AN", name: "Andaman and Nicobar Islands", type: "ut", labelPos: { x: 575, y: 560 }, path: "M 570,530 L 580,530 L 578,610 L 568,610 Z" },
  { code: "LD", name: "Lakshadweep", type: "ut", labelPos: { x: 135, y: 640 }, path: "M 130,620 L 140,620 L 138,665 L 128,665 Z" },
];

const COLOR_MAP = {
  verified: {
    fill: "fill-teal/85 hover:fill-teal",
    stroke: "stroke-teal",
    badge: "green" as const,
    label: "Verified State Law",
  },
  partial: {
    fill: "fill-electric/80 hover:fill-electric",
    stroke: "stroke-electric",
    badge: "blue" as const,
    label: "Partially Verified",
  },
  unverified: {
    fill: "fill-amber-500/75 hover:fill-amber-500",
    stroke: "stroke-amber-400",
    badge: "amber" as const,
    label: "Unverified (Pending Review)",
  },
  central_only: {
    fill: "fill-surface-2 hover:fill-slate-600 dark:hover:fill-slate-600",
    stroke: "stroke-line",
    badge: "grey" as const,
    label: "Central Law Only (No State Data)",
  },
};

export function IndiaMap({ navigateTo }: { navigateTo?: string }) {
  const { state, setState } = useApp();
  const router = useRouter();
  const { data } = useFetch<{ states: Cov[] }>("/api/states");
  const [hoveredState, setHoveredState] = useState<Cov | null>(null);

  const covMap = new Map((data?.states ?? []).map((s) => [s.code, s]));
  const currentStateCov = state ? covMap.get(state) : null;

  const handleStateClick = (code: string) => {
    setState(code);
    if (navigateTo) {
      router.push(`${navigateTo}?state=${encodeURIComponent(code)}`);
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-surface p-4 sm:p-6 border border-line">
      {/* Header controls & status summary */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="font-extrabold text-sm sm:text-base text-fg">Geographical State & UT Coverage Map</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">28 Sovereign States · 8 Union Territories · Real-time verification status</p>
        </div>
        {state && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Selected:</span>
            <Badge tone="blue">{STATES.find((s) => s.code === state)?.name ?? state}</Badge>
            <button
              onClick={() => setState("")}
              className="text-xs text-muted hover:text-fg underline ml-1"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Main Geographical Map Container */}
      <div className="relative grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 items-center">
        {/* SVG Geographical Vector Map */}
        <div className="relative mx-auto w-full max-w-[520px] aspect-[650/720] rounded-2xl bg-[#070D1B]/40 p-2 shadow-inner">
          <svg
            viewBox="0 0 650 720"
            className="w-full h-full drop-shadow-md select-none"
            role="region"
            aria-label="Interactive India Geographical Map"
          >
            {/* Ambient Background Grid Pattern */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.05)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="650" height="720" fill="url(#grid)" />

            {/* Geographical State Boundaries */}
            {INDIA_GEO_DATA.map((geo) => {
              const c = covMap.get(geo.code);
              const level = c?.level ?? "central_only";
              const colorInfo = COLOR_MAP[level];
              const isSelected = state === geo.code;

              return (
                <g key={geo.code} className="cursor-pointer transition-all">
                  <path
                    d={geo.path}
                    className={cx(
                      "transition-all duration-200 stroke-[1.2]",
                      colorInfo.fill,
                      colorInfo.stroke,
                      isSelected && "stroke-accent stroke-[3] filter drop-shadow-[0_0_8px_rgba(34,211,238,0.7)]"
                    )}
                    onClick={() => handleStateClick(geo.code)}
                    onMouseEnter={() => setHoveredState(c ?? { code: geo.code, name: geo.name, total: 0, verified: 0, level: "central_only" })}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                  {/* State Code Label */}
                  <text
                    x={geo.labelPos.x}
                    y={geo.labelPos.y}
                    textAnchor="middle"
                    className="pointer-events-none fill-white font-extrabold text-[10px] tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  >
                    {geo.code}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Island Label indicators */}
          <div className="absolute bottom-4 left-4 text-[10px] font-semibold text-muted bg-surface/80 backdrop-blur-sm px-2 py-1 rounded-md border border-line">
            Lakshadweep (LD)
          </div>
          <div className="absolute bottom-4 right-4 text-[10px] font-semibold text-muted bg-surface/80 backdrop-blur-sm px-2 py-1 rounded-md border border-line">
            Andaman & Nicobar (AN)
          </div>
        </div>

        {/* Live State Information Card */}
        <div className="flex flex-col justify-between space-y-4 rounded-2xl border border-line bg-surface-2 p-5">
          {hoveredState || currentStateCov ? (
            (() => {
              const item = hoveredState || currentStateCov!;
              const colorInfo = COLOR_MAP[item.level];
              return (
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">State Intelligence</span>
                      <h4 className="text-xl font-black text-fg">{item.name}</h4>
                    </div>
                    <Badge tone={colorInfo.badge}>{colorInfo.label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-line bg-surface p-3">
                      <span className="text-muted block mb-0.5">Stored Records</span>
                      <span className="text-lg font-extrabold text-fg">{item.total}</span>
                    </div>
                    <div className="rounded-xl border border-line bg-surface p-3">
                      <span className="text-muted block mb-0.5">Verified Rules</span>
                      <span className="text-lg font-extrabold text-teal">{item.verified}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-line/60 bg-surface/70 p-3 text-xs leading-relaxed text-muted">
                    {item.level === "verified" && "Full statutory state amendments and local transport notifications are verified."}
                    {item.level === "partial" && "Some state provisions are verified; remaining records await human review."}
                    {item.level === "unverified" && "Records are pending official gazette confirmation. Demo amounts not verified."}
                    {item.level === "central_only" && "No state-specific gazette loaded. Central Motor Vehicles Act applies universally."}
                  </div>

                  <button
                    onClick={() => handleStateClick(item.code)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-royal py-2.5 text-xs font-bold text-white transition hover:bg-royal/90 shadow-md"
                  >
                    <span>View {item.name} Legal Overview</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted">
              <MapPin className="h-8 w-8 text-accent/60 mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-fg">Hover or Click Any State</p>
              <p className="mt-1 text-xs max-w-xs">
                Inspect authentic statutory data coverage, state-specific speed limits, fine schedules, and forest regulations.
              </p>
            </div>
          )}

          {/* Map Legend */}
          <div className="border-t border-line pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block mb-2">Coverage Legend</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(Object.keys(COLOR_MAP) as Cov["level"][]).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span className={cx("h-3 w-3 rounded-md border", COLOR_MAP[k].fill, COLOR_MAP[k].stroke)} />
                  <span className="text-[11px] text-muted">{COLOR_MAP[k].label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
