"use client";
import { useState } from "react";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/Providers";
import { Button, Card, Field, Notice, PageHeader, inputCls } from "@/components/ui";
import { api } from "@/lib/client";
import { LANGUAGES } from "@/lib/constants";

export default function SettingsPage() {
  const { theme, setTheme, lang, setLang, user, refreshUser, toast, translationsReviewed } = useApp();
  const [fb, setFb] = useState({ category: "general", message: "" });
  const [sending, setSending] = useState(false);
  const ns = user?.notifySettings;
  async function toggle(k: "documentExpiry" | "reportUpdates" | "sourceChanges") {
    if (!ns) return;
    try { await api("/api/auth/profile", { method: "PATCH", body: { notifySettings: { ...ns, [k]: !ns[k] } } }); await refreshUser(); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  return (
    <>
      <PageHeader title="Settings" icon={<Settings className="h-5 w-5" />} />
      <div className="grid max-w-3xl gap-4">
        <Card className="space-y-4"><h2 className="font-semibold">Appearance & language</h2>
          <div className="flex gap-2">{(["light", "dark"] as const).map((t) => <Button key={t} variant={theme === t ? "primary" : "secondary"} onClick={() => setTheme(t)}>{t === "light" ? "Light" : "Dark (navy)"}</Button>)}</div>
          <Field label="Interface language" htmlFor="sl"><select id="sl" className={inputCls} value={lang} onChange={(e) => setLang(e.target.value)}>{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>)}</select></Field>
          {!translationsReviewed && <Notice tone="amber">Interface translations for this language are machine-generated and not yet human-reviewed. Legal text is never machine-translated silently.</Notice>}
        </Card>
        <Card className="space-y-3"><h2 className="font-semibold">Notifications</h2>
          {!user ? <p className="text-sm text-muted"><Link className="text-royal underline" href="/login">Log in</Link> to manage notifications.</p> : (
            <>{([["documentExpiry", "Document expiry reminders (licence, insurance, PUC, fitness, permit)"], ["reportUpdates", "Saved report updates"], ["sourceChanges", "Verified monitored source changes (not yet available)"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4" checked={ns?.[k] ?? false} onChange={() => toggle(k)} />{l}</label>))}</>
          )}
        </Card>
        <Card className="space-y-3"><h2 className="font-semibold">Privacy</h2><p className="text-sm text-muted">You can delete any saved document or report at any time. Document uploads are optional and files are not retained.</p>
          <div className="flex gap-2"><Link className="text-sm text-royal underline" href="/documents">Manage documents</Link><Link className="text-sm text-royal underline" href="/reports">Manage reports</Link></div></Card>
        <Card className="space-y-3"><h2 className="font-semibold">Send feedback</h2>
          <select className={inputCls} value={fb.category} onChange={(e) => setFb({ ...fb, category: e.target.value })} aria-label="Feedback category"><option value="general">General</option><option value="wrong_information">Wrong information</option><option value="missing_information">Missing information</option><option value="translation">Translation issue</option><option value="bug">Bug</option></select>
          <textarea className={inputCls} rows={4} placeholder="Tell us what to fix or improve…" value={fb.message} onChange={(e) => setFb({ ...fb, message: e.target.value })} maxLength={1000} aria-label="Feedback message" />
          <Button loading={sending} disabled={fb.message.trim().length < 5} onClick={async () => { setSending(true); try { await api("/api/feedback", { body: { ...fb, page: window.location.pathname } }); toast("Thank you — feedback sent.", "success"); setFb({ ...fb, message: "" }); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } finally { setSending(false); } }}>Send feedback</Button></Card>
      </div>
    </>
  );
}
