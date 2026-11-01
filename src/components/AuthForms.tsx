"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { useApp } from "@/components/Providers";
import { Button, Card, Field, Notice, inputCls } from "@/components/ui";
import { api } from "@/lib/client";

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <div className="mb-5 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-navy"><ShieldCheck className="h-6 w-6 text-cyan-300" /></span>
          <div><h1 className="text-xl font-bold">{title}</h1><p className="text-sm text-muted">{subtitle}</p></div></div>
        {children}
        <p className="mt-5 border-t border-line pt-3 text-xs text-muted">We never ask for government-portal passwords or OTPs.</p>
      </Card>
    </div>
  );
}

const loginSchema = z.object({ email: z.string().email("Enter a valid email"), password: z.string().min(1, "Enter your password") });
export function LoginForm() {
  const { refreshUser, toast } = useApp();
  const router = useRouter();
  const [err, setErr] = useState("");
  const f = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  return (
    <Shell title="Welcome back" subtitle="Log in to save reports and track documents.">
      <form className="space-y-4" onSubmit={f.handleSubmit(async (v) => {
        setErr("");
        try { await api("/api/auth/login", { body: v }); await refreshUser(); toast("Logged in.", "success"); router.push("/dashboard"); }
        catch (e) { setErr(e instanceof Error ? e.message : "Login failed"); }
      })}>
        {err && <Notice tone="red">{err}</Notice>}
        <Field label="Email" htmlFor="email" error={f.formState.errors.email?.message}><input id="email" type="email" autoComplete="email" className={inputCls} {...f.register("email")} /></Field>
        <Field label="Password" htmlFor="password" error={f.formState.errors.password?.message}><input id="password" type="password" autoComplete="current-password" className={inputCls} {...f.register("password")} /></Field>
        <Button type="submit" className="w-full" loading={f.formState.isSubmitting}>Log in</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm"><Link className="text-royal hover:underline" href="/forgot-password">Forgot password?</Link><Link className="text-royal hover:underline" href="/register">Create account</Link></div>
    </Shell>
  );
}

const regSchema = z.object({ name: z.string().min(2, "Enter your name"), email: z.string().email("Enter a valid email"), password: z.string().min(8, "At least 8 characters"), confirm: z.string() }).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });
export function RegisterForm() {
  const { refreshUser, toast, lang, state } = useApp();
  const router = useRouter();
  const [err, setErr] = useState("");
  const f = useForm<z.infer<typeof regSchema>>({ resolver: zodResolver(regSchema) });
  return (
    <Shell title="Create your account" subtitle="Free. Collects only what is needed.">
      <form className="space-y-4" onSubmit={f.handleSubmit(async (v) => {
        setErr("");
        try {
          const r = await api<{ firstUser: boolean }>("/api/auth/register", { body: { name: v.name, email: v.email, password: v.password, preferredLanguage: lang, preferredState: state || undefined } });
          await refreshUser(); toast(r.firstUser ? "Account created — you are the first user, so you have Super Admin access." : "Account created.", "success"); router.push("/dashboard");
        } catch (e) { setErr(e instanceof Error ? e.message : "Registration failed"); }
      })}>
        {err && <Notice tone="red">{err}</Notice>}
        <Field label="Full name" htmlFor="name" error={f.formState.errors.name?.message}><input id="name" autoComplete="name" className={inputCls} {...f.register("name")} /></Field>
        <Field label="Email" htmlFor="email" error={f.formState.errors.email?.message}><input id="email" type="email" autoComplete="email" className={inputCls} {...f.register("email")} /></Field>
        <Field label="Password" htmlFor="password" error={f.formState.errors.password?.message}><input id="password" type="password" autoComplete="new-password" className={inputCls} {...f.register("password")} /></Field>
        <Field label="Confirm password" htmlFor="confirm" error={f.formState.errors.confirm?.message}><input id="confirm" type="password" autoComplete="new-password" className={inputCls} {...f.register("confirm")} /></Field>
        <Button type="submit" className="w-full" loading={f.formState.isSubmitting}>Create account</Button>
      </form>
      <p className="mt-4 text-sm">Already registered? <Link className="text-royal hover:underline" href="/login">Log in</Link></p>
    </Shell>
  );
}

export function ForgotForm() {
  const [done, setDone] = useState<{ message: string; devLink?: string } | null>(null);
  const [err, setErr] = useState("");
  const f = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email("Enter a valid email") })) });
  return (
    <Shell title="Forgot password" subtitle="We will generate a reset link for your account.">
      {done ? (
        <div className="space-y-3"><Notice tone="green">{done.message}</Notice>
          {done.devLink ? <Link className="text-sm text-royal underline" href={done.devLink}>Open reset link (debug mode)</Link> : <Notice tone="blue" title="Email delivery is not configured yet">The link is written to the server log. Connect an email provider to deliver it — see the README.</Notice>}</div>
      ) : (
        <form className="space-y-4" onSubmit={f.handleSubmit(async (v) => { setErr(""); try { setDone(await api("/api/auth/forgot", { body: v })); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } })}>
          {err && <Notice tone="red">{err}</Notice>}
          <Field label="Email" htmlFor="email" error={f.formState.errors.email?.message}><input id="email" type="email" className={inputCls} {...f.register("email")} /></Field>
          <Button type="submit" className="w-full" loading={f.formState.isSubmitting}>Send reset link</Button>
        </form>
      )}
      <p className="mt-4 text-sm"><Link className="text-royal hover:underline" href="/login">Back to login</Link></p>
    </Shell>
  );
}

export function ResetForm() {
  const [token, setToken] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(new URLSearchParams(window.location.search).get("token") ?? ""); }, []);
  const f = useForm<{ password: string }>({ resolver: zodResolver(z.object({ password: z.string().min(8, "At least 8 characters") })) });
  return (
    <Shell title="Reset password" subtitle="Choose a new password.">
      {ok ? <div className="space-y-3"><Notice tone="green">Password updated. You can now log in.</Notice><Link className="text-royal underline" href="/login">Go to login</Link></div> : (
        <form className="space-y-4" onSubmit={f.handleSubmit(async (v) => { setErr(""); try { await api("/api/auth/reset", { body: { token, password: v.password } }); setOk(true); } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); } })}>
          {!token && <Notice tone="red">This page needs a valid reset link.</Notice>}
          {err && <Notice tone="red">{err}</Notice>}
          <Field label="New password" htmlFor="password" error={f.formState.errors.password?.message}><input id="password" type="password" autoComplete="new-password" className={inputCls} {...f.register("password")} /></Field>
          <Button type="submit" className="w-full" disabled={!token} loading={f.formState.isSubmitting}>Update password</Button>
        </form>
      )}
    </Shell>
  );
}
