"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { OpportunityJourneyFlow } from "@/components/opportunity-journey-flow";
import { OpportunityParticipationConfirmation } from "@/components/opportunity-participation-confirmation";
import {
  ApplicationExperienceModal,
  ApprovalCelebration,
  type OpportunityExperienceScore,
} from "@/components/opportunity-status-effects";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { getOpportunityDetail, getOpportunityDetailBySlug } from "@/data/opportunity-details";
import {
  APPLICATION_CONFIRM_SUBMISSION_ID,
  APPLICATION_REQUIREMENTS_ID,
  APPLICATION_SUBMIT_ID,
  APPLICATION_UNDERSTAND_ID,
  createRecommendationFeedback,
  createRequirementChecklistId,
  markOfficialPageVisited,
  saveJourneyOpportunity,
} from "@/services/opportunity-journey-service";
import type { ApplicationResult, JourneyStage, OpportunityIntent, OpportunityJourney, OpportunityObjective, OpportunityPriority, RecommendationFeedback, RecommendationFeedbackScore } from "@/types/opportunity-journey";

const JOURNEYS_STORAGE_KEY = "seconecta:opportunity-journeys";
const FEEDBACK_STORAGE_KEY = "seconecta:recommendation-feedback";
const FEEDBACK_DISMISSALS_STORAGE_KEY = "seconecta:recommendation-feedback-dismissals";
const FEEDBACK_SESSION_KEY = "seconecta:recommendation-feedback-shown";
const EXPERIENCE_FEEDBACK_STORAGE_KEY = "seconecta:application-experience-feedback";
const FEEDBACK_DISMISSAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const SUBMITTED_APPLICATION_STAGES = new Set<JourneyStage>(["applied", "waitingForResult", "accepted", "participating", "rejected", "completed", "archived"]);

function opportunityIdFromPath(pathname: string) {
  const legacyMatch = pathname.match(/^\/explorar\/(\d+)$/);
  if (legacyMatch) return Number(legacyMatch[1]);
  const canonicalMatch = pathname.match(/^\/oportunidades\/([^/]+)$/);
  return canonicalMatch ? getOpportunityDetailBySlug(decodeURIComponent(canonicalMatch[1]))?.id : undefined;
}

function isOpportunityPath(pathname: string, opportunityId: number) {
  return opportunityIdFromPath(pathname) === opportunityId;
}

function applicationChecklistIds(opportunityId: number) {
  const opportunity = getOpportunityDetail(opportunityId);
  return [
    APPLICATION_UNDERSTAND_ID,
    APPLICATION_REQUIREMENTS_ID,
    ...(opportunity?.requirements.map((requirement) => createRequirementChecklistId(requirement.label)) ?? []),
    APPLICATION_SUBMIT_ID,
    APPLICATION_CONFIRM_SUBMISSION_ID,
  ];
}

type StoredJourney = Partial<OpportunityJourney> & {
  opportunityId: number;
  intent?: OpportunityIntent;
  stage?: JourneyStage;
  checklist?: { completedItemIds: string[]; updatedAt: string };
};

function migrateJourney(stored: StoredJourney): OpportunityJourney {
  const timestamp = stored.updatedAt ?? new Date().toISOString();
  const legacyStage = stored.stage;
  const objective = stored.objective
    ?? (legacyStage === "watching" || stored.intent === "follow"
      ? "following"
      : legacyStage === "participating" || legacyStage === "completed"
        ? "participating"
        : "applying");
  const storedApplicationResult = stored.applicationResult
    ?? (legacyStage === "accepted" || legacyStage === "participating" || legacyStage === "completed"
      ? "approved"
      : legacyStage === "rejected" ? "rejected" : "pending");
  const normalizedObjective = storedApplicationResult === "approved" || objective === "participating"
    ? "participating"
    : objective;
  const applicationResult = normalizedObjective === "participating" ? "approved" : storedApplicationResult;
  const submitted = normalizedObjective === "participating" || (legacyStage ? SUBMITTED_APPLICATION_STAGES.has(legacyStage) : false);
  const legacyCompletedIds = stored.applicationProgress?.completedItemIds ?? stored.checklist?.completedItemIds ?? [];
  const applicationCompletedIds = submitted
    ? Array.from(new Set([...applicationChecklistIds(stored.opportunityId), ...legacyCompletedIds]))
    : legacyCompletedIds;

  return {
    opportunityId: stored.opportunityId,
    userId: stored.userId ?? "local-student",
    modelId: stored.modelId ?? "application",
    objective: normalizedObjective,
    saved: true,
    priority: stored.priority ?? (normalizedObjective === "following" ? "low" : "high"),
    applicationResult,
    completed: stored.completed ?? legacyStage === "completed",
    archived: stored.archived ?? legacyStage === "archived",
    createdAt: stored.createdAt ?? timestamp,
    updatedAt: timestamp,
    officialPageVisitedAt: stored.officialPageVisitedAt ?? (submitted ? timestamp : undefined),
    acceptedAt: stored.acceptedAt ?? (legacyStage === "accepted" || legacyStage === "participating" || legacyStage === "completed" ? timestamp : undefined),
    applicationProgress: {
      completedItemIds: applicationCompletedIds,
      updatedAt: stored.applicationProgress?.updatedAt ?? stored.checklist?.updatedAt ?? timestamp,
    },
    workflowStage: stored.workflowStage,
  };
}

function readLocalCollection<T>(key: string): T[] {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) as T[] : [];
  } catch {
    return [];
  }
}

function readSessionCollection<T>(key: string): T[] {
  try {
    const stored = window.sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) as T[] : [];
  } catch {
    return [];
  }
}

export type JourneyOpportunityRef = { id: number; title: string; officialUrl?: string };

type OpportunityJourneyContextValue = {
  journeys: OpportunityJourney[];
  recommendationFeedback: RecommendationFeedback[];
  getJourney: (opportunityId: number) => OpportunityJourney | undefined;
  startJourney: (opportunity: JourneyOpportunityRef, intent?: OpportunityIntent) => void;
  participate: (opportunity: JourneyOpportunityRef) => void;
  followOpportunity: (opportunity: JourneyOpportunityRef) => void;
  visitOfficialPage: (opportunity: JourneyOpportunityRef) => void;
  updateJourneyObjective: (opportunityId: number, objective: OpportunityObjective) => void;
  updateApplicationResult: (opportunityId: number, result: ApplicationResult) => void;
  toggleJourneyChecklistItem: (opportunityId: number, itemId: string) => void;
  removeJourney: (opportunityId: number) => void;
  requestRecommendationFeedback: (opportunity: JourneyOpportunityRef) => void;
  dismissRecommendationFeedback: (opportunityId: number, remember?: boolean) => void;
  updateRecommendationFeedback: (opportunityId: number, score: RecommendationFeedbackScore) => void;
};

const OpportunityJourneyContext = createContext<OpportunityJourneyContextValue | null>(null);

function FeedbackPrompt({ opportunity, onSelect, onClose }: { opportunity: JourneyOpportunityRef | null; onSelect: (score: RecommendationFeedbackScore) => void; onClose: () => void }) {
  return <AnimatePresence>{opportunity && <motion.section className="journey-feedback-prompt" role="dialog" aria-label="Feedback sobre recomendação" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
    <button className="absolute right-3 top-3 border-0 bg-transparent p-1 text-[#7a8580]" type="button" onClick={onClose} aria-label="Fechar"><X size={14} /></button>
    <p>Ela combina com o que você procura?</p><span>Sua resposta melhora as próximas recomendações.</span>
    <div className="journey-feedback-actions"><button type="button" onClick={() => onSelect(1)}>Muito</button><button type="button" onClick={() => onSelect(0)}>Um pouco</button><button type="button" onClick={() => onSelect(-1)}>Não</button></div>
  </motion.section>}</AnimatePresence>;
}

export function OpportunityJourneyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, openAuthentication } = useAuthentication();
  const [journeys, setJourneys] = useState<OpportunityJourney[]>([]);
  const [recommendationFeedback, setRecommendationFeedback] = useState<RecommendationFeedback[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [activeOpportunity, setActiveOpportunity] = useState<JourneyOpportunityRef | null>(null);
  const [initialIntent, setInitialIntent] = useState<OpportunityIntent | null>(null);
  const [participationOpportunity, setParticipationOpportunity] = useState<JourneyOpportunityRef | null>(null);
  const [feedbackOpportunity, setFeedbackOpportunity] = useState<JourneyOpportunityRef | null>(null);
  const [experienceOpportunity, setExperienceOpportunity] = useState<JourneyOpportunityRef | null>(null);
  const [experienceSubmitted, setExperienceSubmitted] = useState(false);
  const [celebrationOpportunity, setCelebrationOpportunity] = useState<JourneyOpportunityRef | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const celebratedOpportunityPageRef = useRef<string | null>(null);

  useEffect(() => {
    setJourneys(readLocalCollection<StoredJourney>(JOURNEYS_STORAGE_KEY).map(migrateJourney));
    setRecommendationFeedback(readLocalCollection<RecommendationFeedback>(FEEDBACK_STORAGE_KEY));
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(JOURNEYS_STORAGE_KEY, JSON.stringify(journeys));
  }, [journeys, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(recommendationFeedback));
  }, [recommendationFeedback, storageReady]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!storageReady) return;
    const opportunityId = opportunityIdFromPath(pathname);
    if (!opportunityId) {
      celebratedOpportunityPageRef.current = null;
      return;
    }

    const journey = journeys.find((item) => item.opportunityId === opportunityId);
    if (journey?.applicationResult !== "approved") return;
    if (celebratedOpportunityPageRef.current === pathname) return;

    const opportunity = getOpportunityDetail(opportunityId);
    if (!opportunity) return;
    celebratedOpportunityPageRef.current = pathname;
    setCelebrationOpportunity({ id: opportunity.id, title: opportunity.title, officialUrl: opportunity.officialUrl });
  }, [journeys, pathname, storageReady]);

  useEffect(() => {
    if (!feedbackOpportunity) return;
    if (!isOpportunityPath(pathname, feedbackOpportunity.id)) setFeedbackOpportunity(null);
  }, [feedbackOpportunity, pathname]);

  useEffect(() => {
    if (!feedbackOpportunity) return;
    const timeout = window.setTimeout(() => setFeedbackOpportunity(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [feedbackOpportunity]);

  const saveOrUpdateJourney = (opportunity: JourneyOpportunityRef, intent: OpportunityIntent, priority: OpportunityPriority = intent === "follow" ? "low" : "high") => {
    setJourneys((current) => {
      const existing = current.find((item) => item.opportunityId === opportunity.id);
      if (!existing) return [...current, saveJourneyOpportunity(opportunity.id, intent, priority)];
      const timestamp = new Date().toISOString();
      return current.map((item) => item.opportunityId === opportunity.id ? {
        ...item,
        objective: intent === "follow" ? "following" : "applying",
        priority,
        archived: false,
        updatedAt: timestamp,
      } : item);
    });
  };

  const queueFeedback = useCallback((opportunity: JourneyOpportunityRef) => {
    if (!storageReady || recommendationFeedback.some((item) => item.opportunityId === opportunity.id)) return;
    const shownThisSession = readSessionCollection<number>(FEEDBACK_SESSION_KEY);
    if (shownThisSession.includes(opportunity.id)) return;

    const dismissals = readLocalCollection<{ opportunityId: number; until: number }>(FEEDBACK_DISMISSALS_STORAGE_KEY);
    if (dismissals.some((item) => item.opportunityId === opportunity.id && item.until > Date.now())) return;

    window.sessionStorage.setItem(FEEDBACK_SESSION_KEY, JSON.stringify([...shownThisSession, opportunity.id]));
    setFeedbackOpportunity(opportunity);
  }, [recommendationFeedback, storageReady]);

  const dismissFeedback = useCallback((opportunityId: number, remember = false) => {
    setFeedbackOpportunity((current) => current?.id === opportunityId ? null : current);
    if (!remember) return;
    const dismissals = readLocalCollection<{ opportunityId: number; until: number }>(FEEDBACK_DISMISSALS_STORAGE_KEY);
    const next = [
      ...dismissals.filter((item) => item.opportunityId !== opportunityId && item.until > Date.now()),
      { opportunityId, until: Date.now() + FEEDBACK_DISMISSAL_COOLDOWN_MS },
    ];
    window.localStorage.setItem(FEEDBACK_DISMISSALS_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const continueWithPersistence = (action: () => void) => {
    if (isAuthenticated) action();
    else openAuthentication("saveOpportunity", action);
  };

  const value = useMemo<OpportunityJourneyContextValue>(() => ({
    journeys,
    recommendationFeedback,
    getJourney: (opportunityId) => journeys.find((journey) => journey.opportunityId === opportunityId),
    startJourney: (opportunity, intent) => {
      if (journeys.some((journey) => journey.opportunityId === opportunity.id)) return;
      continueWithPersistence(() => {
        setInitialIntent(intent ?? null);
        setActiveOpportunity(opportunity);
      });
    },
    participate: (opportunity) => {
      continueWithPersistence(() => {
        setParticipationOpportunity(opportunity);
      });
    },
    followOpportunity: (opportunity) => {
      continueWithPersistence(() => {
        saveOrUpdateJourney(opportunity, "follow", "low");
        setToast("Adicionada à sua jornada para acompanhar.");
      });
    },
    visitOfficialPage: (opportunity) => {
      setJourneys((current) => current.map((journey) => journey.opportunityId === opportunity.id ? markOfficialPageVisited(journey) : journey));
    },
    updateJourneyObjective: (opportunityId, objective) => {
      const previousJourney = journeys.find((journey) => journey.opportunityId === opportunityId);
      if (!previousJourney || previousJourney.objective === objective) return;
      const timestamp = new Date().toISOString();
      const confirmsParticipation = objective === "participating";
      const leavesParticipation = previousJourney.objective === "participating" && !confirmsParticipation;
      setJourneys((current) => current.map((journey) => journey.opportunityId === opportunityId ? {
        ...journey,
        objective,
        priority: objective === "following" ? "low" : journey.priority === "low" ? "high" : journey.priority,
        applicationResult: confirmsParticipation ? "approved" : leavesParticipation ? "pending" : journey.applicationResult,
        acceptedAt: confirmsParticipation ? journey.acceptedAt ?? timestamp : leavesParticipation ? undefined : journey.acceptedAt,
        officialPageVisitedAt: confirmsParticipation ? journey.officialPageVisitedAt ?? timestamp : journey.officialPageVisitedAt,
        applicationProgress: confirmsParticipation
          ? { completedItemIds: applicationChecklistIds(opportunityId), updatedAt: timestamp }
          : leavesParticipation
            ? { completedItemIds: [], updatedAt: timestamp }
          : journey.applicationProgress,
        completed: leavesParticipation ? false : journey.completed,
        archived: false,
        updatedAt: timestamp,
      } : journey));
      const labels: Record<OpportunityObjective, string> = {
        following: "Só acompanhando",
        applying: "Quero me candidatar",
        participating: "Participando",
      };
      if (confirmsParticipation) {
        const opportunity = getOpportunityDetail(opportunityId);
        if (opportunity) {
          if (isOpportunityPath(pathname, opportunityId)) celebratedOpportunityPageRef.current = pathname;
          setCelebrationOpportunity({ id: opportunity.id, title: opportunity.title, officialUrl: opportunity.officialUrl });
        }
      } else if (leavesParticipation) {
        celebratedOpportunityPageRef.current = null;
        setCelebrationOpportunity((current) => current?.id === opportunityId ? null : current);
      }
      const feedback: Record<OpportunityObjective, string> = {
        following: "Agora você está acompanhando esta oportunidade.",
        applying: "Agora esta oportunidade faz parte da sua preparação.",
        participating: "Objetivo atualizado: você está participando.",
      };
      setToast(feedback[objective] ?? `Objetivo atualizado: ${labels[objective]}.`);
    },
    updateApplicationResult: (opportunityId, result) => {
      const previousJourney = journeys.find((journey) => journey.opportunityId === opportunityId);
      if (!previousJourney || previousJourney.applicationResult === result) return;
      const opportunity = getOpportunityDetail(opportunityId);
      const timestamp = new Date().toISOString();

      setJourneys((current) => current.map((journey) => journey.opportunityId === opportunityId ? {
        ...journey,
        objective: result === "approved" ? "participating" : result === "rejected" ? "following" : journey.objective === "participating" ? "applying" : journey.objective,
        priority: result === "rejected" ? "low" : journey.priority,
        applicationResult: result,
        acceptedAt: result === "approved" ? journey.acceptedAt ?? timestamp : undefined,
        updatedAt: timestamp,
      } : journey));
      const opportunityRef = opportunity
        ? { id: opportunity.id, title: opportunity.title, officialUrl: opportunity.officialUrl }
        : { id: opportunityId, title: "esta oportunidade" };
      if (result === "approved") {
        if (isOpportunityPath(pathname, opportunityId)) celebratedOpportunityPageRef.current = pathname;
        setCelebrationOpportunity(opportunityRef);
      }
      setToast(result === "approved" ? "Resultado registrado: aprovado!" : result === "rejected" ? "Não selecionado. Agora você está acompanhando esta oportunidade." : "Resultado redefinido como pendente.");
    },
    toggleJourneyChecklistItem: (opportunityId, itemId) => {
      const previousJourney = journeys.find((journey) => journey.opportunityId === opportunityId);
      const isSubmitting = itemId === APPLICATION_CONFIRM_SUBMISSION_ID
        && !previousJourney?.applicationProgress.completedItemIds.includes(itemId);
      setJourneys((current) => current.map((journey) => {
        if (journey.opportunityId !== opportunityId) return journey;
        const completedItemIds = journey.applicationProgress.completedItemIds;
        const isCompleted = completedItemIds.includes(itemId);
        const toggledItemIds = isCompleted
          ? completedItemIds.filter((completedId) => completedId !== itemId)
          : [...completedItemIds, itemId];
        const timestamp = new Date().toISOString();
        const nextCompletedItemIds = !isCompleted && itemId === APPLICATION_CONFIRM_SUBMISSION_ID
          ? applicationChecklistIds(opportunityId)
          : toggledItemIds;

        return {
          ...journey,
          objective: journey.applicationResult === "approved" || journey.objective === "participating" ? journey.objective : "applying",
          priority: journey.priority === "low" ? "high" : journey.priority,
          applicationResult: isCompleted && itemId === APPLICATION_CONFIRM_SUBMISSION_ID ? "pending" : journey.applicationResult,
          applicationProgress: { completedItemIds: nextCompletedItemIds, updatedAt: timestamp },
          updatedAt: timestamp,
        };
      }));
      if (isSubmitting) {
        const opportunity = getOpportunityDetail(opportunityId);
        if (opportunity) {
          setExperienceSubmitted(false);
          setExperienceOpportunity({ id: opportunity.id, title: opportunity.title, officialUrl: opportunity.officialUrl });
        }
        setToast("Candidatura enviada. Agora é só acompanhar o resultado.");
      } else {
        setToast("Progresso da candidatura atualizado.");
      }
    },
    removeJourney: (opportunityId) => {
      setJourneys((current) => current.filter((journey) => journey.opportunityId !== opportunityId));
      setToast("Removido da sua jornada.");
    },
    requestRecommendationFeedback: queueFeedback,
    dismissRecommendationFeedback: dismissFeedback,
    updateRecommendationFeedback: (opportunityId, score) => {
      setRecommendationFeedback((current) => [...current.filter((item) => item.opportunityId !== opportunityId), createRecommendationFeedback(opportunityId, score)]);
      setToast("Preferência atualizada. Suas próximas recomendações vão considerar isso.");
    },
  }), [dismissFeedback, isAuthenticated, journeys, pathname, recommendationFeedback, openAuthentication, queueFeedback]);

  const addJourneyFromFlow = (journey: OpportunityJourney) => {
    setJourneys((current) => current.some((item) => item.opportunityId === journey.opportunityId) ? current : [...current, journey]);
    setToast("Adicionada à sua jornada.");
  };

  const completeParticipationOnboarding = (objective: OpportunityObjective) => {
    const opportunity = participationOpportunity;
    if (!opportunity) return;
    const timestamp = new Date().toISOString();

    setJourneys((current) => {
      const existing = current.find((journey) => journey.opportunityId === opportunity.id);
      const base = existing ?? saveJourneyOpportunity(opportunity.id, objective === "following" ? "follow" : "apply", objective === "following" ? "low" : "high");
      const next: OpportunityJourney = {
        ...base,
        objective,
        priority: objective === "following" ? "low" : "high",
        applicationResult: objective === "participating" ? "approved" : base.applicationResult,
        acceptedAt: objective === "participating" ? base.acceptedAt ?? timestamp : base.acceptedAt,
        officialPageVisitedAt: objective === "participating" ? base.officialPageVisitedAt ?? timestamp : base.officialPageVisitedAt,
        applicationProgress: objective === "participating"
          ? { completedItemIds: applicationChecklistIds(opportunity.id), updatedAt: timestamp }
          : base.applicationProgress,
        archived: false,
        updatedAt: timestamp,
      };
      return [...current.filter((journey) => journey.opportunityId !== opportunity.id), next];
    });

    setParticipationOpportunity(null);
    const labels: Record<OpportunityObjective, string> = {
      following: "Só acompanhando",
      applying: "Quero me candidatar",
      participating: "Participando",
    };
    if (objective === "participating") {
      if (isOpportunityPath(pathname, opportunity.id)) celebratedOpportunityPageRef.current = pathname;
      setCelebrationOpportunity(opportunity);
    }
    setToast(`Objetivo definido: ${labels[objective]}.`);
  };

  const closeParticipation = () => {
    setParticipationOpportunity(null);
  };

  const recordFeedback = (score: RecommendationFeedbackScore) => {
    if (!feedbackOpportunity) return;
    setRecommendationFeedback((current) => [...current.filter((item) => item.opportunityId !== feedbackOpportunity.id), createRecommendationFeedback(feedbackOpportunity.id, score)]);
    setFeedbackOpportunity(null);
    setToast("Obrigado — vamos usar isso para melhorar suas recomendações.");
  };

  const recordExperienceFeedback = (score: OpportunityExperienceScore) => {
    if (!experienceOpportunity) return;
    const current = readLocalCollection<{ opportunityId: number; score: OpportunityExperienceScore; timestamp: string }>(EXPERIENCE_FEEDBACK_STORAGE_KEY);
    const feedback = {
      opportunityId: experienceOpportunity.id,
      score,
      timestamp: new Date().toISOString(),
    };
    window.localStorage.setItem(EXPERIENCE_FEEDBACK_STORAGE_KEY, JSON.stringify([
      ...current.filter((item) => item.opportunityId !== experienceOpportunity.id),
      feedback,
    ]));
    setExperienceSubmitted(true);
  };

  const closeExperienceFeedback = useCallback(() => {
    setExperienceOpportunity(null);
    setExperienceSubmitted(false);
  }, []);

  const closeCelebration = useCallback(() => setCelebrationOpportunity(null), []);

  return <OpportunityJourneyContext.Provider value={value}>
    {children}
    <OpportunityJourneyFlow opportunity={activeOpportunity} initialIntent={initialIntent} onClose={() => setActiveOpportunity(null)} onComplete={addJourneyFromFlow} />
    <OpportunityParticipationConfirmation opportunity={participationOpportunity} onClose={closeParticipation} onSelect={completeParticipationOnboarding} />
    <FeedbackPrompt opportunity={feedbackOpportunity} onClose={() => feedbackOpportunity && dismissFeedback(feedbackOpportunity.id, true)} onSelect={recordFeedback} />
    <ApplicationExperienceModal opportunity={experienceOpportunity} submitted={experienceSubmitted} onSubmit={recordExperienceFeedback} onClose={closeExperienceFeedback} />
    <ApprovalCelebration opportunity={celebrationOpportunity} onClose={closeCelebration} />
    <AnimatePresence>{toast && <motion.div className="journey-success-feedback" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><Check size={16} /> {toast}</motion.div>}</AnimatePresence>
  </OpportunityJourneyContext.Provider>;
}

export function useOpportunityJourney() {
  const context = useContext(OpportunityJourneyContext);
  if (!context) throw new Error("useOpportunityJourney must be used inside OpportunityJourneyProvider.");
  return context;
}
