import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { informationGaps, sourceConflicts, userFeedback } from "@/db/schema";
import { handle, parseBody, sanitize } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";

const Body = z.object({
  kind: z.enum(["conflict", "gap", "feedback"]),
  id: z.number().int(),
  reviewStatus: z.enum(["open", "in_review", "resolved", "dismissed", "new", "reviewed", "closed"]),
  note: z.string().trim().max(600).optional(),
});

// Human review of detected findings. Legal superiority between conflicting sources is never decided automatically.
export const PATCH = handle(async (req) => {
  const u = await requireRole("legal_reviewer", "data_manager");
  const b = await parseBody(req, Body);
  const note = b.note ? sanitize(b.note) : null;
  if (b.kind === "conflict") await db.update(sourceConflicts).set({ reviewStatus: b.reviewStatus, reviewerId: u.id, reviewNote: note, resolvedAt: b.reviewStatus === "resolved" ? new Date() : null }).where(eq(sourceConflicts.id, b.id));
  else if (b.kind === "gap") await db.update(informationGaps).set({ reviewStatus: b.reviewStatus, reviewerId: u.id, reviewNote: note }).where(eq(informationGaps.id, b.id));
  else await db.update(userFeedback).set({ status: b.reviewStatus }).where(eq(userFeedback.id, b.id));
  await audit(req, u, `review_${b.kind}`, b.kind, b.id, { status: b.reviewStatus, note });
  return { ok: true };
});
