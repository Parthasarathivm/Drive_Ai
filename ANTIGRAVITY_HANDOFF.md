# Antigravity Handoff — DriveLegal AI

## State of the build

A complete multi-page full-stack application: 33 routes, ~55 REST endpoints, 28 database tables, an admin console with human approval workflow, a gap/conflict detection engine, and a provider-agnostic AI layer. `npm run build`, `tsc --noEmit` and `next typegen` pass.

## Completed features

* **Foundation:** design system (navy/royal/teal, light + dark), responsive navbar, sidebar, mobile drawer, toasts, skeletons, empty/error states, searchable dropdowns, confirm dialogs, status badges, source-citation panels, legal footer disclaimer, Indian-script font stack.
* **Home / Dashboard / Services:** hero + search, state/vehicle/language selectors, tile-grid India map coloured by real coverage, module cards, live trust counters, Recharts dashboards computed from DB rows.
* **Licence & Vehicle services:** 10 licence and 14 vehicle services with eligibility, documents, steps, state-note slot, official portal links; fees intentionally empty (unverified).
* **Fine calculator:** 16 violation categories, state/vehicle filtering, repeat offence, extra tonnes, verified-only calculation, draft references, state comparison, save/download/print report, eChallan link. Challan information page.
* **Laws explorer:** multilingual keyword search, filters (state, district, vehicle, topic, category, status), per-rule detail with original reference vs explanation, conditions, exceptions, dates, source, verification, on-demand machine translation (needs AI key).
* **Forest & wildlife, Location checker, Route checker, Commercial permits:** rule-based checkers that expose missing information explicitly.
* **Compliance:** per-user documents with consent, masked numbers, expiry status (Valid / Expiring soon / Expired / Not provided / Verification unavailable), reminders at 30/7/1 days, notifications, downloadable report, optional PDF/text date extraction (file not retained).
* **AI Assistant:** language/state/vehicle/topic detection (12 scripts), retrieval from structured records, structured answer (direct answer, location, vehicle, provision, verified info, conditions, source, last verified, uncertainty), original reference separated, voice input and read-aloud (Web Speech API), localised templates for English/Hindi/Tamil in retrieval mode, full-language answers when an AI key is set.
* **Road sign AI:** upload/camera, preview, confidence indicator and low-confidence refusal (needs vision key) + text sign library.
* **Gap & conflict engine:** missing section/date/jurisdiction/vehicle/amount/entry-info detection, central-vs-state penalty conflicts, outdated/never-verified documents and sources, potentially superseded documents, verification checklist, EXAMPLE conflicts clearly labelled. Never picks a winner.
* **Admin:** dashboard, source registry with freshness monitoring, PDF upload + text extraction + AI/heuristic rule extraction, review queue with approve/reject/outdated, rule version history, conflict & gap review, translation management, user/role management, generic data CRUD (penalties, rules, permits, protected areas, locations, services, districts, languages), user feedback, audit log.
* **Security:** scrypt hashing, HTTP-only cookies, DB sessions, RBAC on every admin endpoint (server-enforced), Zod validation, input sanitising, upload type/size/magic-byte checks, rate limiting, audit trail, no secrets in the client.

## Incomplete / known limitations

1. **MongoDB / Atlas Vector Search** — replaced by PostgreSQL; no embeddings. Add `pgvector` + an embedding provider for semantic retrieval.
2. **Email delivery** (password reset, notifications) — not wired; reset link is logged server-side. Add Resend/SES/SMTP in `src/app/api/auth/forgot/route.ts`.
3. **Real legal data** — all seeded legal records are demo/pending and compiled without a reviewer. Seed amounts must be verified against India Code / MoRTH notifications; state amendments, state rules, districts, forest entry rules, permits, fees and timings are **not loaded**. Only 12 states have a handful of districts.
4. **Live integrations** — no Sarathi/Vahan/eChallan APIs (none are claimed), no live traffic/weather/closure feeds, no automatic source-change monitoring (freshness is manual "mark checked").
5. **Translations** — only ~43 UI strings are translated; page bodies, form labels and service text remain English. Introduce a full message catalogue (e.g. next-intl) and human review. Machine-translated AI answers are labelled.
6. **Map** — tile-grid cartogram; no tile map/geocoding/routing. Add Leaflet/MapLibre + a routing API to detect intermediate states automatically.
7. **Scanned-PDF OCR** is not supported (text-based PDFs only).
8. **Rate limiting** is in-memory (per instance). Use Redis/Upstash for multi-instance production.
9. **AI-dependent features** (full-language answers, translation, road-sign recognition, AI rule extraction) need an API key and have not been exercised against a live provider in this build — the request/response code follows the public Gemini/Claude REST formats and degrades gracefully on failure.
10. No automated test suite yet (manual API smoke tests only, below); no CSRF token beyond SameSite=Lax cookies + JSON-only bodies.

## API credentials needed

| Credential | Needed for |
|---|---|
| `GEMINI_API_KEY` **or** `ANTHROPIC_API_KEY` | AI answers in all languages, translation, road-sign vision, AI rule extraction |
| Email provider (not yet integrated) | password reset, reminders by email |
| Map/routing provider (not yet integrated) | embedded maps, automatic route state detection |

## Suggested next steps (priority order)

1. Verify and approve central penalties/rules in Admin → Legal Rule Review; attach original text from India Code PDFs via Source Management.
2. Register state transport-department sources and load verified state penalties (run conflict detection after each load).
3. Add forest-department sources and verified entry rules for the top National Parks/Tiger Reserves.
4. Wire an AI key; test Tamil/Hindi answers and road-sign recognition with real images.
5. Add email delivery, Redis rate limiting, a Playwright test suite and pgvector retrieval.

## Testing results (manual, against the production build)

| Check | Result |
|---|---|
| `next typegen`, `tsc --noEmit`, `npm run build` | Pass |
| Tamil Nadu learner's licence guidance (EN + Tamil question) | Pass — TN detected; state-specific procedure honestly flagged as unverified |
| Fine calculation, verified-only | Pass — pending record returns warning and no total; after reviewer approval returns ₹1,000; signal violation (no amount) shows "Information Not Found"; approval blocked without amount |
| Vehicle-category specificity | Pass — helmet only for two-wheelers; truck permits ≠ private-car rules |
| National Park lookup / forest permit info | Pass — Bandipur returns classification and explicit missing-information list |
| Location / route travel check (TN → HP, Manali) | Pass — states, advisories, missing info, no-live-data notice |
| Hindi question (helmet fine) | Pass — Hindi answer with draft/unverified wording |
| Tamil question | Pass — Tamil detected, localised template |
| Document upload & processing (text) | Pass — consent enforced, expiry suggested, file not retained |
| Admin PDF/text upload → rule extraction | Pass — 3 candidate rules created as pending |
| Gap detection | Pass — gaps generated from real records |
| Conflict detection | Pass — central vs state helmet amount flagged "Potential Conflict" |
| Admin approval workflow | Pass — approve, reject-requires-note, audit log written |
| Auth & permissions | Pass — validation errors, bad login rejected, admin endpoints 401 without a session |
| API error states | Pass — 400 validation, 401, 409, 422 responses verified |
| Mobile layouts | Layouts are responsive (mobile-first Tailwind, drawer navigation) but were not exercised on physical devices in this build |

Test data was removed afterwards; the database ships clean, so the first registered user becomes Super Admin.
