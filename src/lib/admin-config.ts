// Client-safe field definitions for the generic Admin → Data management screens.
import { LEGAL_TOPICS, LOCATION_TYPES, PROTECTED_CLASSES, VEHICLE_CATEGORIES, VIOLATIONS } from "@/lib/constants";

export type FieldType = "text" | "textarea" | "number" | "select" | "multi" | "boolean" | "date" | "lines" | "state";
export type Field = { name: string; label: string; type: FieldType; options?: { value: string; label: string }[]; required?: boolean; help?: string };
export type EntityConfig = {
  key: string; label: string; roles: string[]; hasStatus: boolean; titleField: string; columns: string[]; fields: Field[];
};

const vehicleOpts = [{ value: "*", label: "All vehicles" }, ...VEHICLE_CATEGORIES.map((v) => ({ value: v.slug, label: v.name }))];
const t = (name: string, label: string, required = false): Field => ({ name, label, type: "text", required });
const ta = (name: string, label: string): Field => ({ name, label, type: "textarea" });
const num = (name: string, label: string): Field => ({ name, label, type: "number" });
const st: Field = { name: "stateId", label: "State / UT (blank = central)", type: "state" };

export const ENTITY_CONFIGS: EntityConfig[] = [
  {
    key: "penalties", label: "Penalties", roles: ["data_manager"], hasStatus: true, titleField: "violationName",
    columns: ["violationName", "stateCode", "baseAmount", "verificationStatus"],
    fields: [
      { name: "violationKey", label: "Violation category", type: "select", required: true, options: VIOLATIONS.map((v) => ({ value: v.key, label: v.name })) },
      t("violationName", "Violation name", true), t("legalSection", "Legal section / provision", true), st,
      { name: "vehicleCategories", label: "Applicable vehicle categories", type: "multi", options: vehicleOpts, required: true },
      num("baseAmount", "Base penalty (₹) — fixed or upper bound"), num("minAmount", "Minimum (₹) if a range"), num("repeatAmount", "Repeat-offence penalty (₹)"),
      num("additionalAmount", "Additional penalty (₹)"), t("additionalUnit", "Additional penalty unit (e.g. per tonne)"),
      ta("imprisonment", "Imprisonment / other penalty"), ta("otherConsequences", "Other consequences"), ta("repeatConditions", "Repeat-offence conditions"),
      ta("stateAmendment", "State amendment information"), { name: "effectiveFrom", label: "Effective from", type: "date" }, t("sourceUrl", "Official source URL"), ta("notes", "Notes"),
    ],
  },
  {
    key: "legal_rules", label: "Legal rules", roles: ["data_manager", "legal_reviewer"], hasStatus: true, titleField: "title",
    columns: ["title", "topic", "stateCode", "verificationStatus"],
    fields: [
      t("title", "Rule title", true), { name: "topic", label: "Legal topic", type: "select", required: true, options: LEGAL_TOPICS.map((x) => ({ value: x, label: x })) }, t("category", "Rule category", true), st, t("district", "District"),
      { name: "jurisdictionLevel", label: "Jurisdiction level", type: "select", options: ["central", "state", "district", "local"].map((x) => ({ value: x, label: x })) },
      { name: "vehicleCategories", label: "Applicable vehicle categories", type: "multi", options: vehicleOpts, required: true },
      t("legalReference", "Legal reference (Act / section / notification)", true), ta("originalText", "Original legal text (verbatim)"), ta("explanation", "Plain-language explanation"),
      ta("conditions", "Conditions"), ta("exceptions", "Exceptions"), { name: "effectiveFrom", label: "Effective from", type: "date" }, { name: "effectiveUntil", label: "Effective until", type: "date" }, t("sourceUrl", "Official source URL"),
    ],
  },
  {
    key: "permits", label: "Permits", roles: ["data_manager"], hasStatus: true, titleField: "name", columns: ["name", "permitType", "scope", "verificationStatus"],
    fields: [
      t("name", "Permit name", true),
      { name: "permitType", label: "Permit type", type: "select", required: true, options: ["national", "state", "goods", "tourist", "contract_carriage", "stage_carriage", "other"].map((x) => ({ value: x, label: x })) },
      { name: "scope", label: "Scope", type: "select", options: ["state", "interstate", "national"].map((x) => ({ value: x, label: x })) },
      t("legalReference", "Legal reference"), ta("description", "Description"), { name: "applicableVehicles", label: "Applicable vehicles", type: "multi", options: vehicleOpts },
      { name: "requirements", label: "Requirements (one per line)", type: "lines" }, ta("renewalInfo", "Renewal information"), ta("feeInfo", "Fee information (only if verified)"), t("officialUrl", "Official URL"),
    ],
  },
  {
    key: "protected_areas", label: "Protected areas", roles: ["data_manager"], hasStatus: true, titleField: "name", columns: ["name", "classification", "stateCode", "verificationStatus"],
    fields: [
      t("name", "Name", true), { name: "classification", label: "Classification", type: "select", required: true, options: Object.entries(PROTECTED_CLASSES).map(([value, label]) => ({ value, label })) }, st, t("district", "District"), t("authority", "Responsible authority"),
      ta("vehicleEntry", "Vehicle entry information"), ta("permitInfo", "Permit information"), ta("bookingInfo", "Booking information"), ta("entryConditions", "Entry conditions"), ta("timings", "Official entry timings"),
      ta("touristVehicleRestrictions", "Tourist vehicle restrictions"), ta("parkingRestrictions", "Parking restrictions"), ta("cameraDroneRules", "Photography / drone rules"), ta("closures", "Temporary closures (verified only)"), ta("ecoSensitiveZone", "Eco-Sensitive Zone information"), t("officialUrl", "Official URL"), ta("notes", "Notes"),
    ],
  },
  {
    key: "locations", label: "Travel locations", roles: ["data_manager"], hasStatus: true, titleField: "name", columns: ["name", "type", "stateCode", "verificationStatus"],
    fields: [
      t("name", "Name", true), { name: "type", label: "Type", type: "select", required: true, options: Object.entries(LOCATION_TYPES).map(([value, label]) => ({ value, label })) }, st, t("district", "District"),
      ta("description", "Description"), ta("restrictions", "Restrictions"), ta("permitInfo", "Permit information"), ta("vehicleNotes", "Vehicle notes"), t("officialUrl", "Official URL"),
    ],
  },
  {
    key: "license_services", label: "Licence services", roles: ["data_manager"], hasStatus: true, titleField: "title", columns: ["title", "category", "verificationStatus"],
    fields: [t("title", "Title", true), t("category", "Category"), ta("description", "Description"), ta("eligibility", "Eligibility"), { name: "documents", label: "Documents (one per line)", type: "lines" }, { name: "steps", label: "Steps (one per line)", type: "lines" }, ta("feeInfo", "Fee information (only if verified)"), t("officialUrl", "Official URL")],
  },
  {
    key: "vehicle_services", label: "Vehicle services", roles: ["data_manager"], hasStatus: true, titleField: "title", columns: ["title", "category", "verificationStatus"],
    fields: [t("title", "Title", true), t("category", "Category"), ta("description", "Description"), ta("eligibility", "Eligibility"), { name: "documents", label: "Documents (one per line)", type: "lines" }, { name: "steps", label: "Steps (one per line)", type: "lines" }, { name: "vehicleCategories", label: "Vehicle categories", type: "multi", options: vehicleOpts }, ta("feeInfo", "Fee information (only if verified)"), t("officialUrl", "Official URL")],
  },
  {
    key: "districts", label: "Districts", roles: ["data_manager"], hasStatus: false, titleField: "name", columns: ["name", "stateCode"],
    fields: [{ ...st, label: "State / UT", required: true }, t("name", "District name", true)],
  },
  {
    key: "languages", label: "Languages", roles: ["translator", "data_manager"], hasStatus: false, titleField: "name", columns: ["code", "name", "nativeName", "enabled"],
    fields: [t("code", "Language code (e.g. ur)", true), t("name", "Name", true), t("nativeName", "Native name", true), { name: "enabled", label: "Enabled", type: "boolean" }, t("speechCode", "Speech code (e.g. ur-IN)")],
  },
];

export const REVIEW_ENTITIES: Record<string, string> = {
  rule: "Legal rules", penalty: "Penalties", protected_area: "Protected areas", permit: "Permits", location: "Travel locations", license_service: "Licence services", vehicle_service: "Vehicle services",
};
