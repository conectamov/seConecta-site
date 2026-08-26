"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Compass, Flame, Mail, Map, MessageCircle, Monitor, Sparkles, Target, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { educationOptions, getOnboardingQuestionSteps, gradeOptions, type OnboardingAnswers, type OnboardingStepConfig } from "@/data/onboarding-flow";
import { getOnboardingRecommendationSummary, type OnboardingRecommendationSummary } from "@/services/onboarding-recommendation-service";
import { onboardingService } from "@/services/onboarding-service";
import type { EducationLevel, NotificationPreference, OnboardingActivity, OnboardingGoal, OnboardingProfile, OnboardingSubject, SchoolType } from "@/types/onboarding";
import "./journey-onboarding.css";

type JourneyOnboardingContextValue = {
  profile: OnboardingProfile | null;
  startOnboarding: () => void;
  updateProfile: (profile: OnboardingProfile) => void;
};

type OnboardingPhase = "questions" | "loading" | "results" | "notifications";

const emptyAnswers: OnboardingAnswers = {
  educationLevel: null,
  current_grade: null,
  subjects: [],
  activities: [],
  goals: [],
  experience: {},
  school_type: null,
};

const notificationOptions: { value: NotificationPreference; icon: typeof MessageCircle; title: string; copy: string; recommended?: boolean }[] = [
  { value: "whatsapp", icon: MessageCircle, title: "WhatsApp", copy: "Receba recomendações personalizadas, lembretes de prazo e novidades importantes.", recommended: true },
  { value: "site", icon: Monitor, title: "Apenas pelo site", copy: "Explore oportunidades sempre que quiser." },
  { value: "email", icon: Mail, title: "E-mail", copy: "Receba um resumo semanal." },
];

const loadingItems = ["Encontrando oportunidades", "Selecionando programas", "Preparando recomendações", "Quase pronto"];

export const JourneyOnboardingContext = createContext<JourneyOnboardingContextValue | null>(null);

function answersFromProfile(profile: OnboardingProfile | null): OnboardingAnswers {
  if (!profile?.onboardingVersion) return emptyAnswers;
  return {
    educationLevel: profile.educationLevel,
    current_grade: profile.current_grade ?? null,
    subjects: profile.subjects ?? [],
    activities: profile.activities ?? [],
    goals: profile.goals ?? [],
    experience: profile.experience ?? {},
    school_type: profile.school_type ?? null,
  };
}

export function JourneyOnboarding({ open, onClose, onComplete }: { open: boolean; onClose: () => void; onComplete: (profile: OnboardingProfile) => void }) {
  const router = useRouter();
  const { isAuthenticated, openAuthentication } = useAuthentication();
  const [answers, setAnswers] = useState<OnboardingAnswers>(emptyAnswers);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [phase, setPhase] = useState<OnboardingPhase>("questions");
  const [loadingStage, setLoadingStage] = useState(0);
  const [results, setResults] = useState<OnboardingRecommendationSummary | null>(null);
  const [notificationPreference, setNotificationPreference] = useState<NotificationPreference | null>(null);
  const timers = useRef<number[]>([]);
  const steps = useMemo(() => getOnboardingQuestionSteps(answers), [answers]);
  const currentStep = steps[Math.min(questionIndex, steps.length - 1)];

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => {
    if (!open) return;
    const stored = onboardingService.load();
    setAnswers(answersFromProfile(stored));
    setNotificationPreference(stored?.notification_preference ?? null);
    setQuestionIndex(0);
    setPhase("questions");
    setLoadingStage(0);
    setResults(null);
    clearTimers();
  }, [clearTimers, open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const schedule = (callback: () => void, delay = 220) => {
    timers.current.push(window.setTimeout(callback, delay));
  };

  const openExistingAccount = () => {
    onClose();
    openAuthentication("journey");
  };

  const beginPersonalization = async (completedAnswers: OnboardingAnswers) => {
    clearTimers();
    setAnswers(completedAnswers);
    setPhase("loading");
    setLoadingStage(0);
    const provisionalProfile = onboardingService.createProfile(completedAnswers, notificationPreference ?? "site");
    const summaryPromise = getOnboardingRecommendationSummary(provisionalProfile);
    [420, 980, 1560, 2140].forEach((delay, index) => {
      timers.current.push(window.setTimeout(() => setLoadingStage(index + 1), delay));
    });
    const [summary] = await Promise.all([
      summaryPromise,
      new Promise((resolve) => {
        timers.current.push(window.setTimeout(resolve, 2700));
      }),
    ]);
    setResults(summary);
    setPhase("results");
  };

  const advance = (nextAnswers = answers) => {
    if (questionIndex >= steps.length - 1) {
      void beginPersonalization(nextAnswers);
      return;
    }
    setQuestionIndex((current) => current + 1);
  };

  const goBack = () => {
    if (phase === "notifications") {
      setPhase("results");
      return;
    }
    if (phase === "results") {
      setPhase("questions");
      setQuestionIndex(Math.max(0, steps.length - 1));
      return;
    }
    setQuestionIndex((current) => Math.max(0, current - 1));
  };

  const updateMulti = (field: "subjects" | "activities" | "goals", value: string, max: number) => {
    setAnswers((current) => {
      const values = current[field] as string[];
      const next = values.includes(value) ? values.filter((item) => item !== value) : values.length < max ? [...values, value] : values;
      return { ...current, [field]: next };
    });
  };

  const selectGrade = (educationLevel: EducationLevel, grade?: string) => {
    const directGrade = grade ?? (educationLevel === "Universidade" ? "Universidade" : educationLevel === "Outro" ? "Outro" : null);
    const next = { ...answers, educationLevel, current_grade: directGrade };
    setAnswers(next);
    if (directGrade) schedule(() => advance(next));
  };

  const selectSingle = (step: OnboardingStepConfig, value: string) => {
    if (step.backendField === "school_type") {
      const next = { ...answers, school_type: value as SchoolType };
      setAnswers(next);
      schedule(() => advance(next));
      return;
    }
    if (step.backendField.startsWith("experience.")) {
      const area = step.backendField.split(".")[1] as keyof OnboardingAnswers["experience"];
      const next = { ...answers, experience: { ...answers.experience, [area]: value } };
      setAnswers(next);
      schedule(() => advance(next));
    }
  };

  const selectedValues = (step: OnboardingStepConfig): string[] => {
    if (step.backendField === "subjects") return answers.subjects;
    if (step.backendField === "activities") return answers.activities;
    if (step.backendField === "goals") return answers.goals;
    if (step.backendField === "school_type") return answers.school_type ? [answers.school_type] : [];
    if (step.backendField.startsWith("experience.")) {
      const area = step.backendField.split(".")[1] as keyof OnboardingAnswers["experience"];
      return answers.experience[area] ? [answers.experience[area]!] : [];
    }
    return [];
  };

  const canContinue = currentStep?.type === "multi-select"
    ? selectedValues(currentStep).length >= (currentStep.min ?? 1)
    : currentStep?.type === "grade"
      ? Boolean(answers.current_grade)
      : selectedValues(currentStep).length > 0;

  const progress = phase === "questions"
    ? ((questionIndex + 1) / (steps.length + 2)) * 100
    : phase === "loading"
      ? (steps.length / (steps.length + 2)) * 100
      : phase === "results"
        ? ((steps.length + 1) / (steps.length + 2)) * 100
        : 100;

  const finish = () => {
    if (!notificationPreference) return;
    const profile = onboardingService.createProfile(answers, notificationPreference);
    onboardingService.save(profile);
    onComplete(profile);
    onClose();
    router.push("/jornada");
  };

  return <AnimatePresence>{open && <motion.div className="journey-onboarding-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <motion.section layout className="journey-onboarding" role="dialog" aria-modal="true" aria-label="Começar minha jornada" initial={{ opacity: 0, y: 20, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .99 }} transition={{ layout: { duration: .24, ease: "easeOut" }, opacity: { duration: .2 }, y: { duration: .24 }, scale: { duration: .24 } }}>
      <header className="journey-onboarding-head">
        <span className="journey-brand"><b>se</b>Conecta<i /></span>
        <button className="journey-back" type="button" onClick={goBack} disabled={(phase === "questions" && questionIndex === 0) || phase === "loading"} aria-label="Voltar"><ChevronLeft size={18} /><span>Voltar</span></button>
        <button className="journey-close" type="button" onClick={onClose} aria-label="Fechar onboarding"><X size={19} /></button>
      </header>
      <div className="journey-progress" aria-label="Progresso do onboarding"><motion.i initial={false} animate={{ width: `${progress}%` }} transition={{ duration: .35, ease: "easeOut" }} /></div>

      <div className="journey-onboarding-content">
        <AnimatePresence mode="wait" initial={false}>
          {phase === "questions" && currentStep && <motion.div className={`journey-screen ${currentStep.type === "grade" ? "journey-screen--grade" : ""}`} key={currentStep.id} initial={{ opacity: 0, x: 22 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .2 }}>
            <span className="journey-kicker">Personalizando sua jornada</span>
            <h2>{currentStep.title}</h2>
            {currentStep.subtitle && <p className="journey-subtitle">{currentStep.subtitle}</p>}
            {currentStep.type === "grade"
              ? <GradeStep answers={answers} onSelect={selectGrade} />
              : <ChoiceStep
                step={currentStep}
                selected={selectedValues(currentStep)}
                onSelect={(value) => currentStep.type === "multi-select"
                  ? updateMulti(currentStep.backendField as "subjects" | "activities" | "goals", value, currentStep.max ?? Number.POSITIVE_INFINITY)
                  : selectSingle(currentStep, value)}
              />}
            {currentStep.type === "multi-select" && <div className="journey-multi-footer"><span>{selectedValues(currentStep).length} de {currentStep.max} selecionados</span><button type="button" className="journey-next" disabled={!canContinue} onClick={() => advance()}>Continuar <ChevronRight size={17} /></button></div>}
            {!isAuthenticated && questionIndex === 0 && <button type="button" className="journey-existing-account" onClick={openExistingAccount}>Já tenho conta</button>}
          </motion.div>}

          {phase === "loading" && <motion.div className="journey-loading-screen" key="loading" role="status" aria-live="polite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.span className="journey-loading-orbit" animate={{ rotate: 360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}><Sparkles size={24} /></motion.span>
            <span className="journey-kicker">Criando sua seleção</span><h2>Analisando seu perfil...</h2><p>Estamos conectando seus interesses aos melhores próximos passos.</p>
            <div className="journey-loading-list">{loadingItems.map((item, index) => <motion.div className={loadingStage > index ? "is-complete" : loadingStage === index ? "is-active" : ""} animate={loadingStage === index ? { opacity: [0.55, 1, 0.55] } : undefined} transition={{ repeat: Infinity, duration: 1.1 }} key={item}><span>{loadingStage > index ? <Check size={13} /> : index + 1}</span><strong>{item}</strong></motion.div>)}</div>
          </motion.div>}

          {phase === "results" && <motion.div className="journey-results-screen" key="results" initial={{ opacity: 0, scale: .985 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -18 }}>
            <div className="journey-success-illustration" aria-hidden="true"><i /><i /><span><Check size={31} /></span><b><Sparkles size={15} /></b></div>
            <span className="journey-kicker">Sua seleção está pronta</span><h2>Encontramos oportunidades para você!</h2><p>Com base no seu perfil, já preparamos uma seleção personalizada.</p>
            <div className="journey-result-grid">
              <ResultMetric icon={Target} value={results?.compatibleOpportunities ?? 0} label="oportunidades compatíveis" />
              <ResultMetric icon={Compass} value={results?.recommendedPaths ?? 0} label="trilhas recomendadas" />
              <ResultMetric icon={Flame} value={results?.openOpportunities ?? 0} label="com inscrições abertas" />
              <ResultMetric icon={Map} value={results?.connectedGoals ?? answers.goals.length} label="objetivos conectados" />
            </div>
            <button type="button" className="journey-next" onClick={() => setPhase("notifications")}>Continuar <ChevronRight size={17} /></button>
          </motion.div>}

          {phase === "notifications" && <motion.div className="journey-screen" key="notifications" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
            <span className="journey-kicker">Último ajuste</span><h2>Como você prefere acompanhar sua jornada?</h2><p className="journey-subtitle">Você poderá alterar essa preferência quando quiser.</p>
            <div className="journey-channel-list">{notificationOptions.map(({ value, icon: Icon, title, copy, recommended }) => <button type="button" className={notificationPreference === value ? "is-selected" : ""} onClick={() => setNotificationPreference(value)} key={value}><span className="journey-channel-icon"><Icon size={20} /></span><span><strong>{title}{recommended && <em>Recomendado</em>}</strong><small>{copy}</small></span><Check size={18} /></button>)}</div>
            <button type="button" className="journey-next" disabled={!notificationPreference} onClick={finish}>Finalizar <ChevronRight size={17} /></button>
          </motion.div>}
        </AnimatePresence>
      </div>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

function GradeStep({ answers, onSelect }: { answers: OnboardingAnswers; onSelect: (level: EducationLevel, grade?: string) => void }) {
  const gradeChoices = answers.educationLevel === "Ensino Fundamental II" || answers.educationLevel === "Ensino Médio" ? gradeOptions[answers.educationLevel] : [];
  return <div>
    <div className="journey-option-grid journey-option-grid--education">{educationOptions.map((option) => <button type="button" className={answers.educationLevel === option.value ? "is-selected" : ""} onClick={() => onSelect(option.value)} key={option.value}><span>{option.icon}</span><strong>{option.title}</strong><Check size={17} /></button>)}</div>
    <AnimatePresence>{gradeChoices.length > 0 && <motion.div className="journey-grade-choices" initial={{ opacity: 0, height: 0, y: -5 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0 }}><span>Agora escolha a série</span><div>{gradeChoices.map((grade) => <button type="button" className={answers.current_grade === grade.value ? "is-selected" : ""} onClick={() => onSelect(answers.educationLevel!, grade.value)} key={grade.value}>{grade.title}{answers.current_grade === grade.value && <Check size={14} />}</button>)}</div></motion.div>}</AnimatePresence>
  </div>;
}

function ChoiceStep({ step, selected, onSelect }: { step: OnboardingStepConfig; selected: string[]; onSelect: (value: string) => void }) {
  const atLimit = step.type === "multi-select" && selected.length >= (step.max ?? Number.POSITIVE_INFINITY);
  return <div className={`journey-choice-grid ${step.type === "multi-select" ? "journey-choice-grid--multi" : "journey-choice-grid--single"}`}>{step.options.map((option) => {
    const isSelected = selected.includes(option.value);
    return <motion.button type="button" className={isSelected ? "is-selected" : ""} onClick={() => onSelect(option.value)} disabled={atLimit && !isSelected} whileTap={{ scale: .98 }} key={option.value}><span className="journey-choice-icon">{option.icon ?? "→"}</span><span className="journey-choice-copy"><strong>{option.title}</strong>{option.description && <small>{option.description}</small>}</span>{isSelected && <span className="journey-choice-check"><Check size={13} /></span>}</motion.button>;
  })}</div>;
}

function ResultMetric({ icon: Icon, value, label }: { icon: typeof Target; value: number; label: string }) {
  return <div><span><Icon size={17} /></span><strong>{value}</strong><small>{label}</small></div>;
}

export function JourneyOnboardingProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => setProfile(onboardingService.load()), []);

  const updateProfile = (nextProfile: OnboardingProfile) => {
    onboardingService.save(nextProfile);
    setProfile(nextProfile);
  };

  return <JourneyOnboardingContext.Provider value={{ profile, startOnboarding: () => setIsOpen(true), updateProfile }}>
    {children}
    <JourneyOnboarding open={isOpen} onClose={() => setIsOpen(false)} onComplete={setProfile} />
  </JourneyOnboardingContext.Provider>;
}
