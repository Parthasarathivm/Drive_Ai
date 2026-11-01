import { handle } from "@/lib/api";
import { db } from "@/db";
import { licenseServices } from "@/db/schema";

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.toLowerCase();
  const state = sp.get("state")?.toUpperCase();
  let rows = await db.select().from(licenseServices).orderBy(licenseServices.id);
  if (q) rows = rows.filter((r) => `${r.title} ${r.description}`.toLowerCase().includes(q));
  return { services: rows.map((r) => ({ ...r, stateNote: state ? r.stateNotes?.[state] ?? null : null })) };
});
