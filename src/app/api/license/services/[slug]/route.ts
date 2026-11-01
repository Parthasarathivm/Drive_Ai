import { eq } from "drizzle-orm";
import { db } from "@/db";
import { licenseServices } from "@/db/schema";
import { ApiError, handle } from "@/lib/api";

export const GET = handle<{ params: Promise<{ slug: string }> }>(async (req, { params }) => {
  const { slug } = await params;
  const state = new URL(req.url).searchParams.get("state")?.toUpperCase();
  const [s] = await db.select().from(licenseServices).where(eq(licenseServices.slug, slug)).limit(1);
  if (!s) throw new ApiError(404, "Service not found.");
  return { service: { ...s, stateNote: state ? s.stateNotes?.[state] ?? null : null } };
});
