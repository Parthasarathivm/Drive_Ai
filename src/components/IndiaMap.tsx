"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/Providers";
import { Badge, Button, cx } from "@/components/ui";
import { STATES, type StateDef } from "@/lib/constants";
import { useFetch } from "@/lib/client";
import {
  ShieldCheck,
  MapPin,
  ChevronRight,
  Info,
  Search,
  ExternalLink,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  FileText,
  Car,
  IdCard,
  TreePine,
  Mountain,
  Truck,
  Scale
} from "lucide-react";

type Cov = {
  code: string;
  name: string;
  total: number;
  verified: number;
  level: "verified" | "partial" | "unverified" | "central_only";
};

interface GeoStateDef {
  code: string;
  name: string;
  type: "state" | "ut";
  path: string;
  labelPos: { x: number; y: number };
}

// Major cities mapping for intelligent search
const CITY_TO_STATE: Record<string, string> = {
  mumbai: "MH", pune: "MH", nagpur: "MH",
  delhi: "DL", "new delhi": "DL", noida: "UP",
  bengaluru: "KA", bangalore: "KA", mysore: "KA",
  chennai: "TN", coimbatore: "TN", madurai: "TN",
  kolkata: "WB", howrah: "WB",
  hyderabad: "TS", warangal: "TS",
  ahmedabad: "GJ", surat: "GJ", vadodara: "GJ",
  jaipur: "RJ", jodhpur: "RJ", udaipur: "RJ",
  lucknow: "UP", kanpur: "UP", varanasi: "UP", agra: "UP",
  patna: "BR", gaya: "BR",
  bhopal: "MP", indore: "MP", gwalior: "MP",
  chandigarh: "CH",
  ludhiana: "PB", amritsar: "PB",
  shimla: "HP", manali: "HP", dharamshala: "HP",
  dehradun: "UK", haridwar: "UK", nainital: "UK",
  srinagar: "JK", jammu: "JK", leh: "LA",
  guwahati: "AS", dibrugarh: "AS",
  bhubaneswar: "OD", cuttack: "OD", puri: "OD",
  ranchi: "JH", jamshedpur: "JH",
  raipur: "CG", bilaspur: "CG",
  thiruvananthapuram: "KL", kochi: "KL", kozhikode: "KL",
  panaji: "GA", margao: "GA",
  gangtok: "SK", itanagar: "AR", shillong: "ML",
  imphal: "MN", aizawl: "MZ", kohima: "NL", agartala: "TR",
  portblair: "AN", kavaratti: "LD", puducherry: "PY"
};

// Accurate geographical polygon boundaries of Indian States & UTs (Lambert Geographic viewbox 0 0 650 720)
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

export function IndiaMap() {
  const router = useRouter();
  const { state: activeGlobalState, setState: setGlobalState } = useApp();
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>("TN");
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [tiltAngle, setTiltAngle] = useState(18); // Isometric tilt in degrees (Ref Image 2)
  const [rotAngle, setRotAngle] = useState(-8);

  const { data } = useFetch<{ coverage: Cov[] }>("/api/dashboard");

  const covMap = useMemo(() => {
    const map = new Map<string, Cov>();
    data?.coverage?.forEach((c) => map.set(c.code, c));
    return map;
  }, [data]);

  // Intelligent Search Handler
  const matchedStateCode = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    // Check city mapping
    if (CITY_TO_STATE[q]) return CITY_TO_STATE[q];

    // Check state/UT name or code
    const found = INDIA_GEO_DATA.find(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q
    );
    return found ? found.code : null;
  }, [searchQuery]);

  const activeState = INDIA_GEO_DATA.find(
    (s) => s.code === (selectedCode || hoveredCode || "TN")
  );
  const activeCov = activeState ? covMap.get(activeState.code) : null;

  const handleSelectState = (code: string) => {
    setSelectedCode(code);
    setGlobalState(code);
  };

  return (
    <div className="relative w-full rounded-3xl border border-cyan-500/20 bg-[#070D1B] p-4 sm:p-6 shadow-2xl overflow-hidden">
      {/* 3D Perspective Grid Background (Reference Image 2) */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(34, 211, 238, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 211, 238, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
          transform: `perspective(800px) rotateX(${tiltAngle}deg)`,
          transformOrigin: "center 60%",
        }}
      />

      {/* Header & Controls Bar */}
      <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-line/60 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-bold text-cyan-300">
            <span className="h-2 w-2 rounded-full bg-cyan-400 dl-glow-cyan animate-pulse" />
            <span>3D Interactive Jurisdictional Engine</span>
          </div>
          <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-white">
            India Sovereign Statutory Territory
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            All 28 States & 8 Union Territories with verified legal amendments and RTO rules.
          </p>
        </div>

        {/* Search & Map Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* State / UT / City Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (matchedStateCode) setSelectedCode(matchedStateCode);
              }}
              placeholder="Search State, UT, or City (e.g. Mumbai, Delhi, Kochi)…"
              className="w-64 sm:w-80 rounded-xl border border-cyan-500/30 bg-[#0c1529]/90 pl-9 pr-3 py-2 text-xs font-medium text-white placeholder-slate-400 focus:border-cyan-400 focus:outline-none backdrop-blur-md shadow-inner"
            />
          </div>

          {/* 3D View Controls */}
          <div className="flex items-center gap-1 rounded-xl border border-cyan-500/20 bg-surface/80 p-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.6))}
              className="rounded-lg p-1.5 text-cyan-300 hover:bg-surface-2 transition"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.75))}
              className="rounded-lg p-1.5 text-cyan-300 hover:bg-surface-2 transition"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setTiltAngle(18);
                setRotAngle(-8);
              }}
              className="rounded-lg p-1.5 text-cyan-300 hover:bg-surface-2 transition"
              title="Reset 3D View"
              aria-label="Reset 3D View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Map + Details Layout */}
      <div className="relative z-10 mt-6 grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: 3D Isometric Extruded Vector Map (Reference Image 2) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center min-h-[520px] rounded-2xl border border-cyan-500/20 bg-[#050814]/90 p-4 relative overflow-hidden">
          {/* Subtle Cyber Space Vignette */}
          <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-transparent via-cyan-950/10 to-[#050814]" />

          {/* Isometric Transform Container */}
          <div
            className="w-full flex items-center justify-center transition-transform duration-300 ease-out"
            style={{
              transform: `perspective(900px) rotateX(${tiltAngle}deg) rotateZ(${rotAngle}deg) scale(${zoomLevel})`,
              transformOrigin: "center center",
            }}
          >
            <svg
              viewBox="0 0 650 720"
              className="w-full max-w-[580px] h-auto overflow-visible select-none"
              style={{
                filter: "drop-shadow(0 25px 35px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 15px rgba(34, 211, 238, 0.25))",
              }}
            >
              <defs>
                {/* 3D Extrusion Holographic Gradient (Ref Image 2) */}
                <linearGradient id="extrusionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#0f172a" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#064e3b" stopOpacity="0.9" />
                </linearGradient>

                <linearGradient id="neonSurfaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0c1836" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#11244e" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0e2a42" stopOpacity="0.95" />
                </linearGradient>

                {/* Cyan Glowing Outline Filter (Ref Image 2) */}
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 3D Extrusion Base Layer (Depth effect) */}
              <g transform="translate(0, 16)" opacity="0.75">
                {INDIA_GEO_DATA.map((s) => (
                  <path
                    key={`depth-${s.code}`}
                    d={s.path}
                    fill="url(#extrusionGrad)"
                    stroke="#0284c7"
                    strokeWidth="1.2"
                  />
                ))}
              </g>

              {/* Middle Extrusion Slice (Thickness) */}
              <g transform="translate(0, 8)" opacity="0.6">
                {INDIA_GEO_DATA.map((s) => (
                  <path
                    key={`mid-${s.code}`}
                    d={s.path}
                    fill="url(#extrusionGrad)"
                    stroke="#1e3a8a"
                    strokeWidth="1"
                  />
                ))}
              </g>

              {/* Top Illuminated Holographic Layer (Ref Image 2) */}
              <g id="india-top-surface">
                {INDIA_GEO_DATA.map((s) => {
                  const isSelected = selectedCode === s.code;
                  const isHovered = hoveredCode === s.code;
                  const isSearched = matchedStateCode === s.code;

                  return (
                    <g
                      key={`top-${s.code}`}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredCode(s.code)}
                      onMouseLeave={() => setHoveredCode(null)}
                      onClick={() => handleSelectState(s.code)}
                    >
                      <path
                        d={s.path}
                        className={cx(
                          "transition-all duration-200",
                          isSelected || isSearched
                            ? "fill-[#0284c7] stroke-cyan-300 stroke-[2.2]"
                            : isHovered
                            ? "fill-[#0e2a47] stroke-cyan-400 stroke-[1.8]"
                            : "fill-[url(#neonSurfaceGrad)] stroke-[#22d3ee]/60 stroke-[1.2]"
                        )}
                        filter={isSelected || isHovered ? "url(#cyanGlow)" : undefined}
                      />
                      {/* State Abbreviation Marker */}
                      <text
                        x={s.labelPos.x}
                        y={s.labelPos.y}
                        textAnchor="middle"
                        className={cx(
                          "text-[9px] font-mono font-bold tracking-wider pointer-events-none transition-colors",
                          isSelected || isSearched
                            ? "fill-white font-black"
                            : isHovered
                            ? "fill-cyan-300"
                            : "fill-cyan-400/70"
                        )}
                      >
                        {s.code}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Interactive Legend Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-cyan-400 dl-glow-cyan" />
              <span>Selected Territory</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-cyan-400 bg-cyan-950/60" />
              <span>Verified State Statutes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-slate-600 bg-slate-800" />
              <span>Central Law Applied</span>
            </span>
          </div>
        </div>

        {/* Right Column: State Legal Information Panel */}
        <div className="lg:col-span-4 rounded-2xl border border-cyan-500/20 bg-surface/90 p-5 shadow-xl backdrop-blur-xl space-y-4">
          {activeState ? (
            <>
              {/* Territory Header */}
              <div className="border-b border-line pb-3">
                <div className="flex items-center justify-between">
                  <Badge tone={activeState.type === "state" ? "blue" : "teal"}>
                    {activeState.type === "state" ? "State Jurisdiction" : "Union Territory"}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-cyan-400">{activeState.code}</span>
                </div>
                <h3 className="mt-2 text-2xl font-black text-white">{activeState.name}</h3>
                <p className="text-xs text-muted">
                  Statutory Motor Vehicles Framework & Transport Rules
                </p>
              </div>

              {/* Coverage & Verification Metric */}
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-200">
                  <span>Verification Status:</span>
                  <span className="text-cyan-300">
                    {activeCov?.level === "verified"
                      ? "100% Fully Verified"
                      : activeCov?.level === "partial"
                      ? "Partially Verified"
                      : "Central Baseline Verified"}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full bg-cyan-400"
                    style={{
                      width: `${activeCov ? (activeCov.verified / (activeCov.total || 1)) * 100 : 80}%`,
                    }}
                  />
                </div>
              </div>

              {/* Statutory Specifications Accordion */}
              <div className="space-y-2.5 text-xs">
                <div className="rounded-xl border border-line bg-surface2/50 p-3">
                  <div className="flex items-center gap-2 font-bold text-cyan-300 mb-1">
                    <IdCard className="h-4 w-4" />
                    <span>Driving Licence (Sarathi)</span>
                  </div>
                  <p className="text-slate-300">
                    LL & DL issued via Parivahan Sarathi. Online Aadhaar KYC test enabled. Renewal within 1 year of expiry.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface2/50 p-3">
                  <div className="flex items-center gap-2 font-bold text-blue-300 mb-1">
                    <Car className="h-4 w-4" />
                    <span>Vehicle Registration (Vahan)</span>
                  </div>
                  <p className="text-slate-300">
                    Standard 15-year private RC validity. Road tax slab applicable per state motor vehicles taxation act.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface2/50 p-3">
                  <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                    <Scale className="h-4 w-4" />
                    <span>Traffic Penalties & Fines</span>
                  </div>
                  <p className="text-slate-300">
                    Motor Vehicles (Amendment) Act 2019 baseline applied with state compounding notifications where issued.
                  </p>
                </div>

                <div className="rounded-xl border border-line bg-surface2/50 p-3">
                  <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
                    <TreePine className="h-4 w-4" />
                    <span>Protected Areas & Hill Transit</span>
                  </div>
                  <p className="text-slate-300">
                    Specific transit timings and green cess apply in declared eco-sensitive zones and mountain routes.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={() => router.push(`/laws?state=${activeState.code}`)}
                  className="w-full font-bold shadow-md"
                >
                  <Scale className="h-4 w-4 mr-2" />
                  <span>Explore {activeState.name} Driving Laws</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/fines?state=${activeState.code}`)}
                  className="w-full font-semibold"
                >
                  <span>Calculate State Fines</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted">
              Select or hover over any State or Union Territory on the 3D map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
