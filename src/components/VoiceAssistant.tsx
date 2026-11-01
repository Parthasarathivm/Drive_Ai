"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Send,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/components/Providers";
import { LANGUAGES } from "@/lib/constants";
import { api } from "@/lib/client";

// Mapping from app language code to BCP-47 speech recognition/synthesis locale tag
const SPEECH_LOCALES: Record<string, string> = {
  en: "en-IN",
  ta: "ta-IN",
  hi: "hi-IN",
  te: "te-IN",
  ml: "ml-IN",
  kn: "kn-IN",
  bn: "bn-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  pa: "pa-IN",
  or: "en-IN",
  as: "en-IN",
};

interface AiAskResponse {
  success: boolean;
  answer?: string;
  sources?: { title: string; section?: string; url?: string; verified?: boolean }[];
  confidence?: number;
  providerConfigured?: string | null;
  message?: string;
}

export default function VoiceAssistant() {
  const { lang, setLang, state, vehicle, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"idle" | "listening" | "processing" | "speaking" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [manualText, setManualText] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<AiAskResponse["sources"]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize Speech APIs safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
      if ("speechSynthesis" in window) {
        synthRef.current = window.speechSynthesis;
      }
    }
  }, []);

  // Animated Electric-Cyan Waveform Canvas
  useEffect(() => {
    if (!isOpen) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const renderWave = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Activity multiplier depending on current assistant state
      let amplitude = 6;
      let speed = 0.04;
      let strokeColor = "rgba(34, 211, 238, 0.4)"; // cyan

      if (mode === "listening") {
        amplitude = 22;
        speed = 0.09;
        strokeColor = "rgba(34, 211, 238, 0.9)";
      } else if (mode === "processing") {
        amplitude = 12;
        speed = 0.06;
        strokeColor = "rgba(192, 132, 252, 0.85)"; // purple
      } else if (mode === "speaking") {
        amplitude = 18;
        speed = 0.08;
        strokeColor = "rgba(59, 130, 246, 0.9)"; // electric blue
      }

      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = strokeColor;

      const midY = height / 2;
      for (let x = 0; x < width; x++) {
        const sin1 = Math.sin(x * 0.03 + phase) * amplitude;
        const sin2 = Math.sin(x * 0.015 - phase * 0.7) * (amplitude * 0.5);
        const y = midY + sin1 + sin2;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Second harmonic wave with subtle glow
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = mode === "listening" ? "rgba(20, 184, 166, 0.6)" : "rgba(34, 211, 238, 0.35)";
      for (let x = 0; x < width; x++) {
        const sin3 = Math.cos(x * 0.02 + phase * 1.2) * (amplitude * 0.6);
        const y = midY + sin3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += speed;
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isOpen, mode]);

  // Text-To-Speech Synthesis
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!synthRef.current || isMuted) return;
      synthRef.current.cancel();

      // Clean markdown tags for spoken audio
      const clean = textToSpeak.replace(/[\*_#`\[\]\(\)]/g, " ").slice(0, 320);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = SPEECH_LOCALES[lang] || "en-IN";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setMode("speaking");
      utterance.onend = () => setMode("idle");
      utterance.onerror = () => setMode("idle");

      synthRef.current.speak(utterance);
    },
    [lang, isMuted]
  );

  // Send question to /api/ai/ask
  const handleQuery = useCallback(
    async (queryText: string) => {
      if (!queryText.trim()) return;
      setMode("processing");
      setErrorMessage(null);

      try {
        const res = await api<AiAskResponse>("/api/ai/ask", {
          method: "POST",
          body: {
            question: queryText.trim(),
            language: lang,
            state: state || undefined,
            vehicle: vehicle || undefined,
          },
        });

        if (res.answer) {
          setAnswer(res.answer);
          setSources(res.sources || []);
          setConfidence(res.confidence ?? 94);
          speakText(res.answer);
        } else {
          setAnswer("No response received from statutory engine. Please rephrase.");
          setMode("idle");
        }
      } catch (err: any) {
        setMode("error");
        setErrorMessage(err?.message || "Failed to query DriveLegal AI assistant.");
      }
    },
    [lang, state, vehicle, speakText]
  );

  // Start Voice Recognition
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    if (synthRef.current) synthRef.current.cancel();

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = SPEECH_LOCALES[lang] || "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setMode("listening");
        setTranscript("");
        setInterimTranscript("");
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setTranscript(final);
          handleQuery(final);
        } else {
          setInterimTranscript(interim);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[Voice AI error]", event.error);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setErrorMessage(t("voice.micDenied", "Microphone access was denied. Please allow microphone permission."));
        } else if (event.error !== "no-speech") {
          setErrorMessage(`Speech recognition notice: ${event.error}`);
        }
        setMode("idle");
      };

      recognition.onend = () => {
        if (mode === "listening") setMode("idle");
      };

      recognition.start();
    } catch (e: any) {
      console.error("[Voice AI Init Error]", e);
      setMode("idle");
      setErrorMessage(e?.message || "Could not initialize voice recording.");
    }
  }, [lang, handleQuery, mode, t]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setMode("idle");
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setTranscript(manualText.trim());
    handleQuery(manualText.trim());
    setManualText("");
  };

  const handleClose = () => {
    stopListening();
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Microphone Trigger Pill */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <button
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => startListening(), 250);
            }}
            className="group relative flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/40 bg-[#070d1b]/90 text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.35)] backdrop-blur-xl transition-all duration-300 hover:scale-110 hover:border-cyan-300 hover:shadow-[0_0_35px_rgba(34,211,238,0.55)] active:scale-95"
            aria-label={t("voice.floatingTip", "Speak to DriveLegal AI")}
            title={t("voice.floatingTip", "Speak to DriveLegal AI")}
          >
            {/* Subtle radar pulse ring */}
            <span className="absolute -inset-1 animate-ping rounded-2xl bg-cyan-400/20 opacity-75 duration-1000" />
            <Mic className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-cyan-500" />
            </span>
          </button>
        )}
      </div>

      {/* Futuristic Voice Assistant Glassmorphic Cockpit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-cyan-400/30 bg-[#070d1b]/95 p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(34,211,238,0.2)] backdrop-blur-2xl">
            {/* Background neon ambient gradients */}
            <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />

            {/* Modal Header */}
            <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    <span>{t("voice.title", "DriveLegal Voice AI")}</span>
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-400/30">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {mode === "listening"
                      ? t("voice.listening", "Listening to your voice…")
                      : mode === "processing"
                      ? t("voice.processing", "Processing legal intelligence…")
                      : mode === "speaking"
                      ? t("voice.speaking", "Voice AI speaking…")
                      : t("voice.pressToSpeak", "Tap microphone to speak")}
                  </p>
                </div>
              </div>

              {/* Language selector & Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="rounded-xl border border-white/15 bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-cyan-300 focus:border-cyan-400 focus:outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#070d1b] text-white">
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title={isMuted ? "Unmute Voice" : "Mute Voice"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <button
                  onClick={handleClose}
                  className="rounded-xl p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Audio Waveform Canvas */}
            <div className="relative my-4 flex h-24 w-full items-center justify-center rounded-2xl border border-white/5 bg-slate-950/60 overflow-hidden">
              <canvas ref={canvasRef} width={500} height={96} className="h-full w-full" />
              {mode === "listening" && (
                <div className="absolute flex items-center gap-2 rounded-full bg-cyan-950/80 border border-cyan-400/40 px-3 py-1 text-xs font-semibold text-cyan-300 shadow-md">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>{t("voice.speakNow", "Speak now in your language")}</span>
                </div>
              )}
            </div>

            {/* Speech Transcript Preview */}
            <div className="min-h-[4rem] max-h-36 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/50 p-3.5 text-xs text-slate-300">
              {transcript ? (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block mb-1">
                    Your Question:
                  </span>
                  <p className="text-white font-medium">{transcript}</p>
                </div>
              ) : interimTranscript ? (
                <p className="italic text-cyan-300">{interimTranscript}…</p>
              ) : (
                <p className="text-slate-500 italic">
                  {t("assistant.suggest1", "e.g. What is the fine for driving without a valid PUC certificate?")}
                </p>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/30 p-2.5 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* AI Answer Display */}
            {answer && (
              <div className="mt-4 max-h-48 overflow-y-auto rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 to-blue-950/20 p-4 text-xs text-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <ShieldCheck className="h-4 w-4" />
                    <span>DriveLegal AI Response</span>
                  </div>
                  {confidence && (
                    <span className="rounded-full bg-cyan-500/20 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                      {confidence}% Verified
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-line leading-relaxed text-slate-200">{answer}</p>

                {sources && sources.length > 0 && (
                  <div className="mt-3 border-t border-white/10 pt-2 flex flex-wrap gap-1.5">
                    {sources.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-400"
                      >
                        <span>{s.title}</span>
                        {s.section && <span className="text-cyan-400 font-semibold">({s.section})</span>}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-end">
                  <button
                    onClick={() => speakText(answer)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>{t("voice.replay", "Listen Again")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar (Mic Control + Text Input Fallback) */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
              {/* Mic Toggle Button */}
              <button
                onClick={mode === "listening" ? stopListening : startListening}
                className={`flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold transition-all shadow-md ${
                  mode === "listening"
                    ? "bg-red-500 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    : "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                }`}
              >
                {mode === "listening" ? (
                  <>
                    <MicOff className="h-4 w-4" />
                    <span>{t("voice.stopListening", "Stop Listening")}</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    <span>{t("voice.pressToSpeak", "Speak Now")}</span>
                  </>
                )}
              </button>

              {/* Text Fallback Form */}
              <form onSubmit={handleManualSubmit} className="relative flex-1 w-full flex items-center">
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={t("voice.textFallback", "Or type your question here…")}
                  className="w-full rounded-xl border border-white/15 bg-slate-900/80 px-3.5 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!manualText.trim()}
                  className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 disabled:opacity-30 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
