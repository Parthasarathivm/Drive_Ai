// Client-safe shared constants (no server imports).

export const DEMO_WARNING = "DEMO DATA - NOT VERIFIED LEGAL ADVICE";

export const LEGAL_DISCLAIMER =
  "DriveLegal AI is an independent information and service-navigation platform. It is not a government website and is not affiliated with or endorsed by any government department unless an authorized partnership is formally established. Legal information is provided for general guidance and must be checked against the applicable official source. Users should confirm important requirements with the relevant authority before taking legal or financial action.";

export type StateDef = { code: string; name: string; type: "state" | "ut"; col: number; row: number };

// col/row = position on the tile-grid map of India (approximate geography, not a survey map)
export const STATES: StateDef[] = [
  { code: "AP", name: "Andhra Pradesh", type: "state", col: 5, row: 6 },
  { code: "AR", name: "Arunachal Pradesh", type: "state", col: 9, row: 2 },
  { code: "AS", name: "Assam", type: "state", col: 8, row: 3 },
  { code: "BR", name: "Bihar", type: "state", col: 6, row: 3 },
  { code: "CG", name: "Chhattisgarh", type: "state", col: 5, row: 4 },
  { code: "GA", name: "Goa", type: "state", col: 3, row: 6 },
  { code: "GJ", name: "Gujarat", type: "state", col: 2, row: 5 },
  { code: "HR", name: "Haryana", type: "state", col: 3, row: 3 },
  { code: "HP", name: "Himachal Pradesh", type: "state", col: 4, row: 1 },
  { code: "JH", name: "Jharkhand", type: "state", col: 6, row: 4 },
  { code: "KA", name: "Karnataka", type: "state", col: 4, row: 6 },
  { code: "KL", name: "Kerala", type: "state", col: 4, row: 7 },
  { code: "MP", name: "Madhya Pradesh", type: "state", col: 4, row: 4 },
  { code: "MH", name: "Maharashtra", type: "state", col: 4, row: 5 },
  { code: "MN", name: "Manipur", type: "state", col: 9, row: 4 },
  { code: "ML", name: "Meghalaya", type: "state", col: 8, row: 4 },
  { code: "MZ", name: "Mizoram", type: "state", col: 9, row: 5 },
  { code: "NL", name: "Nagaland", type: "state", col: 9, row: 3 },
  { code: "OD", name: "Odisha", type: "state", col: 6, row: 5 },
  { code: "PB", name: "Punjab", type: "state", col: 3, row: 2 },
  { code: "RJ", name: "Rajasthan", type: "state", col: 3, row: 4 },
  { code: "SK", name: "Sikkim", type: "state", col: 7, row: 3 },
  { code: "TN", name: "Tamil Nadu", type: "state", col: 5, row: 7 },
  { code: "TS", name: "Telangana", type: "state", col: 5, row: 5 },
  { code: "TR", name: "Tripura", type: "state", col: 8, row: 5 },
  { code: "UP", name: "Uttar Pradesh", type: "state", col: 5, row: 3 },
  { code: "UK", name: "Uttarakhand", type: "state", col: 5, row: 2 },
  { code: "WB", name: "West Bengal", type: "state", col: 7, row: 4 },
  { code: "AN", name: "Andaman and Nicobar Islands", type: "ut", col: 8, row: 8 },
  { code: "CH", name: "Chandigarh", type: "ut", col: 4, row: 2 },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu", type: "ut", col: 3, row: 5 },
  { code: "DL", name: "Delhi", type: "ut", col: 4, row: 3 },
  { code: "JK", name: "Jammu and Kashmir", type: "ut", col: 3, row: 1 },
  { code: "LA", name: "Ladakh", type: "ut", col: 4, row: 0 },
  { code: "LD", name: "Lakshadweep", type: "ut", col: 3, row: 7 },
  { code: "PY", name: "Puducherry", type: "ut", col: 6, row: 7 },
];

export const VEHICLE_CATEGORIES = [
  { slug: "two-wheeler", name: "Two-wheeler", isCommercial: false, description: "Motorcycles, scooters and mopeds" },
  { slug: "private-car", name: "Private car", isCommercial: false, description: "Light motor vehicles used for private purposes" },
  { slug: "taxi", name: "Taxi / rental vehicle", isCommercial: true, description: "Light motor vehicles used as taxi or rental cabs" },
  { slug: "bus", name: "Bus", isCommercial: true, description: "Stage carriage, contract carriage and other buses" },
  { slug: "goods-truck", name: "Goods truck", isCommercial: true, description: "Light and medium goods vehicles" },
  { slug: "heavy-commercial", name: "Heavy commercial vehicle", isCommercial: true, description: "Heavy goods / heavy passenger motor vehicles" },
  { slug: "tourist-vehicle", name: "Tourist vehicle", isCommercial: true, description: "Vehicles operated under tourist permits" },
  { slug: "other", name: "Other vehicle class", isCommercial: false, description: "Tractors, e-rickshaws, special-purpose vehicles etc." },
];

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", speech: "en-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", speech: "ta-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", speech: "hi-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", speech: "te-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", speech: "ml-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", speech: "kn-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", speech: "bn-IN" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", speech: "mr-IN" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", speech: "gu-IN" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", speech: "pa-IN" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", speech: "or-IN" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", speech: "as-IN" },
];

// The 16 violation categories of the fine calculator
export const VIOLATIONS = [
  { key: "no-licence", name: "Driving without a valid licence" },
  { key: "no-insurance", name: "Driving without insurance" },
  { key: "no-registration", name: "Driving without registration" },
  { key: "no-helmet", name: "Not wearing a helmet" },
  { key: "no-seatbelt", name: "Not wearing a seatbelt" },
  { key: "overspeeding", name: "Overspeeding" },
  { key: "signal-violation", name: "Traffic signal violation" },
  { key: "dangerous-driving", name: "Dangerous driving" },
  { key: "mobile-phone", name: "Mobile phone usage while driving" },
  { key: "wrong-side", name: "Wrong-side driving" },
  { key: "drunk-driving", name: "Drunk driving" },
  { key: "overloading", name: "Overloading" },
  { key: "illegal-parking", name: "Illegal parking" },
  { key: "unauthorised-modification", name: "Unauthorised vehicle modification" },
  { key: "pollution", name: "Pollution-related violation (PUC)" },
  { key: "permit-violation", name: "Commercial vehicle permit violation" },
];

export const ROLES = ["super_admin", "legal_reviewer", "data_manager", "translator", "user"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  legal_reviewer: "Legal Reviewer",
  data_manager: "Data Manager",
  translator: "Translator",
  user: "Standard User",
};

export const FINDING_STATUSES = ["Verified", "Needs Verification", "Potential Conflict", "Outdated", "Information Not Found"] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const VERIFICATION_LABEL: Record<string, string> = {
  verified: "Verified (human-reviewed)",
  pending: "Needs Verification",
  rejected: "Rejected",
  outdated: "Outdated",
};

export const LEGAL_TOPICS = [
  "licence", "registration", "helmet", "seatbelt", "speed", "overtaking", "lane", "signals", "markings",
  "parking", "mobile", "drunk-driving", "lighting", "horn", "modification", "accident", "emergency",
  "pedestrian", "school-zone", "highway", "commercial", "insurance", "pollution", "permit", "interstate", "central-law",
];

export const PROTECTED_CLASSES: Record<string, string> = {
  national_park: "National Park",
  wildlife_sanctuary: "Wildlife Sanctuary",
  tiger_reserve: "Tiger Reserve",
  reserved_forest: "Reserved Forest",
  protected_forest: "Protected Forest",
  conservation_reserve: "Conservation Reserve",
  community_reserve: "Community Reserve",
  eco_sensitive_zone: "Eco-Sensitive Zone",
};

export const LOCATION_TYPES: Record<string, string> = {
  hill_station: "Hill station",
  tourist_destination: "Tourist destination",
  coastal: "Coastal area",
  island: "Island territory",
  restricted_zone: "Restricted zone",
  forest_road: "Forest road",
  mountain_road: "Mountain road",
};

export const OFFICIAL_LINKS = {
  sarathi: "https://sarathi.parivahan.gov.in/",
  vahan: "https://vahan.parivahan.gov.in/",
  echallan: "https://echallan.parivahan.nic.in/",
  parivahan: "https://parivahan.gov.in/",
  indiacode: "https://www.indiacode.nic.in/",
  morth: "https://morth.nic.in/",
  moef: "https://moef.gov.in/",
};

export const DOC_TYPES: Record<string, string> = {
  licence: "Driving Licence",
  rc: "Registration Certificate (RC)",
  insurance: "Insurance",
  puc: "PUC Certificate",
  fitness: "Fitness Certificate",
  permit: "Permit",
};

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function stateName(code?: string | null) {
  return STATES.find((s) => s.code === code)?.name ?? "";
}
