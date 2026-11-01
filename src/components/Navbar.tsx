"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Menu, Moon, ShieldCheck, Sun, UserCircle2, X } from "lucide-react";
import { useApp } from "@/components/Providers";
import { NavList } from "@/components/nav";
import { LinkButton, btnClass, cx } from "@/components/ui";
import { LANGUAGES } from "@/lib/constants";
import { api } from "@/lib/client";

export function Navbar() {
  const { lang, setLang, theme, setTheme, t, user, userLoading, refreshUser, toast } = useApp();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await refreshUser();
    toast("You have been logged out.", "success");
    router.push("/");
  }

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4">
        <button className="rounded-lg p-2 hover:bg-surface2 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-navy text-white"><ShieldCheck className="h-5 w-5 text-cyan-300" /></span>
          <span className="hidden sm:inline">DriveLegal <span className="text-accent">AI</span></span>
        </Link>
        <nav className="ml-4 hidden items-center gap-1 text-sm lg:flex" aria-label="Primary">
          {[["/services", t("nav.services")], ["/fines", t("nav.fines")], ["/laws", t("nav.laws")], ["/forest", t("nav.forest")], ["/assistant", t("nav.assistant")]].map(([h, l]) => (
            <Link key={h} href={h} className="rounded-lg px-3 py-1.5 text-fg/80 hover:bg-surface2">{l}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="lang-select">{t("common.language")}</label>
          <select id="lang-select" value={lang} onChange={(e) => setLang(e.target.value)} title={t("common.machine")}
            className="max-w-[8.5rem] rounded-lg border border-line bg-surface px-2 py-1.5 text-sm focus:border-royal focus:outline-none">
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.nativeName}</option>)}
          </select>
          <button aria-label="Toggle dark mode" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-lg p-2 hover:bg-surface2">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {userLoading ? null : user ? (
            <div className="flex items-center gap-1">
              <Link href="/profile" className={cx(btnClass("ghost", "sm"), "max-w-[9rem]")}><UserCircle2 className="h-4 w-4 shrink-0" /><span className="hidden truncate sm:inline">{user.name}</span></Link>
              <button onClick={logout} className="rounded-lg p-2 hover:bg-surface2" aria-label={t("nav.logout")} title={t("nav.logout")}><LogOut className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <Link href="/login" className={cx(btnClass("ghost", "sm"), "hidden sm:inline-flex")}><LogIn className="h-4 w-4" />{t("nav.login")}</Link>
              <LinkButton href="/register" size="sm">{t("nav.register")}</LinkButton>
            </>
          )}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[18rem] max-w-[85vw] overflow-y-auto bg-surface p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold">DriveLegal AI</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-surface2"><X className="h-5 w-5" /></button>
            </div>
            <Link href="/" onClick={() => setOpen(false)} className="mb-3 block rounded-lg px-3 py-2 text-sm hover:bg-surface2">{t("nav.home")}</Link>
            <NavList onNavigate={() => setOpen(false)} />
            {!user && <div className="mt-4 flex gap-2"><LinkButton href="/login" variant="secondary" size="sm">{t("nav.login")}</LinkButton><LinkButton href="/register" size="sm">{t("nav.register")}</LinkButton></div>}
          </div>
        </div>
      )}
    </header>
  );
}
