# DRIVELEGAL AI — CYBER-SOVEREIGNTY UI DESIGN SYSTEM

**Brand Identity:** India's Unified AI-Powered Driving, Transport and Legal Intelligence Platform  
**Primary Tagline:** *Every Road. Every Rule. Every Service. In Your Language.*  
**Secondary Tagline:** *Know the Law Before You Drive.*  
**Brand Personality:** Intelligent, Trustworthy, Premium, Futuristic, Indian Mobility-Focused, Legally Responsible, Professional.

---

## 1. COLOR ARCHITECTURE & TOKEN HIERARCHY

The DriveLegal AI color system evokes digital governance, modern highway infrastructure, and high-tech automotive cockpits.

### 1.1 Dark Theme (Primary Experience)
- **Primary Background (Obsidian Night):** `#070D1B`
- **Secondary Background (Deep Navvy):** `#0C1529`
- **Card / Surface (High-Tech Cockpit):** `#111E35`
- **Surface Elevation 2 (Hover / Elevated):** `#182846`
- **Primary Blue:** `#2563EB`
- **Electric Blue (Interactive / Accent):** `#3B82F6`
- **Cyan Accent (Glow / Highlights):** `#22D3EE`
- **Teal / Emerald (Verified Status):** `#14B8A6`
- **Warning / Needs Verification (Amber):** `#F59E0B`
- **Conflict / Danger (Crimson Red):** `#EF4444`
- **Primary Text:** `#F8FAFC` (Slate 50)
- **Secondary Text:** `#A7B4CC` (Slate 400)
- **Border / Outline:** `rgba(148, 163, 184, 0.16)`
- **Glow Highlight:** `0 0 25px rgba(34, 211, 238, 0.15)`

### 1.2 Light Mode (Clean Executive Experience)
- **Primary Background:** `#F8FAFC` (Porcelain Slate)
- **Secondary Background:** `#EDF2F7` (Soft Pearl)
- **Card / Surface:** `#FFFFFF`
- **Primary Text:** `#0B1B3A` (Deep Navy)
- **Secondary Text:** `#4B5E7E`
- **Border:** `#E2E8F0`

---

## 2. TYPOGRAPHY & MULTI-SCRIPT STACK

To provide crisp, authentic typography across India's constitutional languages, DriveLegal AI uses the unified Google Noto Sans family with fallback to Inter and system sans-serif fonts:

```css
--font-sans: "Inter", "Noto Sans", system-ui, -apple-system, "Segoe UI",
  "Noto Sans Devanagari", /* Hindi, Marathi */
  "Noto Sans Tamil",      /* Tamil */
  "Noto Sans Telugu",     /* Telugu */
  "Noto Sans Malayalam",  /* Malayalam */
  "Noto Sans Kannada",    /* Kannada */
  "Noto Sans Bengali",    /* Bengali, Assamese */
  "Noto Sans Gujarati",   /* Gujarati */
  "Noto Sans Gurmukhi",   /* Punjabi */
  "Noto Sans Oriya",      /* Odia */
  sans-serif;
```

---

## 3. 3D VISUAL ASSETS & REUSABLE COMPONENTS

### 3.1 `RoadScene3D`
- Procedural multi-lane Indian highway with perspective depth.
- Animated dashed lines indicating legal speed limit velocity.
- 3D vehicle model with realistic reflective finish and dual cyan headlights.
- Ambient light trails receding towards a misty horizon.
- Reduced-motion toggle and responsive mobile static fallback.

### 3.2 `IndiaMap3D` / Vector Geographic Map
- Authentic 28 States + 8 Union Territories vector geographic boundaries.
- Dynamic data binding: fills each state according to live database verification percentage.
- Interactive hover tooltip with state legal record count and transport advisories.
- Instant click navigation to state-specific laws, fines, and services.

### 3.3 Core UI Primitives
- **`GlassPanel`**: Translucent container with `backdrop-blur-md`, subtle border glow, and depth shadow.
- **`GlowButton`**: Automotive-grade CTA button with hover gradient flare and tactile spring transition.
- **`AnimatedCounter`**: Smooth numeric counter for verified statutes, active penalties, and monitored gazettes.
- **`StatusPill`**: Verified (Emerald), Needs Verification (Amber), Potential Conflict (Crimson), Central Law Only (Slate).
- **`SourceCitationPanel`**: Dedicated citation drawer showing Act, Section, Gazette publication date, and issuing authority.
