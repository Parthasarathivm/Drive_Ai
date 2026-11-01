import { desc } from "drizzle-orm";
import { db } from "@/db";
import { states } from "@/db/schema";
import { ApiError, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { REVIEW_TABLES } from "@/lib/admin-server";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Review queue: lists records of one entity type filtered by verification status.
export const GET = handle(async (req) => {
  const u = await requireUser();
  if (!u.roles.some((r) => r !== "user")) throw new ApiError(403, "Staff access required.");
  const sp = new URL(req.url).searchParams;
  const entity = sp.get("entity") ?? "rule";
  const status = sp.get("status") ?? "pending";
  const table = REVIEW_TABLES[entity];
  if (!table) throw new ApiError(400, "Unknown entity type.");
  const rows: any[] = await db.select().from(table).orderBy(desc(table.id)).limit(500);
  const st = await db.select().from(states);
  return {
    canReview: u.roles.includes("legal_reviewer") || u.roles.includes("super_admin"),
    rows: rows
      .filter((r) => status === "all" || r.verificationStatus === status)
      .map((r) => ({ ...r, stateName: r.stateId ? st.find((s) => s.id === r.stateId)?.name : null })),
  };
});
