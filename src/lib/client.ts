"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export class ClientApiError extends Error {
  status: number;
  issues?: { path: string; message: string }[];
  constructor(status: number, message: string, issues?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.issues = issues;
  }
}

export async function api<T = unknown>(url: string, opts: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body || opts.form ? "POST" : "GET"),
    headers: opts.body ? { "content-type": "application/json" } : undefined,
    body: opts.form ?? (opts.body ? JSON.stringify(opts.body) : undefined),
    credentials: "same-origin",
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    const d = data as { error?: string; issues?: { path: string; message: string }[] } | null;
    const detail = d?.issues?.length ? `: ${d.issues.map((i) => i.message).join(", ")}` : "";
    throw new ClientApiError(res.status, (d?.error ?? `Request failed (${res.status})`) + detail, d?.issues);
  }
  return data as T;
}

/** Simple data-fetching hook with loading/error/reload. Pass null to skip. */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);
  const load = useCallback(async () => {
    if (!url) return;
    const n = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const d = await api<T>(url);
      if (n === seq.current) setData(d);
    } catch (e) {
      if (n === seq.current) setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      if (n === seq.current) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  return { data, loading, error, reload: load };
}

export function downloadText(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export type ReportLike = {
  title: string;
  reportType: string;
  query?: Record<string, unknown>;
  location?: string | null;
  vehicleCategory?: string | null;
  findings: unknown[];
  legalReferences: string[];
  sources: { name: string; url: string }[];
  missingInfo: string[];
  uncertaintyNotices: string[];
  createdAt?: string;
};

export function reportToText(r: ReportLike) {
  const L: string[] = [];
  L.push(`DriveLegal AI — ${r.title}`, "=".repeat(60), "DEMO DATA - NOT VERIFIED LEGAL ADVICE unless a record is marked Verified.", "");
  L.push(`Report type: ${r.reportType}`, `Query: ${JSON.stringify(r.query ?? {})}`, `Location: ${r.location ?? "India (central law)"}`, `Vehicle category: ${r.vehicleCategory ?? "Not specified"}`, `Generated: ${r.createdAt ?? new Date().toISOString()}`, "");
  L.push("FINDINGS");
  r.findings.forEach((f, i) => L.push(`${i + 1}. ${typeof f === "string" ? f : JSON.stringify(f)}`));
  L.push("", "LEGAL REFERENCES", ...(r.legalReferences.length ? r.legalReferences.map((x) => `- ${x}`) : ["- none recorded"]));
  L.push("", "OFFICIAL SOURCE LINKS", ...(r.sources.length ? r.sources.map((s) => `- ${s.name}: ${s.url}`) : ["- none"]));
  L.push("", "MISSING INFORMATION", ...(r.missingInfo.length ? r.missingInfo.map((x) => `- ${x}`) : ["- none identified"]));
  L.push("", "UNCERTAINTY NOTICES", ...(r.uncertaintyNotices.length ? r.uncertaintyNotices.map((x) => `- ${x}`) : ["- none"]));
  L.push("", "DISCLAIMER: DriveLegal AI is an independent information and service-navigation platform and is not a government website. Verify with the official source before acting.");
  return L.join("\n");
}
