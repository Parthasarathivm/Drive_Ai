import { z } from "zod";
import { ApiError } from "@/lib/api";
import { aiProvider, callLLM, parseJsonLoose } from "@/lib/ai";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function extractTextFromFile(file: File): Promise<{ text: string; kind: string }> {
  if (file.size > MAX_UPLOAD_BYTES) throw new ApiError(413, "File is too large (max 8 MB).");
  const name = file.name.toLowerCase();
  const buf = new Uint8Array(await file.arrayBuffer());
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  if (isPdf) {
    // verify magic bytes: %PDF
    if (!(buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) throw new ApiError(400, "File is not a valid PDF.");
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });
    return { text: (Array.isArray(text) ? text.join("\n") : text).replace(/\u0000/g, ""), kind: "pdf" };
  }
  if (file.type.startsWith("text/") || name.endsWith(".txt") || name.endsWith(".md")) {
    return { text: new TextDecoder().decode(buf).replace(/\u0000/g, ""), kind: "text" };
  }
  throw new ApiError(415, "Unsupported file type. Upload a PDF or a plain-text file.");
}

export type Candidate = { title: string; legalReference: string | null; excerpt: string; explanation?: string | null; hasPenalty: boolean };

/** Heuristic (non-AI) candidate extraction: finds "Section N" style provisions and penalty sentences. */
export function heuristicRuleExtraction(text: string): Candidate[] {
  const clean = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const re = /(?:^|\n)\s*(?:Section\s+)?(\d{1,3}[A-Z]{0,2})\.\s+([A-Z][^\n.]{4,120})\.?[\s\u2014\-–]/g;
  const hits: { idx: number; num: string; title: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(clean))) hits.push({ idx: m.index, num: m[1], title: m[2].trim() });
  const out: Candidate[] = [];
  hits.slice(0, 60).forEach((h, i) => {
    const end = hits[i + 1]?.idx ?? Math.min(clean.length, h.idx + 1500);
    const excerpt = clean.slice(h.idx, Math.min(end, h.idx + 1500)).trim();
    if (excerpt.length < 40) return;
    out.push({ title: h.title, legalReference: `Section ${h.num}`, excerpt, hasPenalty: /(rupees|₹|Rs\.?)\s?[\d,]+|fine/i.test(excerpt) });
  });
  if (!out.length) {
    const paras = clean.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 80);
    paras.slice(0, 20).forEach((p, i) => {
      const ref = p.match(/Section\s+\d+[A-Z]?/i)?.[0] ?? null;
      out.push({ title: p.slice(0, 70).replace(/\s+\S*$/, "") + "…", legalReference: ref, excerpt: p.slice(0, 1200), hasPenalty: /(rupees|₹|Rs\.?)\s?[\d,]+|fine/i.test(p) && i >= 0 });
    });
  }
  return out;
}

const AiRules = z.array(z.object({ title: z.string(), legalReference: z.string().nullable().optional(), excerpt: z.string(), explanation: z.string().nullable().optional(), hasPenalty: z.boolean().optional() }));

export async function extractRules(text: string): Promise<{ candidates: Candidate[]; method: "ai" | "heuristic"; note?: string }> {
  if (aiProvider()) {
    try {
      const raw = await callLLM({
        system: "You extract legal provisions from Indian transport/traffic law documents. Return ONLY JSON. Never invent text: 'excerpt' must be copied verbatim from the document; 'explanation' is a short plain-English summary. If unsure about a field use null.",
        prompt: `Extract up to 15 distinct legal provisions as a JSON array of {title, legalReference, excerpt, explanation, hasPenalty}.\n\nDOCUMENT:\n${text.slice(0, 24000)}`,
        json: true,
      });
      const parsed = parseJsonLoose(raw, AiRules);
      if (parsed?.length) return { candidates: parsed.map((c) => ({ title: c.title, legalReference: c.legalReference ?? null, excerpt: c.excerpt, explanation: c.explanation ?? null, hasPenalty: !!c.hasPenalty })), method: "ai" };
    } catch (e) {
      console.error("[extract] AI extraction failed", e);
    }
  }
  return { candidates: heuristicRuleExtraction(text), method: "heuristic", note: aiProvider() ? "AI extraction failed; heuristic extraction used." : "No AI provider configured; heuristic extraction used." };
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
function iso(y: number, m: number, d: number) {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
/** Finds dates near validity/expiry keywords in extracted document text. */
export function findDates(text: string) {
  const out: { date: string; context: string; kind: "expiry" | "other" }[] = [];
  const re = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})|(\d{1,2})[\s\-]([A-Za-z]{3})[a-z]*[\s\-,]+(\d{4})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const d = m[1] ? iso(+m[3], +m[2], +m[1]) : iso(+m[6], MONTHS[m[5].toLowerCase()] ?? 0, +m[4]);
    if (!d) continue;
    const ctx = text.slice(Math.max(0, m.index - 50), m.index).toLowerCase();
    out.push({ date: d, context: text.slice(Math.max(0, m.index - 30), m.index + m[0].length).trim(), kind: /valid|expir|upto|up to|till|validity/.test(ctx) ? "expiry" : "other" });
  }
  return out.slice(0, 10);
}
