import { z } from "zod";
import { db } from "@/db";
import { userFeedback } from "@/db/schema";
import { handle, parseBody, rateLimit, sanitize } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";

const Body = z.object({
  message: z.string().trim().min(5, "Please write at least a few words").max(1000),
  rating: z.number().int().min(1).max(5).optional(),
  category: z.enum(["general", "wrong_information", "missing_information", "translation", "bug"]).default("general"),
  page: z.string().max(200).optional(),
});

export const POST = handle(async (req) => {
  rateLimit(req, "feedback", 5);
  const b = await parseBody(req, Body);
  const u = await getSessionUser();
  await db.insert(userFeedback).values({ ...b, message: sanitize(b.message), userId: u?.id });
  return { ok: true };
});
