import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/**
 * DriveLegal AI schema (PostgreSQL / Drizzle).
 * The original spec proposed MongoDB collections; each collection is mapped to a
 * relational table here with jsonb columns where document-style data is useful.
 * Original legal documents, extracted rules (legal_rules) and AI/human explanations
 * are kept in separate tables.
 */

const ts = (name: string) => timestamp(name, { withTimezone: true });
type Verification = "pending" | "verified" | "rejected" | "outdated";

export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// ---------- Auth ----------
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    preferredLanguage: text("preferred_language").notNull().default("en"),
    preferredState: text("preferred_state"),
    preferredVehicle: text("preferred_vehicle"),
    notifySettings: jsonb("notify_settings")
      .$type<{ documentExpiry: boolean; reportUpdates: boolean; sourceChanges: boolean }>()
      .notNull()
      .default({ documentExpiry: true, reportUpdates: true, sourceChanges: false }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // super_admin | legal_reviewer | data_manager | translator | user
  },
  (t) => [uniqueIndex("user_roles_unique").on(t.userId, t.role)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    tokenHash: text("token_hash").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: ts("expires_at").notNull(),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_idx").on(t.tokenHash)],
);

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  usedAt: ts("used_at"),
});

// ---------- Reference data ----------
export const states = pgTable(
  "states",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull().$type<"state" | "ut">(),
  },
  (t) => [uniqueIndex("states_code_idx").on(t.code)],
);

export const districts = pgTable(
  "districts",
  {
    id: serial("id").primaryKey(),
    stateId: integer("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
  },
  (t) => [uniqueIndex("districts_unique").on(t.stateId, t.name)],
);

export const vehicleCategories = pgTable(
  "vehicle_categories",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    isCommercial: boolean("is_commercial").notNull().default(false),
    description: text("description"),
  },
  (t) => [uniqueIndex("vehicle_categories_slug_idx").on(t.slug)],
);

export const languages = pgTable("languages", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  nativeName: text("native_name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  speechCode: text("speech_code"),
});

export const locations = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(), // hill_station | tourist_destination | coastal | island | restricted_zone | forest_road | mountain_road
    stateId: integer("state_id").references(() => states.id),
    district: text("district"),
    description: text("description"),
    restrictions: text("restrictions"),
    permitInfo: text("permit_info"),
    vehicleNotes: text("vehicle_notes"),
    officialUrl: text("official_url"),
    sourceId: integer("source_id"),
    verificationStatus: text("verification_status").$type<Verification>().notNull().default("pending"),
    lastVerifiedAt: ts("last_verified_at"),
    isDemo: boolean("is_demo").notNull().default(true),
  },
  (t) => [uniqueIndex("locations_slug_idx").on(t.slug), index("locations_state_idx").on(t.stateId)],
);

// ---------- Legal sources & documents ----------
export const legalSources = pgTable(
  "legal_sources",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    purpose: text("purpose"),
    authority: text("authority"),
    jurisdictionLevel: text("jurisdiction_level").notNull().default("central"),
    stateId: integer("state_id").references(() => states.id),
    isOfficial: boolean("is_official").notNull().default(true),
    checkFrequencyDays: integer("check_frequency_days").notNull().default(90),
    lastCheckedAt: ts("last_checked_at"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("legal_sources_slug_idx").on(t.slug)],
);

export const legalDocuments = pgTable(
  "legal_documents",
  {
    id: serial("id").primaryKey(),
    slug: text("slug"),
    sourceId: integer("source_id").references(() => legalSources.id),
    title: text("title").notNull(),
    docType: text("doc_type").notNull().default("act"), // act | rules | notification | circular | pdf | other
    stateId: integer("state_id").references(() => states.id),
    issuingAuthority: text("issuing_authority"),
    publishedDate: date("published_date", { mode: "string" }),
    effectiveDate: date("effective_date", { mode: "string" }),
    supersededById: integer("superseded_by_id"),
    status: text("status").notNull().default("active"), // active | superseded | outdated | pending
    url: text("url"),
    fileName: text("file_name"),
    fileSha256: text("file_sha256"),
    extractedText: text("extracted_text"),
    extractionStatus: text("extraction_status").notNull().default("none"), // none | extracted | failed
    uploadedBy: integer("uploaded_by"),
    lastVerifiedAt: ts("last_verified_at"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("legal_documents_slug_idx").on(t.slug)],
);

export const legalRules = pgTable(
  "legal_rules",
  {
    id: serial("id").primaryKey(),
    ruleKey: text("rule_key").notNull(),
    title: text("title").notNull(),
    topic: text("topic").notNull(),
    category: text("category").notNull(),
    stateId: integer("state_id").references(() => states.id),
    district: text("district"),
    jurisdictionLevel: text("jurisdiction_level").notNull().default("central"),
    vehicleCategories: jsonb("vehicle_categories").$type<string[]>().notNull().default([]),
    legalReference: text("legal_reference"),
    originalText: text("original_text"), // original legal wording — never translated/altered
    explanation: text("explanation"), // plain-language explanation (English master)
    conditions: text("conditions"),
    exceptions: text("exceptions"),
    effectiveFrom: date("effective_from", { mode: "string" }),
    effectiveUntil: date("effective_until", { mode: "string" }),
    sourceId: integer("source_id").references(() => legalSources.id),
    documentId: integer("document_id").references(() => legalDocuments.id),
    sourceUrl: text("source_url"),
    verificationStatus: text("verification_status").$type<Verification>().notNull().default("pending"),
    reviewerId: integer("reviewer_id"),
    lastVerifiedAt: ts("last_verified_at"),
    extractedBy: text("extracted_by").notNull().default("manual"), // manual | seed | ai | heuristic
    isDemo: boolean("is_demo").notNull().default(false),
    version: integer("version").notNull().default(1),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("legal_rules_key_idx").on(t.ruleKey),
    index("legal_rules_state_idx").on(t.stateId),
    index("legal_rules_topic_idx").on(t.topic),
    index("legal_rules_status_idx").on(t.verificationStatus),
  ],
);

export const ruleVersions = pgTable("rule_versions", {
  id: serial("id").primaryKey(),
  ruleId: integer("rule_id")
    .notNull()
    .references(() => legalRules.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
  changedBy: integer("changed_by"),
  changeNote: text("change_note"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const penalties = pgTable(
  "penalties",
  {
    id: serial("id").primaryKey(),
    recordKey: text("record_key").notNull(),
    violationKey: text("violation_key").notNull(),
    violationName: text("violation_name").notNull(),
    category: text("category"),
    legalSection: text("legal_section"),
    stateId: integer("state_id").references(() => states.id), // null = central law
    jurisdictionLevel: text("jurisdiction_level").notNull().default("central"),
    vehicleCategories: jsonb("vehicle_categories").$type<string[]>().notNull().default([]), // ["*"] = all
    baseAmount: integer("base_amount"), // fixed amount or upper bound of range (INR)
    minAmount: integer("min_amount"), // lower bound if a range
    repeatAmount: integer("repeat_amount"),
    additionalAmount: integer("additional_amount"),
    additionalUnit: text("additional_unit"),
    imprisonment: text("imprisonment"),
    otherConsequences: text("other_consequences"),
    repeatConditions: text("repeat_conditions"),
    stateAmendment: text("state_amendment"),
    effectiveFrom: date("effective_from", { mode: "string" }),
    sourceId: integer("source_id").references(() => legalSources.id),
    sourceUrl: text("source_url"),
    verificationStatus: text("verification_status").$type<Verification>().notNull().default("pending"),
    reviewerId: integer("reviewer_id"),
    lastVerifiedAt: ts("last_verified_at"),
    notes: text("notes"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("penalties_key_idx").on(t.recordKey),
    index("penalties_violation_idx").on(t.violationKey),
    index("penalties_state_idx").on(t.stateId),
  ],
);

// ---------- Services ----------
export const licenseServices = pgTable(
  "license_services",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull().default("licence"),
    description: text("description"),
    eligibility: text("eligibility"),
    documents: jsonb("documents").$type<string[]>().notNull().default([]),
    steps: jsonb("steps").$type<string[]>().notNull().default([]),
    feeInfo: text("fee_info"),
    stateNotes: jsonb("state_notes").$type<Record<string, string>>().notNull().default({}),
    officialUrl: text("official_url"),
    sourceId: integer("source_id").references(() => legalSources.id),
    verificationStatus: text("verification_status").$type<Verification>().notNull().default("pending"),
    lastVerifiedAt: ts("last_verified_at"),
    isDemo: boolean("is_demo").notNull().default(true),
  },
  (t) => [uniqueIndex("license_services_slug_idx").on(t.slug)],
);

export const vehicleServices = pgTable(
  "vehicle_services",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category").notNull().default("registration"),
    description: text("description"),
    eligibility: text("eligibility"),
    documents: jsonb("documents").$type<string[]>().notNull().default([]),
    steps: jsonb("steps").$type<string[]>().notNull().default([]),
    feeInfo: text("fee_info"),
    vehicleCategories: jsonb("vehicle_categories").$type<string[]>().notNull().default([]),
    stateNotes: jsonb("state_notes").$type<Record<string, string>>().notNull().default({}),
    officialUrl: text("official_url"),
    sourceId: integer("source_id").references(() => legalSources.id),
    verificationStatus: text("verification_status").$type<Verification>().notNull().default("pending"),
    lastVerifiedAt: ts("last_verified_at"),
    isDemo: boolean("is_demo").notNull().default(true),
  },
  (t) => [uniqueIndex("vehicle_services_slug_idx").on(t.slug)],
);

export const permits = pgTable(
  "permits",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    permitType: text("permit_type").notNull(), // national | state | goods | tourist | contract_carriage | stage_carriage | other
    scope: text("scope").notNull().default("state"),
    legalReference: text("legal_reference"),
    description: text("description"),
    applicableVehicles: jsonb("applicable_vehicles").$type<string[]>().notNull().default([]),
    requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
    renewalInfo: text("renewal_info"),
    feeInfo: text("fee_info"),
    officialUrl: text("official_url"),
    sourceId: integer("source_id").references(() => legalSources.id),
    verificationStatus: text("verification_status").$type<Verification>().notNull().default("pending"),
    lastVerifiedAt: ts("last_verified_at"),
    isDemo: boolean("is_demo").notNull().default(true),
  },
  (t) => [uniqueIndex("permits_slug_idx").on(t.slug)],
);

export const protectedAreas = pgTable(
  "protected_areas",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    classification: text("classification").notNull(), // national_park | wildlife_sanctuary | tiger_reserve | reserved_forest | ...
    stateId: integer("state_id").references(() => states.id),
    district: text("district"),
    authority: text("authority"),
    vehicleEntry: text("vehicle_entry"),
    permitInfo: text("permit_info"),
    bookingInfo: text("booking_info"),
    entryConditions: text("entry_conditions"),
    timings: text("timings"),
    touristVehicleRestrictions: text("tourist_vehicle_restrictions"),
    parkingRestrictions: text("parking_restrictions"),
    cameraDroneRules: text("camera_drone_rules"),
    closures: text("closures"),
    ecoSensitiveZone: text("eco_sensitive_zone"),
    officialUrl: text("official_url"),
    sourceId: integer("source_id").references(() => legalSources.id),
    verificationStatus: text("verification_status").$type<Verification>().notNull().default("pending"),
    lastVerifiedAt: ts("last_verified_at"),
    notes: text("notes"),
    isDemo: boolean("is_demo").notNull().default(true),
  },
  (t) => [uniqueIndex("protected_areas_slug_idx").on(t.slug), index("protected_areas_state_idx").on(t.stateId)],
);

// ---------- i18n ----------
export const translations = pgTable(
  "translations",
  {
    id: serial("id").primaryKey(),
    lang: text("lang").notNull(),
    key: text("key").notNull(),
    value: text("value").notNull(),
    namespace: text("namespace").notNull().default("ui"),
    source: text("source").notNull().default("machine"), // machine | human
    reviewedBy: integer("reviewed_by"),
    reviewedAt: ts("reviewed_at"),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("translations_unique").on(t.lang, t.key)],
);

// ---------- Intelligence ----------
export const sourceConflicts = pgTable(
  "source_conflicts",
  {
    id: serial("id").primaryKey(),
    conflictKey: text("conflict_key").notNull(),
    title: text("title").notNull(),
    explanation: text("explanation").notNull(),
    sourceA: jsonb("source_a").$type<Record<string, unknown>>(),
    sourceB: jsonb("source_b").$type<Record<string, unknown>>(),
    documentDates: jsonb("document_dates").$type<Record<string, unknown>>(),
    legalProvisions: text("legal_provisions"),
    reason: text("reason").notNull(),
    priority: text("priority").notNull().default("medium"),
    findingStatus: text("finding_status").notNull().default("Potential Conflict"),
    suggestedAction: text("suggested_action").notNull(),
    isExample: boolean("is_example").notNull().default(false),
    reviewStatus: text("review_status").notNull().default("open"), // open | in_review | resolved | dismissed
    reviewerId: integer("reviewer_id"),
    reviewNote: text("review_note"),
    detectedAt: ts("detected_at").notNull().defaultNow(),
    resolvedAt: ts("resolved_at"),
  },
  (t) => [uniqueIndex("source_conflicts_key_idx").on(t.conflictKey)],
);

export const informationGaps = pgTable(
  "information_gaps",
  {
    id: serial("id").primaryKey(),
    gapKey: text("gap_key").notNull(),
    gapType: text("gap_type").notNull(),
    entityType: text("entity_type"),
    entityId: integer("entity_id"),
    title: text("title").notNull(),
    explanation: text("explanation").notNull(),
    sourceA: jsonb("source_a").$type<Record<string, unknown>>(),
    documentDates: jsonb("document_dates").$type<Record<string, unknown>>(),
    legalProvisions: text("legal_provisions"),
    reason: text("reason").notNull(),
    priority: text("priority").notNull().default("medium"),
    findingStatus: text("finding_status").notNull().default("Needs Verification"),
    suggestedAction: text("suggested_action").notNull(),
    isExample: boolean("is_example").notNull().default(false),
    reviewStatus: text("review_status").notNull().default("open"),
    reviewerId: integer("reviewer_id"),
    reviewNote: text("review_note"),
    detectedAt: ts("detected_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("information_gaps_key_idx").on(t.gapKey), index("information_gaps_type_idx").on(t.gapType)],
);

export const verificationRecords = pgTable("verification_records", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  reviewerId: integer("reviewer_id"),
  note: text("note"),
  createdAt: ts("created_at").notNull().defaultNow(),
});

// ---------- User data ----------
export const userDocuments = pgTable(
  "user_documents",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    docType: text("doc_type").notNull(), // licence | rc | insurance | puc | fitness | permit
    label: text("label"),
    maskedNumber: text("masked_number"), // only the last 4 characters are ever stored
    issueDate: date("issue_date", { mode: "string" }),
    expiryDate: date("expiry_date", { mode: "string" }),
    consentGiven: boolean("consent_given").notNull().default(false),
    consentAt: ts("consent_at"),
    notes: text("notes"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("user_documents_user_idx").on(t.userId)],
);

export const documentReminders = pgTable("document_reminders", {
  id: serial("id").primaryKey(),
  userDocumentId: integer("user_document_id")
    .notNull()
    .references(() => userDocuments.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  daysBefore: integer("days_before").notNull(),
  remindOn: date("remind_on", { mode: "string" }).notNull(),
  dismissedAt: ts("dismissed_at"),
});

export const analysisReports = pgTable(
  "analysis_reports",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    reportType: text("report_type").notNull(), // fine | law | compliance | forest | permit | route | gap
    title: text("title").notNull(),
    query: jsonb("query").$type<Record<string, unknown>>().notNull().default({}),
    location: text("location"),
    vehicleCategory: text("vehicle_category"),
    findings: jsonb("findings").$type<unknown[]>().notNull().default([]),
    legalReferences: jsonb("legal_references").$type<string[]>().notNull().default([]),
    sources: jsonb("sources").$type<{ name: string; url: string }[]>().notNull().default([]),
    missingInfo: jsonb("missing_info").$type<string[]>().notNull().default([]),
    uncertaintyNotices: jsonb("uncertainty_notices").$type<string[]>().notNull().default([]),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("analysis_reports_user_idx").on(t.userId)],
);

export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  page: text("page"),
  category: text("category").notNull().default("general"),
  rating: integer("rating"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new | reviewed | closed
  createdAt: ts("created_at").notNull().defaultNow(),
});

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id"),
    userEmail: text("user_email"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: ts("created_at").notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);
