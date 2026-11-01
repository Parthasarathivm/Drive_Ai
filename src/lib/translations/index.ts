import { en } from "./en";
import { ta } from "./ta";
import { hi } from "./hi";
import { te } from "./te";
import { ml } from "./ml";
import { kn } from "./kn";
import { bn } from "./bn";
import { mr } from "./mr";
import { gu } from "./gu";
import { pa } from "./pa";
import { or } from "./or";
import { as } from "./as";

export const DICTIONARIES: Record<string, Record<string, string>> = {
  en,
  ta,
  hi,
  te,
  ml,
  kn,
  bn,
  mr,
  gu,
  pa,
  or,
  as,
};

export function getDictionary(lang: string): Record<string, string> {
  const base = DICTIONARIES.en;
  const target = DICTIONARIES[lang] || base;
  return { ...base, ...target };
}

export { en, ta, hi, te, ml, kn, bn, mr, gu, pa, or, as };
