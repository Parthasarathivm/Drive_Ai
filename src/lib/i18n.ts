// Centralised UI translation architecture.
// - Full multi-lingual dictionaries supporting 12 Indian languages across 21 namespaces.
// - Dictionaries are seeded into the `translations` table; reviewers can override/approve values in
//   Admin → Translations, and the client overlays those overrides at runtime (/api/translations).
// - Legal text is never stored in these dictionaries; original provisions stay in legal_rules.original_text.

import { DICTIONARIES, getDictionary } from "./translations";

export const UI_KEYS = [
  "nav.home", "nav.dashboard", "nav.services", "nav.licence", "nav.vehicle", "nav.fines", "nav.laws",
  "nav.forest", "nav.travel", "nav.permits", "nav.compliance", "nav.roadSign", "nav.assistant", "nav.gaps",
  "nav.reports", "nav.documents", "nav.notifications", "nav.settings", "nav.login", "nav.register",
  "nav.logout", "nav.admin", "hero.title", "hero.desc", "hero.search", "hero.askAi", "hero.explore",
  "hero.state", "hero.vehicle", "common.language", "common.allStates", "common.allVehicles",
  "common.verified", "common.needsVerification", "common.official", "common.machine", "common.search",
  "section.how", "section.trusted", "section.categories", "how.1", "how.2", "how.3",
] as const;

export type UiKey = (typeof UI_KEYS)[number];

export function builtInDict(lang: string): Record<string, string> {
  return getDictionary(lang);
}

export function hasBuiltIn(lang: string): boolean {
  return !!DICTIONARIES[lang];
}

export const BUILTIN_LANGS = Object.keys(DICTIONARIES);

export { DICTIONARIES };
