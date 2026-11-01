"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { api } from "@/lib/client";
import { builtInDict, type UiKey } from "@/lib/i18n";
import type { Role } from "@/lib/constants";

export type AppUser = {
  id: number; email: string; name: string; preferredLanguage: string; preferredState: string | null; preferredVehicle: string | null;
  notifySettings: { documentExpiry: boolean; reportUpdates: boolean; sourceChanges: boolean }; roles: Role[];
};
type Toast = { id: number; type: "success" | "error" | "info"; message: string };

type Ctx = {
  lang: string; setLang: (l: string) => void;
  state: string; setState: (s: string) => void;
  vehicle: string; setVehicle: (v: string) => void;
  theme: "light" | "dark"; setTheme: (t: "light" | "dark") => void;
  t: (k: UiKey) => string;
  translationsReviewed: boolean;
  user: AppUser | null; userLoading: boolean; refreshUser: () => Promise<void>;
  toast: (message: string, type?: Toast["type"]) => void;
  isStaff: boolean; hasRole: (...r: Role[]) => boolean;
};

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside Providers");
  return c;
};

const ls = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

export function Providers({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState("en");
  const [state, setStateRaw] = useState("");
  const [vehicle, setVehicleRaw] = useState("");
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [overrides, setOverrides] = useState<{ lang: string; values: Record<string, string>; reviewed: boolean }>({ lang: "en", values: {}, reviewed: false });
  const [user, setUser] = useState<AppUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refreshUser = useCallback(async () => {
    try {
      const r = await api<{ user: AppUser | null }>("/api/auth/profile");
      setUser(r.user);
      return;
    } catch {
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const l = ls.get("dl_lang"); if (l) setLangState(l);
    const s = ls.get("dl_state"); if (s) setStateRaw(s);
    const v = ls.get("dl_vehicle"); if (v) setVehicleRaw(v);
    const th = (ls.get("dl_theme") as "light" | "dark" | null) ?? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(th);
    refreshUser().then(() => undefined);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [refreshUser]);

  // adopt saved profile preferences when nothing is stored locally
  useEffect(() => {
    if (!user) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!ls.get("dl_lang") && user.preferredLanguage) setLangState(user.preferredLanguage);
    if (!ls.get("dl_state") && user.preferredState) setStateRaw(user.preferredState);
    if (!ls.get("dl_vehicle") && user.preferredVehicle) setVehicleRaw(user.preferredVehicle);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = lang;
  }, [theme, lang]);

  // overlay reviewed/overridden translations from the database
  useEffect(() => {
    let cancelled = false;
    api<{ lang: string; values: Record<string, string>; reviewed: boolean }>(`/api/translations?lang=${lang}`)
      .then((r) => { if (!cancelled) setOverrides(r); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [lang]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const setLang = useCallback((l: string) => {
    setLangState(l); ls.set("dl_lang", l);
    if (user) api("/api/auth/profile", { method: "PATCH", body: { preferredLanguage: l } }).catch(() => undefined);
  }, [user]);
  const setState = useCallback((s: string) => { setStateRaw(s); ls.set("dl_state", s); }, []);
  const setVehicle = useCallback((v: string) => { setVehicleRaw(v); ls.set("dl_vehicle", v); }, []);
  const setTheme = useCallback((t: "light" | "dark") => { setThemeState(t); ls.set("dl_theme", t); }, []);

  const dict = useMemo(() => ({ ...builtInDict(lang), ...(overrides.lang === lang ? overrides.values : {}) }), [lang, overrides]);
  const t = useCallback((k: UiKey) => dict[k] ?? k, [dict]);
  const hasRole = useCallback((...r: Role[]) => !!user && (user.roles.includes("super_admin") || r.some((x) => user.roles.includes(x))), [user]);

  const value: Ctx = {
    lang, setLang, state, setState, vehicle, setVehicle, theme, setTheme, t,
    translationsReviewed: lang === "en" || overrides.reviewed,
    user, userLoading, refreshUser, toast,
    isStaff: !!user && user.roles.some((r) => r !== "user"), hasRole,
  };

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-[100] flex w-[min(92vw,22rem)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className="dl-toast flex items-start gap-2 rounded-xl border border-line bg-surface p-3 text-sm shadow-lg">
            {x.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : x.type === "error" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-royal" />}
            <span>{x.message}</span>
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
