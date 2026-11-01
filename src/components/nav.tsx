"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Bot, Calculator, Car, FileCheck, FileText, FolderOpen, GitCompareArrows, IdCard, LayoutDashboard, Languages, LayoutGrid, MapPin, Receipt, Route, Scale,
  ScanLine, Settings, ShieldCheck, SearchCheck, TreePine, Truck, User, Users, Database, BookOpenCheck, Globe2, Newspaper,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import { cx } from "@/components/ui";
import type { UiKey } from "@/lib/i18n";
import type { ReactNode } from "react";

type Item = { href: string; label: string; key?: UiKey; icon: ReactNode; group: string; admin?: boolean };
const ic = "h-4 w-4";
export const NAV: Item[] = [
  { href: "/dashboard", label: "Dashboard", key: "nav.dashboard", icon: <LayoutDashboard className={ic} />, group: "Overview" },
  { href: "/services", label: "Services", key: "nav.services", icon: <LayoutGrid className={ic} />, group: "Overview" },
  { href: "/licence", label: "Driving Licence", key: "nav.licence", icon: <IdCard className={ic} />, group: "Driving & vehicles" },
  { href: "/vehicle", label: "Vehicle Services", key: "nav.vehicle", icon: <Car className={ic} />, group: "Driving & vehicles" },
  { href: "/fines", label: "Fine Calculator", key: "nav.fines", icon: <Calculator className={ic} />, group: "Driving & vehicles" },
  { href: "/challan", label: "Challan Information", icon: <Receipt className={ic} />, group: "Driving & vehicles" },
  { href: "/laws", label: "Driving Laws", key: "nav.laws", icon: <Scale className={ic} />, group: "Driving & vehicles" },
  { href: "/forest", label: "Forest & Wildlife", key: "nav.forest", icon: <TreePine className={ic} />, group: "Travel & transport" },
  { href: "/location-checker", label: "Location Legal Checker", icon: <MapPin className={ic} />, group: "Travel & transport" },
  { href: "/route-checker", label: "Route Legal Checker", key: "nav.travel", icon: <Route className={ic} />, group: "Travel & transport" },
  { href: "/permits", label: "Commercial Permits", key: "nav.permits", icon: <Truck className={ic} />, group: "Travel & transport" },
  { href: "/compliance", label: "Insurance & PUC", key: "nav.compliance", icon: <FileCheck className={ic} />, group: "My compliance" },
  { href: "/documents", label: "My Documents", key: "nav.documents", icon: <FolderOpen className={ic} />, group: "My compliance" },
  { href: "/notifications", label: "Notifications", key: "nav.notifications", icon: <Bell className={ic} />, group: "My compliance" },
  { href: "/reports", label: "Reports", key: "nav.reports", icon: <FileText className={ic} />, group: "My compliance" },
  { href: "/assistant", label: "AI Legal Assistant", key: "nav.assistant", icon: <Bot className={ic} />, group: "AI tools" },
  { href: "/road-sign", label: "Road Sign AI", key: "nav.roadSign", icon: <ScanLine className={ic} />, group: "AI tools" },
  { href: "/gaps", label: "Legal Gap Analysis", key: "nav.gaps", icon: <SearchCheck className={ic} />, group: "AI tools" },
  { href: "/profile", label: "Profile", icon: <User className={ic} />, group: "Account" },
  { href: "/settings", label: "Settings", key: "nav.settings", icon: <Settings className={ic} />, group: "Account" },
  { href: "/admin", label: "Admin Dashboard", icon: <ShieldCheck className={ic} />, group: "Administration", admin: true },
  { href: "/admin/sources", label: "Source Management", icon: <Globe2 className={ic} />, group: "Administration", admin: true },
  { href: "/admin/rules", label: "Legal Rule Review", icon: <BookOpenCheck className={ic} />, group: "Administration", admin: true },
  { href: "/admin/conflicts", label: "Conflict Review", icon: <GitCompareArrows className={ic} />, group: "Administration", admin: true },
  { href: "/admin/translations", label: "Translation Management", icon: <Languages className={ic} />, group: "Administration", admin: true },
  { href: "/admin/data", label: "Data Management", icon: <Database className={ic} />, group: "Administration", admin: true },
  { href: "/admin/users", label: "Users & Roles", icon: <Users className={ic} />, group: "Administration", admin: true },
];
export const NewsIcon = Newspaper;

export function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { t, isStaff } = useApp();
  const groups = [...new Set(NAV.map((n) => n.group))];
  return (
    <nav aria-label="Main" className="space-y-5">
      {groups.map((g) => {
        const items = NAV.filter((n) => n.group === g && (!n.admin || isStaff));
        if (!items.length) return null;
        return (
          <div key={g}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{g}</p>
            <ul className="space-y-0.5">
              {items.map((n) => {
                const active = path === n.href || (n.href !== "/admin" && path.startsWith(n.href + "/"));
                return (
                  <li key={n.href}>
                    <Link href={n.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                      className={cx("flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition", active ? "bg-royal/10 font-semibold text-royal" : "text-fg/80 hover:bg-surface2")}>
                      {n.icon}{n.key ? t(n.key) : n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
