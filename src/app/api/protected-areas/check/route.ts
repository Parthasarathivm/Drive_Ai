import { z } from "zod";
import { handle, parseBody, rateLimit } from "@/lib/api";
import { checkProtectedArea } from "@/lib/legal";

const Body = z.object({
  destination: z.string().trim().max(120).optional(),
  state: z.string().max(3).optional(),
  vehicle: z.string().max(40).optional(),
  purpose: z.string().max(200).optional(),
  date: z.string().max(10).optional(),
}).refine((b) => b.destination || b.state, "Enter a destination or choose a state.");

export const POST = handle(async (req) => {
  rateLimit(req, "pa-check", 60);
  return checkProtectedArea(await parseBody(req, Body));
});
