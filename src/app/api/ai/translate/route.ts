import { z } from "zod";
import { ApiError, handle, parseBody, rateLimit } from "@/lib/api";
import { aiProvider, callLLM } from "@/lib/ai";
import { LANGUAGES } from "@/lib/constants";

const Body = z.object({ text: z.string().trim().min(1).max(3000), target: z.string().max(5) });

// Machine translation of explanations only. Original legal text is never altered or replaced by this endpoint.
export const POST = handle(async (req) => {
  rateLimit(req, "ai-translate", 20);
  const b = await parseBody(req, Body);
  const lang = LANGUAGES.find((l) => l.code === b.target);
  if (!lang) throw new ApiError(400, "Unsupported target language.");
  if (!aiProvider()) throw new ApiError(503, "Machine translation needs an AI provider key (GEMINI_API_KEY or ANTHROPIC_API_KEY). See README.");
  const out = await callLLM({
    system: "You translate Indian traffic-law explanations. Preserve meaning exactly, keep Act names, section numbers, currency amounts and legal terms consistent. Never add or remove legal content. Output only the translation.",
    prompt: `Translate into ${lang.name}:\n\n${b.text}`,
  });
  return { translated: out.trim(), target: b.target, machineGenerated: true, humanReviewed: false, notice: "Machine-generated translation — not human-reviewed. The original wording remains authoritative." };
});
