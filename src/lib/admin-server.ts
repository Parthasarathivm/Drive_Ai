import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as S from "@/db/schema";
import { ApiError, sanitize } from "@/lib/api";
import { slugify } from "@/lib/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const ENTITY_TABLES: Record<string, any> = {
  penalties: S.penalties, legal_rules: S.legalRules, permits: S.permits, protected_areas: S.protectedAreas, locations: S.locations,
  license_services: S.licenseServices, vehicle_services: S.vehicleServices, districts: S.districts, languages: S.languages,
};
export const REVIEW_TABLES: Record<string, any> = {
  rule: S.legalRules, penalty: S.penalties, protected_area: S.protectedAreas, permit: S.permits, location: S.locations,
  license_service: S.licenseServices, vehicle_service: S.vehicleServices,
};

export async function stateIdFromCode(code?: string | null) {
  if (!code) return null;
  const [s] = await db.select().from(S.states).where(eq(S.states.code, code.toUpperCase())).limit(1);
  if (!s) throw new ApiError(400, `Unknown state code ${code}.`);
  return s.id;
}

import type { Field } from "@/lib/admin-config";

/** Converts a raw form payload into DB column values according to the field definitions. */
export async function coerceFields(fields: Field[], raw: Record<string, unknown>, partial: boolean) {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const has = f.name in raw;
    if (!has) {
      if (!partial && f.required) throw new ApiError(400, `${f.label} is required.`);
      continue;
    }
    const v = raw[f.name];
    const empty = v === null || v === undefined || v === "" || (Array.isArray(v) && !v.length);
    if (empty) {
      if (f.required) throw new ApiError(400, `${f.label} is required.`);
      out[f.name] = f.type === "multi" || f.type === "lines" ? [] : f.type === "boolean" ? false : null;
      continue;
    }
    switch (f.type) {
      case "text": case "textarea": case "select": {
        const s = sanitize(String(v));
        if (s.length > 5000) throw new ApiError(400, `${f.label} is too long.`);
        if (f.type === "select" && f.options && !f.options.some((o) => o.value === s)) throw new ApiError(400, `Invalid value for ${f.label}.`);
        out[f.name] = s; break;
      }
      case "number": {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 0 || n > 100_000_000) throw new ApiError(400, `${f.label} must be a positive number.`);
        out[f.name] = Math.round(n); break;
      }
      case "boolean": out[f.name] = v === true || v === "true"; break;
      case "date":
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) throw new ApiError(400, `${f.label} must be YYYY-MM-DD.`);
        out[f.name] = String(v); break;
      case "lines": {
        const arr = Array.isArray(v) ? v.map(String) : String(v).split("\n");
        out[f.name] = arr.map((x) => sanitize(x)).filter(Boolean).slice(0, 60); break;
      }
      case "multi": {
        const arr = (Array.isArray(v) ? v : [v]).map(String);
        if (f.options && arr.some((a) => !f.options!.some((o) => o.value === a))) throw new ApiError(400, `Invalid option for ${f.label}.`);
        out[f.name] = arr; break;
      }
      case "state": out[f.name] = await stateIdFromCode(String(v)); break;
    }
  }
  return out;
}

export function autoKey(entity: string, values: Record<string, unknown>) {
  const base = slugify(String(values.title ?? values.name ?? values.violationName ?? "record")).slice(0, 50);
  const suffix = Math.random().toString(36).slice(2, 7);
  const key = `${base}-${suffix}`;
  if (entity === "penalties") return { recordKey: `custom-${key}` };
  if (entity === "legal_rules") return { ruleKey: `custom-${key}` };
  if (["permits", "protected_areas", "locations", "license_services", "vehicle_services"].includes(entity)) return { slug: key };
  return {};
}
