import { ApiError, handle, rateLimit } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { extractTextFromFile, findDates } from "@/lib/extract";

// Processes a user-uploaded document ONLY with explicit consent. The file and its text are NOT stored —
// only the extracted suggestions are returned to the browser (data minimisation).
export const POST = handle(async (req) => {
  rateLimit(req, "analyze-doc", 10);
  await requireUser();
  const form = await req.formData();
  if (form.get("consent") !== "true") throw new ApiError(400, "Consent is required before a document can be processed.");
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(400, "Attach a PDF or text file.");
  const { text, kind } = await extractTextFromFile(file);
  if (!text.trim()) throw new ApiError(422, "No readable text found. Scanned images are not supported — enter the dates manually.");
  const dates = findDates(text);
  const expiry = dates.filter((d) => d.kind === "expiry").map((d) => d.date).sort().pop() ?? null;
  const low = text.toLowerCase();
  const guess = low.includes("insurance") ? "insurance" : low.includes("pollution") || low.includes("puc") ? "puc" : low.includes("fitness") ? "fitness" : low.includes("permit") ? "permit" : low.includes("driving licen") ? "licence" : low.includes("registration") ? "rc" : null;
  return {
    kind, characters: text.length, suggestedExpiry: expiry, suggestedType: guess, dates, retained: false,
    notice: "Suggestions are heuristic and may be wrong — please confirm the dates before saving. The uploaded file was not stored.",
  };
});
