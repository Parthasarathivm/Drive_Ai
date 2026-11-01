"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Menu, Palette, ShieldCheck, UserCircle2, X, Check, Compass } from "lucide-react";
import { useApp, THEMES, type ThemeId } from "@/components/Providers";
import { NavList } from "@/components/nav";
import { LinkButton, btnClass, cx } from "@/components/ui";
import { LANGUAGES } from "@/lib/constants";
import { api } from "@/lib/client";

export function Navbar() {
  const { lang, setLang, theme, setTheme, t, user, userLoading, refreshUser, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Click outside to close theme dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const currentThemeMeta = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-xl transition-colors">
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

        {/* Action Controls: Language, 5 Themes, Auth */}
        <div className="flex items-center gap-2">
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
              className="max-w-[7.5rem] rounded-xl border border-line bg-surface/90 px-2.5 py-1.5 text-xs font-medium text-fg shadow-sm focus:border-accent focus:outline-none transition sm:max-w-[9.5rem] sm:text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          {/* 5 Themes Selector Dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              aria-label="Select Theme"
              title={`Theme: ${currentThemeMeta.name}`}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-surface/90 px-2.5 py-1.5 text-xs font-medium text-fg shadow-sm transition hover:bg-surface-2 hover:border-accent/50"
            >
              <Palette className="h-4 w-4 text-accent" />
              <span
                className="h-2.5 w-2.5 rounded-full border border-white/30"
                style={{ backgroundColor: currentThemeMeta.accent }}
              />
              <span className="hidden md:inline font-semibold text-xs">{currentThemeMeta.name}</span>
            </button>

            {themeOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-surface/95 p-2 shadow-2xl backdrop-blur-xl z-50">
                <div className="px-3 py-1.5 border-b border-line/60 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Select Theme</p>
                </div>
                <div className="space-y-1">
                  {THEMES.map((th) => (
                    <button
                      key={th.id}
                      onClick={() => {
                        setTheme(th.id);
                        setThemeOpen(false);
                      }}
                      className={cx(
                        "w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-left transition",
                        theme === th.id
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "text-fg hover:bg-surface-2"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-white/40 shadow-sm"
                          style={{ backgroundColor: th.accent }}
                        />
                        <span>{th.name}</span>
                      </div>
                      {theme === th.id && <Check className="h-3.5 w-3.5 text-accent" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="relative ml-auto flex h-full w-[min(85vw,22rem)] flex-col border-l border-line bg-surface p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span className="text-sm font-bold tracking-tight text-fg">Navigation Menu</span>
              <button
                className="rounded-xl p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-line pt-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-muted mb-2">
                <span>Active Theme:</span>
                <span className="font-semibold text-accent">{currentThemeMeta.name}</span>
              </div>
              {!user && (
                <div className="grid grid-cols-2 gap-2" onClick={() => setOpen(false)}>
                  <LinkButton href="/login" variant="secondary" size="sm">
                    {t("nav.login")}
                  </LinkButton>
                  <LinkButton href="/register" variant="accent" size="sm">
                    {t("nav.register")}
                  </LinkButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
