import { z } from "zod";
import { handle, parseBody, rateLimit } from "@/lib/api";
import { aiProvider, askAssistant } from "@/lib/ai";

const Body = z.object({
  question: z.string().trim().min(2, "Ask a question").max(500),
  language: z.string().max(5).default("en"),
  state: z.string().max(3).nullish(),
  vehicle: z.string().max(40).nullish(),
});

export const POST = handle(async (req) => {
  rateLimit(req, "ai-ask", 20);
  const b = await parseBody(req, Body);
  const result = await askAssistant({ question: b.question, lang: b.language, state: b.state, vehicle: b.vehicle });
  return { ...result, providerConfigured: aiProvider() };
});
