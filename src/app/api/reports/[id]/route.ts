import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { analysisReports } from "@/db/schema";
import { ApiError, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

async function load(id: string) {
  const u = await requireUser();
  const n = Number(id);
  if (!Number.isInteger(n)) throw new ApiError(400, "Invalid id.");
  const [r] = await db.select().from(analysisReports).where(and(eq(analysisReports.id, n), eq(analysisReports.userId, u.id))).limit(1);
  if (!r) throw new ApiError(404, "Report not found.");
  return r;
}

export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => ({ report: await load((await params).id) }));

export const DELETE = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const r = await load((await params).id);
  await db.delete(analysisReports).where(eq(analysisReports.id, r.id));
  return { ok: true };
});
