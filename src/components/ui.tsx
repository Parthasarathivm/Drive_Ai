"use client";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, Info, Loader2, Search, ShieldAlert, X, XCircle, Clock } from "lucide-react";
import { DEMO_WARNING, STATES } from "@/lib/constants";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const inputCls =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/30 disabled:opacity-60";

export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-2xl border border-line bg-surface p-5 shadow-sm", className)} {...rest}>{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" | "accent"; size?: "sm" | "md" | "lg"; loading?: boolean };
const btnBase = "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
const variants = {
  primary: "bg-royal text-white hover:bg-royal/90",
  accent: "bg-accent text-white hover:bg-accent/90",
  secondary: "border border-line bg-surface text-fg hover:bg-surface2",
  ghost: "text-fg hover:bg-surface2",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-3 text-base" };
export function btnClass(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md") {
  return cx(btnBase, variants[variant], sizes[size]);
}
export function Button({ variant = "primary", size = "md", loading, children, className, disabled, ...rest }: BtnProps) {
  return (
    <button className={cx(btnClass(variant, size), className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
export function LinkButton({ href, variant = "primary", size = "md", children, external, className }: { href: string; variant?: keyof typeof variants; size?: keyof typeof sizes; children: ReactNode; external?: boolean; className?: string }) {
  const cls = cx(btnClass(variant, size), className);
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}<ExternalLink className="h-3.5 w-3.5" /></a>
  ) : (
    <Link href={href} className={cls}>{children}</Link>
  );
}

const TONES = {
  green: "bg-green-500/15 text-green-700 dark:text-green-300 border-green-500/30",
  amber: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  red: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  grey: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  teal: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30",
};
export type Tone = keyof typeof TONES;
export function Badge({ tone = "grey", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium", TONES[tone], className)}>{children}</span>;
}

const STATUS_MAP: Record<string, { tone: Tone; label: string; icon: ReactNode }> = {
  verified: { tone: "green", label: "Verified", icon: <CheckCircle2 className="h-3 w-3" /> },
  Verified: { tone: "green", label: "Verified", icon: <CheckCircle2 className="h-3 w-3" /> },
  pending: { tone: "amber", label: "Needs Verification", icon: <Clock className="h-3 w-3" /> },
  "Needs Verification": { tone: "amber", label: "Needs Verification", icon: <Clock className="h-3 w-3" /> },
  rejected: { tone: "red", label: "Rejected", icon: <XCircle className="h-3 w-3" /> },
  outdated: { tone: "red", label: "Outdated", icon: <AlertTriangle className="h-3 w-3" /> },
  Outdated: { tone: "red", label: "Outdated", icon: <AlertTriangle className="h-3 w-3" /> },
  "Potential Conflict": { tone: "red", label: "Potential Conflict", icon: <ShieldAlert className="h-3 w-3" /> },
  "Information Not Found": { tone: "grey", label: "Information Not Found", icon: <Info className="h-3 w-3" /> },
  none: { tone: "grey", label: "No record", icon: <Info className="h-3 w-3" /> },
};
export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { tone: "grey" as Tone, label: status, icon: null };
  return <Badge tone={s.tone}>{s.icon}{s.label}</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("dl-skeleton h-4 w-full", className)} aria-hidden />;
}
export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );
}
export function EmptyState({ title, text, icon, action }: { title: string; text?: string; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
      <div className="text-muted">{icon ?? <Info className="h-8 w-8" />}</div>
      <p className="font-semibold">{title}</p>
      {text && <p className="max-w-md text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
      <div className="flex items-center gap-2 font-medium"><XCircle className="h-4 w-4" />{message}</div>
      {onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function Notice({ tone = "amber", title, children }: { tone?: "amber" | "blue" | "red" | "green"; title?: string; children: ReactNode }) {
  const cls = { amber: TONES.amber, blue: TONES.blue, red: TONES.red, green: TONES.green }[tone];
  const Icon = tone === "red" ? ShieldAlert : tone === "green" ? CheckCircle2 : tone === "blue" ? Info : AlertTriangle;
  return (
    <div className={cx("flex gap-3 rounded-xl border p-3 text-sm", cls)} role={tone === "red" ? "alert" : undefined}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{title && <p className="font-semibold">{title}</p>}<div className="space-y-1">{children}</div></div>
    </div>
  );
}
export const DemoBanner = () => (
  <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold tracking-wide text-amber-800 dark:text-amber-300">
    <AlertTriangle className="h-4 w-4" />{DEMO_WARNING}
  </div>
);

export function PageHeader({ title, description, icon, actions }: { title: string; description?: string; icon?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-1 rounded-xl bg-royal/10 p-2 text-royal">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SourcePanel({ sources, lastVerifiedAt, status, title = "Source & verification" }: { sources: { name: string; url?: string | null }[]; lastVerifiedAt?: string | Date | null; status?: string; title?: string }) {
  const list = sources.filter((s) => s.url);
  return (
    <div className="rounded-xl border border-line bg-surface2 p-3 text-xs">
      <div className="mb-1 flex flex-wrap items-center gap-2 font-semibold"><span>{title}</span>{status && <StatusBadge status={status} />}</div>
      {list.length ? (
        <ul className="space-y-1">
          {list.map((s) => (
            <li key={s.url!}>
              <a className="inline-flex items-center gap-1 text-royal underline-offset-2 hover:underline" href={s.url!} target="_blank" rel="noopener noreferrer">{s.name}<ExternalLink className="h-3 w-3" /></a>
            </li>
          ))}
        </ul>
      ) : <p className="text-muted">No official source URL recorded.</p>}
      <p className="mt-1 text-muted">Last verified: {lastVerifiedAt ? new Date(lastVerifiedAt).toLocaleDateString("en-IN") : "Never (not human-verified)"}</p>
    </div>
  );
}

export function Field({ label, error, hint, children, htmlFor }: { label: string; error?: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-line bg-surface p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button aria-label="Close" onClick={onClose} className="rounded p-1 hover:bg-surface2"><X className="h-4 w-4" /></button></div>
        {children}
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel }: { open: boolean; title: string; message: string; confirmLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} footer={<><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button></>}>
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}

/** Searchable dropdown with full keyboard support. */
export function Combobox({ options, value, onChange, placeholder = "Select…", label, id }: { options: { value: string; label: string; hint?: string }[]; value: string; onChange: (v: string) => void; placeholder?: string; label?: string; id?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const uid = useId();
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q.toLowerCase())), [options, q]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const pick = (v: string) => { onChange(v); setOpen(false); setQ(""); };
  return (
    <div className="relative" ref={ref}>
      <button
        type="button" id={id} aria-haspopup="listbox" aria-expanded={open} aria-label={label}
        onClick={() => { setOpen((o) => !o); setActive(0); }}
        onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); } }}
        className={cx(inputCls, "flex items-center justify-between text-left")}
      >
        <span className={cx("truncate", !selected && "text-muted")}>{selected?.label ?? placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[14rem] rounded-xl border border-line bg-surface p-2 shadow-xl">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted" />
            <input
              autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} placeholder="Search…" aria-controls={uid}
              className={cx(inputCls, "pl-8")}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                else if (e.key === "Enter") { e.preventDefault(); if (filtered[active]) pick(filtered[active].value); }
                else if (e.key === "Escape") setOpen(false);
              }}
            />
          </div>
          <ul id={uid} role="listbox" className="max-h-60 overflow-auto">
            {filtered.length === 0 && <li className="px-2 py-2 text-sm text-muted">No matches</li>}
            {filtered.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === value}>
                <button type="button" onClick={() => pick(o.value)} onMouseEnter={() => setActive(i)}
                  className={cx("flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm", i === active && "bg-royal/10", o.value === value && "font-semibold")}>
                  <span>{o.label}</span>{o.hint && <span className="text-xs text-muted">{o.hint}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const STATE_OPTIONS = (allLabel = "All India (central law)") => [
  { value: "", label: allLabel },
  ...STATES.map((s) => ({ value: s.code, label: s.name, hint: s.type === "ut" ? "UT" : undefined })).sort((a, b) => a.label.localeCompare(b.label)),
];

export function Tabs({ tabs, value, onChange }: { tabs: { value: string; label: string; count?: number }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="tablist" className="no-print flex flex-wrap gap-1 rounded-xl border border-line bg-surface2 p-1">
      {tabs.map((t) => (
        <button key={t.value} role="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}
          className={cx("rounded-lg px-3 py-1.5 text-sm font-medium transition", value === t.value ? "bg-surface text-royal shadow-sm" : "text-muted hover:text-fg")}>
          {t.label}{t.count !== undefined && <span className="ml-1.5 rounded-full bg-royal/10 px-1.5 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return <section className={className}><h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>{children}</section>;
}

export function List({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((i, n) => <li key={n}>{i}</li>)}</ul>;
}
