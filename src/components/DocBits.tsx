"use client";
import { Badge } from "@/components/ui";
import { STATUS_TONE, daysUntil, docStatus } from "@/lib/compliance";

export type UserDoc = { id: number; docType: string; label: string | null; maskedNumber: string | null; issueDate: string | null; expiryDate: string | null; notes: string | null };

export function DocStatusBadge({ expiry }: { expiry: string | null }) {
  const s = docStatus(expiry);
  const d = daysUntil(expiry);
  return <Badge tone={STATUS_TONE[s]}>{s}{d !== null && s !== "Expired" ? ` · ${d} day(s)` : d !== null ? ` · ${-d} day(s) ago` : ""}</Badge>;
}
