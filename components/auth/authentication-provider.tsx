"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CircleCheck, LoaderCircle, LockKeyhole, MessageCircle, Smartphone, X } from "lucide-react";
import { createContext, FormEvent, useContext, useEffect, useMemo, useRef, useState } from "react";

export type AuthenticationReason = "saveOpportunity" | "journey" | "reminders" | "aiMemory" | "community" | "settings";
export type AuthenticationProviderId = "whatsapp" | "google";

type ConnectedAccount = { connected: boolean; identifier?: string };
type AuthenticationSession = {
  authenticated: boolean;
  primaryProvider?: AuthenticationProviderId;
  connectedAccounts: Record<AuthenticationProviderId, ConnectedAccount>;
};

type AuthenticationContextValue = {
  ready: boolean;
  isAuthenticated: boolean;
  session: AuthenticationSession;
  openAuthentication: (reason: AuthenticationReason, onAuthenticated?: () => void, preferredProvider?: AuthenticationProviderId) => void;
  connectAccount: (provider: AuthenticationProviderId) => void;
  logout: () => void;
};

const SESSION_KEY = "seconecta:auth-session";
const KNOWN_IDENTITIES_KEY = "seconecta:known-identities";
const emptySession: AuthenticationSession = { authenticated: false, connectedAccounts: { whatsapp: { connected: false }, google: { connected: false } } };
const AuthenticationContext = createContext<AuthenticationContextValue | null>(null);

type ModalStage = "choice" | "phone" | "waiting" | "google" | "success";

function readKnownIdentities() {
  try {
    return JSON.parse(window.localStorage.getItem(KNOWN_IDENTITIES_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function identityKey(provider: AuthenticationProviderId, identifier: string) {
  return `${provider}:${identifier}`;
}

function isKnownIdentity(provider: AuthenticationProviderId, identifier: string) {
  const known = readKnownIdentities();
  return known.includes(identityKey(provider, identifier)) || (provider === "whatsapp" && known.includes(identifier));
}

function readSession() {
  try {
    const stored = window.localStorage.getItem(SESSION_KEY);
    return stored ? { ...emptySession, ...JSON.parse(stored) as AuthenticationSession } : emptySession;
  } catch {
    return emptySession;
  }
}

function reasonBenefit(reason: AuthenticationReason) {
  const copy: Record<AuthenticationReason, string> = {
    saveOpportunity: "Salve esta oportunidade, acompanhe prazos e continue sua preparação em qualquer dispositivo.",
    journey: "Acompanhe oportunidades, progresso, lembretes e notificações em um só lugar.",
    reminders: "Receba avisos importantes antes que um prazo termine.",
    aiMemory: "Permita que seu Coach lembre seu contexto e continue a orientação depois.",
    community: "Preserve suas perguntas, respostas e conexões com outros estudantes.",
    settings: "Conecte outra forma de acesso à mesma Jornada.",
  };
  return copy[reason];
}

function GoogleMark() {
  return <span className="grid size-6 place-items-center rounded-full bg-white text-sm font-bold shadow-sm"><i className="not-italic text-[#4285f4]">G</i></span>;
}

function AuthModal({ open, reason, preferredProvider, linkingAccount, onClose, onAuthenticated }: { open: boolean; reason: AuthenticationReason; preferredProvider: AuthenticationProviderId | null; linkingAccount: boolean; onClose: () => void; onAuthenticated: (provider: AuthenticationProviderId, identifier: string, returning: boolean) => void }) {
  const [stage, setStage] = useState<ModalStage>("choice");
  const [phone, setPhone] = useState("");
  const [returning, setReturning] = useState(false);
  const [completedProvider, setCompletedProvider] = useState<AuthenticationProviderId>("whatsapp");

  useEffect(() => {
    if (!open) return;
    setPhone("");
    setReturning(false);
    setStage(preferredProvider === "whatsapp" ? "phone" : preferredProvider === "google" ? "google" : "choice");
  }, [preferredProvider, open]);

  useEffect(() => {
    if (!open || stage !== "google") return;
    const identifier = "conta-google@mock.seconecta";
    const timeout = window.setTimeout(() => complete("google", identifier, isKnownIdentity("google", identifier)), 1350);
    return () => window.clearTimeout(timeout);
  }, [open, stage]);

  const complete = (provider: AuthenticationProviderId, identifier: string, isReturning: boolean) => {
    setCompletedProvider(provider);
    setReturning(isReturning);
    setStage("success");
    window.setTimeout(() => onAuthenticated(provider, identifier, isReturning), 1250);
  };

  const submitPhone = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = phone.replace(/\D/g, "");
    if (normalized.length < 10) return;
    setStage("waiting");
    window.setTimeout(() => complete("whatsapp", normalized, isKnownIdentity("whatsapp", normalized)), 1850);
  };

  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[1200] grid place-items-center bg-[#14221d]/45 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <motion.section role="dialog" aria-modal="true" aria-labelledby="authentication-title" className="relative w-full max-w-[470px] overflow-hidden rounded-[28px] border border-white/70 bg-[#fbfcfa] shadow-[0_30px_95px_rgba(17,39,30,.25)]" initial={{ opacity: 0, y: 18, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .985 }} transition={{ duration: .22 }}>
      <header className="flex h-16 items-center justify-between border-b border-[#e1e7e3] px-6"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#078166]">seConecta</span><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-[#66736d] hover:bg-[#edf2ef]" aria-label="Fechar"><X size={17} /></button></header>
      <AnimatePresence mode="wait" initial={false}>
        {stage === "choice" && <motion.div className="p-7 sm:p-9" key="choice" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}><span className="grid size-11 place-items-center rounded-2xl bg-[#e9f7f1] text-[#078166]"><LockKeyhole size={20} /></span><h2 id="authentication-title" className="mt-6 text-[28px] font-semibold tracking-[-.05em] text-[#17372b]">Salvar minha jornada</h2><p className="mt-3 text-[12px] leading-6 text-[#66736d]">Continue exatamente de onde parou e acompanhe suas oportunidades em qualquer dispositivo.</p><p className="mt-3 rounded-xl bg-[#f0f5f2] px-3 py-2.5 text-[10px] leading-5 text-[#52615a]">{reasonBenefit(reason)}</p><div className="mt-7 grid gap-2.5"><button type="button" onClick={() => setStage("phone")} className="flex min-h-13 items-center gap-3 rounded-[15px] bg-[#079272] px-4 text-[11px] font-semibold shadow-[0_10px_24px_rgba(7,146,114,.17)]" style={{ color: "#fff" }}><span className="grid size-8 place-items-center rounded-xl bg-white/12"><MessageCircle size={17} /></span>Continuar com WhatsApp <ArrowRight size={14} className="ml-auto" /></button><button type="button" onClick={() => setStage("google")} className="flex min-h-13 items-center gap-3 rounded-[15px] border border-[#d8e0dc] bg-white px-4 text-[11px] font-semibold text-[#365247] hover:bg-[#f5f8f6]"><GoogleMark />Continuar com Google <ArrowRight size={14} className="ml-auto" /></button></div><p className="mt-5 text-center text-[9px] leading-5 text-[#818c86]">Você poderá conectar os dois métodos depois.</p><p className="mt-2 flex items-center justify-center gap-1.5 text-[8px] text-[#98a19d]"><LockKeyhole size={10} />Sem senha. Seus dados locais serão preservados.</p></motion.div>}

        {stage === "phone" && <motion.div className="p-7 sm:p-9" key="phone" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}><button type="button" onClick={() => preferredProvider ? onClose() : setStage("choice")} className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#748079]"><ArrowLeft size={12} />Voltar</button><span className="mt-6 grid size-11 place-items-center rounded-2xl bg-[#e9f7f1] text-[#078166]"><Smartphone size={20} /></span><h2 id="authentication-title" className="mt-5 text-[25px] font-semibold tracking-[-.045em] text-[#17372b]">Confirmar pelo WhatsApp</h2><p className="mt-3 text-[11px] leading-6 text-[#66736d]">Vamos enviar uma mensagem no WhatsApp para confirmar sua identidade. Você não precisará criar uma senha.</p><form onSubmit={submitPhone} className="mt-6"><label className="text-[9px] font-semibold text-[#52615a]" htmlFor="authentication-phone">Número com DDD</label><div className="mt-2 flex h-12 items-center rounded-[14px] border border-[#d3ddd8] bg-white px-3 focus-within:border-[#079272] focus-within:ring-2 focus-within:ring-[#079272]/10"><span className="border-r border-[#e0e5e2] pr-3 text-[10px] font-semibold text-[#52615a]">+55</span><input id="authentication-phone" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(11) 99999-9999" className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[12px] text-[#29493c] outline-none" autoFocus /></div><button type="submit" disabled={phone.replace(/\D/g, "").length < 10} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#079272] text-[11px] font-semibold disabled:opacity-35" style={{ color: "#fff" }}>Enviar confirmação <ArrowRight size={14} /></button></form><p className="mt-4 text-center text-[8px] leading-4 text-[#909994]">Usaremos este número apenas para identidade, lembretes e conversas que você ativar.</p></motion.div>}

        {stage === "waiting" && <motion.div className="flex min-h-[390px] flex-col items-center justify-center p-8 text-center" key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.span className="relative grid size-16 place-items-center rounded-full bg-[#e9f7f1] text-[#078166]" animate={{ scale: [1, 1.04, 1] }} transition={{ duration: 1.5, repeat: Infinity }}><MessageCircle size={25} /><motion.i className="absolute inset-[-7px] rounded-full border-2 border-[#079272]/20 border-t-[#079272]" animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} /></motion.span><h2 id="authentication-title" className="mt-7 text-[24px] font-semibold tracking-[-.04em] text-[#17372b]">Aguardando confirmação...</h2><p className="mt-3 max-w-xs text-[11px] leading-6 text-[#66736d]">Abra a mensagem enviada no WhatsApp e confirme que é você. Esta tela continuará automaticamente.</p><span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f0f4f2] px-4 py-2 text-[8px] font-medium text-[#748079]"><LoaderCircle size={12} className="animate-spin" />Verificando com segurança</span></motion.div>}

        {stage === "google" && <motion.div className="flex min-h-[390px] flex-col items-center justify-center p-8 text-center" key="google" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.2, repeat: Infinity }}><GoogleMark /></motion.span><h2 id="authentication-title" className="mt-6 text-[23px] font-semibold tracking-[-.04em] text-[#17372b]">Abrindo o Google...</h2><p className="mt-3 text-[11px] leading-6 text-[#66736d]">Conclua a confirmação na janela segura do Google.</p><LoaderCircle size={18} className="mt-6 animate-spin text-[#078166]" /></motion.div>}

        {stage === "success" && <motion.div className="flex min-h-[390px] flex-col items-center justify-center p-8 text-center" key="success" initial={{ opacity: 0, scale: .98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><motion.span className="grid size-16 place-items-center rounded-full bg-[#e7f7ef] text-[#078166]" initial={{ scale: .65 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}><CircleCheck size={29} /></motion.span><h2 id="authentication-title" className="mt-7 text-[25px] font-semibold tracking-[-.045em] text-[#17372b]">{linkingAccount ? "Conta conectada." : returning ? "Bem-vindo de volta." : "Jornada salva."}</h2><p className="mt-3 max-w-xs text-[11px] leading-6 text-[#66736d]">{returning ? "Suas recomendações, oportunidades e contexto foram restaurados." : linkingAccount ? `${completedProvider === "whatsapp" ? "WhatsApp" : "Google"} agora leva você à mesma Jornada.` : "Seu progresso local está conectado e pronto para continuar em qualquer dispositivo."}</p><span className="mt-5 inline-flex items-center gap-2 text-[9px] font-semibold text-[#078166]"><Check size={13} />Continuando de onde você parou</span></motion.div>}
      </AnimatePresence>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

export function AuthenticationProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthenticationSession>(emptySession);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState<AuthenticationReason>("journey");
  const [preferredProvider, setPreferredProvider] = useState<AuthenticationProviderId | null>(null);
  const [linkingAccount, setLinkingAccount] = useState(false);
  const continuationRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => { setSession(readSession()); setReady(true); }, []);

  const openAuthentication = (nextReason: AuthenticationReason, onAuthenticated?: () => void, preferredProvider?: AuthenticationProviderId) => {
    if (session.authenticated && !preferredProvider) { onAuthenticated?.(); return; }
    continuationRef.current = onAuthenticated;
    setReason(nextReason);
    setPreferredProvider(preferredProvider ?? null);
    setLinkingAccount(false);
    setModalOpen(true);
  };

  const finishAuthentication = (provider: AuthenticationProviderId, identifier: string) => {
    const next: AuthenticationSession = { authenticated: true, primaryProvider: session.primaryProvider ?? provider, connectedAccounts: { ...session.connectedAccounts, [provider]: { connected: true, identifier } } };
    setSession(next);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    const known = readKnownIdentities();
    window.localStorage.setItem(KNOWN_IDENTITIES_KEY, JSON.stringify([...new Set([...known, identityKey(provider, identifier)])]));
    setModalOpen(false);
    setPreferredProvider(null);
    setLinkingAccount(false);
    const continuation = continuationRef.current;
    continuationRef.current = undefined;
    window.setTimeout(() => continuation?.(), 80);
  };

  const value = useMemo<AuthenticationContextValue>(() => ({
    ready,
    isAuthenticated: session.authenticated,
    session,
    openAuthentication,
    connectAccount: (provider) => {
      setReason("settings");
      setPreferredProvider(provider);
      setLinkingAccount(true);
      continuationRef.current = undefined;
      setModalOpen(true);
    },
    logout: () => {
      setSession(emptySession);
      setModalOpen(false);
      setPreferredProvider(null);
      setLinkingAccount(false);
      continuationRef.current = undefined;
      window.localStorage.removeItem(SESSION_KEY);
    },
  }), [ready, session]);

  return <AuthenticationContext.Provider value={value}>{children}<AuthModal open={modalOpen} reason={reason} preferredProvider={preferredProvider} linkingAccount={linkingAccount} onClose={() => { setModalOpen(false); continuationRef.current = undefined; setPreferredProvider(null); setLinkingAccount(false); }} onAuthenticated={(provider, identifier) => finishAuthentication(provider, identifier)} /></AuthenticationContext.Provider>;
}

export function useAuthentication() {
  const context = useContext(AuthenticationContext);
  if (!context) throw new Error("useAuthentication must be used inside AuthenticationProvider.");
  return context;
}
