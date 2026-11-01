import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import * as S from "@/db/schema";
import { ApiError, handle } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const GET = handle(async () => {
  const u = await requireUser();
  if (!u.roles.some((r) => r !== "user")) throw new ApiError(403, "Staff access required.");
  const pending = async (t: typeof S.legalRules | typeof S.penalties | typeof S.protectedAreas | typeof S.permits | typeof S.locations) =>
    (await db.select({ n: count() }).from(t).where(eq(t.verificationStatus, "pending")))[0].n;
  const [rules, penalties, areas, permits, locations] = await Promise.all([pending(S.legalRules), pending(S.penalties), pending(S.protectedAreas), pending(S.permits), pending(S.locations)]);
  const [{ users }] = await db.select({ users: count() }).from(S.users);
  const [{ openGaps }] = await db.select({ openGaps: count() }).from(S.informationGaps).where(eq(S.informationGaps.reviewStatus, "open"));
  const [{ openConflicts }] = await db.select({ openConflicts: count() }).from(S.sourceConflicts).where(eq(S.sourceConflicts.reviewStatus, "open"));
  const [{ newFeedback }] = await db.select({ newFeedback: count() }).from(S.userFeedback).where(eq(S.userFeedback.status, "new"));
  const sources = await db.select().from(S.legalSources);
  const audit = await db.select().from(S.adminAuditLogs).orderBy(desc(S.adminAuditLogs.createdAt)).limit(25);
  const feedback = await db.select().from(S.userFeedback).orderBy(desc(S.userFeedback.createdAt)).limit(25);
  const now = Date.now();
  const fresh = { never_checked: 0, overdue: 0, fresh: 0 };
  sources.forEach((s) => {
    if (!s.lastCheckedAt) fresh.never_checked++;
    else if (s.lastCheckedAt.getTime() + s.checkFrequencyDays * 86400_000 < now) fresh.overdue++;
    else fresh.fresh++;
  });
  return { pending: { rules, penalties, areas, permits, locations }, users, openGaps, openConflicts, newFeedback, sourceFreshness: fresh, audit, feedback, roles: u.roles };
});
