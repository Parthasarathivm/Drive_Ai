import { z } from "zod";
import { handle, parseBody, rateLimit } from "@/lib/api";
import { analyzeRoute } from "@/lib/legal";

const Body = z.object({
  fromState: z.string().max(3).optional(),
  toState: z.string().max(3).optional(),
  viaStates: z.array(z.string().max(3)).max(10).optional(),
  fromPlace: z.string().trim().max(120).optional(),
  toPlace: z.string().trim().max(120).optional(),
  date: z.string().max(10).optional(),
  vehicle: z.string().max(40).optional(),
  purpose: z.string().max(200).optional(),
}).refine((b) => b.toState || b.toPlace, "Choose a destination state or enter a destination place.");

export const POST = handle(async (req) => {
  rateLimit(req, "route", 60);
  return analyzeRoute(await parseBody(req, Body));
});
