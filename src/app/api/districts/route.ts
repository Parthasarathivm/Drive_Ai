import { eq } from "drizzle-orm";
import { db } from "@/db";
import { districts, states } from "@/db/schema";
import { handle } from "@/lib/api";

export const GET = handle(async (req) => {
  const state = new URL(req.url).searchParams.get("state");
  const rows = await db
    .select({ id: districts.id, name: districts.name, stateCode: states.code, stateName: states.name })
    .from(districts)
    .innerJoin(states, eq(states.id, districts.stateId))
    .where(state ? eq(states.code, state.toUpperCase()) : undefined)
    .orderBy(districts.name);
  return {
    districts: rows,
    note: "District lists are partial — only districts referenced by stored records are seeded. Admins can add more in Admin → Data.",
  };
});
