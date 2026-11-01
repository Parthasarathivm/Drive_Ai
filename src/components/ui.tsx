"use client";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Info,
  Loader2,
  Search,
  ShieldAlert,
  X,
  XCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { DEMO_WARNING, STATES } from "@/lib/constants";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 transition disabled:opacity-60";

export function Card({
  className,
  children,
  hover = true,
  ...rest
}: { className?: string; children: ReactNode; hover?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all duration-300",
        hover && "hover:border-accent/40 hover:shadow-lg dark:hover:shadow-black/40",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Glass-style panel with backdrop blur and refined border */
export function GlassPanel({
  className,
  children,
  glow = false,
  ...rest
}: { className?: string; children: ReactNode; glow?: boolean } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "dl-glass rounded-2xl p-6 transition-all duration-300",
        glow && "dl-glow-cyan border-accent/30",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "accent" | "glow" | "teal";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]";

const variants = {
  primary: "bg-royal text-white hover:bg-royal/90 shadow-sm hover:shadow-royal/20",
  accent: "bg-gradient-to-r from-royal to-electric text-white hover:from-royal/90 hover:to-electric/90 shadow-md",
  glow: "bg-gradient-to-r from-electric to-accent text-slate-950 font-semibold hover:shadow-[0_0_25px_rgba(34,211,238,0.4)]",
  teal: "bg-teal text-white hover:bg-teal/90 shadow-sm hover:shadow-teal/20",
  secondary: "border border-line bg-surface text-fg hover:bg-surface2 hover:border-accent/40",
  ghost: "text-fg hover:bg-surface2",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };

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

export function GlowButton({ children, className, ...props }: BtnProps) {
  return (
    <Button variant="glow" className={cx("relative overflow-hidden", className)} {...props}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  children,
  external,
  className,
}: {
  href: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const cls = cx(btnClass(variant, size), className);
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

const TONES = {
  green: "bg-teal/15 text-teal border-teal/30",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  red: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  blue: "bg-electric/15 text-electric border-electric/30",
  grey: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  teal: "bg-accent/15 text-cyan-800 dark:text-accent border-accent/30",
};

export type Tone = keyof typeof TONES;

export function Badge({ tone = "grey", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide", TONES[tone], className)}>
      {children}
    </span>
  );
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
  return (
    <Badge tone={s.tone}>
      {s.icon}
      {s.label}
    </Badge>
  );
}

/** Animated numerical counter for dashboard & hero statistics */
export function AnimatedCounter({
  value,
  duration = 1200,
  prefix = "",
  suffix = "",
}: {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = 0;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(Math.floor(startVal + easeOutQuad * (value - startVal)));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

/** Premium Dashboard Metric Card with automotive-inspired cockpit design */
export function PremiumDashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "blue",
  trend,
  className,
}: {
  title: string;
  value: number | string | ReactNode;
  subtitle?: string;
  icon: any;
  tone?: "blue" | "teal" | "cyan" | "amber";
  trend?: string;
  className?: string;
}) {
  const toneGradients = {
    blue: "from-royal/20 to-electric/5 border-royal/30 text-electric",
    teal: "from-teal/20 to-teal/5 border-teal/30 text-teal",
    cyan: "from-accent/20 to-accent/5 border-accent/30 text-accent",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400",
  };

  return (
    <div
      className={cx(
        "relative overflow-hidden rounded-2xl border bg-surface/90 p-5 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-xl",
        toneGradients[tone],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-muted">{title}</span>
        <div className="rounded-xl bg-surface-2 p-2.5">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-fg">{value}</span>
        {trend && <span className="text-xs font-medium text-teal">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
    </div>
  );
}

/** Floating 3D Service Card */
export function FloatingServiceCard({
  href,
  title,
  text,
  icon: Icon,
  badge,
  className,
}: {
  href: string;
  title: string;
  text: string;
  icon: any;
  badge?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cx("group block h-full", className)}>
      <div className="relative flex h-full flex-col justify-between rounded-2xl border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-xl hover:shadow-royal/10 dark:hover:shadow-black/60">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="rounded-xl bg-gradient-to-br from-royal/15 to-accent/10 p-3 text-electric group-hover:scale-110 transition-transform">
              <Icon className="h-6 w-6" />
            </div>
            {badge && <Badge tone="teal">{badge}</Badge>}
          </div>
          <h3 className="text-lg font-bold tracking-tight text-fg group-hover:text-electric transition-colors">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
        </div>
        <div className="mt-5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-electric group-hover:text-accent">
          <span>Explore Service</span>
          <ChevronDown className="h-3.5 w-3.5 -rotate-90 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("dl-skeleton h-4 w-full", className)} aria-hidden />;
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  icon,
  action,
}: {
  title: string;
  text?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface/50 p-8 text-center backdrop-blur-sm">
      <div className="text-muted">{icon ?? <Info className="h-8 w-8" />}</div>
      <p className="font-semibold text-fg">{title}</p>
      {text && <p className="max-w-md text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
      <div className="flex items-center gap-2 font-medium">
        <XCircle className="h-4 w-4" />
        {message}
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Notice({
  tone = "amber",
  title,
  children,
}: {
  tone?: "amber" | "blue" | "red" | "green";
  title?: string;
  children: ReactNode;
}) {
  const cls = { amber: TONES.amber, blue: TONES.blue, red: TONES.red, green: TONES.green }[tone];
  const Icon = tone === "red" ? ShieldAlert : tone === "green" ? CheckCircle2 : tone === "blue" ? Info : AlertTriangle;
  return (
    <div className={cx("flex gap-3 rounded-xl border p-3 text-sm", cls)} role={tone === "red" ? "alert" : undefined}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        <div className="space-y-1">{children}</div>
      </div>
    </div>
  );
}

export function NoticeBanner({
  tone = "amber",
  title,
  children,
}: {
  tone?: "amber" | "red" | "blue" | "green";
  title?: string;
  children: ReactNode;
}) {
  return (
    <Notice tone={tone} title={title}>
      {children}
    </Notice>
  );
}

export const DemoBanner = () => (
  <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold tracking-wide text-amber-800 dark:text-amber-300">
    <AlertTriangle className="h-4 w-4 shrink-0" />
    <span>{DEMO_WARNING}</span>
  </div>
);

export const DemoNotice = DemoBanner;

export function PageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-1 rounded-xl bg-royal/10 p-2.5 text-royal">{icon}</div>}
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-fg">{title}</h1>
          {description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function SourcePanel({
  sources,
  lastVerifiedAt,
  status,
  title = "Source & verification",
}: {
  sources: { name: string; url?: string | null }[];
  lastVerifiedAt?: string | Date | null;
  status?: string;
  title?: string;
}) {
  const list = sources.filter((s) => s.url);
  return (
    <div className="rounded-xl border border-line bg-surface2 p-3 text-xs">
      <div className="mb-1 flex flex-wrap items-center gap-2 font-semibold">
        <span>{title}</span>
        {status && <StatusBadge status={status} />}
      </div>
      {list.length ? (
        <ul className="space-y-1">
          {list.map((s) => (
            <li key={s.url!}>
              <a
                className="inline-flex items-center gap-1 text-royal underline-offset-2 hover:underline"
                href={s.url!}
                target="_blank"
                rel="noopener noreferrer"
              >
                {s.name}
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted">No official source URL recorded.</p>
      )}
      <p className="mt-1 text-muted">
        Last verified: {lastVerifiedAt ? new Date(lastVerifiedAt).toLocaleDateString("en-IN") : "Never (not human-verified)"}
      </p>
    </div>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-fg">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-surface2 hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2 border-t border-line pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}

export function UncertaintyNotice({ notices }: { notices: string[] }) {
  if (!notices.length) return null;
  return (
    <div className="space-y-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200">
      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Verification & Coverage Notices</span>
      </div>
      <ul className="list-disc space-y-1 pl-4">
        {notices.map((n, i) => (
          <li key={i}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

export type Option = { value: string; label: string; hint?: string };

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select…",
  label,
  id,
}: {
  options: Option[];
  value?: string | null;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
}) {
  const genId = useId();
  const cid = id ?? genId;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === (value ?? ""));

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        type="button"
        id={cid}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm text-fg shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 transition"
      >
        <span className={cx(!selected && "text-muted")}>{selected ? selected.label : placeholder}</span>
        <ChevronDown className={cx("h-4 w-4 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="dl-glass absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-2xl">
          <div className="relative border-b border-line p-1">
            <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Filter options"
              autoFocus
              className="w-full rounded-lg bg-surface-2 py-1.5 pl-8 pr-2 text-xs text-fg focus:outline-none"
            />
          </div>
          <ul role="listbox" className="py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-muted">No match</li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={o.value === (value ?? "")}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cx(
                    "cursor-pointer rounded-lg px-3 py-2 text-xs transition",
                    o.value === (value ?? "") ? "bg-royal text-white font-medium" : "text-fg hover:bg-surface-2"
                  )}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export const STATE_OPTIONS = (allLabel = "All India (central law)"): Option[] => [
  { value: "", label: allLabel },
  ...STATES.map((s) => ({ value: s.code, label: `${s.name} (${s.code})`, hint: s.type === "ut" ? "UT" : undefined })),
];

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="tablist" className="no-print flex flex-wrap gap-1 rounded-xl border border-line bg-surface2 p-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cx(
            "rounded-lg px-3 py-1.5 text-sm font-medium transition",
            value === t.value ? "bg-surface text-royal shadow-sm" : "text-muted hover:text-fg"
          )}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-royal/10 px-1.5 text-xs">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={className}>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((i, n) => (
        <li key={n}>{i}</li>
      ))}
    </ul>
  );
}
