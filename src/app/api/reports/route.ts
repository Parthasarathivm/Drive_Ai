import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { analysisReports } from "@/db/schema";
import { handle, parseBody, sanitize } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const GET = handle(async () => {
  const u = await requireUser();
  const reports = await db.select().from(analysisReports).where(eq(analysisReports.userId, u.id)).orderBy(desc(analysisReports.createdAt));
  return { reports };
});

const Body = z.object({
  reportType: z.enum(["fine", "law", "compliance", "forest", "permit", "route", "gap"]),
  title: z.string().trim().min(2).max(160),
  query: z.record(z.string(), z.unknown()).default({}),
  location: z.string().max(200).nullish(),
  vehicleCategory: z.string().max(60).nullish(),
  findings: z.array(z.unknown()).max(100).default([]),
  legalReferences: z.array(z.string().max(300)).max(50).default([]),
  sources: z.array(z.object({ name: z.string().max(200), url: z.string().max(500) })).max(30).default([]),
  missingInfo: z.array(z.string().max(500)).max(50).default([]),
  uncertaintyNotices: z.array(z.string().max(600)).max(50).default([]),
});

export const POST = handle(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, Body);
  const [r] = await db.insert(analysisReports).values({ ...b, title: sanitize(b.title), userId: u.id, location: b.location ?? null, vehicleCategory: b.vehicleCategory ?? null }).returning({ id: analysisReports.id });
  return { id: r.id };
});
