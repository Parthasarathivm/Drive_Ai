import { handle } from "@/lib/api";
import { searchRules } from "@/lib/legal";
import { stateByCode } from "@/lib/legal";

export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const g = (k: string) => sp.get(k) || undefined;
  const rules = await searchRules({ q: g("q"), state: g("state"), district: g("district"), vehicle: g("vehicle"), topic: g("topic"), category: g("category"), status: g("status") });
  const st = await stateByCode(g("state"));
  const stateSpecific = st ? rules.filter((r) => r.stateId === st.id).length : 0;
  return {
    rules,
    total: rules.length,
    coverageNote: st && !stateSpecific ? `No state-specific rules are stored for ${st.name}. Results show central law only.` : null,
  };
});
