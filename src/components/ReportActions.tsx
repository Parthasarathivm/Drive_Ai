"use client";
import { useState } from "react";
import { Download, Printer, Save } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Button } from "@/components/ui";
import { api, downloadText, reportToText, type ReportLike } from "@/lib/client";

export function ReportActions({ report, filename = "drivelegal-report" }: { report: ReportLike; filename?: string }) {
  const { user, toast } = useApp();
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number | null>(null);
  async function save() {
    if (!user) return toast("Log in to save reports to your account.", "info");
    setSaving(true);
    try {
      const { createdAt: _c, ...body } = report;
      void _c;
      const r = await api<{ id: number }>("/api/reports", { body });
      setSavedId(r.id);
      toast("Report saved. Find it under Reports.", "success");
    } catch (e) { toast(e instanceof Error ? e.message : "Could not save", "error"); }
    finally { setSaving(false); }
  }
  return (
    <div className="no-print flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={save} loading={saving} disabled={!!savedId}><Save className="h-4 w-4" />{savedId ? "Saved" : "Save report"}</Button>
      <Button size="sm" variant="secondary" onClick={() => downloadText(`${filename}.txt`, reportToText(report))}><Download className="h-4 w-4" />Download</Button>
      <Button size="sm" variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Print</Button>
    </div>
  );
}
