import { ApiError, handle } from "@/lib/api";
import { db } from "@/db";
import { licenseServices } from "@/db/schema";
import { STATES } from "@/lib/constants";

// Tamil Nadu state-specific administrative guidance for licence services
const TN_LICENSE_NOTES: Record<string, string> = {
  "learners-licence":
    "Tamil Nadu provides contactless online Learner's Licence testing via Aadhaar-based authentication on the Sarathi portal. Passing the online test generates an instant downloadable LL.",
  "permanent-licence":
    "Driving test slot booking is mandatory on Sarathi for all Tamil Nadu RTOs. Practical driving tests are evaluated at automated driving test tracks (ADTT) in Chennai, Coimbatore, Trichy, and other regional centres.",
  "licence-renewal":
    "Faceless DL renewal is enabled across Tamil Nadu for non-transport licences within one year of expiry. Medical Certificate Form 1-A can be digitally uploaded by an authorized medical practitioner on Sarathi.",
  "duplicate-licence":
    "For a lost licence in Tamil Nadu, an online Lost Document Report (LDR) from the Tamil Nadu Police portal (eservices.tnpolice.gov.in) must be submitted along with the Sarathi application.",
  "licence-address-change":
    "Address change within Tamil Nadu requires Aadhaar or valid address proof and is processed online without physical RTO visit if biometric records are active.",
  "add-vehicle-class":
    "To add a transport or additional vehicle class in Tamil Nadu, slot booking for the practical test at the jurisdictional RTO is required.",
  "international-driving-permit":
    "In Tamil Nadu, IDP applications require physical verification of the original passport, valid visa, air ticket, and Indian DL at the home RTO.",
  "licence-status":
    "Track Sarathi application status using your Tamil Nadu application number and date of birth.",
  "driving-test-preparation":
    "Tamil Nadu driving test tracks assess parallel parking, 8-figure driving, and gradient stop-start compliance under automated CCTV supervision.",
};

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const rawQ = sp.get("q")?.trim();
  const rawState = sp.get("state")?.trim();

  if (rawQ && rawQ.length > 100) {
    throw new ApiError(400, "Search query is too long (maximum 100 characters).");
  }

  let stateCode: string | null = null;
  if (rawState) {
    const upper = rawState.toUpperCase();
    const matchedState = STATES.find(
      (s) => s.code === upper || s.name.toLowerCase() === rawState.toLowerCase()
    );
    if (!matchedState) {
      throw new ApiError(
        400,
        `Invalid state parameter: "${rawState}". Please provide a valid Indian State or UT code (e.g., 'TN', 'DL', 'KA').`
      );
    }
    stateCode = matchedState.code;
  }

  let rows = await db.select().from(licenseServices).orderBy(licenseServices.id);

  if (rawQ) {
    const qLower = rawQ.toLowerCase();
    rows = rows.filter((r) =>
      `${r.title} ${r.description ?? ""}`.toLowerCase().includes(qLower)
    );
  }

  const services = rows.map((r) => {
    let stateNote: string | null = null;
    if (stateCode) {
      stateNote =
        r.stateNotes?.[stateCode] ??
        (stateCode === "TN" ? TN_LICENSE_NOTES[r.slug] ?? null : null);
    }
    return {
      ...r,
      stateNote,
    };
  });

  return { services };
});
