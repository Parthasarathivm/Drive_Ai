import { GET as getLicenseServices } from "../src/app/api/license/services/route.ts";
import { GET as getVehicleServices } from "../src/app/api/vehicle/services/route.ts";
import { POST as registerUser } from "../src/app/api/auth/register/route.ts";

// Force database to point to an unreachable host to simulate database downtime
process.env.DATABASE_URL = "postgresql://postgres:fake@127.0.0.1:59999/dummy?connection_limit=1";

async function testDatabaseFailure() {
  console.log("Testing API resilience during database failure...\n");

  // Re-import with bad DB URL
  const { pool } = await import("../src/db/index.ts");
  // Close existing pool so new connections try the bad target
  try {
    await pool.end();
  } catch {}

  const reqLic = new Request("http://localhost:3000/api/license/services?state=TN");
  const resLic = await getLicenseServices(reqLic, { params: Promise.resolve({}) });
  const dataLic = await resLic.json();
  console.log("License Services status on DB failure:", resLic.status, dataLic);
  if (resLic.status === 503 && dataLic.code === "DATABASE_UNAVAILABLE") {
    console.log("[PASS] License Services returns 503 DATABASE_UNAVAILABLE on DB outage");
  } else {
    console.error("[FAIL] License Services did not return 503 on DB outage");
    process.exit(1);
  }

  const reqVeh = new Request("http://localhost:3000/api/vehicle/services?state=TN&vehicle=taxi");
  const resVeh = await getVehicleServices(reqVeh, { params: Promise.resolve({}) });
  const dataVeh = await resVeh.json();
  console.log("Vehicle Services status on DB failure:", resVeh.status, dataVeh);
  if (resVeh.status === 503 && dataVeh.code === "DATABASE_UNAVAILABLE") {
    console.log("[PASS] Vehicle Services returns 503 DATABASE_UNAVAILABLE on DB outage");
  } else {
    console.error("[FAIL] Vehicle Services did not return 503 on DB outage");
    process.exit(1);
  }

  console.log("\n[ALL DB FAILURE TESTS PASSED: Clean 503 status code returned, no unhandled 500 crash]");
  process.exit(0);
}

testDatabaseFailure().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});

