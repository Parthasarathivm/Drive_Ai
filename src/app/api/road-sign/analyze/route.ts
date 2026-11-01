import { z } from "zod";
import { ApiError, handle, parseBody, rateLimit } from "@/lib/api";
import { aiProvider, callLLM, parseJsonLoose } from "@/lib/ai";

const Body = z.object({ image: z.string().min(100).max(7_000_000) });
const Out = z.object({
  recognized: z.boolean(),
  signName: z.string().nullable().optional(),
  category: z.enum(["warning", "mandatory", "prohibitory", "informational", "speed_limit", "unknown"]),
  meaning: z.string().nullable().optional(),
  speedLimit: z.number().nullable().optional(),
  confidence: z.number().min(0).max(1),
  notes: z.string().nullable().optional(),
});

export const POST = handle(async (req) => {
  rateLimit(req, "road-sign", 10);
  const { image } = await parseBody(req, Body);
  const m = image.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw new ApiError(400, "Upload a PNG, JPEG or WebP image.");
  if (Buffer.from(m[2], "base64").length > 4 * 1024 * 1024) throw new ApiError(413, "Image is too large (max 4 MB).");
  if (!aiProvider()) {
    return { status: "provider_not_configured", message: "Automatic recognition needs an AI vision provider key (GEMINI_API_KEY or ANTHROPIC_API_KEY). No recognition was performed. Use the Sign Library below to identify the sign manually." };
  }
  const raw = await callLLM({
    system: "You identify Indian road signs (Motor Vehicles Act schedule / IRC conventions). Be conservative: if the image is blurry, partial, not a road sign, or you are unsure, set recognized=false and a low confidence. Return ONLY JSON.",
    prompt: 'Return JSON: {"recognized":boolean,"signName":string|null,"category":"warning|mandatory|prohibitory|informational|speed_limit|unknown","meaning":string|null,"speedLimit":number|null,"confidence":number 0-1,"notes":string|null}',
    image: { mime: m[1], base64: m[2] },
    json: true,
  });
  const out = parseJsonLoose(raw, Out);
  if (!out) return { status: "unreadable", message: "The AI response could not be interpreted. Please try a clearer image." };
  const level = out.confidence >= 0.8 ? "high" : out.confidence >= 0.55 ? "medium" : "low";
  const unclear = !out.recognized || level === "low";
  return {
    status: unclear ? "uncertain" : "ok",
    result: out,
    confidenceLevel: level,
    confirmed: false,
    legalReference: "Motor Vehicles Act, 1988 — Section 119 (duty to obey traffic signs) and the Schedule of road signs. Confirm the exact provision on the official source.",
    warning: unclear
      ? "LOW CONFIDENCE: the image is unclear or the sign could not be recognised reliably. Do NOT treat this as a legal instruction. Compare with the Sign Library or official sign manuals."
      : "AI recognition is a suggestion, not a confirmed legal instruction. Always follow the sign you see on the road and local police directions.",
  };
});
