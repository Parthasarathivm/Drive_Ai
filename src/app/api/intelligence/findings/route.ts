import { desc } from "drizzle-orm";
import { db } from "@/db";
import { informationGaps, sourceConflicts } from "@/db/schema";
import { handle } from "@/lib/api";

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind");
  const gaps = kind === "conflict" ? [] : await db.select().from(informationGaps).orderBy(desc(informationGaps.detectedAt));
  const conflicts = kind === "gap" ? [] : await db.select().from(sourceConflicts).orderBy(desc(sourceConflicts.detectedAt));
  const status = sp.get("status");
  const prio = sp.get("priority");
  const f = <T extends { findingStatus: string; priority: string }>(x: T[]) => x.filter((r) => (!status || r.findingStatus === status) && (!prio || r.priority === prio));
  return { gaps: f(gaps), conflicts: f(conflicts) };
});
