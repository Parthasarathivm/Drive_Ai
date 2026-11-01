import { z } from "zod";
import { handle, parseBody, rateLimit } from "@/lib/api";
import { detectTopics } from "@/lib/ai";
import { searchRules } from "@/lib/legal";

const Body = z.object({
  query: z.string().trim().min(1).max(300),
  state: z.string().max(3).optional(),
  vehicle: z.string().max(40).optional(),
});

// Multilingual-aware search: native-script keywords are mapped to legal topics before text matching.
export const POST = handle(async (req) => {
  rateLimit(req, "laws-search", 60);
  const b = await parseBody(req, Body);
  const topics = detectTopics(b.query);
  let rules = await searchRules({ q: topics.length ? undefined : b.query, topic: topics[0], state: b.state, vehicle: b.vehicle, limit: 30 });
  if (!rules.length && topics.length) rules = await searchRules({ q: b.query, state: b.state, vehicle: b.vehicle, limit: 30 });
  return { query: b.query, detectedTopics: topics, rules };
});
