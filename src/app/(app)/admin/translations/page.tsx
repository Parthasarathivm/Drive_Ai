"use client";
import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { RequireStaff } from "@/components/Guards";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, ErrorState, LoadingBlock, Notice, PageHeader, inputCls } from "@/components/ui";
import { api, useFetch } from "@/lib/client";
import { LANGUAGES } from "@/lib/constants";

type Item = { key: string; english: string; value: string; source: string };

function Row({ item, lang, onSaved, canEdit }: { item: Item; lang: string; onSaved: () => void; canEdit: boolean }) {
  const { toast } = useApp();
  const [v, setV] = useState(item.value);
  useEffect(() => setV(item.value), [item.value]);
  const save = async () => { try { await api("/api/admin/translations", { method: "PUT", body: { lang, key: item.key, value: v, markReviewed: true } }); toast("Saved and marked human-reviewed.", "success"); onSaved(); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); } };
  return (
    <tr className="border-b border-line/60 align-top">
      <td className="py-2 pr-3 text-xs text-muted">{item.key}</td><td className="pr-3 text-sm">{item.english}</td>
      <td className="pr-3"><textarea className={inputCls} rows={2} value={v} onChange={(e) => setV(e.target.value)} disabled={!canEdit} aria-label={`Translation for ${item.key}`} /></td>
      <td className="pr-3"><Badge tone={item.source === "human" ? "green" : item.source === "machine" ? "amber" : "grey"}>{item.source === "human" ? "human-reviewed" : item.source === "machine" ? "machine" : "missing"}</Badge></td>
      <td><Button size="sm" variant="secondary" disabled={!canEdit || !v.trim() || (v === item.value && item.source === "human")} onClick={save}>Save &amp; approve</Button></td>
    </tr>
  );
}

function Inner() {
  const { hasRole } = useApp();
  const [lang, setLang] = useState("hi");
  const { data, loading, error, reload } = useFetch<{ items: Item[] }>(`/api/admin/translations?lang=${lang}`);
  const reviewed = data?.items.filter((i) => i.source === "human").length ?? 0;
  return (
    <>
      <Notice tone="blue" title="Translation policy">UI strings are stored separately from legal text. Machine translations are labelled until a translator reviews them. Never change the legal meaning — original provisions are kept untranslated in the rules database.</Notice>
      <div className="my-4 flex flex-wrap items-center gap-3"><select className={`${inputCls} !w-auto`} value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Language">{LANGUAGES.filter((l) => l.code !== "en").map((l) => <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>)}</select>
        {data && <span className="text-sm text-muted">{reviewed} / {data.items.length} human-reviewed</span>}</div>
      {loading ? <LoadingBlock /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <Card className="overflow-x-auto"><table className="w-full min-w-[56rem] text-left"><thead className="border-b border-line text-xs uppercase text-muted"><tr><th className="py-2 pr-3">Key</th><th className="pr-3">English (source)</th><th className="pr-3">Translation</th><th className="pr-3">Status</th><th /></tr></thead>
          <tbody>{data?.items.map((i) => <Row key={`${lang}${i.key}`} item={i} lang={lang} onSaved={reload} canEdit={hasRole("translator")} />)}</tbody></table></Card>
      )}
    </>
  );
}
export default function TranslationsPage() {
  return (<><PageHeader title="Translation Management" icon={<Languages className="h-5 w-5" />} description="Review machine translations and mark them human-reviewed. New languages can be added in Data Management → Languages." /><RequireStaff><Inner /></RequireStaff></>);
}
