import { handle } from "@/lib/api";
import { compareStates, listPenalties } from "@/lib/legal";

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const g = (k: string) => sp.get(k) || undefined;
  if (sp.get("compare") === "1" && g("violation")) {
    return { comparison: await compareStates(g("violation")!, g("vehicle")), note: "States without a stored state record fall back to central law; this is not proof that the state has not amended the amount." };
  }
  const penalties = await listPenalties({ state: g("state"), vehicle: g("vehicle"), violation: g("violation"), status: g("status"), q: g("q") });
  return { penalties, total: penalties.length };
});
