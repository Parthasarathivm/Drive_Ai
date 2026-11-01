"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut, Menu, Moon, ShieldCheck, Sun, UserCircle2, X, Sparkles, Compass } from "lucide-react";
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
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    await refreshUser();
    toast("You have been logged out.", "success");
    router.push("/");
  }

  const navLinks = [
    { href: "/services", label: t("nav.services") },
    { href: "/laws", label: t("nav.laws") },
    { href: "/fines", label: t("nav.fines") },
    { href: "/permits", label: t("nav.permits") },
    { href: "/forest", label: t("nav.forest") },
    { href: "/assistant", label: t("nav.assistant") },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-surface/80 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        {/* Mobile menu trigger & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl p-2 text-fg hover:bg-surface-2 lg:hidden transition"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="group flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-royal via-electric to-accent text-white shadow-md shadow-royal/20 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5 text-white" />
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-lg text-fg font-black tracking-tight">DriveLegal</span>
                <span className="rounded-md bg-accent/20 px-1.5 py-0.2 text-[10px] font-black uppercase tracking-widest text-accent">AI</span>
              </div>
              <span className="hidden text-[9px] font-semibold uppercase tracking-wider text-muted sm:inline-block">India Mobility & Legal Intel</span>
            </div>
          </Link>
        </div>

        {/* Primary Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 text-sm font-semibold lg:flex" aria-label="Primary Navigation">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3.5 py-2 text-fg/80 transition hover:bg-surface-2 hover:text-electric"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Action Controls: Language, Theme, Auth */}
        <div className="flex items-center gap-2.5">
          {/* Language Selector */}
          <div className="relative">
            <label className="sr-only" htmlFor="lang-select">
              {t("common.language")}
            </label>
            <select
              id="lang-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              title={t("common.machine")}
              className="max-w-[8.5rem] rounded-xl border border-line bg-surface/90 px-2.5 py-1.5 text-xs font-medium text-fg shadow-sm focus:border-accent focus:outline-none transition sm:max-w-[10rem] sm:text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            aria-label="Toggle dark mode"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl border border-line bg-surface/90 p-2 text-fg shadow-sm transition hover:bg-surface-2"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </button>

          {/* User Auth or Profile */}
          {userLoading ? null : user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href="/dashboard"
                className={cx(
                  btnClass("secondary", "sm"),
                  "hidden rounded-xl border-accent/30 bg-accent/10 text-accent font-semibold md:inline-flex"
                )}
              >
                <Compass className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/profile"
                className={cx(btnClass("ghost", "sm"), "max-w-[9rem] truncate rounded-xl")}
              >
                <UserCircle2 className="h-4 w-4 shrink-0 text-electric" />
                <span className="hidden truncate font-semibold sm:inline">{user.name}</span>
              </Link>
              <button
                onClick={logout}
                className="rounded-xl p-2 text-muted transition hover:bg-surface-2 hover:text-red-500"
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className={cx(btnClass("ghost", "sm"), "hidden font-semibold sm:inline-flex")}>
                <LogIn className="h-4 w-4 text-electric" />
                {t("nav.login")}
              </Link>
              <LinkButton href="/register" size="sm" variant="accent" className="font-semibold shadow-md">
                {t("nav.register")}
              </LinkButton>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[20rem] max-w-[85vw] overflow-y-auto bg-surface p-5 shadow-2xl border-r border-line">
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-royal text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="font-black text-lg text-fg">DriveLegal <span className="text-accent">AI</span></span>
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-fg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="mb-3 block rounded-xl px-3.5 py-2.5 text-sm font-semibold hover:bg-surface-2 text-fg"
            >
              {t("nav.home")}
            </Link>
            <NavList onNavigate={() => setOpen(false)} />
            {!user && (
              <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-line">
                <LinkButton href="/login" variant="secondary" size="md">
                  {t("nav.login")}
                </LinkButton>
                <LinkButton href="/register" variant="accent" size="md">
                  {t("nav.register")}
                </LinkButton>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
