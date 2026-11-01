import { and, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { protectedAreas, states } from "@/db/schema";
import { handle } from "@/lib/api";

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const conds: SQL[] = [];
  if (sp.get("state")) conds.push(eq(states.code, sp.get("state")!.toUpperCase()));
  if (sp.get("class")) conds.push(eq(protectedAreas.classification, sp.get("class")!));
  if (sp.get("q")) conds.push(ilike(protectedAreas.name, `%${sp.get("q")!.replace(/[%_]/g, "")}%`));
  const rows = await db
    .select({ a: protectedAreas, stateCode: states.code, stateName: states.name })
    .from(protectedAreas)
    .leftJoin(states, eq(states.id, protectedAreas.stateId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(protectedAreas.name);
  return { areas: rows.map((r) => ({ ...r.a, stateCode: r.stateCode, stateName: r.stateName })) };
});
