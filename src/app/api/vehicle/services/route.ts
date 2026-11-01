import { ApiError, handle } from "@/lib/api";
import { db } from "@/db";
import { vehicleServices } from "@/db/schema";
import { appliesToVehicle } from "@/lib/legal";
import { STATES, VEHICLE_CATEGORIES } from "@/lib/constants";

// Tamil Nadu state-specific administrative guidance for vehicle services
const TN_VEHICLE_NOTES: Record<string, string> = {
  "fitness-certificate":
    "In Tamil Nadu, annual fitness testing for commercial transport vehicles (taxis/cabs) is conducted at regional automated testing stations or designated RTO tracks with electronic speed governor verification.",
  "commercial-registration":
    "Commercial taxi registrations in Tamil Nadu require mandatory fitment of AIS-140 GPS tracking devices, emergency panic buttons, high-security registration plates (HSRP), and fare-meter certification.",
  "interstate-requirements":
    "Tourist taxis operating into or out of Tamil Nadu require countersignature or All India Tourist Permit (AITP) along with applicable Tamil Nadu single-journey or quarterly motor vehicle tax payments.",
  "puc-certificate":
    "Pollution Under Control (PUC) certificates in Tamil Nadu are uploaded directly to the central Vahan database by authorized testing centres. Digital verification is accepted during road inspections.",
  "new-registration":
    "Dealer-point registration is active across all Tamil Nadu RTOs for new motor vehicles. The registration number is assigned online via the Vahan portal.",
  "rc-renewal":
    "RC renewal for non-transport vehicles occurs after 15 years; for transport vehicles like taxis, renewal follows periodic fitness certificate inspection at the jurisdictional RTO in Tamil Nadu.",
  "duplicate-rc":
    "In Tamil Nadu, applying for a duplicate RC requires an online non-traceable report from the Tamil Nadu Police web portal (eservices.tnpolice.gov.in) if the original RC was lost or stolen.",
  "ownership-transfer":
    "Transfer of vehicle ownership across Tamil Nadu requires Form 29 and 30, valid insurance, PUC, and clearance of any outstanding e-Challans prior to RTO approval.",
  "noc":
    "No Objection Certificate (NOC) for moving a vehicle registered in Tamil Nadu to another state requires police clearance and tax verification from the parent RTO.",
  "hypothecation-add":
    "Loan endorsement in Tamil Nadu is processed online via Vahan with financier authorization.",
  "hypothecation-terminate":
    "Removal of bank hypothecation in Tamil Nadu requires Form 35 and a digital or signed No Objection Certificate (NOC) from the financial institution.",
};

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const rawQ = sp.get("q")?.trim();
  const rawVehicle = sp.get("vehicle")?.trim();
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

  let vehicleSlug: string | null = null;
  if (rawVehicle) {
    const lower = rawVehicle.toLowerCase();
    if (lower !== "*") {
      const matchedVehicle = VEHICLE_CATEGORIES.find((v) => v.slug === lower);
      if (!matchedVehicle) {
        throw new ApiError(
          400,
          `Invalid vehicle parameter: "${rawVehicle}". Valid categories include: ${VEHICLE_CATEGORIES.map((v) => v.slug).join(", ")}.`
        );
      }
      vehicleSlug = matchedVehicle.slug;
    }
  }

  let rows = await db.select().from(vehicleServices).orderBy(vehicleServices.id);

  if (rawQ) {
    const qLower = rawQ.toLowerCase();
    rows = rows.filter((r) =>
      `${r.title} ${r.description ?? ""}`.toLowerCase().includes(qLower)
    );
  }

  if (vehicleSlug) {
    rows = rows.filter((r) => appliesToVehicle(r.vehicleCategories, vehicleSlug));
  }

  const services = rows.map((r) => {
    let stateNote: string | null = null;
    if (stateCode) {
      stateNote =
        r.stateNotes?.[stateCode] ??
        (stateCode === "TN" ? TN_VEHICLE_NOTES[r.slug] ?? null : null);
    }
    return {
      ...r,
      stateNote,
    };
  });

  return { services };
});
