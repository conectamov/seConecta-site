"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Compass, Flame, Layers3, LoaderCircle, LogIn, MessageCircle, Sparkles, Target, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { educationOptions, experienceOptions, gradeOptions, primaryGoalOptions, subjectOptions } from "@/data/onboarding-flow";
import { getOnboardingRecommendationSummary, type OnboardingRecommendationSummary } from "@/services/onboarding-recommendation-service";
import { onboardingService } from "@/services/onboarding-service";
import { useAuthentication, type AuthenticationCompletedDetail } from "@/components/auth/authentication-provider";
import { multichannelActivationEnabled, studentApiEnabled } from "@/services/feature-flags";
import { getActivationContext, recordActivationEvent } from "@/services/student-activation-service";
import type { EducationLevel, OnboardingExperienceLevel, OnboardingPrimaryGoal, OnboardingProfile, OnboardingSubject } from "@/types/onboarding";

type JourneyOnboardingContextValue = {
  profile: OnboardingProfile | null;
  startOnboarding: () => void;
  updateProfile: (profile: OnboardingProfile) => void;
};

type Answers = {
  educationLevel: EducationLevel | null;
  current_grade: string | null;
  subjects: OnboardingSubject[];
  primary_goal: OnboardingPrimaryGoal | null;
  experience_level: OnboardingExperienceLevel | null;
};

type Phase = "questions" | "loading" | "results";
const loadingItems = ["Entendendo seus interesses", "Comparando oportunidades", "Organizando sua seleção", "Quase pronto"];
const emptyAnswers: Answers = { educationLevel: null, current_grade: null, subjects: [], primary_goal: null, experience_level: null };

export const JourneyOnboardingContext = createContext<JourneyOnboardingContextValue | null>(null);

function answersFromProfile(profile: OnboardingProfile | null): Answers {
  return profile ? {
    educationLevel: profile.educationLevel,
    current_grade: profile.current_grade,
    subjects: profile.subjects,
    primary_goal: profile.primary_goal,
    experience_level: profile.experience_level,
  } : emptyAnswers;
}

function JourneyOnboarding({ open, profile, onClose, onComplete }: { open: boolean; profile: OnboardingProfile | null; onClose: () => void; onComplete: (profile: OnboardingProfile) => void }) {
  const router = useRouter();
  const { openAuthentication } = useAuthentication();
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("questions");
  const [loadingStage, setLoadingStage] = useState(0);
  const [results, setResults] = useState<OnboardingRecommendationSummary | null>(null);
  const [activationBusy, setActivationBusy] = useState<"whatsapp" | "website" | null>(null);
  const [activationError, setActivationError] = useState("");
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => {
    if (!open) return;
    setAnswers(answersFromProfile(profile));
    setStep(0);
    setPhase("questions");
    setLoadingStage(0);
    setResults(null);
    setActivationBusy(null);
    setActivationError("");
    clearTimers();
    const overflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", closeOnEscape); clearTimers(); };
  }, [clearTimers, onClose, open, profile]);

  useEffect(() => {
    if (phase !== "results" || !multichannelActivationEnabled) return;
    void recordActivationEvent("ONBOARDING_RESULTS_VIEWED", "onboarding-results:v1");
  }, [phase]);

  const scheduleAdvance = (nextStep: number) => timers.current.push(window.setTimeout(() => setStep(nextStep), 180));
  const gradeChoices = answers.educationLevel === "Ensino Fundamental II" || answers.educationLevel === "Ensino Médio" ? gradeOptions[answers.educationLevel] : [];
  const progress = phase === "results" ? 100 : phase === "loading" ? 84 : ((step + 1) / 6) * 100;

  const selectEducation = (educationLevel: EducationLevel) => {
    const directGrade = educationLevel === "Universidade" || educationLevel === "Outro" ? educationLevel : null;
    const next = { ...answers, educationLevel, current_grade: directGrade };
    setAnswers(next);
    if (directGrade) scheduleAdvance(1);
  };

  const selectGrade = (currentGrade: string) => {
    setAnswers((current) => ({ ...current, current_grade: currentGrade }));
    scheduleAdvance(1);
  };

  const toggleSubject = (subject: OnboardingSubject) => setAnswers((current) => ({
    ...current,
    subjects: current.subjects.includes(subject)
      ? current.subjects.filter((item) => item !== subject)
      : current.subjects.length < 5 ? [...current.subjects, subject] : current.subjects,
  }));

  const beginPersonalization = async (completedAnswers: Answers) => {
    if (!completedAnswers.educationLevel || !completedAnswers.current_grade || !completedAnswers.primary_goal || !completedAnswers.experience_level || completedAnswers.subjects.length === 0) return;
    clearTimers();
    setAnswers(completedAnswers);
    setPhase("loading");
    setLoadingStage(0);
    const nextProfile = onboardingService.createProfile({
      educationLevel: completedAnswers.educationLevel,
      current_grade: completedAnswers.current_grade,
      subjects: completedAnswers.subjects,
      primary_goal: completedAnswers.primary_goal,
      experience_level: completedAnswers.experience_level,
    });
    const summaryPromise = getOnboardingRecommendationSummary(nextProfile);
    [420, 980, 1560, 2180].forEach((delay, index) => timers.current.push(window.setTimeout(() => setLoadingStage(index + 1), delay)));
    const [summary] = await Promise.all([summaryPromise, new Promise((resolve) => timers.current.push(window.setTimeout(resolve, 2600)))]);
    setResults(summary);
    setPhase("results");
  };

  const persistProfile = () => {
    if (!answers.educationLevel || !answers.current_grade || !answers.primary_goal || !answers.experience_level || answers.subjects.length === 0) return;
    const nextProfile = onboardingService.createProfile({
      educationLevel: answers.educationLevel,
      current_grade: answers.current_grade,
      subjects: answers.subjects,
      primary_goal: answers.primary_goal,
      experience_level: answers.experience_level,
    });
    onboardingService.save(nextProfile);
    onComplete(nextProfile);
    return nextProfile;
  };

  const finish = () => {
    if (!persistProfile()) return;
    onClose();
    router.push("/explorar");
  };

  const continueWithoutSaving = () => {
    void recordActivationEvent("CONTINUED_WITHOUT_SAVING", "continue-without-saving:v1");
    finish();
  };

  const continueOnWebsite = () => {
    const nextProfile = persistProfile();
    if (!nextProfile) return;
    setActivationBusy("website");
    void recordActivationEvent("WEBSITE_AUTH_SELECTED", "website-auth-selected:v1");
    onClose();
    openAuthentication({ kind: "persist_onboarding", returnTo: "/explorar" });
  };

  const continueOnWhatsApp = async () => {
    const nextProfile = persistProfile();
    if (!nextProfile) return;
    setActivationBusy("whatsapp");
    setActivationError("");
    await recordActivationEvent("WHATSAPP_SELECTED", "whatsapp-selected:v1");
    try {
      const handoff = await onboardingService.createWhatsAppHandoff(nextProfile, getActivationContext());
      window.location.assign(handoff.whatsapp_url);
    } catch {
      setActivationBusy(null);
      setActivationError("Não consegui abrir o WhatsApp agora. Seu perfil continua salvo neste aparelho; tente novamente.");
    }
  };

  const goBack = () => {
    if (phase === "results") { setPhase("questions"); setStep(3); return; }
    if (phase === "questions") setStep((current) => Math.max(0, current - 1));
  };

  const question = useMemo(() => {
    if (step === 0) return <div>
      <span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Sua seleção começa aqui</span>
      <h2 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-[-.05em] text-[#17372b]">Em qual série você está?</h2>
      <div className="mt-7 grid gap-3 sm:grid-cols-2">{educationOptions.map((option) => <button type="button" onClick={() => selectEducation(option.value)} className={`flex min-h-20 items-center gap-3 rounded-[18px] border p-4 text-left transition hover:-translate-y-0.5 ${answers.educationLevel === option.value ? "border-[#079272] bg-[#eaf7f1]" : "border-[#dce4e0] bg-white hover:border-[#a9cdbf]"}`} key={option.value}><span className="text-xl">{option.icon}</span><strong className="text-[11px] text-[#29493c]">{option.title}</strong>{answers.educationLevel === option.value && <Check size={15} className="ml-auto text-[#079272]" />}</button>)}</div>
      <AnimatePresence>{gradeChoices.length > 0 && <motion.div className="mt-7 overflow-hidden border-t border-[#e3e8e5] pt-6" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}><span className="block text-center text-[10px] font-semibold text-[#65736c]">Agora escolha a série</span><div className="mt-3 flex flex-wrap justify-center gap-2">{gradeChoices.map((option) => <button type="button" onClick={() => selectGrade(option.value)} className={`min-h-11 min-w-16 rounded-full border px-5 text-[11px] font-semibold ${answers.current_grade === option.value ? "border-[#079272] bg-[#079272] text-white" : "border-[#d5dfda] bg-white text-[#52615a]"}`} key={option.value}>{option.title}</button>)}</div></motion.div>}</AnimatePresence>
    </div>;
    if (step === 1) return <div>
      <span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Áreas que combinam com você</span><h2 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-[-.05em] text-[#17372b]">Quais assuntos você gostaria de explorar?</h2><p className="mt-2 text-[11px] text-[#68766f]">Escolha até 5 áreas.</p>
      <div className="mt-7 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{subjectOptions.map((option) => { const selected = answers.subjects.includes(option.value); return <button type="button" onClick={() => toggleSubject(option.value)} disabled={!selected && answers.subjects.length >= 5} className={`flex min-h-16 items-center gap-3 rounded-[16px] border p-3.5 text-left transition hover:-translate-y-0.5 disabled:opacity-40 ${selected ? "border-[#079272] bg-[#eaf7f1]" : "border-[#dce4e0] bg-white hover:border-[#a9cdbf]"}`} key={option.value}><span className="text-lg">{option.icon}</span><strong className="text-[10px] text-[#29493c]">{option.title}</strong>{selected && <Check size={14} className="ml-auto text-[#079272]" />}</button>; })}</div>
      <div className="mt-7 flex items-center justify-between gap-4 border-t border-[#e3e8e5] pt-5"><span className="text-[9px] font-medium text-[#748079]">{answers.subjects.length} de 5 selecionados</span><button type="button" onClick={() => setStep(2)} disabled={answers.subjects.length === 0} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#079272] px-5 text-[10px] font-semibold text-white disabled:opacity-35">Continuar <ChevronRight size={14} /></button></div>
    </div>;
    if (step === 2) return <ChoiceScreen kicker="Sua prioridade agora" title="Qual é seu principal interesse agora?" subtitle="Escolha uma direção. Você poderá mudar isso quando quiser." options={primaryGoalOptions} selected={answers.primary_goal} onSelect={(value) => { setAnswers((current) => ({ ...current, primary_goal: value })); scheduleAdvance(3); }} />;
    return <ChoiceScreen kicker="Ajustando o nível" title="Qual frase melhor descreve sua experiência até aqui?" subtitle="Não existe resposta certa. Isso só ajuda a encontrar oportunidades no nível ideal para você." options={experienceOptions} selected={answers.experience_level} onSelect={(value) => { const next = { ...answers, experience_level: value }; setAnswers(next); timers.current.push(window.setTimeout(() => void beginPersonalization(next), 180)); }} />;
  }, [answers, gradeChoices, step]);

  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[4000] grid place-items-center overflow-y-auto bg-[#10251e]/60 p-4 backdrop-blur-sm max-sm:items-end max-sm:p-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.section role="dialog" aria-modal="true" aria-label="Personalizar oportunidades" className="my-auto max-h-[calc(100svh-32px)] w-full max-w-[760px] overflow-hidden rounded-[28px] border border-white/70 bg-[#fbfcfa] shadow-[0_30px_95px_rgba(17,39,30,.25)] max-sm:my-0 max-sm:max-h-[100svh] max-sm:rounded-b-none" initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .99 }}>
      <header className="grid h-16 grid-cols-3 items-center border-b border-[#e1e7e4] bg-white/90 px-5"><span className="text-[17px] font-semibold tracking-[-.04em] text-[#17372b]"><b className="text-[#026df0]">se</b>Conecta</span><button type="button" onClick={goBack} disabled={(phase === "questions" && step === 0) || phase === "loading"} className="inline-flex items-center justify-center gap-1 text-[9px] font-semibold text-[#65736c] disabled:invisible"><ChevronLeft size={14} />Voltar</button><button type="button" onClick={onClose} className="ml-auto grid size-9 place-items-center rounded-full text-[#65736c] hover:bg-[#eef2ef]" aria-label="Fechar"><X size={17} /></button></header>
      <div className="h-1 bg-[#e7ece9]"><motion.i className="block h-full bg-[linear-gradient(90deg,#078166,#43b28e)]" animate={{ width: `${progress}%` }} /></div>
      <div className="max-h-[calc(100svh-100px)] overflow-y-auto p-6 sm:p-9"><AnimatePresence mode="wait" initial={false}>
        {phase === "questions" && <motion.div key={`question-${step}`} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>{question}</motion.div>}
        {phase === "loading" && <motion.div key="loading" className="flex min-h-[460px] flex-col items-center justify-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><span className="grid size-16 place-items-center rounded-full border border-[#bcd9ce] bg-[#e8f7f1] text-[#078166] shadow-[0_13px_32px_rgba(7,129,102,.12)]"><Compass size={25} /></span><h2 className="mt-6 text-[32px] font-semibold tracking-[-.05em] text-[#17372b]">Analisando seu perfil...</h2><p className="mt-2 text-[11px] text-[#718078]">Estamos organizando oportunidades que combinam com seu momento.</p><div className="mt-7 grid w-full max-w-[410px] gap-2 text-left">{loadingItems.map((item, index) => <motion.div className={`flex min-h-12 items-center gap-3 rounded-[14px] border px-4 ${loadingStage > index ? "border-[#cce0d7] bg-white text-[#29493c]" : loadingStage === index ? "border-[#bdd8cd] bg-white text-[#52615a]" : "border-[#e1e7e3] bg-white/65 text-[#99a29e]"}`} animate={loadingStage === index ? { opacity: [.6, 1, .6] } : undefined} transition={{ repeat: Infinity, duration: 1.1 }} key={item}><span className={`grid size-6 place-items-center rounded-full text-[8px] font-bold ${loadingStage > index ? "bg-[#078166] text-white" : "bg-[#f0f3f1]"}`}>{loadingStage > index ? <Check size={13} /> : index + 1}</span><strong className="text-[10px]">{item}</strong></motion.div>)}</div></motion.div>}
        {phase === "results" && <motion.div key="results" className="min-h-[460px] text-center" initial={{ opacity: 0, scale: .985 }} animate={{ opacity: 1, scale: 1 }}><span className="relative mx-auto grid size-20 place-items-center rounded-full border-[7px] border-white bg-[#079272] text-white shadow-[0_13px_28px_rgba(7,129,102,.22)]"><Check size={31} /><Sparkles className="absolute -right-5 -top-2 rounded-full bg-[#fff5d9] p-2 text-[#a87716] shadow-md" size={30} /></span><span className="mt-6 block text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Sua seleção está pronta</span><h2 className="mx-auto mt-2 text-[clamp(1.9rem,4vw,2.6rem)] font-semibold tracking-[-.05em] text-[#17372b]">Encontramos oportunidades para você!</h2><p className="mx-auto mt-3 max-w-lg text-[11px] leading-6 text-[#718078]">Com base no seu perfil, já organizamos um primeiro ponto de partida.</p><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4"><ResultMetric icon={Target} value={results?.compatibleOpportunities ?? 0} label="compatíveis agora" /><ResultMetric icon={Flame} value={results?.openOpportunities ?? 0} label="com inscrições abertas" /><ResultMetric icon={Layers3} value={results?.selectedSubjects ?? answers.subjects.length} label="áreas conectadas" /><ResultMetric icon={Compass} value={results?.catalogSize ?? 0} label="oportunidades analisadas" /></div>{multichannelActivationEnabled && studentApiEnabled ? <><button type="button" onClick={() => void continueOnWhatsApp()} disabled={activationBusy !== null} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#079272] px-6 text-[11px] font-semibold text-white shadow-[0_9px_22px_rgba(7,129,102,.16)] disabled:opacity-55">{activationBusy === "whatsapp" ? <LoaderCircle size={16} className="animate-spin" /> : <MessageCircle size={16} />}Receber oportunidades no WhatsApp</button><button type="button" onClick={continueOnWebsite} disabled={activationBusy !== null} className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#b9d6cb] px-6 text-[10px] font-semibold text-[#078166] disabled:opacity-55"><LogIn size={14} />Salvar meu perfil e continuar no site</button><button type="button" onClick={continueWithoutSaving} disabled={activationBusy !== null} className="mt-3 text-[9px] font-semibold text-[#69766f] underline decoration-[#bdc8c3] underline-offset-4">Continuar sem salvar</button><p className="mx-auto mt-2 max-w-md text-[8px] leading-4 text-[#8a948f]">Sem confirmar seu WhatsApp, este perfil fica apenas neste aparelho e pode ser perdido ao limpar o navegador.</p>{activationError && <p role="alert" className="mx-auto mt-3 max-w-md rounded-xl bg-[#fff0ed] px-3 py-2.5 text-[9px] font-medium text-[#a84d35]">{activationError}</p>}</> : <><button type="button" onClick={finish} className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#079272] px-6 text-[11px] font-semibold text-white shadow-[0_9px_22px_rgba(7,129,102,.16)]">Continuar no site <ChevronRight size={16} /></button>{studentApiEnabled && <button type="button" onClick={() => void continueOnWhatsApp()} className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#b9d6cb] px-6 text-[10px] font-semibold text-[#078166]">Continuar pelo WhatsApp</button>}</>}</motion.div>}
      </AnimatePresence></div>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

function ChoiceScreen<T extends string>({ kicker, title, subtitle, options, selected, onSelect }: { kicker: string; title: string; subtitle: string; options: readonly { value: T; title: string; icon?: string; description?: string }[]; selected: T | null; onSelect: (value: T) => void }) {
  return <div><span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">{kicker}</span><h2 className="mt-2 text-[clamp(1.8rem,4vw,2.6rem)] font-semibold tracking-[-.05em] text-[#17372b]">{title}</h2><p className="mt-2 text-[11px] leading-5 text-[#68766f]">{subtitle}</p><div className="mt-7 grid gap-2 sm:grid-cols-2">{options.map((option) => <motion.button type="button" onClick={() => onSelect(option.value)} whileTap={{ scale: .985 }} className={`relative flex min-h-[76px] items-center gap-3 rounded-[16px] border p-4 text-left transition hover:-translate-y-0.5 ${selected === option.value ? "border-[#079272] bg-[#eaf7f1]" : "border-[#dce4e0] bg-white hover:border-[#a9cdbf]"}`} key={option.value}><span className="text-xl">{option.icon}</span><span className="grid min-w-0 gap-1"><strong className="pr-5 text-[10px] leading-4 text-[#29493c]">{option.title}</strong>{option.description && <small className="text-[8px] leading-4 text-[#748079]">{option.description}</small>}</span>{selected === option.value && <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-[#079272] text-white"><Check size={12} /></span>}</motion.button>)}</div></div>;
}

function ResultMetric({ icon: Icon, value, label }: { icon: typeof Target; value: number; label: string }) {
  return <div className="flex min-h-28 flex-col items-start rounded-[17px] border border-[#dce4e0] bg-white p-4 text-left"><span className="grid size-8 place-items-center rounded-[10px] bg-[#eaf7f1] text-[#078166]"><Icon size={16} /></span><strong className="mt-3 text-xl text-[#17372b]">{value}</strong><small className="mt-1 text-[8px] leading-4 text-[#718078]">{label}</small></div>;
}

export function JourneyOnboardingProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuthentication();
  const router = useRouter();
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => setProfile(onboardingService.load()), []);
  useEffect(() => {
    if (!studentApiEnabled || !session || !profile) return;
    const syncKey = `seconecta:onboarding-sync:${session.studentId}`;
    const profileHash = JSON.stringify(profile);
    if (window.localStorage.getItem(syncKey) === profileHash) return;
    onboardingService.sync(profile).then(() => window.localStorage.setItem(syncKey, profileHash)).catch(() => undefined);
  }, [profile, session]);
  useEffect(() => {
    const handleAuthenticated = (rawEvent: Event) => {
      const event = rawEvent as CustomEvent<AuthenticationCompletedDetail>;
      const intent = event.detail?.intent;
      if (intent?.kind !== "persist_onboarding") return;
      const storedProfile = onboardingService.load();
      if (!storedProfile) {
        router.push(intent.returnTo);
        return;
      }
      // The existing session-aware effect performs the canonical sync once
      // and keeps the local profile available if Railway is temporarily down.
      setProfile(storedProfile);
      router.push(intent.returnTo);
    };
    window.addEventListener("seconecta:authenticated", handleAuthenticated);
    return () => window.removeEventListener("seconecta:authenticated", handleAuthenticated);
  }, [router]);
  const updateProfile = (next: OnboardingProfile) => { onboardingService.save(next); setProfile(next); };
  return <JourneyOnboardingContext.Provider value={{ profile, startOnboarding: () => setOpen(true), updateProfile }}>{children}<JourneyOnboarding open={open} profile={profile} onClose={() => setOpen(false)} onComplete={setProfile} /></JourneyOnboardingContext.Provider>;
}
