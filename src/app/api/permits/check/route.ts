import { z } from "zod";
import { handle, parseBody, rateLimit } from "@/lib/api";
import { checkPermits } from "@/lib/legal";

const Body = z.object({
  vehicle: z.string().min(2).max(40),
  usage: z.enum(["private", "goods", "stage", "contract", "tourist"]),
  weight: z.enum(["light", "medium", "heavy", "na"]).optional(),
  originState: z.string().max(3).optional(),
  destState: z.string().max(3).optional(),
  purpose: z.string().max(200).optional(),
});

export const POST = handle(async (req) => {
  rateLimit(req, "permit-check", 60);
  return checkPermits(await parseBody(req, Body));
});
