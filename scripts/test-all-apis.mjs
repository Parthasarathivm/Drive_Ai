import { GET as getLicenseServices } from "../src/app/api/license/services/route.ts";
import { GET as getVehicleServices } from "../src/app/api/vehicle/services/route.ts";
import { POST as registerUser } from "../src/app/api/auth/register/route.ts";
import { pool } from "../src/db/index.ts";

async function runTestSuite() {
  console.log("==========================================");
  console.log("DRIVELEGAL AI — BACKEND API VERIFICATION");
  console.log("==========================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message, detail = null) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      if (detail) console.error("       Detail:", detail);
      failed++;
    }
  }

  // --- 1. License Services API Tests ---
  console.log("--- 1. Testing License Services API ---");

  // Test 1.1: State=TN
  try {
    const req = new Request("http://localhost:3000/api/license/services?state=TN");
    const res = await getLicenseServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 200, "GET /api/license/services?state=TN returns 200 OK");
    assert(Array.isArray(data.services) && data.services.length > 0, "Returns non-empty services array", data.services?.length);
    const tnNoted = data.services?.find((s) => s.slug === "learners-licence");
    assert(
      tnNoted?.stateNote && tnNoted.stateNote.includes("Tamil Nadu"),
      "Tamil Nadu stateNote populated for learners-licence",
      tnNoted?.stateNote
    );
  } catch (err) {
    assert(false, "GET /api/license/services?state=TN threw exception", err.message);
  }

  // Test 1.2: State=Tamil Nadu (by name)
  try {
    const req = new Request("http://localhost:3000/api/license/services?state=Tamil%20Nadu");
    const res = await getLicenseServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 200, "GET /api/license/services?state=Tamil Nadu returns 200 OK");
    const tnNoted = data.services?.find((s) => s.slug === "permanent-licence");
    assert(tnNoted?.stateNote && tnNoted.stateNote.includes("Tamil Nadu"), "Tamil Nadu stateNote populated when querying by name");
  } catch (err) {
    assert(false, "GET /api/license/services?state=Tamil Nadu threw exception", err.message);
  }

  // Test 1.3: No state parameter (national baseline)
  try {
    const req = new Request("http://localhost:3000/api/license/services");
    const res = await getLicenseServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 200, "GET /api/license/services returns 200 OK without state param");
    assert(data.services?.every((s) => s.stateNote === null), "All services have null stateNote when state param omitted");
  } catch (err) {
    assert(false, "GET /api/license/services threw exception", err.message);
  }

  // Test 1.4: Search query filter
  try {
    const req = new Request("http://localhost:3000/api/license/services?q=learner");
    const res = await getLicenseServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 200, "GET /api/license/services?q=learner returns 200 OK");
    assert(data.services?.length >= 1 && data.services.some((s) => s.slug === "learners-licence"), "Correctly filters by search query");
  } catch (err) {
    assert(false, "GET /api/license/services?q=learner threw exception", err.message);
  }

  // Test 1.5: Empty search results
  try {
    const req = new Request("http://localhost:3000/api/license/services?q=nonexistentqueryxyz");
    const res = await getLicenseServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 200, "GET /api/license/services?q=nonexistent returns 200 OK");
    assert(Array.isArray(data.services) && data.services.length === 0, "Returns empty services array for non-matching query");
  } catch (err) {
    assert(false, "Empty search test threw exception", err.message);
  }

  // Test 1.6: Invalid state parameter
  try {
    const req = new Request("http://localhost:3000/api/license/services?state=XYZ_INVALID");
    const res = await getLicenseServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 400, "GET /api/license/services?state=XYZ_INVALID returns 400 Bad Request", res.status);
    assert(data.error?.includes("Invalid state"), "Returns descriptive invalid state error message", data.error);
  } catch (err) {
    assert(false, "Invalid state test threw exception", err.message);
  }

  // --- 2. Vehicle Services API Tests ---
  console.log("\n--- 2. Testing Vehicle Services API ---");

  // Test 2.1: state=TN&vehicle=taxi
  try {
    const req = new Request("http://localhost:3000/api/vehicle/services?state=TN&vehicle=taxi");
    const res = await getVehicleServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 200, "GET /api/vehicle/services?state=TN&vehicle=taxi returns 200 OK");
    assert(Array.isArray(data.services) && data.services.length > 0, "Returns vehicle services array", data.services?.length);

    // Verify taxi-specific services are included
    const fitnessService = data.services?.find((s) => s.slug === "fitness-certificate");
    const commercialService = data.services?.find((s) => s.slug === "commercial-registration");
    assert(fitnessService !== undefined, "Includes fitness-certificate for taxi");
    assert(commercialService !== undefined, "Includes commercial-registration for taxi");
    assert(
      fitnessService?.stateNote && fitnessService.stateNote.includes("Tamil Nadu"),
      "Tamil Nadu stateNote populated for fitness-certificate on taxi",
      fitnessService?.stateNote
    );
  } catch (err) {
    assert(false, "GET /api/vehicle/services?state=TN&vehicle=taxi threw exception", err.message);
  }

  // Test 2.2: vehicle=private-car
  try {
    const req = new Request("http://localhost:3000/api/vehicle/services?state=TN&vehicle=private-car");
    const res = await getVehicleServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 200, "GET /api/vehicle/services?state=TN&vehicle=private-car returns 200 OK");
    // Fitness certificate is commercial only, shouldn't appear for private car
    const fitnessService = data.services?.find((s) => s.slug === "fitness-certificate");
    assert(fitnessService === undefined, "Correctly excludes commercial fitness-certificate for private-car");
  } catch (err) {
    assert(false, "GET /api/vehicle/services?vehicle=private-car threw exception", err.message);
  }

  // Test 2.3: Invalid vehicle category
  try {
    const req = new Request("http://localhost:3000/api/vehicle/services?vehicle=airplane");
    const res = await getVehicleServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 400, "GET /api/vehicle/services?vehicle=airplane returns 400 Bad Request", res.status);
    assert(data.error?.includes("Invalid vehicle"), "Returns descriptive invalid vehicle error message", data.error);
  } catch (err) {
    assert(false, "Invalid vehicle test threw exception", err.message);
  }

  // Test 2.4: Invalid state parameter
  try {
    const req = new Request("http://localhost:3000/api/vehicle/services?state=999");
    const res = await getVehicleServices(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 400, "GET /api/vehicle/services?state=999 returns 400 Bad Request", res.status);
  } catch (err) {
    assert(false, "Invalid state test on vehicle services threw exception", err.message);
  }

  // --- 3. Registration API Tests ---
  console.log("\n--- 3. Testing Registration API ---");

  const testEmail = `test_driver_${Date.now()}@example.com`;
  const testPassword = "SecurePassword123!";

  // Test 3.1: Valid Registration
  try {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ramesh Kumar",
        email: testEmail,
        password: testPassword,
        preferredLanguage: "ta",
        preferredState: "TN",
      }),
    });
    const res = await registerUser(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 200, "POST /api/auth/register returns 200 OK for valid test user", res.status);
    assert(data.ok === true, "Response returns { ok: true }", data);

    // Verify in database: password is hash, not plain text
    const dbUserRes = await pool.query("SELECT email, password_hash, preferred_language, preferred_state FROM users WHERE email = $1", [testEmail]);
    assert(dbUserRes.rows.length === 1, "User record found in database");
    const dbUser = dbUserRes.rows[0];
    assert(!dbUser.password_hash.includes(testPassword), "Password is cryptographically hashed (NEVER plain-text)");
    assert(dbUser.password_hash.includes(":"), "Password hash contains salt:hash structure");
    assert(dbUser.preferred_state === "TN", "User preferred_state saved as 'TN'");
    assert(dbUser.preferred_language === "ta", "User preferred_language saved as 'ta'");
  } catch (err) {
    assert(false, "Valid registration threw exception", err.message);
  }

  // Test 3.2: Duplicate email registration
  try {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Duplicate User",
        email: testEmail,
        password: testPassword,
      }),
    });
    const res = await registerUser(req, { params: Promise.resolve({}) });
    const data = await res.json();
    assert(res.status === 409, "POST /api/auth/register duplicate email returns 409 Conflict", res.status);
    assert(data.error?.includes("already exists"), "Returns duplicate email conflict message", data.error);
  } catch (err) {
    assert(false, "Duplicate registration threw exception", err.message);
  }

  // Test 3.3: Invalid email format
  try {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Bad Email",
        email: "not-an-email",
        password: testPassword,
      }),
    });
    const res = await registerUser(req, { params: Promise.resolve({}) });
    assert(res.status === 400, "POST /api/auth/register invalid email returns 400 Bad Request", res.status);
  } catch (err) {
    assert(false, "Invalid email test threw exception", err.message);
  }

  // Test 3.4: Short password (<8 characters)
  try {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Short Pass",
        email: `short_${Date.now()}@example.com`,
        password: "short",
      }),
    });
    const res = await registerUser(req, { params: Promise.resolve({}) });
    assert(res.status === 400, "POST /api/auth/register short password returns 400 Bad Request", res.status);
  } catch (err) {
    assert(false, "Short password test threw exception", err.message);
  }

  // Test 3.5: Invalid preferred state code
  try {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Invalid State User",
        email: `badstate_${Date.now()}@example.com`,
        password: testPassword,
        preferredState: "NONEXISTENT",
      }),
    });
    const res = await registerUser(req, { params: Promise.resolve({}) });
    assert(res.status === 400, "POST /api/auth/register invalid state returns 400 Bad Request", res.status);
  } catch (err) {
    assert(false, "Invalid state test threw exception", err.message);
  }

  console.log("\n==========================================");
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED:      ${passed}`);
  console.log(`FAILED:      ${failed}`);
  console.log("==========================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});

