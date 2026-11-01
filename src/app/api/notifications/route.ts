import { and, eq, isNull, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { documentReminders, userDocuments } from "@/db/schema";
import { handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { daysUntil, docStatus } from "@/lib/compliance";
import { DOC_TYPES } from "@/lib/constants";

// Notifications are derived from the user's own documents/reminders (no fabricated alerts).
export const GET = handle(async () => {
  const u = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const due = await db
    .select({ r: documentReminders, d: userDocuments })
    .from(documentReminders)
    .innerJoin(userDocuments, eq(userDocuments.id, documentReminders.userDocumentId))
    .where(and(eq(documentReminders.userId, u.id), isNull(documentReminders.dismissedAt), lte(documentReminders.remindOn, today)));
  const enabled = u.notifySettings.documentExpiry;
  const items = enabled
    ? due.map(({ r, d }) => {
        const days = daysUntil(d.expiryDate);
        const st = docStatus(d.expiryDate);
        return {
          id: r.id, kind: "document_expiry", severity: st === "Expired" ? "red" : "amber",
          title: `${DOC_TYPES[d.docType] ?? d.docType}${d.label ? ` (${d.label})` : ""} ${st === "Expired" ? "has expired" : `expires in ${days} day(s)`}`,
          detail: `Expiry date: ${d.expiryDate}. Renew through the official portal.`, documentId: d.id,
        };
      })
    : [];
  return { items, settings: u.notifySettings, note: "Verified source-change alerts are not available yet because automated source monitoring is not implemented." };
});

export const POST = handle(async (req) => {
  const u = await requireUser();
  const { id } = await parseBody(req, z.object({ id: z.number().int() }));
  await db.update(documentReminders).set({ dismissedAt: new Date() }).where(and(eq(documentReminders.id, id), eq(documentReminders.userId, u.id)));
  return { ok: true };
});
