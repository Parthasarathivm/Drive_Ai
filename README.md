# DriveLegal AI

**India's Unified AI-Powered Driving, Transport & Legal Intelligence Platform.**  
*Every Road. Every Rule. Every Service. In Your Language.*  
*Know the Law Before You Drive.*

---

## 1. Overview & Statutory Integrity

DriveLegal AI is India's sovereign, production-grade legal intelligence platform for motorists, commercial operators, transport departments, and citizens. It centralises motor vehicle laws, traffic fine calculators, driving licence protocols, vehicle registration services, commercial permits, interstate travel regulations, and eco-sensitive wildlife corridor guidelines across all **28 States and 8 Union Territories**.

> [!IMPORTANT]
> **Strict Statutory Verification & Anti-Hallucination Directives:**
> * DriveLegal AI is an independent statutory navigation platform and is **not** an official government agency.
> * **Zero-Hallucination Guarantee**: No traffic fine, penalty calculation, or statutory provision is ever invented.
> * All newly entered or AI-extracted legal records start in a `pending` state and **never** contribute to calculated fine totals until certified by an authorized human Legal Reviewer.
> * Unverified penalties are explicitly flagged as *Draft / Unverified Reference*; missing values display *Information Not Found*.
> * Original statutory citations (`legal_rules.original_text`) remain untranslated and pristine.

---

## 2. Technology Architecture

| Layer | Architecture & Technology |
|---|---|
| **Frontend Framework** | **Next.js 16** (App Router, Server Components & Dynamic Client Modules), **React 19**, **TypeScript 5.9** |
| **Styling & Design System** | **Tailwind CSS v4**, Cyber-Sovereignty Theme (`#070D1B` Obsidian, `#0C1529` Deep Navy, `#111E35` Slate Card, `#2563EB` Royal Blue, `#3B82F6` Electric Blue, `#22D3EE` High-Tech Cyan, `#14B8A6` Emerald Verified), Glassmorphism (`.dl-glass`), Noto Sans Indic Multilingual Font Stacks |
| **3D Visualization** | **Three.js (WebGL)**: Procedural 3D Indian Highway (`RoadScene3D`), Interactive 3D Vehicle Simulation (`VehicleModel3D`), National Transit Corridor Network (`RoadNetworkVisualization`), Hardware-Accelerated Geographical India Vector Map (28 States + 8 UTs) |
| **Backend & API** | Next.js API Route Handlers (RESTful, Zod runtime validation, centralized error handler, in-memory IP rate-limiting, audit logging) |
| **Database & ORM** | **PostgreSQL** via **Drizzle ORM** (28 production tables including version snapshots, verification logs, and audit journals) |
| **Authentication & RBAC** | Session cookie (`dl_session`, HTTP-only, SameSite=Lax, SHA-256 session token hashes), **scrypt** cryptographic password hashing with timing-safe comparisons, 5-tier Role-Based Access Control (`super_admin`, `legal_reviewer`, `data_manager`, `translator`, `user`) |
| **AI Intelligence Layer** | Multi-provider abstraction (`Gemini 2.0 Flash` / `Claude 3.5 Sonnet` / Local Retrieval Fallback), RAG grounded exclusively in verified database records, AI road-sign vision analysis, PDF statutory heuristic extraction |
| **Privacy & DPDP Act** | Strict DPDP Act 2023 compliance: explicit user consent, strict last-4 document masking (`DL-*****1234`), ephemeral file processing (uploads discarded immediately after reading dates) |

---

## 3. High-Priority 3D Features

1. **Procedural 3D Indian Highway (`RoadScene3D`):**
   - High-speed perspective camera animation down a multi-lane highway.
   - Dynamic road geometry with animated yellow dash dividers, cyan/electric blue light trails, and atmospheric perspective fog.
   - 3D vehicle model with illuminated cyan headlights, road spotlights, and floating wireframe legal checkpoint markers.
   - Automatic fallback: gracefully degrades to reduced-motion CSS or static canvas on low-power devices.

2. **Interactive 3D Vehicle Model Viewer (`VehicleModel3D`):**
   - Interactive orbit/rotation controls for 5 Indian vehicle categories: Two-Wheelers, Private Motor Cars, Taxis, Buses, and Heavy Commercial Trucks.
   - Real-time statutory badges displaying vehicle-specific speed limits, fitness inspection cycles, and permit requirements.

3. **National Transit Corridor Network (`RoadNetworkVisualization`):**
   - 3D node-and-edge network representing major Indian freight corridors (Golden Quadrilateral, NH44, East-West Corridor).
   - Real-time statutory checkpoint indicators for state border toll gates, weigh stations, and RTO checkpoints.

4. **Geographical Vector India Map (`IndiaMap`):**
   - Fully interactive vector map representing all **28 States and 8 Union Territories**.
   - Hover cards showing live database coverage statistics, active legal rules, recorded penalties, and RTO district networks.
   - Deep-linked state filtering across all legal explorers and fine calculators.

---

## 4. Multilingual Sovereign Font Stack

DriveLegal AI natively supports **12 official Indian languages** with localized UI strings, voice input, and regional speech synthesis:

1. English (`en`)
2. हिन्दी - Hindi (`hi`)
3. தமிழ் - Tamil (`ta`)
4. తెలుగు - Telugu (`te`)
5. മലയാളം - Malayalam (`ml`)
6. ಕನ್ನಡ - Kannada (`kn`)
7. বাংলা - Bengali (`bn`)
8. मराठी - Marathi (`mr`)
9. ગુજરાતી - Gujarati (`gu`)
10. ਪੰਜਾਬੀ - Punjabi (`pa`)
11. ଓଡ଼ିଆ - Odia (`or`)
12. অসমীয়া - Assamese (`as`)

---

## 5. Local Setup & Quickstart

### Prerequisites
- **Node.js**: v20+ (Node v24 recommended)
- **npm**: v10+
- **PostgreSQL**: PostgreSQL 14+ database instance

### Installation Steps

1. **Clone repository and install dependencies:**
   ```bash
   git clone <repo-url> drivelegal-ai
   cd drivelegal-ai
   npm install
   ```

2. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your database connection string:
   ```env
   DATABASE_URL="postgres://username:password@localhost:5432/drivelegal"
   SESSION_COOKIE_SECURE="false" # Set "true" in HTTPS production

   # Optional: AI Provider (Gemini or Claude)
   GEMINI_API_KEY=""
   # or
   ANTHROPIC_API_KEY=""
   ```

3. **Push Database Schema:**
   ```bash
   npx drizzle-kit push
   ```

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

> [!NOTE]
> **Automatic Database Seeding:**
> On the very first API request, DriveLegal AI automatically seeds reference data: all 36 States/UTs, 5 vehicle categories, 12 languages, official government sources, core service timelines, sample rules, and multilingual dictionaries.
>
> **First Registered Account:**
> The first account created via `/register` is automatically granted the **Super Admin** role.

---

## 6. Production Verification & Building

To compile and verify the production build:

```bash
# TypeScript strict type-check
npm run build
```

---

## 7. Official Source Directory

DriveLegal AI indexes and links directly to official Indian transport authorities:
- **Ministry of Road Transport and Highways (MoRTH)**: [morth.nic.in](https://morth.nic.in)
- **Sarathi Parivahan (DL Services)**: [sarathi.parivahan.gov.in](https://sarathi.parivahan.gov.in)
- **Vahan Parivahan (RC & Vehicle Services)**: [vahan.parivahan.gov.in](https://vahan.parivahan.gov.in)
- **eChallan Digital Traffic Enforcement**: [echallan.parivahan.nic.in](https://echallan.parivahan.nic.in)
- **India Code (Statutory Acts Repository)**: [indiacode.nic.in](https://www.indiacode.nic.in)

---

## 8. License & Governance

DriveLegal AI is distributed under the MIT License. Designed and engineered for Indian mobility and statutory excellence.
