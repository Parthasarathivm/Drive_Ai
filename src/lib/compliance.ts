// Client-safe compliance helpers.
export type DocStatus = "Valid" | "Expiring soon" | "Expired" | "Not provided" | "Verification unavailable";

export function daysUntil(expiry?: string | null, now = new Date()) {
  if (!expiry) return null;
  const e = new Date(expiry + "T00:00:00");
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((e.getTime() - t.getTime()) / 86400_000);
}

export function docStatus(expiry?: string | null): DocStatus {
  const d = daysUntil(expiry);
  if (d === null) return "Verification unavailable";
  if (d < 0) return "Expired";
  if (d <= 30) return "Expiring soon";
  return "Valid";
}

export const STATUS_TONE: Record<DocStatus, "green" | "amber" | "red" | "grey" | "blue"> = {
  Valid: "green",
  "Expiring soon": "amber",
  Expired: "red",
  "Not provided": "grey",
  "Verification unavailable": "blue",
};

export function maskNumber(n?: string | null) {
  if (!n) return null;
  const clean = n.replace(/[^A-Za-z0-9]/g, "");
  if (!clean) return null;
  return `${"•".repeat(Math.max(0, Math.min(clean.length - 4, 8)))}${clean.slice(-4)}`;
}
