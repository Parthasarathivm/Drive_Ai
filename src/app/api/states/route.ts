import { handle } from "@/lib/api";
import { coverageByState } from "@/lib/intelligence";

// All 28 states + 8 UTs with data-coverage level computed from actual records.
export const GET = handle(async () => ({ states: await coverageByState() }));
