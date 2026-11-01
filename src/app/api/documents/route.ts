import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { documentReminders, userDocuments } from "@/db/schema";
import { ApiError, handle, parseBody, sanitize } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { maskNumber } from "@/lib/compliance";
import { DOC_TYPES } from "@/lib/constants";

export const GET = handle(async () => {
  const u = await requireUser();
  const documents = await db.select().from(userDocuments).where(eq(userDocuments.userId, u.id)).orderBy(desc(userDocuments.createdAt));
  return { documents };
});

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD").nullish().or(z.literal("").transform(() => null));
const Body = z.object({
  docType: z.string().refine((t) => t in DOC_TYPES, "Unknown document type"),
  label: z.string().trim().max(80).nullish(),
  number: z.string().trim().max(30).nullish(), // used only to derive a masked value; the full number is never stored
  issueDate: date,
  expiryDate: date,
  notes: z.string().trim().max(300).nullish(),
  consent: z.literal(true, { error: "Consent is required to save document details." }),
});

export const POST = handle(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, Body);
  const [d] = await db
    .insert(userDocuments)
    .values({
      userId: u.id, docType: b.docType, label: b.label ? sanitize(b.label) : null, maskedNumber: maskNumber(b.number),
      issueDate: b.issueDate ?? null, expiryDate: b.expiryDate ?? null, consentGiven: true, consentAt: new Date(), notes: b.notes ? sanitize(b.notes) : null,
    })
    .returning();
  if (d.expiryDate) {
    const exp = new Date(d.expiryDate + "T00:00:00Z");
    const rows = [30, 7, 1].map((daysBefore) => ({ userDocumentId: d.id, userId: u.id, daysBefore, remindOn: new Date(exp.getTime() - daysBefore * 86400_000).toISOString().slice(0, 10) }));
    await db.insert(documentReminders).values(rows);
  }
  if (!d) throw new ApiError(500, "Could not save document.");
  return { document: d };
});
