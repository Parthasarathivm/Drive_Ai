import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userDocuments } from "@/db/schema";
import { ApiError, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const DELETE = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const u = await requireUser();
  const n = Number((await params).id);
  if (!Number.isInteger(n)) throw new ApiError(400, "Invalid id.");
  const res = await db.delete(userDocuments).where(and(eq(userDocuments.id, n), eq(userDocuments.userId, u.id))).returning({ id: userDocuments.id });
  if (!res.length) throw new ApiError(404, "Document not found.");
  return { ok: true };
});
