import dotenv from "dotenv";
dotenv.config();

import { ensureSeeded } from "../src/lib/seed.ts";
import { db } from "../src/db/index.ts";
import * as S from "../src/db/schema.ts";

async function main() {
  console.log("Starting ensureSeeded()...");
  await ensureSeeded();
  console.log("Seeding complete!");

  const [licCount] = await db.select({ count: S.licenseServices.id }).from(S.licenseServices);
  const [vehCount] = await db.select({ count: S.vehicleServices.id }).from(S.vehicleServices);
  const [stateCount] = await db.select({ count: S.states.id }).from(S.states);

  console.log("License services count:", licCount);
  console.log("Vehicle services count:", vehCount);
  console.log("States count:", stateCount);

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed execution failed:", err);
  process.exit(1);
});

