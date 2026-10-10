"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookmarkCheck, LogIn, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { multichannelActivationEnabled, studentApiEnabled } from "@/services/feature-flags";
import { apiRequest } from "@/services/seconecta-browser-api";
import { getActivationContext, linkActivationSession, recordActivationEvent } from "@/services/student-activation-service";
import { createOpportunityJourney, type ApplicationResult, type OpportunityIntent, type OpportunityJourney, type OpportunityObjective, type OpportunityPriority, type RecommendationFeedback, type RecommendationFeedbackScore } from "@/types/opportunity-journey";
import type { StudentOpportunityRelationshipApi } from "@/types/seconecta-api";

const STORAGE_KEY = "seconecta:opportunity-journeys";
const FEEDBACK_KEY = "seconecta:recommendation-feedback";
export type JourneyOpportunityRef = { id: number; title: string; officialUrl?: string };

type OpportunityJourneyContextValue = {
  journeys: OpportunityJourney[];
  ready: boolean;
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

function readLocal<T>(key: string): T[] {
  try { return JSON.parse(window.localStorage.getItem(key) ?? "[]") as T[]; }
  catch { return []; }
}

function persistJourneys(journeys: OpportunityJourney[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}

function fromRelationship(item: StudentOpportunityRelationshipApi): OpportunityJourney {
  return {
    opportunityId: item.opportunityId,
    userId: item.studentId,
    modelId: item.modelId,
    objective: item.objective,
    saved: true,
    priority: item.priority,
    applicationResult: item.applicationResult,
    completed: item.completed,
    archived: item.archived,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    officialPageVisitedAt: item.officialPageVisitedAt ?? undefined,
    acceptedAt: item.acceptedAt ?? undefined,
    applicationProgress: item.applicationProgress,
    workflowStage: item.workflowStage ?? undefined,
    version: item.version,
  };
}

function FeedbackPrompt({ opportunity, onSelect, onClose }: { opportunity: JourneyOpportunityRef | null; onSelect: (score: RecommendationFeedbackScore) => void; onClose: () => void }) {
  return <AnimatePresence>{opportunity && <motion.section className="journey-feedback-prompt" role="dialog" aria-label="Feedback sobre recomendação" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
    <button className="absolute right-3 top-3 border-0 bg-transparent p-1 text-[#7a8580]" type="button" onClick={onClose} aria-label="Fechar"><X size={14} /></button>
    <p>Ela combina com o que você procura?</p><span>Sua resposta melhora as próximas recomendações.</span>
    <div className="journey-feedback-actions"><button type="button" onClick={() => onSelect(1)}>Muito</button><button type="button" onClick={() => onSelect(0)}>Um pouco</button><button type="button" onClick={() => onSelect(-1)}>Não</button></div>
  </motion.section>}</AnimatePresence>;
}

export function OpportunityJourneyProvider({ children }: { children: React.ReactNode }) {
  const { ready: authReady, session, openAuthentication } = useAuthentication();
  const [journeys, setJourneys] = useState<OpportunityJourney[]>([]);
  const [recommendationFeedback, setRecommendationFeedback] = useState<RecommendationFeedback[]>([]);
  const [feedbackOpportunity, setFeedbackOpportunity] = useState<JourneyOpportunityRef | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activationNudge, setActivationNudge] = useState(false);

  const dismissActivationNudge = useCallback(() => {
    const context = getActivationContext();
    window.localStorage.setItem(`seconecta:activation-nudge:${context.sessionId}`, "dismissed");
    setActivationNudge(false);
  }, []);

  const replaceRelationship = useCallback((relationship: StudentOpportunityRelationshipApi) => {
    const mapped = fromRelationship(relationship);
    setJourneys((current) => [...current.filter((item) => item.opportunityId !== mapped.opportunityId), mapped]);
  }, []);

  const hydrate = useCallback(async () => {
    if (!authReady) return;
    const local = readLocal<OpportunityJourney>(STORAGE_KEY).filter((item) => Number.isFinite(item.opportunityId));
    setRecommendationFeedback(readLocal<RecommendationFeedback>(FEEDBACK_KEY));
    if (!studentApiEnabled || !session) {
      setJourneys(local);
      setReady(true);
      return;
    }
    setReady(false);
    try {
      if (local.length) {
        const fingerprint = local.map((item) => item.opportunityId).sort((a, b) => a - b).join("-");
        const key = `seconecta:anonymous-import:${fingerprint}`;
        const importId = window.localStorage.getItem(key) ?? window.crypto.randomUUID();
        window.localStorage.setItem(key, importId);
        await apiRequest("students/me/opportunity-relationships/import", {
          method: "POST",
          body: JSON.stringify({ importId, relationships: local.map((item) => ({ opportunityId: item.opportunityId, modelId: item.modelId, objective: item.objective, priority: item.priority, applicationResult: item.applicationResult, completed: item.completed, officialPageVisitedAt: item.officialPageVisitedAt, completedItemIds: item.applicationProgress.completedItemIds, workflowStage: item.workflowStage })) }),
        });
        persistJourneys([]);
      }
      const result = await apiRequest<{ data: StudentOpportunityRelationshipApi[] }>("students/me/opportunity-relationships");
      setJourneys(result.data.filter((item) => item.saved && !item.archived).map(fromRelationship));
    } catch {
      setJourneys([]);
      setToast("Não foi possível sincronizar sua Jornada agora.");
    } finally { setReady(true); }
  }, [authReady, session]);

  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2800); return () => window.clearTimeout(timer); }, [toast]);

  const saveWithObjective = useCallback((opportunity: JourneyOpportunityRef, objective: OpportunityObjective, priority: OpportunityPriority) => {
    const existing = journeys.find((item) => item.opportunityId === opportunity.id);
    const optimistic = existing ? { ...existing, objective, priority, archived: false, updatedAt: new Date().toISOString() } : createOpportunityJourney({ opportunityId: opportunity.id, intent: objective === "following" ? "follow" : "apply", priority, userId: session?.studentId ?? "local-student" });
    setJourneys((current) => [...current.filter((item) => item.opportunityId !== opportunity.id), optimistic]);
    if (!studentApiEnabled || !session) {
      persistJourneys([...journeys.filter((item) => item.opportunityId !== opportunity.id), optimistic]);
      if (multichannelActivationEnabled) {
        const activation = getActivationContext();
        void recordActivationEvent("FIRST_OPPORTUNITY_SAVED", "first-opportunity-saved:v1", { opportunity_id: opportunity.id });
        if (!window.localStorage.getItem(`seconecta:activation-nudge:${activation.sessionId}`)) {
          setActivationNudge(true);
        }
      }
      return;
    }
    if (multichannelActivationEnabled) {
      void recordActivationEvent("FIRST_OPPORTUNITY_SAVED", "first-opportunity-saved:v1", { opportunity_id: opportunity.id })
        .then(linkActivationSession);
    }
    const idempotencyKey = window.crypto.randomUUID();
    apiRequest<StudentOpportunityRelationshipApi>(`students/me/opportunity-relationships/${opportunity.id}`, { method: "PUT", body: JSON.stringify({ modelId: optimistic.modelId, objective, priority, sourceChannel: "website", expectedVersion: existing?.version, idempotencyKey }) })
      .then(replaceRelationship)
      .catch(() => { setToast("A Jornada mudou em outro dispositivo. Atualizamos os dados."); void hydrate(); });
  }, [hydrate, journeys, replaceRelationship, session]);

  const patchRelationship = useCallback((opportunityId: number, patch: Record<string, unknown>, optimistic: (journey: OpportunityJourney) => OpportunityJourney) => {
    const existing = journeys.find((item) => item.opportunityId === opportunityId);
    if (!existing) return;
    setJourneys((current) => current.map((item) => item.opportunityId === opportunityId ? optimistic(item) : item));
    if (!studentApiEnabled || !session) {
      persistJourneys(journeys.map((item) => item.opportunityId === opportunityId ? optimistic(item) : item));
      return;
    }
    apiRequest<StudentOpportunityRelationshipApi>(`students/me/opportunity-relationships/${opportunityId}`, { method: "PATCH", body: JSON.stringify({ ...patch, sourceChannel: "website", expectedVersion: existing.version, idempotencyKey: window.crypto.randomUUID() }) })
      .then(replaceRelationship)
      .catch(() => { setToast("Não foi possível salvar essa alteração."); void hydrate(); });
  }, [hydrate, journeys, replaceRelationship, session]);

  const updateChecklist = useCallback((opportunityId: number, completedItemIds: string[]) => {
    const existing = journeys.find((item) => item.opportunityId === opportunityId);
    if (!existing) return;
    const timestamp = new Date().toISOString();
    setJourneys((current) => current.map((item) => item.opportunityId === opportunityId ? { ...item, applicationProgress: { completedItemIds, updatedAt: timestamp }, updatedAt: timestamp } : item));
    if (!studentApiEnabled || !session) {
      persistJourneys(journeys.map((item) => item.opportunityId === opportunityId ? { ...item, applicationProgress: { completedItemIds, updatedAt: timestamp }, updatedAt: timestamp } : item));
      return;
    }
    apiRequest<StudentOpportunityRelationshipApi>(`students/me/opportunity-relationships/${opportunityId}/checklist`, { method: "PATCH", body: JSON.stringify({ completedItemIds, sourceChannel: "website", expectedVersion: existing.version, idempotencyKey: window.crypto.randomUUID() }) })
      .then(replaceRelationship)
      .catch(() => { setToast("Não foi possível atualizar o checklist."); void hydrate(); });
  }, [hydrate, journeys, replaceRelationship, session]);

  const value = useMemo<OpportunityJourneyContextValue>(() => ({
    journeys,
    ready,
    recommendationFeedback,
    getJourney: (opportunityId) => journeys.find((item) => item.opportunityId === opportunityId),
    startJourney: (opportunity, intent = "apply") => saveWithObjective(opportunity, intent === "follow" ? "following" : "applying", intent === "follow" ? "low" : "high"),
    participate: (opportunity) => { saveWithObjective(opportunity, "applying", "high"); setToast("Adicionada à sua preparação."); },
    followOpportunity: (opportunity) => { saveWithObjective(opportunity, "following", "low"); setToast("Adicionada à sua Jornada para acompanhar."); },
    visitOfficialPage: (opportunity) => {
      const existing = journeys.find((item) => item.opportunityId === opportunity.id);
      if (!existing || !studentApiEnabled || !session) return;
      apiRequest<StudentOpportunityRelationshipApi>(`students/me/opportunity-relationships/${opportunity.id}/official-visit`, { method: "POST", body: JSON.stringify({ sourceChannel: "website", expectedVersion: existing.version, idempotencyKey: window.crypto.randomUUID() }) }).then(replaceRelationship).catch(() => undefined);
    },
    updateJourneyObjective: (opportunityId, objective) => patchRelationship(opportunityId, { objective, priority: objective === "following" ? "low" : "high" }, (journey) => ({ ...journey, objective, priority: objective === "following" ? "low" : "high", updatedAt: new Date().toISOString() })),
    updateApplicationResult: (opportunityId, applicationResult) => patchRelationship(opportunityId, { applicationResult }, (journey) => ({ ...journey, applicationResult, objective: applicationResult === "approved" ? "participating" : applicationResult === "rejected" ? "following" : journey.objective, updatedAt: new Date().toISOString() })),
    toggleJourneyChecklistItem: (opportunityId, itemId) => {
      const journey = journeys.find((item) => item.opportunityId === opportunityId);
      if (!journey) return;
      const current = journey.applicationProgress.completedItemIds;
      updateChecklist(opportunityId, current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]);
    },
    removeJourney: (opportunityId) => {
      const existing = journeys.find((item) => item.opportunityId === opportunityId);
      setJourneys((current) => current.filter((item) => item.opportunityId !== opportunityId));
      if (!studentApiEnabled || !session) { persistJourneys(journeys.filter((item) => item.opportunityId !== opportunityId)); return; }
      const params = new URLSearchParams({ sourceChannel: "website", idempotencyKey: window.crypto.randomUUID() });
      if (existing?.version != null) params.set("expectedVersion", String(existing.version));
      apiRequest(`students/me/opportunity-relationships/${opportunityId}?${params}`, { method: "DELETE" }).catch(() => void hydrate());
    },
    requestRecommendationFeedback: (opportunity) => { if (session && !recommendationFeedback.some((item) => item.opportunityId === opportunity.id)) setFeedbackOpportunity(opportunity); },
    dismissRecommendationFeedback: (opportunityId) => setFeedbackOpportunity((current) => current?.id === opportunityId ? null : current),
    updateRecommendationFeedback: (opportunityId, feedbackScore) => {
      const feedback = { opportunityId, userId: session?.studentId ?? "local-student", feedbackScore, timestamp: new Date().toISOString() };
      setRecommendationFeedback((current) => [...current.filter((item) => item.opportunityId !== opportunityId), feedback]);
      window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify([...recommendationFeedback.filter((item) => item.opportunityId !== opportunityId), feedback]));
      setFeedbackOpportunity(null);
      if (session) void apiRequest(`students/me/opportunity-relationships/${opportunityId}/feedback`, { method: "POST", body: JSON.stringify({ feedbackScore, surface: "website", sourceChannel: "website", idempotencyKey: window.crypto.randomUUID() }) }).catch(() => undefined);
    },
  }), [hydrate, journeys, patchRelationship, ready, recommendationFeedback, replaceRelationship, saveWithObjective, session, updateChecklist]);

  return <OpportunityJourneyContext.Provider value={value}>
    {children}
    <FeedbackPrompt opportunity={feedbackOpportunity} onClose={() => setFeedbackOpportunity(null)} onSelect={(score) => feedbackOpportunity && value.updateRecommendationFeedback(feedbackOpportunity.id, score)} />
    <AnimatePresence>{toast && <motion.div className="fixed bottom-5 left-1/2 z-[1400] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#173b30] px-5 py-3 text-[9px] font-semibold text-white shadow-xl" role="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><BookmarkCheck size={15} />{toast}</motion.div>}</AnimatePresence>
    <AnimatePresence>{activationNudge && !session && <motion.aside className="fixed bottom-5 left-1/2 z-[1450] w-[min(430px,calc(100%-28px))] -translate-x-1/2 rounded-[20px] border border-[#cfe0d9] bg-white p-4 shadow-[0_18px_55px_rgba(19,52,41,.2)]" role="dialog" aria-label="Salvar sua Jornada" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}><button type="button" onClick={dismissActivationNudge} className="absolute right-3 top-3 grid size-7 place-items-center rounded-full text-[#75817b] hover:bg-[#eef3f0]" aria-label="Agora não"><X size={14} /></button><div className="pr-8"><strong className="text-[12px] text-[#17372b]">Quer levar esta oportunidade com você?</strong><p className="mt-1 text-[9px] leading-4 text-[#69766f]">Confirme seu WhatsApp para manter seu perfil e sua Jornada mesmo ao trocar de aparelho.</p></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => { dismissActivationNudge(); void recordActivationEvent("WEBSITE_AUTH_SELECTED", "website-auth-selected-after-save:v1"); openAuthentication({ kind: "persist_onboarding", returnTo: "/explorar" }); }} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-4 text-[9px] font-semibold text-white"><LogIn size={13} />Salvar com meu WhatsApp</button><button type="button" onClick={dismissActivationNudge} className="min-h-10 rounded-full px-3 text-[9px] font-semibold text-[#65736c]">Agora não</button></div></motion.aside>}</AnimatePresence>
    {!ready && <span className="sr-only" role="status">Sincronizando Jornada</span>}
  </OpportunityJourneyContext.Provider>;
}

export function useOpportunityJourney() {
  const context = useContext(OpportunityJourneyContext);
  if (!context) throw new Error("useOpportunityJourney must be used inside OpportunityJourneyProvider.");
  return context;
}
