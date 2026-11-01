import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { legalDocuments, legalRules, states } from "@/db/schema";
import { ApiError, handle, parseBody, rateLimit, sanitize } from "@/lib/api";
import { requireRole, requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { stateIdFromCode } from "@/lib/admin-server";
import { extractTextFromFile } from "@/lib/extract";
import { extractRulesIntoDb } from "@/lib/extract-db";
import { slugify } from "@/lib/constants";

export const GET = handle(async () => {
  const u = await requireUser();
  if (!u.roles.some((r) => r !== "user")) throw new ApiError(403, "Staff access required.");
  const docs = await db.select({
    id: legalDocuments.id, title: legalDocuments.title, docType: legalDocuments.docType, issuingAuthority: legalDocuments.issuingAuthority, publishedDate: legalDocuments.publishedDate,
    effectiveDate: legalDocuments.effectiveDate, status: legalDocuments.status, url: legalDocuments.url, fileName: legalDocuments.fileName, extractionStatus: legalDocuments.extractionStatus,
    lastVerifiedAt: legalDocuments.lastVerifiedAt, stateId: legalDocuments.stateId, isDemo: legalDocuments.isDemo, hasText: legalDocuments.extractedText,
  }).from(legalDocuments).orderBy(legalDocuments.id);
  const st = await db.select().from(states);
  const rules = await db.select({ d: legalRules.documentId, s: legalRules.verificationStatus, by: legalRules.extractedBy }).from(legalRules);
  return {
    documents: docs.map((d) => ({
      ...d, hasText: !!d.hasText, stateName: d.stateId ? st.find((s) => s.id === d.stateId)?.name : null,
      linkedRules: rules.filter((r) => r.d === d.id).length, pendingExtracted: rules.filter((r) => r.d === d.id && r.s === "pending" && r.by !== "seed").length,
    })),
  };
});

const opt = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const Meta = z.object({
  title: z.string().min(3).max(200), docType: z.enum(["act", "rules", "notification", "circular", "pdf", "other"]).default("pdf"),
  issuingAuthority: z.string().max(200).optional(), publishedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  url: z.string().url().refine((u) => /^https?:\/\//.test(u)).optional(), stateCode: z.string().max(3).optional(), sourceId: z.coerce.number().int().optional(),
  autoExtract: z.enum(["true", "false"]).default("false"),
});

// Register an official URL and/or upload a government PDF (multipart form).
export const POST = handle(async (req) => {
  rateLimit(req, "admin-upload", 20);
  const u = await requireRole("data_manager");
  const form = await req.formData();
  const meta = Meta.parse({
    title: opt(form.get("title")), docType: opt(form.get("docType")), issuingAuthority: opt(form.get("issuingAuthority")), publishedDate: opt(form.get("publishedDate")),
    effectiveDate: opt(form.get("effectiveDate")), url: opt(form.get("url")), stateCode: opt(form.get("stateCode")), sourceId: opt(form.get("sourceId")), autoExtract: opt(form.get("autoExtract")),
  });
  const file = form.get("file");
  let text: string | null = null;
  let sha: string | null = null;
  let fileName: string | null = null;
  let extractionStatus = "none";
  if (file instanceof File && file.size > 0) {
    fileName = sanitize(file.name).slice(0, 200);
    sha = createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
    try {
      text = (await extractTextFromFile(file)).text;
      extractionStatus = text.trim() ? "extracted" : "failed";
    } catch (e) {
      if (e instanceof ApiError && e.status !== 422) throw e;
      extractionStatus = "failed";
    }
  } else if (!meta.url) throw new ApiError(400, "Provide a PDF/text file or an official URL.");

  const [doc] = await db.insert(legalDocuments).values({
    slug: `${slugify(meta.title)}-${Math.random().toString(36).slice(2, 6)}`, sourceId: meta.sourceId ?? null, title: sanitize(meta.title), docType: meta.docType,
    stateId: await stateIdFromCode(meta.stateCode), issuingAuthority: meta.issuingAuthority ?? null, publishedDate: meta.publishedDate ?? null, effectiveDate: meta.effectiveDate ?? null,
    url: meta.url ?? null, fileName, fileSha256: sha, extractedText: text, extractionStatus, uploadedBy: u.id, status: "pending",
  }).returning({ id: legalDocuments.id });
  await audit(req, u, "register_document", "legal_document", doc.id, { fileName, url: meta.url, extractionStatus });

  let extracted = 0;
  let method: string | null = null;
  if (meta.autoExtract === "true" && text?.trim()) {
    const r = await extractRulesIntoDb(doc.id, text, meta.title, meta.sourceId ?? null, meta.url ?? null, u.id);
    extracted = r.count; method = r.method;
    await audit(req, u, "extract_rules", "legal_document", doc.id, { count: extracted, method });
  }
  return { id: doc.id, extractionStatus, extracted, method, message: "Document registered. Extracted rules stay PENDING until a Legal Reviewer approves them." };
});

const Patch = z.object({ id: z.number().int(), status: z.enum(["active", "superseded", "outdated", "pending"]).optional(), supersededById: z.number().int().nullable().optional(), markVerified: z.boolean().optional() });
export const PATCH = handle(async (req) => {
  const u = await requireRole("data_manager", "legal_reviewer");
  const b = await parseBody(req, Patch);
  const patch: Record<string, unknown> = {};
  if (b.status) patch.status = b.status;
  if (b.supersededById !== undefined) { patch.supersededById = b.supersededById; if (b.supersededById) patch.status = "superseded"; }
  if (b.markVerified) patch.lastVerifiedAt = new Date();
  if (!Object.keys(patch).length) throw new ApiError(400, "Nothing to update.");
  await db.update(legalDocuments).set(patch).where(eq(legalDocuments.id, b.id));
  await audit(req, u, "update_document", "legal_document", b.id, patch);
  return { ok: true };
});
