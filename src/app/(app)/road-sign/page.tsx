"use client";
import { useRef, useState } from "react";
import { Camera, ImageUp, ScanLine, Search } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, EmptyState, Notice, PageHeader, Tabs, inputCls } from "@/components/ui";
import { api } from "@/lib/client";
import { SIGNS, SIGN_TONE } from "@/lib/road-signs";

type Res = {
  status: "ok" | "uncertain" | "provider_not_configured" | "unreadable"; message?: string; confidenceLevel?: "high" | "medium" | "low"; warning?: string; legalReference?: string;
  result?: { recognized: boolean; signName?: string | null; category: string; meaning?: string | null; speedLimit?: number | null; confidence: number; notes?: string | null };
};

export default function RoadSignPage() {
  const { toast } = useApp();
  const [tab, setTab] = useState("ai");
  const [img, setImg] = useState<string | null>(null);
  const [res, setRes] = useState<Res | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  function pick(f?: File) {
    if (!f) return;
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return toast("Use a PNG, JPEG or WebP image.", "error");
    if (f.size > 4 * 1024 * 1024) return toast("Image is larger than 4 MB.", "error");
    const r = new FileReader();
    r.onload = () => { setImg(String(r.result)); setRes(null); };
    r.readAsDataURL(f);
  }
  async function analyze() {
    if (!img) return;
    setBusy(true);
    try { setRes(await api<Res>("/api/road-sign/analyze", { body: { image: img } })); }
    catch (e) { toast(e instanceof Error ? e.message : "Analysis failed", "error"); }
    finally { setBusy(false); }
  }
  const signs = SIGNS.filter((s) => (!cat || s.category === cat) && `${s.name} ${s.meaning}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="AI Road Sign Recognition" icon={<ScanLine className="h-5 w-5" />} description="Upload or capture a road-sign photo. Results include a confidence indicator; unclear images are reported as such and never presented as a confirmed legal instruction." />
      <div className="mb-4"><Tabs value={tab} onChange={setTab} tabs={[{ value: "ai", label: "AI recognition" }, { value: "library", label: "Sign library" }]} /></div>
      {tab === "library" ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" /><input className={`${inputCls} pl-9`} placeholder="Search signs…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search signs" /></div>
            <select className={`${inputCls} !w-auto`} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="">All categories</option><option value="mandatory">Mandatory</option><option value="prohibitory">Prohibitory</option><option value="warning">Warning</option><option value="informational">Informational</option></select></div>
          {signs.length === 0 ? <EmptyState title="No signs match" /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{signs.map((s) => <Card key={s.name}><Badge tone={SIGN_TONE[s.category]}>{s.category}</Badge><h3 className="mt-2 font-semibold">{s.name}</h3><p className="text-sm text-muted">{s.meaning}</p></Card>)}</div>}
          <p className="mt-4 text-xs text-muted">Text reference only. Verify against the official road-sign schedule and IRC manuals; local variations may exist.</p>
        </>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => fileRef.current?.click()}><ImageUp className="h-4 w-4" />Upload image</Button>
              <Button variant="secondary" onClick={() => camRef.current?.click()}><Camera className="h-4 w-4" />Use camera</Button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} aria-label="Upload road sign image" />
              <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => pick(e.target.files?.[0])} aria-label="Capture road sign photo" />
            </div>
            {img ? (
              <div className="space-y-3">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={img} alt="Road sign preview" className="max-h-72 w-full rounded-xl border border-line object-contain" />
                <div className="flex gap-2"><Button onClick={analyze} loading={busy}><ScanLine className="h-4 w-4" />Analyse sign</Button><Button variant="ghost" onClick={() => { setImg(null); setRes(null); }}>Remove</Button></div></div>
            ) : <EmptyState icon={<ImageUp className="h-8 w-8" />} title="No image selected" text="PNG, JPEG or WebP up to 4 MB. Make sure the sign fills most of the frame and is in focus." />}
            <p className="text-xs text-muted">Images are sent to the configured AI vision provider for analysis only and are not stored by DriveLegal AI.</p>
          </Card>
          <Card className="space-y-3">
            <h2 className="font-semibold">Result</h2>
            {!res ? <p className="text-sm text-muted">The recognition result will appear here.</p> : res.status === "provider_not_configured" || res.status === "unreadable" ? (
              <Notice tone="amber" title={res.status === "provider_not_configured" ? "AI vision provider not configured" : "Could not read the result"}>{res.message}</Notice>
            ) : res.result && (
              <>
                {res.warning && <Notice tone={res.status === "uncertain" ? "red" : "amber"}>{res.warning}</Notice>}
                <div className="flex flex-wrap items-center gap-2"><Badge tone={res.confidenceLevel === "high" ? "green" : res.confidenceLevel === "medium" ? "amber" : "red"}>Confidence: {res.confidenceLevel} ({Math.round(res.result.confidence * 100)}%)</Badge><Badge tone="blue">{res.result.category.replace("_", " ")}</Badge><Badge tone="amber">Unconfirmed AI suggestion</Badge></div>
                <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden><div className="h-full bg-royal" style={{ width: `${Math.round(res.result.confidence * 100)}%` }} /></div>
                {res.status === "uncertain" ? <p className="text-sm text-muted">Possible sign (low confidence): {res.result.signName ?? "unknown"}. Compare with the Sign Library.</p> : (
                  <dl className="space-y-2 text-sm"><div><dt className="text-xs font-semibold uppercase text-muted">Sign</dt><dd className="text-lg font-semibold">{res.result.signName}{res.result.speedLimit ? ` — ${res.result.speedLimit} km/h` : ""}</dd></div>
                    <div><dt className="text-xs font-semibold uppercase text-muted">Meaning</dt><dd>{res.result.meaning}</dd></div>{res.result.notes && <div><dt className="text-xs font-semibold uppercase text-muted">Notes</dt><dd>{res.result.notes}</dd></div>}</dl>
                )}
                <p className="text-xs text-muted">Legal reference: {res.legalReference}</p>
              </>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
