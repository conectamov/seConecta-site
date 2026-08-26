"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, LoaderCircle, LockKeyhole, MessageCircle, UserRound, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { studentApiEnabled } from "@/services/feature-flags";
import { apiRequest, SeConectaApiError } from "@/services/seconecta-browser-api";
import type { StudentProfileApi, WhatsAppChallengeApi } from "@/types/seconecta-api";

export type AuthenticationSession = { studentId: string; name: string; profilePictureUrl: string | null } | null;
type AuthenticationContextValue = { ready: boolean; isAuthenticated: boolean; session: AuthenticationSession; openAuthentication: () => void; refreshSession: () => Promise<AuthenticationSession>; logout: () => Promise<void> };
const AuthenticationContext = createContext<AuthenticationContextValue | null>(null);

function toSession(profile: StudentProfileApi): NonNullable<AuthenticationSession> {
  return { studentId: profile.studentId, name: profile.fullName?.trim() || "Estudante", profilePictureUrl: profile.profilePictureUrl };
}

function friendlyError(error: unknown) {
  if (error instanceof SeConectaApiError) {
    if (error.status === 429) return "Muitas tentativas. Aguarde um pouco antes de pedir outro código.";
    if (error.status === 502 || error.status === 503) return "Não consegui enviar o código agora. Verifique o WhatsApp e tente novamente em instantes.";
    if (error.status === 400) return "Esse código expirou ou não está correto. Peça um novo código.";
  }
  return "Não consegui concluir o acesso agora. Tente novamente.";
}

function AuthModal({ open, onClose, onAuthenticated }: { open: boolean; onClose: () => void; onAuthenticated: (session: NonNullable<AuthenticationSession>) => void }) {
  const [step, setStep] = useState<"phone" | "code" | "name">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("phone"); setPhone(""); setCode(""); setName(""); setChallengeId(""); setError(""); setBusy(false);
  }, [open]);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (phone.replace(/\D/g, "").length < 10) return setError("Digite seu WhatsApp com DDD.");
    setBusy(true); setError("");
    try {
      const challenge = await apiRequest<WhatsAppChallengeApi>("student-auth/whatsapp/challenge", { method: "POST", body: JSON.stringify({ phone }) });
      setChallengeId(challenge.challenge_id); setStep("code");
    } catch (nextError) { setError(friendlyError(nextError)); }
    finally { setBusy(false); }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("Digite os 6 números enviados pelo WhatsApp.");
    setBusy(true); setError("");
    try {
      await apiRequest<{ authenticated: true }>("student-auth/whatsapp/verify", { method: "POST", body: JSON.stringify({ challenge_id: challengeId, code }) });
      const profile = await apiRequest<StudentProfileApi>("students/me/profile");
      if (!profile.fullName) setStep("name"); else onAuthenticated(toSession(profile));
    } catch (nextError) { setError(friendlyError(nextError)); }
    finally { setBusy(false); }
  };

  const saveName = async (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return setError("Conte como podemos chamar você.");
    setBusy(true); setError("");
    try {
      const profile = await apiRequest<StudentProfileApi>("students/me/profile", { method: "PATCH", body: JSON.stringify({ fullName: name.trim() }) });
      onAuthenticated(toSession(profile));
    } catch (nextError) { setError(friendlyError(nextError)); }
    finally { setBusy(false); }
  };

  const submit = step === "phone" ? requestCode : step === "code" ? verifyCode : saveName;
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[1200] grid place-items-center bg-[#10251e]/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.section role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-[450px] rounded-[26px] border border-white/70 bg-[#fbfcfa] p-6 shadow-[0_30px_95px_rgba(17,39,30,.25)] sm:p-8" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .985 }}>
      <div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#e9f7f1] text-[#078166]">{step === "name" ? <UserRound size={19} /> : <MessageCircle size={19} />}</span><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-[#6f7c75] hover:bg-[#eef2ef]" aria-label="Fechar"><X size={17} /></button></div>
      <h2 id="auth-title" className="mt-6 text-[28px] font-semibold tracking-[-.05em] text-[#17372b]">{step === "phone" ? "Entre com seu WhatsApp" : step === "code" ? "Confira suas mensagens" : "Como podemos chamar você?"}</h2>
      <p className="mt-2 text-[11px] leading-5 text-[#68766f]">{step === "phone" ? "Você receberá um código pelo seConecta. É a mesma conta usada nas conversas e na sua Jornada." : step === "code" ? `Enviamos um código para ${phone}. Ele expira em 10 minutos.` : "Seu nome deixa as recomendações e conversas mais pessoais."}</p>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        {step === "phone" && <label className="grid gap-1.5 text-[9px] font-semibold text-[#52615a]">WhatsApp<input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" autoComplete="tel" autoFocus className="h-12 rounded-[14px] border border-[#d3ddd8] bg-white px-4 text-[12px] outline-none focus:border-[#079272]" placeholder="(11) 99999-9999" /></label>}
        {step === "code" && <label className="grid gap-1.5 text-[9px] font-semibold text-[#52615a]">Código de 6 números<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus className="h-12 rounded-[14px] border border-[#d3ddd8] bg-white px-4 text-center text-lg tracking-[.35em] outline-none focus:border-[#079272]" placeholder="000000" /></label>}
        {step === "name" && <label className="grid gap-1.5 text-[9px] font-semibold text-[#52615a]">Seu nome<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" autoFocus className="h-12 rounded-[14px] border border-[#d3ddd8] bg-white px-4 text-[12px] outline-none focus:border-[#079272]" placeholder="Como podemos chamar você?" /></label>}
        {error && <p role="alert" className="rounded-xl bg-[#fff0ed] px-3 py-2.5 text-[9px] font-medium text-[#a84d35]">{error}</p>}
        <button type="submit" disabled={busy} className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#079272] text-[11px] font-semibold text-white disabled:opacity-50">{busy ? <><LoaderCircle size={15} className="animate-spin" />Aguarde...</> : <>{step === "phone" ? "Receber código" : step === "code" ? "Confirmar acesso" : "Continuar"}<ArrowRight size={14} /></>}</button>
        {step === "code" && <button type="button" onClick={() => { setStep("phone"); setCode(""); setError(""); }} className="text-[9px] font-semibold text-[#65736c]">Usar outro número</button>}
      </form>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[8px] leading-4 text-[#909994]"><LockKeyhole size={11} />O código confirma que esse WhatsApp pertence a você.</p>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

export function AuthenticationProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthenticationSession>(null);
  const [open, setOpen] = useState(false);
  const refreshSession = useCallback(async (): Promise<AuthenticationSession> => {
    if (!studentApiEnabled) { setSession(null); return null; }
    try { const next = toSession(await apiRequest<StudentProfileApi>("students/me/profile")); setSession(next); return next; }
    catch { setSession(null); return null; }
  }, []);
  useEffect(() => { refreshSession().finally(() => setReady(true)); }, [refreshSession]);
  const authenticate = (next: NonNullable<AuthenticationSession>) => { setSession(next); setOpen(false); window.dispatchEvent(new CustomEvent("seconecta:authenticated")); };
  const logout = async () => { await apiRequest<{ ok: true }>("session/logout", { method: "POST", body: "{}" }).catch(() => null); setSession(null); window.dispatchEvent(new CustomEvent("seconecta:logged-out")); };
  const value = useMemo(() => ({ ready, session, isAuthenticated: Boolean(session), openAuthentication: () => setOpen(true), refreshSession, logout }), [ready, refreshSession, session]);
  return <AuthenticationContext.Provider value={value}>{children}<AuthModal open={open} onClose={() => setOpen(false)} onAuthenticated={authenticate} /></AuthenticationContext.Provider>;
}

export function useAuthentication() {
  const context = useContext(AuthenticationContext);
  if (!context) throw new Error("useAuthentication must be used inside AuthenticationProvider.");
  return context;
}
