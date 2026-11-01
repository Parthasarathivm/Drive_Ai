// Direct test of API route handlers
import { GET as getTranslations } from "../src/app/api/translations/route.ts";
import { GET as getDashboard } from "../src/app/api/dashboard/route.ts";

const ALL_LANGS = ["en", "ta", "hi", "te", "ml", "kn", "bn", "mr", "gu", "pa", "or", "as"];

async function runTests() {
  console.log("=== TESTING API ROUTES ===");
  let passed = 0;
  let failed = 0;

  // 1. Test Translations
  for (const lang of ALL_LANGS) {
    try {
      const req = new Request(`http://localhost:3000/api/translations?lang=${lang}`);
      const res = await getTranslations(req, { params: Promise.resolve({}) });
      const data = await res.json();
      if (res.status === 200 && data.success && data.values && Object.keys(data.values).length >= 40) {
        console.log(`✓ /api/translations?lang=${lang} -> 200 OK (${Object.keys(data.values).length} keys, source=${data.source})`);
        passed++;
      } else {
        console.error(`✗ /api/translations?lang=${lang} failed: status=${res.status}`, data);
        failed++;
      }
    } catch (err) {
      console.error(`✗ /api/translations?lang=${lang} exception:`, err);
      failed++;
    }
  }

  // 2. Test Dashboard
  try {
    const req = new Request("http://localhost:3000/api/dashboard");
    const res = await getDashboard(req, { params: Promise.resolve({}) });
    const data = await res.json();
    if ((res.status === 200 || res.status === 503) && data.records && data.totals && data.coverage) {
      console.log(`✓ /api/dashboard -> ${res.status} OK (dbConnected=${data.dbConnected}, coverage=${data.coverage.length} states)`);
      passed++;
    } else {
      console.error("✗ /api/dashboard failed:", res.status, data);
      failed++;
    }
  } catch (err) {
    console.error("✗ /api/dashboard exception:", err);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
