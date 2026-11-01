import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { legalDocuments } from "@/db/schema";
import { ApiError, handle, parseBody, rateLimit } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { extractRulesIntoDb } from "@/lib/extract-db";

// AI/heuristic rule extraction from an already-uploaded document. Results are always created as PENDING.
export const POST = handle(async (req) => {
  rateLimit(req, "admin-extract", 10);
  const u = await requireRole("data_manager", "legal_reviewer");
  const { documentId } = await parseBody(req, z.object({ documentId: z.number().int() }));
  const [d] = await db.select().from(legalDocuments).where(eq(legalDocuments.id, documentId)).limit(1);
  if (!d) throw new ApiError(404, "Document not found.");
  if (!d.extractedText?.trim()) throw new ApiError(422, "This document has no extracted text. Upload a text-based PDF first.");
  const r = await extractRulesIntoDb(d.id, d.extractedText, d.title, d.sourceId, d.url, u.id);
  await audit(req, u, "extract_rules", "legal_document", d.id, r);
  return { ...r, message: `${r.count} candidate rule(s) created as PENDING for human review.` };
});
