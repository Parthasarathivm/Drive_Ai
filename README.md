# DriveLegal AI

**India's unified AI-powered driving, transport, traffic-law and legal-services information platform.**
*Every Road. Every Rule. Every Service. In Your Language.*

> DriveLegal AI is an independent information and service-navigation platform. It is **not** a government website. All legal content in the seed data is **DEMO DATA – NOT VERIFIED LEGAL ADVICE** until a human Legal Reviewer approves it.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide icons, Recharts, React Hook Form + Zod |
| Backend | Next.js route handlers (REST, Zod validation, central error handling, in-memory rate limiting) |
| Database | **PostgreSQL via Drizzle ORM** (see "Deviations" below) |
| Auth | Email + password (scrypt), HTTP-only session cookie, DB-backed sessions, role-based access control |
| AI | Provider-agnostic server-side module (`src/lib/ai.ts`): Gemini or Claude, plus a retrieval-only fallback |

## Quick start

```bash
npm install
cp .env.example .env          # set DATABASE_URL (+ optional AI keys)
npx drizzle-kit push          # create tables (drizzle.config.json)
npm run dev                   # http://localhost:3000
```

Reference data (36 states/UTs, vehicle categories, languages, sources, services, demo rules/penalties, translations) is **seeded automatically and idempotently** on the first API request (`src/lib/seed.ts`).

**First admin:** the *first account registered* becomes **Super Admin**. That user can assign other roles in *Admin → Users & Roles*. (Register your own account immediately after deploying.)

Production: `npm run build && npm start`. Deploy to any Next.js host (Vercel, Render, Railway, Fly) with a managed PostgreSQL instance; set `SESSION_COOKIE_SECURE=true` behind HTTPS.

## Environment variables

See `.env.example`.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` | optional | Enables AI-written multilingual answers, machine translation, road-sign recognition and AI rule extraction. Without a key the assistant answers from stored records (retrieval-only) and road-sign AI reports that no provider is configured |
| `AI_PROVIDER` | optional | `gemini` or `claude` (auto-detected) |
| `AI_MODEL` | optional | Override default model (`gemini-2.0-flash` / `claude-sonnet-4-5`) |
| `SESSION_COOKIE_SECURE` | optional | `true` to mark session cookies Secure (HTTPS deployments) |
| `AUTH_SHOW_RESET_LINK` | optional | `true` (dev only) returns the password-reset link in the API response because no email provider is wired in |

Keys are read only on the server; nothing secret reaches the browser.

## Data integrity rules (enforced in code)

* **No record is seeded as verified.** All legal records start `pending`. Only a Legal Reviewer / Super Admin can approve (`POST /api/admin/rules/approve`), which writes a verification record, a rule version snapshot and an audit-log entry.
* The **fine calculator computes totals only from verified records**. Unverified amounts are shown as clearly labelled draft references; missing amounts show "Information Not Found". Editing an approved record resets it to pending.
* Approval is blocked when a penalty has no section/amount/source or a rule has no legal reference/source.
* Forest/wildlife entry rules, permits, fees and timings are **left empty** rather than guessed; the UI lists exactly what is missing.
* No live traffic/weather/closure data is claimed. Document status "Verification unavailable" is shown because there is no government integration.
* Original legal text (`legal_rules.original_text`) is stored separately from plain-language explanations and is never machine-translated. Machine translations are flagged "not human-reviewed".
* Dashboard statistics are computed from real rows.

## Project layout

```
src/
  app/
    page.tsx                 Home (hero, search, selectors, map, modules, trust section)
    (app)/…                  Sidebar pages: dashboard, services, licence, vehicle, fines, challan, laws,
                             forest, location-checker, route-checker, permits, compliance, documents,
                             notifications, reports, assistant, road-sign, gaps, profile, settings, admin/*
    login | register | forgot-password | reset-password
    api/…                    REST endpoints (see below)
  components/                Providers (i18n/theme/user/toast), ui kit, nav, map, checkers, admin helpers
  db/schema.ts               All tables (users, rules, penalties, sources, documents, conflicts, gaps, …)
  lib/
    seed.ts, seed-data.ts    Idempotent seed + demo data
    legal.ts                 Fine calc, law search, forest check, permit check, route analysis
    intelligence.ts          Gap / conflict / outdated detection engine
    ai.ts                    Provider abstraction, language/state/vehicle/topic detection, assistant (RAG)
    extract.ts, extract-db.ts PDF/text extraction (unpdf), AI/heuristic rule extraction
    auth.ts, api.ts, audit.ts Sessions, RBAC, validation/rate-limit helpers, audit log
    i18n.ts                  12-language UI dictionary (machine-generated) + DB override architecture
```

## API overview

Auth `POST /api/auth/{register,login,logout,forgot,reset}`, `GET|PATCH /api/auth/profile` · Locations `GET /api/{states,districts,locations}` ·
Services `GET /api/license/services[/slug]`, `GET /api/vehicle/services[/slug]` · Laws `GET /api/laws[/id]`, `POST /api/laws/search` ·
Fines `GET /api/fines[?compare=1]`, `POST /api/fines/calculate`, `GET /api/fines/:id` · Permits `GET /api/permits`, `POST /api/permits/check` ·
Protected areas `GET /api/protected-areas[/id]`, `POST /api/protected-areas/check` · `POST /api/routes/analyze` ·
AI `POST /api/ai/{ask,translate,analyze-document}`, `POST /api/road-sign/analyze` ·
Intelligence `GET /api/intelligence/findings`, `POST /api/intelligence/{gap,conflict,outdated}-detection` (staff) ·
User data `GET|POST /api/documents`, `DELETE /api/documents/:id`, `GET|POST /api/notifications`, `GET|POST /api/reports`, `GET|DELETE /api/reports/:id`, `POST /api/feedback` ·
Admin `GET|POST|PATCH /api/admin/sources`, `GET|POST|PATCH /api/admin/documents`, `POST /api/admin/extract`, `POST /api/admin/rules/approve`, `GET /api/admin/review`, `GET /api/admin/dashboard`, `/api/admin/entity/:entity`, `/api/admin/users`, `/api/admin/translations`, `PATCH /api/admin/findings`.

Roles: `super_admin` (everything), `legal_reviewer` (approve/reject, review findings), `data_manager` (sources, documents, data), `translator` (translations), `user`.

## Deviations from the original specification (honest notes)

1. **PostgreSQL + Drizzle instead of MongoDB.** The runtime provides PostgreSQL. All 24 listed collections are mapped to tables (plus `sessions`, `password_resets`, `app_meta`); document-style fields use `jsonb`. Atlas Search / Vector Search are not used — retrieval is keyword/topic based (see Remaining work).
2. **Next.js route handlers instead of Express/FastAPI.** One deployable service; AI logic lives in `src/lib/ai.ts` and could be extracted to a FastAPI service later.
3. **India map is a tile-grid cartogram** (approximate geography, no boundary shapes) to avoid shipping inaccurate borders. Colours show real data coverage.
4. **Map provider:** route/location pages deep-link to OpenStreetMap; no embedded map tiles or geocoding are integrated.
5. **UI translations are machine-generated** for 11 languages (≈43 strings: navigation, hero, key labels). Page bodies, forms and legal content are English unless AI is configured. Translators can review/override strings in Admin → Translations.

## Remaining work / incomplete features

See `ANTIGRAVITY_HANDOFF.md` for the complete list, credentials needed and the testing log.
