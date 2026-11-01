"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, ExternalLink, Mic, Send, Sparkles, Volume2 } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Badge, Button, Card, GlassPanel, Notice, PageHeader, StatusBadge, inputCls } from "@/components/ui";
import { api } from "@/lib/client";
import { LANGUAGES } from "@/lib/constants";

type Fact = { label: string; value: string; status: string; sourceUrl?: string | null; lastVerifiedAt?: string | null };
type Answer = {
  language: string; languageName: string; labels: Record<string, string>; directAnswer: string; englishAnswer: string; applicableLocation: string; vehicleCategory: string; legalProvision: string[];
  verifiedInformation: Fact[]; conditionsAndExceptions: string[]; originalLegalText: { reference: string; text: string }[]; officialSources: { name: string; url: string }[]; lastVerifiedAt: string | null;
  uncertainty: string[]; generatedBy: string; translated: boolean; translationNote: string | null; disclaimer: string; providerConfigured: string | null;
};
type Msg = { role: "user"; text: string } | { role: "ai"; data: Answer } | { role: "error"; text: string };

const EXAMPLES = [
  "How do I apply for a learner's licence in Tamil Nadu?", "What is the applicable fine for not wearing a helmet?", "Can my private car enter this National Park?",
  "What permits are required for a commercial truck?", "தமிழ்நாட்டில் ஓட்டுநர் உரிமம் பெறுவது எப்படி?", "हेलमेट नहीं पहनने पर क्या जुर्माना है?",
];

type SR = { lang: string; interimResults: boolean; onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; start: () => void; stop: () => void };

function AnswerCard({ a, speechCode }: { a: Answer; speechCode: string }) {
  const L = a.labels;
  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(a.directAnswer);
    u.lang = speechCode;
    window.speechSynthesis.speak(u);
  };
  const Row = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">{k}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
  return (
    <GlassPanel className="space-y-4 border-cyan-500/20 shadow-xl">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={a.generatedBy === "retrieval" ? "blue" : "teal"}>
          {a.generatedBy === "retrieval" ? "Assembled from stored records" : `AI-generated (${a.generatedBy}) from stored records`}
        </Badge>
        <Badge>{a.languageName}</Badge>
        {a.translated && <Badge tone="amber">Machine-translated — not human-reviewed</Badge>}
      </div>
      {a.translationNote && <Notice tone="amber">{a.translationNote}</Notice>}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-400">{L.answer}</p>
        <p className="mt-2 whitespace-pre-wrap text-base font-medium leading-relaxed text-slate-100">{a.directAnswer}</p>
        <Button size="sm" variant="ghost" className="mt-3 hover:bg-blue-500/20" onClick={speak}>
          <Volume2 className="h-4 w-4 text-cyan-400" />Read aloud
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Row k={L.location}>{a.applicableLocation}</Row>
        <Row k={L.vehicle}>{a.vehicleCategory}</Row>
      </div>
      {a.legalProvision.length > 0 && (
        <Row k={L.provision}>
          <ul className="list-disc space-y-1 pl-5 text-slate-200">
            {a.legalProvision.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </Row>
      )}
      {a.originalLegalText.length > 0 && (
        <Row k={L.original}>
          {a.originalLegalText.map((o) => (
            <blockquote key={o.reference} className="mt-2 rounded-r-lg border-l-4 border-cyan-500 bg-surface2/60 p-3">
              <b className="text-cyan-300">{o.reference}</b><br />
              <span className="italic text-slate-300">{o.text}</span>
            </blockquote>
          ))}
        </Row>
      )}
      {a.verifiedInformation.length > 0 && (
        <Row k={L.verified}>
          <ul className="space-y-2">
            {a.verifiedInformation.map((f, i) => (
              <li key={i} className="rounded-lg border border-line bg-surface/40 p-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <b className="text-slate-100">{f.label}</b>
                  <StatusBadge status={f.status} />
                </div>
                <p className="mt-1 text-slate-300">{f.value}</p>
              </li>
            ))}
          </ul>
        </Row>
      )}
      {a.conditionsAndExceptions.length > 0 && (
        <Row k={L.conditions}>
          <ul className="list-disc space-y-1 pl-5 text-slate-300">
            {a.conditionsAndExceptions.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Row>
      )}
      <div className="grid gap-4 sm:grid-cols-2 border-t border-line/60 pt-3">
        <Row k={L.source}>
          <ul className="space-y-1">
            {a.officialSources.map((s) => (
              <li key={s.url}>
                <a className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline" href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name}<ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </Row>
        <Row k={L.lastVerified}>
          <span className="text-slate-300">{a.lastVerifiedAt ? new Date(a.lastVerifiedAt).toLocaleDateString("en-IN") : "Never — not human-verified"}</span>
        </Row>
      </div>
      {a.uncertainty.length > 0 && (
        <Notice tone="amber" title={L.uncertainty}>
          <ul className="list-disc space-y-1 pl-5">
            {a.uncertainty.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </Notice>
      )}
      <p className="text-xs text-muted border-t border-line/40 pt-2">{a.disclaimer}</p>
    </GlassPanel>
  );
}

export default function AssistantPage() {
  const { lang, state, vehicle, setLang } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const recRef = useRef<SR | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const speech = LANGUAGES.find((l) => l.code === lang)?.speech ?? "en-IN";

  const ask = useCallback(async (q: string) => {
    const question = q.trim();
    if (!question) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setText(""); setBusy(true);
    try {
      const data = await api<Answer>("/api/ai/ask", { body: { question, language: lang, state: state || null, vehicle: vehicle || null } });
      setMsgs((m) => [...m, { role: "ai", data }]);
    } catch (e) { setMsgs((m) => [...m, { role: "error", text: e instanceof Error ? e.message : "Something went wrong" }]); }
    finally { setBusy(false); }
  }, [lang, state, vehicle]);

  useEffect(() => {
    setVoiceOk(!!((window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition));
    const p = new URLSearchParams(window.location.search).get("q");
    if (p) ask(p);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  function toggleVoice() {
    const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    if (listening) { recRef.current?.stop(); return; }
    const r = new Ctor();
    r.lang = speech; r.interimResults = false;
    r.onresult = (e) => setText(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recRef.current = r; setListening(true); r.start();
  }

  return (
    <>
      <PageHeader 
        title="DriveLegal AI Assistant" 
        icon={<Bot className="h-5 w-5 text-cyan-400" />} 
        description="Ask about licences, registration, fines, driving laws, forests, permits and compliance — in any of 12 languages. Answers cite stored records, show verification status and state what is unknown." 
      />
      <Notice tone="blue" title="How answers are built">
        Records are retrieved from the database (official-source-linked, human-verified where available), then explained. {msgs.length === 0 && "No AI provider key? The assistant still works in retrieval-only mode."}
      </Notice>
      
      <div className="my-4 flex flex-wrap items-center gap-2">
        <label htmlFor="al" className="text-sm font-medium">Answer language</label>
        <select id="al" className={`${inputCls} !w-auto`} value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>)}
        </select>
        <span className="text-xs text-muted">State: {state || "not selected"} · Vehicle: {vehicle || "not selected"}</span>
      </div>

      <div className="space-y-4" aria-live="polite">
        {msgs.length === 0 && (
          <GlassPanel className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300 mb-3">
              <Sparkles className="h-4 w-4" /> Try a statutory example question
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((e) => (
                <button 
                  key={e} 
                  onClick={() => ask(e)} 
                  className="rounded-full border border-line bg-surface2/60 px-3.5 py-1.5 text-left text-sm text-slate-200 transition hover:border-cyan-500/50 hover:bg-cyan-500/10"
                >
                  {e}
                </button>
              ))}
            </div>
          </GlassPanel>
        )}

        {msgs.map((m, i) => m.role === "user" ? (
          <div key={i} className="ml-auto max-w-xl rounded-2xl rounded-tr-sm bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            {m.text}
          </div>
        ) : m.role === "error" ? (
          <Notice key={i} tone="red">{m.text}</Notice>
        ) : (
          <AnswerCard key={i} a={m.data} speechCode={speech} />
        ))}

        {busy && (
          <GlassPanel className="animate-pulse p-4">
            <p className="text-sm text-cyan-300">Searching official statutory database and synthesizing verified guidance…</p>
          </GlassPanel>
        )}
        <div ref={endRef} />
      </div>

      <form className="sticky bottom-3 mt-4 flex gap-2 rounded-2xl border border-cyan-500/20 bg-surface/90 p-2 shadow-2xl backdrop-blur-md" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input 
          className={inputCls} 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="Ask a question across Indian transport law…" 
          aria-label="Your question" 
          maxLength={500} 
        />
        {voiceOk && (
          <Button type="button" variant={listening ? "danger" : "secondary"} onClick={toggleVoice} aria-label="Voice input" title={`Voice input (${speech})`}>
            <Mic className="h-4 w-4" />
          </Button>
        )}
        <Button type="submit" loading={busy} disabled={!text.trim()}>
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Ask</span>
        </Button>
      </form>
    </>
  );
}
