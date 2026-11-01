"use client";
import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { useApp } from "@/components/Providers";
import { RequireLogin } from "@/components/Guards";
import { Badge, Button, Card, Combobox, Field, PageHeader, STATE_OPTIONS, inputCls } from "@/components/ui";
import { api } from "@/lib/client";
import { LANGUAGES, ROLE_LABEL, VEHICLE_CATEGORIES } from "@/lib/constants";

function Inner() {
  const { user, refreshUser, toast, setLang, setState, setVehicle } = useApp();
  const [f, setF] = useState({ name: "", preferredLanguage: "en", preferredState: "", preferredVehicle: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) setF({ name: user.name, preferredLanguage: user.preferredLanguage, preferredState: user.preferredState ?? "", preferredVehicle: user.preferredVehicle ?? "" }); }, [user]); // eslint-disable-line react-hooks/set-state-in-effect
  if (!user) return null;
  return (
    <Card className="max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center gap-2"><p className="text-sm text-muted">{user.email}</p>{user.roles.map((r) => <Badge key={r} tone={r === "user" ? "grey" : "teal"}>{ROLE_LABEL[r]}</Badge>)}</div>
      <Field label="Name" htmlFor="pn"><input id="pn" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <Field label="Preferred language" htmlFor="pl"><select id="pl" className={inputCls} value={f.preferredLanguage} onChange={(e) => setF({ ...f, preferredLanguage: e.target.value })}>{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>)}</select></Field>
      <Field label="Preferred state / UT"><Combobox options={STATE_OPTIONS("No preference")} value={f.preferredState} onChange={(v) => setF({ ...f, preferredState: v })} /></Field>
      <Field label="Default vehicle category" htmlFor="pv"><select id="pv" className={inputCls} value={f.preferredVehicle} onChange={(e) => setF({ ...f, preferredVehicle: e.target.value })}><option value="">None</option>{VEHICLE_CATEGORIES.map((v) => <option key={v.slug} value={v.slug}>{v.name}</option>)}</select></Field>
      <Button loading={busy} onClick={async () => {
        setBusy(true);
        try { await api("/api/auth/profile", { method: "PATCH", body: { name: f.name, preferredLanguage: f.preferredLanguage, preferredState: f.preferredState || null, preferredVehicle: f.preferredVehicle || null } });
          setLang(f.preferredLanguage); setState(f.preferredState); setVehicle(f.preferredVehicle); await refreshUser(); toast("Profile updated.", "success"); }
        catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } finally { setBusy(false); }
      }}>Save profile</Button>
    </Card>
  );
}
export default function ProfilePage() {
  return (<><PageHeader title="Profile" icon={<User className="h-5 w-5" />} description="Your preferences are used as defaults across the platform." /><RequireLogin><Inner /></RequireLogin></>);
}
