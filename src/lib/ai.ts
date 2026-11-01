import { z } from "zod";
import { eq } from "drizzle-orm";
import { VEHICLE_CATEGORIES, STATES, LANGUAGES, OFFICIAL_LINKS } from "@/lib/constants";
import { calculateFine, checkPermits, checkProtectedArea, searchRules, stateByCode } from "@/lib/legal";
import { db } from "@/db";
import * as S from "@/db/schema";

// ------------------------------------------------------------------
// Configurable AI provider (server side only — keys never reach the browser).
//   AI_PROVIDER = gemini | claude   (auto-detected from the key that is set)
//   GEMINI_API_KEY / ANTHROPIC_API_KEY, optional AI_MODEL
// When no key is configured, the assistant still works in retrieval-only mode:
// answers are assembled from approved/pending structured records with citations.
// ------------------------------------------------------------------
export function aiProvider(): "gemini" | "claude" | null {
  const p = (process.env.AI_PROVIDER ?? "").toLowerCase();
  if ((p === "gemini" || !p) && process.env.GEMINI_API_KEY) return "gemini";
  if ((p === "claude" || !p) && process.env.ANTHROPIC_API_KEY) return "claude";
  return null;
}

export async function callLLM(opts: { system: string; prompt: string; image?: { mime: string; base64: string }; json?: boolean }): Promise<string> {
  const provider = aiProvider();
  if (!provider) throw new Error("AI provider is not configured");
  const model = process.env.AI_MODEL || (provider === "gemini" ? "gemini-2.0-flash" : "claude-sonnet-4-5");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45_000);
  try {
    if (provider === "gemini") {
      const parts: unknown[] = [{ text: opts.prompt }];
      if (opts.image) parts.push({ inlineData: { mimeType: opts.image.mime, data: opts.image.base64 } });
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 0.2, ...(opts.json ? { responseMimeType: "application/json" } : {}) },
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`Gemini error ${res.status}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    }
    const content: unknown[] = [];
    if (opts.image) content.push({ type: "image", source: { type: "base64", media_type: opts.image.mime, data: opts.image.base64 } });
    content.push({ type: "text", text: opts.prompt });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 1800, temperature: 0.2, system: opts.system, messages: [{ role: "user", content }] }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Claude error ${res.status}`);
    const data = await res.json();
    return data.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
  } finally {
    clearTimeout(timer);
  }
}

export function parseJsonLoose<T>(raw: string, schema: z.ZodType<T>): T | null {
  const m = raw.match(/[\[{][\s\S]*[\]}]/);
  if (!m) return null;
  try {
    const r = schema.safeParse(JSON.parse(m[0]));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Language / entity detection (step 2-5 of the AI workflow)
// ------------------------------------------------------------------
const SCRIPTS: [string, RegExp][] = [
  ["ta", /[\u0B80-\u0BFF]/], ["te", /[\u0C00-\u0C7F]/], ["kn", /[\u0C80-\u0CFF]/], ["ml", /[\u0D00-\u0D7F]/],
  ["gu", /[\u0A80-\u0AFF]/], ["pa", /[\u0A00-\u0A7F]/], ["or", /[\u0B00-\u0B7F]/], ["bn", /[\u0980-\u09FF]/], ["hi", /[\u0900-\u097F]/],
];
export function detectLanguage(text: string, selected: string) {
  for (const [code, re] of SCRIPTS) if (re.test(text)) {
    if (code === "hi" && selected === "mr") return "mr";
    if (code === "bn" && selected === "as") return "as";
    return code;
  }
  return selected && selected !== "en" ? selected : "en";
}

const STATE_ALIASES: Record<string, string[]> = {
  TN: ["தமிழ்நா", "तमिलनाडु", "tamilnadu"], KL: ["கேரள", "केरल", "കേരള"], KA: ["கர்நாடக", "कर्नाटक", "ಕರ್ನಾಟಕ"], MH: ["महाराष्ट्र"],
  DL: ["दिल्ली", "டெல்லி"], UP: ["उत्तर प्रदेश", "उत्तरप्रदेश"], GJ: ["गुजरात", "ગુજરાત"], RJ: ["राजस्थान"], BR: ["बिहार"],
  WB: ["पश्चिम बंगाल", "পশ্চিমবঙ্গ"], AP: ["ఆంధ్ర", "आंध्र"], TS: ["తెలంగాణ", "तेलंगाना"], PB: ["ਪੰਜਾਬ", "पंजाब"], OD: ["ଓଡ଼ିଶା", "ओडिशा"],
  AS: ["অসম", "असम"], UK: ["उत्तराखंड", "उत्तराखण्ड"], MP: ["मध्य प्रदेश", "मध्यप्रदेश"], HR: ["हरियाणा"], GA: ["गोवा"], HP: ["हिमाचल"],
};
export function detectState(text: string) {
  const low = text.toLowerCase();
  const byName = [...STATES].sort((a, b) => b.name.length - a.name.length).find((s) => low.includes(s.name.toLowerCase()));
  if (byName) return byName.code;
  for (const [code, stems] of Object.entries(STATE_ALIASES)) if (stems.some((s) => low.includes(s.toLowerCase()))) return code;
  return null;
}

const VEHICLE_WORDS: [string, string[]][] = [
  ["heavy-commercial", ["heavy vehicle", "hgv", "heavy commercial"]],
  ["tourist-vehicle", ["tourist vehicle", "tourist bus", "tourist cab"]],
  ["goods-truck", ["truck", "lorry", "goods vehicle", "ट्रक", "லாரி"]],
  ["bus", ["bus", "बस", "பேருந்து"]],
  ["taxi", ["taxi", "cab", "टैक्सी", "டாக்ஸி"]],
  ["two-wheeler", ["bike", "motorcycle", "scooter", "two wheeler", "two-wheeler", "helmet", "बाइक", "दोपहिया", "हेलमेट", "இருசக்கர", "ஹெல்மெட்", "హెల్మెట్", "ഹെൽമെറ്റ്", "ಹೆಲ್ಮೆಟ್", "হেলমেট", "હેલ્મેટ", "ਹੈਲਮੇਟ"]],
  ["private-car", ["car", "कार", "கார்", "కారు", "കാർ", "ಕಾರು"]],
];
export function detectVehicle(text: string) {
  const low = text.toLowerCase();
  for (const [slug, words] of VEHICLE_WORDS) if (words.some((w) => (w.length <= 3 ? new RegExp(`\\b${w}\\b`).test(low) : low.includes(w)))) return slug;
  return null;
}

const TOPIC_WORDS: [string, string[]][] = [
  ["helmet", ["helmet", "हेलमेट", "ஹெல்மெட்", "హెల్మెట్", "ഹെൽമെറ്റ്", "ಹೆಲ್ಮೆಟ್", "হেলমেট", "हेल्मेट", "હેલ્મેટ", "ਹੈਲਮੇਟ", "ହେଲମେଟ"]],
  ["seatbelt", ["seat belt", "seatbelt", "सीट बेल्ट", "சீட் பெல்ட்", "సీట్ బెల్ట్"]],
  ["drunk-driving", ["drunk", "alcohol", "drink and drive", "शराब", "குடி", "மது", "మద్యం"]],
  ["speed", ["speed", "overspeed", "गति", "वेग", "வேகம்", "వేగం"]],
  ["mobile", ["mobile", "phone", "मोबाइल", "மொபைல்", "ఫోన్"]],
  ["parking", ["parking", "पार्किंग", "பார்க்கிங்"]],
  ["pollution", ["puc", "pollution", "emission", "प्रदूषण", "மாசு"]],
  ["insurance", ["insurance", "बीमा", "காப்பீடு", "బీమా"]],
  ["forest", ["national park", "sanctuary", "tiger reserve", "forest", "wildlife", "eco-sensitive", "राष्ट्रीय उद्यान", "अभयारण्य", "वन", "காடு", "வனம்", "தேசிய பூங்கா", "అటవీ", "വനം", "ಅರಣ್ಯ"]],
  ["permit", ["permit", "परमिट", "அனுமதி", "పర్మిట్"]],
  ["licence", ["licence", "license", "learner", "dl ", "लाइसेंस", "लाइसेन्स", "உரிமம்", "ஓட்டுநர்", "లైసెన్స్", "ലൈസൻസ്", "ಪರವಾನಗಿ", "লাইসেন্স", "લાઇસન્સ", "ਲਾਇਸੈਂਸ", "ଲାଇସେନ୍ସ"]],
  ["registration", ["registration", "rc ", "ownership", "transfer", "noc", "hypothecation", "fitness", "पंजीकरण", "பதிவு"]],
  ["signals", ["signal", "red light", "सिग्नल", "சிக்னல்"]],
  ["overloading", ["overload", "ओवरलोड", "அதிக சுமை"]],
];
const FINE_WORDS = ["fine", "penalty", "challan", "जुर्माना", "चालान", "அபராத", "జరిమానా", "പിഴ", "ದಂಡ", "জরিমানা", "દંડ", "ਜੁਰਮਾਨਾ", "ଜରିମାନା"];
export function detectTopics(text: string) {
  const low = text.toLowerCase() + " ";
  return TOPIC_WORDS.filter(([, ws]) => ws.some((w) => low.includes(w))).map(([t]) => t);
}
export const isFineQuery = (t: string) => FINE_WORDS.some((w) => t.toLowerCase().includes(w));

const TOPIC_TO_VIOLATION: Record<string, string> = {
  helmet: "no-helmet", seatbelt: "no-seatbelt", "drunk-driving": "drunk-driving", speed: "overspeeding", mobile: "mobile-phone",
  parking: "illegal-parking", pollution: "pollution", insurance: "no-insurance", signals: "signal-violation", overloading: "overloading",
  permit: "permit-violation", licence: "no-licence", registration: "no-registration",
};

// ------------------------------------------------------------------
// Localised template strings (retrieval mode). Languages without a template fall back to English.
// ------------------------------------------------------------------
type Tpl = {
  fineVerified: (amt: string, sec: string) => string; fineDraft: (amt: string, sec: string) => string; noRecord: string;
  service: (title: string, desc: string) => string; rule: (title: string, expl: string) => string; none: string; forest: string;
  forestArea: (name: string, cls: string) => string; permit: (v: string, n: number) => string;
  labels: Record<"answer" | "location" | "vehicle" | "provision" | "verified" | "conditions" | "source" | "lastVerified" | "uncertainty" | "original" | "translated", string>;
};
const TPL: Record<string, Tpl> = {
  en: {
    fineVerified: (a, s) => `The recorded, human-verified penalty is ${a} (${s}). Always confirm with the official challan authority.`,
    fineDraft: (a, s) => `No human-verified penalty record is available yet. Draft reference (unverified, for information only): ${a} (${s}).`,
    noRecord: "No penalty record is stored for this violation and vehicle category. The information is missing — please check the official eChallan portal.",
    service: (t, d) => `${t}. ${d} Follow the steps below and complete the application on the official government portal.`,
    rule: (t, e) => `${t}: ${e}`,
    none: "I could not find a matching record. Please rephrase, select a state and vehicle, or check the official sources below.",
    forest: "Entry and vehicle rules differ for every forest, sanctuary, National Park and Eco-Sensitive Zone. Use the Forest & Wildlife checker with the destination name; the responsible authority must confirm permits, timings and vehicle access.",
    forestArea: (n, c) => `${n} is recorded as a ${c}. Detailed entry, permit and timing information has not been verified — see the missing-information list and contact the responsible authority.`,
    permit: (v, n) => `For ${v}, ${n} permit/compliance items may apply. Commercial vehicle rules are different from private-car rules.`,
    labels: { answer: "Direct answer", location: "Applicable location", vehicle: "Vehicle category", provision: "Legal provision", verified: "Verified information", conditions: "Conditions and exceptions", source: "Official source", lastVerified: "Last verified", uncertainty: "Uncertainty / information gap", original: "Original legal reference (unaltered)", translated: "Translated explanation" },
  },
  hi: {
    fineVerified: (a, s) => `दर्ज, मानव-सत्यापित जुर्माना ${a} है (${s})। कृपया आधिकारिक चालान प्राधिकरण से पुष्टि करें।`,
    fineDraft: (a, s) => `अभी तक कोई मानव-सत्यापित जुर्माना रिकॉर्ड उपलब्ध नहीं है। मसौदा संदर्भ (असत्यापित, केवल जानकारी हेतु): ${a} (${s})।`,
    noRecord: "इस उल्लंघन और वाहन श्रेणी के लिए कोई जुर्माना रिकॉर्ड उपलब्ध नहीं है। जानकारी अनुपलब्ध है — कृपया आधिकारिक eChallan पोर्टल देखें।",
    service: (t, d) => `${t}। ${d} नीचे दिए चरणों का पालन करें और आधिकारिक सरकारी पोर्टल पर आवेदन पूरा करें।`,
    rule: (t, e) => `${t}: ${e}`,
    none: "मुझे कोई मेल खाता रिकॉर्ड नहीं मिला। कृपया प्रश्न बदलें, राज्य और वाहन चुनें, या नीचे दिए आधिकारिक स्रोत देखें।",
    forest: "हर वन, अभयारण्य, राष्ट्रीय उद्यान और इको-सेंसिटिव ज़ोन के प्रवेश और वाहन नियम अलग होते हैं। गंतव्य के नाम के साथ वन और वन्यजीव चेकर का उपयोग करें; परमिट, समय और वाहन प्रवेश की पुष्टि संबंधित प्राधिकरण ही करेगा।",
    forestArea: (n, c) => `${n} को ${c} के रूप में दर्ज किया गया है। प्रवेश, परमिट और समय की विस्तृत जानकारी सत्यापित नहीं है — अनुपलब्ध जानकारी की सूची देखें और संबंधित प्राधिकरण से संपर्क करें।`,
    permit: (v, n) => `${v} के लिए ${n} परमिट/अनुपालन मदें लागू हो सकती हैं। वाणिज्यिक वाहनों के नियम निजी कार से अलग हैं।`,
    labels: { answer: "सीधा उत्तर", location: "लागू स्थान", vehicle: "वाहन श्रेणी", provision: "कानूनी प्रावधान", verified: "सत्यापित जानकारी", conditions: "शर्तें और अपवाद", source: "आधिकारिक स्रोत", lastVerified: "अंतिम सत्यापन", uncertainty: "अनिश्चितता / जानकारी की कमी", original: "मूल कानूनी संदर्भ (अपरिवर्तित)", translated: "अनूदित स्पष्टीकरण" },
  },
  ta: {
    fineVerified: (a, s) => `பதிவு செய்யப்பட்ட, மனிதரால் சரிபார்க்கப்பட்ட அபராதம் ${a} (${s}). அதிகாரப்பூர்வ சலான் அதிகாரியிடம் உறுதிசெய்யவும்.`,
    fineDraft: (a, s) => `மனிதரால் சரிபார்க்கப்பட்ட அபராதப் பதிவு இன்னும் இல்லை. வரைவு குறிப்பு (சரிபார்க்கப்படாதது, தகவலுக்காக மட்டும்): ${a} (${s}).`,
    noRecord: "இந்த விதிமீறல் மற்றும் வாகன வகைக்கு அபராதப் பதிவு இல்லை. தகவல் கிடைக்கவில்லை — அதிகாரப்பூர்வ eChallan தளத்தைப் பார்க்கவும்.",
    service: (t, d) => `${t}. ${d} கீழே உள்ள படிகளைப் பின்பற்றி அதிகாரப்பூர்வ அரசு தளத்தில் விண்ணப்பத்தை முடிக்கவும்.`,
    rule: (t, e) => `${t}: ${e}`,
    none: "பொருந்தும் பதிவு எதுவும் கிடைக்கவில்லை. கேள்வியை மாற்றி எழுதவும், மாநிலம் மற்றும் வாகனத்தைத் தேர்ந்தெடுக்கவும் அல்லது கீழே உள்ள அதிகாரப்பூர்வ ஆதாரங்களைப் பார்க்கவும்.",
    forest: "ஒவ்வொரு காடு, சரணாலயம், தேசிய பூங்கா மற்றும் சூழல் உணர்திறன் மண்டலத்திற்கும் நுழைவு மற்றும் வாகன விதிகள் வேறுபடும். இலக்கின் பெயருடன் வனம் & வன உயிரினம் சரிபார்ப்பைப் பயன்படுத்தவும்; அனுமதி, நேரம், வாகன அனுமதியை சம்பந்தப்பட்ட அதிகாரியே உறுதிசெய்ய வேண்டும்.",
    forestArea: (n, c) => `${n} ${c} ஆக பதிவு செய்யப்பட்டுள்ளது. நுழைவு, அனுமதி, நேரம் குறித்த விவரங்கள் சரிபார்க்கப்படவில்லை — விடுபட்ட தகவல் பட்டியலைப் பார்த்து சம்பந்தப்பட்ட அதிகாரியைத் தொடர்புகொள்ளவும்.`,
    permit: (v, n) => `${v} க்கு ${n} அனுமதி/இணக்க அம்சங்கள் பொருந்தலாம். வணிக வாகன விதிகள் தனியார் காருக்கான விதிகளிலிருந்து வேறுபடும்.`,
    labels: { answer: "நேரடி பதில்", location: "பொருந்தும் இடம்", vehicle: "வாகன வகை", provision: "சட்ட ஏற்பாடு", verified: "சரிபார்க்கப்பட்ட தகவல்", conditions: "நிபந்தனைகள் மற்றும் விதிவிலக்குகள்", source: "அதிகாரப்பூர்வ ஆதாரம்", lastVerified: "கடைசியாக சரிபார்க்கப்பட்டது", uncertainty: "நிச்சயமின்மை / தகவல் இடைவெளி", original: "அசல் சட்டக் குறிப்பு (மாற்றப்படாதது)", translated: "மொழிபெயர்க்கப்பட்ட விளக்கம்" },
  },
};

export type AssistantResult = Awaited<ReturnType<typeof askAssistant>>;
type Fact = { label: string; value: string; status: string; sourceUrl?: string | null; lastVerifiedAt?: Date | null };

export async function askAssistant(input: { question: string; lang: string; state?: string | null; vehicle?: string | null }) {
  const q = input.question;
  const lang = detectLanguage(q, input.lang);
  const stateCode = detectState(q) ?? input.state ?? null;
  const vehicle = detectVehicle(q) ?? input.vehicle ?? null;
  const topics = detectTopics(q);
  const fine = isFineQuery(q);
  const st = await stateByCode(stateCode);
  const t = TPL[lang] ?? TPL.en;
  const tEn = TPL.en;
  const vehicleName = VEHICLE_CATEGORIES.find((v) => v.slug === vehicle)?.name ?? "Not specified";
  const facts: Fact[] = [];
  const original: { reference: string; text: string }[] = [];
  const conditions: string[] = [];
  const uncertainty: string[] = [];
  const sources = new Map<string, string>();
  const provisions: string[] = [];
  let answerKey: "fine" | "service" | "rule" | "forest" | "permit" | "none" = "none";
  let answer = "";
  let answerEn = "";
  let lastVerified: Date | null = null;
  let intent = "general";
  const addSrc = (name: string, url?: string | null) => url && sources.set(url, name);

  const violationKey = (() => {
    for (const tp of topics) if (TOPIC_TO_VIOLATION[tp] && (fine || ["helmet", "seatbelt", "drunk-driving", "mobile"].includes(tp))) return TOPIC_TO_VIOLATION[tp];
    return null;
  })();

  if (topics.includes("forest")) {
    intent = "forest";
    const areas = await db.select().from(S.protectedAreas);
    const low = q.toLowerCase();
    const generic = new Set(["national", "park", "tiger", "reserve", "sanctuary", "wildlife", "and"]);
    const hit = areas.find((a) => a.name.toLowerCase().split(/[\s()]+/).some((w) => w.length > 3 && !generic.has(w) && low.includes(w)));
    if (hit) {
      const chk = await checkProtectedArea({ destination: hit.name, state: undefined, vehicle: vehicle ?? undefined });
      const m = chk.matches[0];
      answerKey = "forest"; answerEn = tEn.forestArea(m.name, m.classification); answer = t.forestArea(m.name, m.classification);
      facts.push({ label: "Classification", value: m.classification, status: m.verificationStatus, sourceUrl: m.sources[0]?.url });
      if (m.classificationGuide) conditions.push(m.classificationGuide);
      if (m.closures) conditions.push(m.closures);
      m.missingInformation.forEach((x) => uncertainty.push(`Missing: ${x}`));
      m.sources.forEach((s) => addSrc(s.name, s.url));
    } else {
      answerKey = "forest"; answer = t.forest; answerEn = tEn.forest;
      uncertainty.push("No specific protected area was identified in your question.");
    }
    addSrc("Ministry of Environment, Forest and Climate Change", OFFICIAL_LINKS.moef);
  } else if (violationKey) {
    intent = "fine";
    const r = await calculateFine({ state: stateCode, vehicle, violation: violationKey });
    const rec = r.primary ?? r.records.find((x) => x.hasAmount) ?? r.records[0];
    if (rec && rec.hasAmount) {
      const amt = rec.baseAmountText ?? "—";
      answerKey = "fine";
      answer = r.primary ? t.fineVerified(amt, rec.legalSection ?? "") : t.fineDraft(amt, rec.legalSection ?? "");
      answerEn = r.primary ? tEn.fineVerified(amt, rec.legalSection ?? "") : tEn.fineDraft(amt, rec.legalSection ?? "");
      facts.push({ label: r.violation.name, value: `${amt}${rec.additionalPenalty ? ` + ${rec.additionalPenalty}` : ""}`, status: rec.verificationStatus, sourceUrl: rec.sourceUrl, lastVerifiedAt: rec.lastVerifiedAt });
      if (rec.legalSection) provisions.push(rec.legalSection);
      if (rec.imprisonment) conditions.push(rec.imprisonment);
      if (rec.otherConsequences) conditions.push(rec.otherConsequences);
      if (rec.repeatConditions) conditions.push(`Repeat offence: ${rec.repeatConditions}`);
      if (rec.effectiveFrom) conditions.push(`Effective from ${rec.effectiveFrom}`);
      addSrc(rec.sourceName ?? "India Code", rec.sourceUrl);
      lastVerified = rec.lastVerifiedAt;
    } else {
      answerKey = "fine"; answer = t.noRecord; answerEn = tEn.noRecord;
    }
    r.notices.forEach((n) => uncertainty.push(n));
    addSrc("eChallan (official challan portal)", OFFICIAL_LINKS.echallan);
  } else if (topics.includes("permit")) {
    intent = "permit";
    const v = vehicle ?? "goods-truck";
    const r = await checkPermits({ vehicle: v, usage: v === "bus" ? "stage" : v === "taxi" ? "contract" : v === "tourist-vehicle" ? "tourist" : "goods", originState: stateCode ?? undefined });
    answerKey = "permit";
    const vn = r.vehicleLabel;
    answer = t.permit(vn, r.permits.length); answerEn = tEn.permit(vn, r.permits.length);
    r.permits.forEach((p) => { if (p) { facts.push({ label: p.name, value: p.why, status: p.verificationStatus, sourceUrl: p.officialUrl }); if (p.legalReference) provisions.push(p.legalReference); } });
    r.notices.forEach((n) => conditions.push(n));
    r.missingInformation.forEach((n) => uncertainty.push(n));
    r.sources.forEach((s) => addSrc(s.name, s.url));
  } else if (topics.includes("licence") || topics.includes("registration")) {
    intent = topics.includes("licence") ? "licence" : "vehicle-service";
    const low = q.toLowerCase();
    const pick = (map: [string, string[]][], dflt: string) => map.find(([, ws]) => ws.some((w) => low.includes(w)))?.[0] ?? dflt;
    if (intent === "licence") {
      const slug = pick([["licence-renewal", ["renew", "नवीनीकरण", "புதுப்பி"]], ["duplicate-licence", ["duplicate", "lost", "डुप्लिकेट"]], ["licence-address-change", ["address"]], ["licence-name-correction", ["name"]], ["international-driving-permit", ["international", "idp"]], ["licence-status", ["status"]], ["driving-test-preparation", ["test", "exam", "prepare"]], ["add-vehicle-class", ["add class", "another class", "endorse"]], ["permanent-licence", ["permanent"]]], "learners-licence");
      const rows = await db.select().from(S.licenseServices);
      const s = rows.find((x) => x.slug === slug)!;
      answerKey = "service"; answer = t.service(s.title, s.description ?? ""); answerEn = tEn.service(s.title, s.description ?? "");
      facts.push({ label: s.title, value: (s.steps ?? []).slice(0, 3).join(" → "), status: s.verificationStatus, sourceUrl: s.officialUrl, lastVerifiedAt: s.lastVerifiedAt });
      if (s.eligibility) conditions.push(`Eligibility: ${s.eligibility}`);
      (s.documents ?? []).length && conditions.push(`Documents: ${(s.documents ?? []).join("; ")}`);
      addSrc("Sarathi Parivahan", OFFICIAL_LINKS.sarathi);
      uncertainty.push(st ? `State-specific procedure for ${st.name} has not been verified in this database. After opening Sarathi, select ${st.name} and follow its instructions.` : "Procedures and fees vary by state. Select your state for state-specific guidance.");
      uncertainty.push("Fee information is not stated because verified fee data is not available.");
    } else {
      const slug = pick([["ownership-transfer", ["transfer", "ownership", "sale"]], ["noc", ["noc"]], ["duplicate-rc", ["duplicate"]], ["rc-renewal", ["renew"]], ["hypothecation-add", ["hypothecation", "loan"]], ["fitness-certificate", ["fitness"]], ["puc-certificate", ["puc"]], ["registration-status", ["status"]], ["interstate-requirements", ["interstate", "another state"]]], "new-registration");
      const rows = await db.select().from(S.vehicleServices);
      const s = rows.find((x) => x.slug === slug)!;
      answerKey = "service"; answer = t.service(s.title, s.description ?? ""); answerEn = tEn.service(s.title, s.description ?? "");
      facts.push({ label: s.title, value: (s.steps ?? []).slice(0, 3).join(" → "), status: s.verificationStatus, sourceUrl: s.officialUrl });
      addSrc("Vahan Parivahan", OFFICIAL_LINKS.vahan);
      uncertainty.push("Fees and state-specific procedures are not verified in this database.");
    }
  } else {
    intent = "law";
    const rules = await searchRules({ state: stateCode ?? undefined, vehicle: vehicle ?? undefined, topic: topics[0], q: topics.length ? undefined : q, limit: 5 });
    const rule = rules[0];
    if (rule) {
      answerKey = "rule"; answer = t.rule(rule.title, rule.explanation ?? ""); answerEn = tEn.rule(rule.title, rule.explanation ?? "");
      rules.slice(0, 3).forEach((r) => {
        facts.push({ label: r.title, value: r.explanation ?? "", status: r.verificationStatus, sourceUrl: r.sourceUrl, lastVerifiedAt: r.lastVerifiedAt });
        if (r.legalReference) { provisions.push(r.legalReference); original.push({ reference: r.legalReference, text: r.originalText ?? "Original wording not yet loaded — see the official source." }); }
        addSrc(r.sourceName ?? "Official source", r.sourceUrl);
      });
      if (rule.conditions) conditions.push(rule.conditions);
      if (rule.exceptions) conditions.push(`Exceptions: ${rule.exceptions}`);
      lastVerified = rule.lastVerifiedAt;
    } else {
      answer = t.none; answerEn = tEn.none;
    }
  }

  // common uncertainty
  const anyUnverified = facts.some((f) => f.status !== "verified");
  if (anyUnverified || !facts.length) uncertainty.push("Some or all cited records are NOT human-verified (demo data). Treat this as general guidance and confirm with the official source.");
  if (st) {
    const [cnt] = await db.select({ n: S.legalRules.id }).from(S.legalRules).where(eq(S.legalRules.stateId, st.id)).limit(1);
    if (!cnt) uncertainty.push(`No state-specific rules are stored for ${st.name}; answer is based on central law.`);
  }
  if (!st && !["licence", "vehicle-service"].includes(intent)) uncertainty.push("No state was identified; the answer reflects central law only.");
  addSrc("India Code", OFFICIAL_LINKS.indiacode);

  let generatedBy: "retrieval" | "gemini" | "claude" = "retrieval";
  let translationNote: string | null = null;
  const langName = LANGUAGES.find((l) => l.code === lang)?.name ?? "English";
  const provider = aiProvider();
  if (provider) {
    try {
      const context = JSON.stringify({ intent, state: st?.name ?? null, vehicle: vehicleName, facts: facts.slice(0, 6), conditions: conditions.slice(0, 6), provisions, uncertainty: uncertainty.slice(0, 5), draftAnswer: answerEn });
      const out = await callLLM({
        system: `You are DriveLegal AI Assistant for Indian driving and transport law. Use ONLY the CONTEXT given. Never invent legal sections, fines, fees, permits, timings or restrictions. If the context lacks information, say so plainly. Mention when information is not human-verified. Do not give definitive legal advice. Respond in ${langName}. Keep section numbers and Act names in their original form.`,
        prompt: `Question: ${q}\n\nCONTEXT:\n${context}\n\nWrite a concise direct answer (max 120 words) in ${langName}.`,
      });
      if (out.trim()) { answer = out.trim(); generatedBy = provider; }
    } catch (e) {
      console.error("[assistant] provider failed, using retrieval answer", e);
      uncertainty.push("The AI provider was unavailable; this answer was assembled directly from stored records.");
    }
  }
  if (generatedBy === "retrieval" && !TPL[lang] && lang !== "en") translationNote = `Automatic translation into ${langName} needs an AI provider key. The answer is shown in English; the original legal references are unaltered.`;
  const translated = lang !== "en" && (generatedBy !== "retrieval" || !!TPL[lang]);

  return {
    language: lang,
    languageName: langName,
    labels: t.labels,
    detected: { state: st ? { code: st.code, name: st.name } : null, vehicle, vehicleName, topics, intent },
    directAnswer: answer || t.none,
    englishAnswer: answerEn,
    applicableLocation: st ? st.name : "India (central law)",
    vehicleCategory: vehicleName,
    legalProvision: [...new Set(provisions)],
    verifiedInformation: facts,
    conditionsAndExceptions: conditions,
    originalLegalText: original,
    officialSources: [...sources.entries()].map(([url, name]) => ({ name, url })),
    lastVerifiedAt: lastVerified,
    uncertainty: [...new Set(uncertainty)],
    generatedBy,
    translated,
    translationNote,
    answerKind: answerKey,
    disclaimer: "AI-generated explanation based on stored records. Not legal advice. Confirm with the official source.",
  };
}

