import { and, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { locations, states } from "@/db/schema";
import { handle } from "@/lib/api";

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const conds: SQL[] = [];
  if (sp.get("state")) conds.push(eq(states.code, sp.get("state")!.toUpperCase()));
  if (sp.get("type")) conds.push(eq(locations.type, sp.get("type")!));
  if (sp.get("q")) conds.push(ilike(locations.name, `%${sp.get("q")!.replace(/[%_]/g, "")}%`));
  const rows = await db
    .select({ l: locations, stateCode: states.code, stateName: states.name })
    .from(locations)
    .leftJoin(states, eq(states.id, locations.stateId))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(locations.name);
  return { locations: rows.map((r) => ({ ...r.l, stateCode: r.stateCode, stateName: r.stateName })) };
});
