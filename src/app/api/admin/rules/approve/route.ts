import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ruleVersions, verificationRecords } from "@/db/schema";
import { ApiError, handle, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { REVIEW_TABLES } from "@/lib/admin-server";

/* eslint-disable @typescript-eslint/no-explicit-any */
const Body = z.object({
  entityType: z.string(),
  id: z.number().int(),
  action: z.enum(["approve", "reject", "outdated", "reset"]),
  note: z.string().trim().max(500).optional(),
});

const STATUS = { approve: "verified", reject: "rejected", outdated: "outdated", reset: "pending" } as const;

// Human approval gate: only Legal Reviewers / Super Admins can mark records Verified.
export const POST = handle(async (req) => {
  const user = await requireRole("legal_reviewer");
  const b = await parseBody(req, Body);
  const table = REVIEW_TABLES[b.entityType];
  if (!table) throw new ApiError(400, "Unknown entity type.");
  const [row]: any[] = await db.select().from(table).where(eq(table.id, b.id)).limit(1);
  if (!row) throw new ApiError(404, "Record not found.");
  if (b.action === "reject" && !b.note) throw new ApiError(400, "A note is required when rejecting a record.");

  if (b.action === "approve") {
    const missing: string[] = [];
    if (b.entityType === "penalty") {
      if (!row.legalSection) missing.push("legal section");
      if (row.baseAmount == null && row.minAmount == null) missing.push("penalty amount");
      if (!row.sourceUrl && !row.sourceId) missing.push("official source");
    }
    if (b.entityType === "rule") {
      if (!row.legalReference) missing.push("legal reference");
      if (!row.sourceUrl && !row.sourceId) missing.push("official source");
      if (!row.explanation && !row.originalText) missing.push("explanation or original text");
    }
    if (missing.length) throw new ApiError(422, `Cannot verify — missing: ${missing.join(", ")}.`);
  }

  const to = STATUS[b.action];
  const patch: any = { verificationStatus: to, reviewerId: user.id, lastVerifiedAt: b.action === "approve" ? new Date() : null };
  if (b.entityType === "rule") {
    await db.insert(ruleVersions).values({ ruleId: row.id, version: row.version, snapshot: JSON.parse(JSON.stringify(row)), changedBy: user.id, changeNote: `Status ${row.verificationStatus} → ${to}${b.note ? `: ${b.note}` : ""}` });
    patch.version = row.version + 1;
    patch.updatedAt = new Date();
  }
  await db.update(table).set(patch).where(eq(table.id, b.id));
  await db.insert(verificationRecords).values({ entityType: b.entityType, entityId: b.id, fromStatus: row.verificationStatus, toStatus: to, reviewerId: user.id, note: b.note });
  await audit(req, user, `review_${b.action}`, b.entityType, b.id, { from: row.verificationStatus, to, note: b.note });
  return { ok: true, status: to };
});
