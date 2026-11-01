import { handle } from "@/lib/api";
import { db } from "@/db";
import { permits } from "@/db/schema";
import { appliesToVehicle } from "@/lib/legal";

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const vehicle = sp.get("vehicle");
  const type = sp.get("type");
  let rows = await db.select().from(permits).orderBy(permits.id);
  if (vehicle) rows = rows.filter((p) => appliesToVehicle(p.applicableVehicles, vehicle));
  if (type) rows = rows.filter((p) => p.permitType === type);
  return { permits: rows };
});
