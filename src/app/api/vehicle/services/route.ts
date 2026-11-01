import { handle } from "@/lib/api";
import { db } from "@/db";
import { vehicleServices } from "@/db/schema";
import { appliesToVehicle } from "@/lib/legal";

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const q = sp.get("q")?.toLowerCase();
  const vehicle = sp.get("vehicle");
  const state = sp.get("state")?.toUpperCase();
  let rows = await db.select().from(vehicleServices).orderBy(vehicleServices.id);
  if (q) rows = rows.filter((r) => `${r.title} ${r.description}`.toLowerCase().includes(q));
  if (vehicle) rows = rows.filter((r) => appliesToVehicle(r.vehicleCategories, vehicle));
  return { services: rows.map((r) => ({ ...r, stateNote: state ? r.stateNotes?.[state] ?? null : null })) };
});
