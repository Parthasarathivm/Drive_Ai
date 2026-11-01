import { z } from "zod";
import { handle, parseBody, rateLimit } from "@/lib/api";
import { calculateFine } from "@/lib/legal";
import { VIOLATIONS } from "@/lib/constants";

const Body = z.object({
  state: z.string().max(3).nullish(),
  vehicle: z.string().max(40).nullish(),
  violation: z.string().refine((v) => VIOLATIONS.some((x) => x.key === v), "Unknown violation"),
  repeat: z.boolean().optional(),
  extraUnits: z.number().int().min(0).max(1000).optional(),
});

// Calculation uses ONLY human-verified records. Unverified records are returned as draft references with no total.
export const POST = handle(async (req) => {
  rateLimit(req, "fine-calc", 60);
  return calculateFine(await parseBody(req, Body));
});
