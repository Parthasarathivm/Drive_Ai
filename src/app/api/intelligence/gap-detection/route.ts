import { handle, rateLimit } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { runGapDetection } from "@/lib/intelligence";

export const POST = handle(async (req) => {
  rateLimit(req, "intel", 10);
  const u = await requireRole("legal_reviewer", "data_manager");
  const r = await runGapDetection();
  await audit(req, u, "run_gap_detection", "intelligence", undefined, r);
  return r;
});
