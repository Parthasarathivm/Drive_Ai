import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { protectedAreas, states } from "@/db/schema";
import { ApiError, handle } from "@/lib/api";

export const GET = handle<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const key = (await params).id;
  const num = Number(key);
  const [row] = await db
    .select({ a: protectedAreas, stateName: states.name, stateCode: states.code })
    .from(protectedAreas)
    .leftJoin(states, eq(states.id, protectedAreas.stateId))
    .where(or(eq(protectedAreas.slug, key), Number.isInteger(num) ? eq(protectedAreas.id, num) : undefined))
    .limit(1);
  if (!row) throw new ApiError(404, "Protected area not found.");
  return { area: { ...row.a, stateName: row.stateName, stateCode: row.stateCode } };
});
