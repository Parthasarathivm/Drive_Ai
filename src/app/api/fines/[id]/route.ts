import { eq } from "drizzle-orm";
import { db } from "@/db";
import { legalSources, penalties } from "@/db/schema";
import { ApiError, handle } from "@/lib/api";

export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) throw new ApiError(400, "Invalid id.");
  const [p] = await db.select().from(penalties).where(eq(penalties.id, id)).limit(1);
  if (!p) throw new ApiError(404, "Penalty record not found.");
  const [source] = p.sourceId ? await db.select().from(legalSources).where(eq(legalSources.id, p.sourceId)) : [];
  return { penalty: p, source: source ?? null };
});
