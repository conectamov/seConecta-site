"use client";

import { ArrowUpRight, BookOpen, BrainCircuit, MessageCircle, Users } from "lucide-react";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { ComingSoon } from "@/components/coming-soon";
import type { OpportunityJourney } from "@/types/opportunity-journey";

export type OpportunityDecisionContext = {
  opportunity: unknown;
  onboardingProfile: unknown;
  recommendationReasoning: unknown;
  savedOpportunities: unknown;
  journeyState: OpportunityJourney | null;
};

export type OpportunityHelpMode = "deciding" | "applying" | "waiting" | "essay" | "olympiad";

type HelpSection = "guide" | "community";

type DecisionHelpProps = {
  context: OpportunityDecisionContext;
  mode: OpportunityHelpMode;
  onAsk: (question: string, context: OpportunityDecisionContext) => void;
  onOpenSection: (section: HelpSection) => void;
};

type ModeCopy = {
  title: string;
  eyebrow: string;
  aiTitle: string;
  aiDescription: string;
  aiPrompt: string;
  guideTitle: string;
  guideDescription: string;
};

const modeCopy: Record<OpportunityHelpMode, ModeCopy> = {
  deciding: {
    title: "Precisa de ajuda para avançar?",
    eyebrow: "Próximas ações",
    aiTitle: "Perguntar à IA",
    aiDescription: "Receba respostas sobre requisitos, prazos e candidatura.",
    aiPrompt: "Ajude-me a entender se esta oportunidade faz sentido para mim e qual deveria ser meu próximo passo.",
    guideTitle: "Guia e recursos",
    guideDescription: "Abra modelos, orientações e materiais recomendados.",
  },
  applying: {
    title: "Precisa de ajuda com sua candidatura?",
    eyebrow: "Sua preparação",
    aiTitle: "Revisar meu próximo passo",
    aiDescription: "Use seu contexto e progresso para decidir o que fazer agora.",
    aiPrompt: "Revise o estágio atual da minha candidatura e me diga qual é o próximo passo mais importante.",
    guideTitle: "Abrir guia de preparação",
    guideDescription: "Veja modelos, exemplos e materiais para concluir sua candidatura.",
  },
  waiting: {
    title: "Precisa de ajuda enquanto aguarda?",
    eyebrow: "Acompanhamento",
    aiTitle: "Entender o que acontece agora",
    aiDescription: "Revise datas, próximos eventos e o que vale acompanhar.",
    aiPrompt: "Já enviei minha candidatura. O que devo acompanhar enquanto aguardo o resultado?",
    guideTitle: "Revisar processo seletivo",
    guideDescription: "Consulte cronograma, seleção e experiências anteriores.",
  },
  essay: {
    title: "Precisa de ajuda com seu texto?",
    eyebrow: "Texto em andamento",
    aiTitle: "Revisar com a IA",
    aiDescription: "Receba orientação contextual para clareza, estrutura e narrativa.",
    aiPrompt: "Ajude-me a revisar a estrutura do meu texto para esta oportunidade.",
    guideTitle: "Ver exemplos e modelos",
    guideDescription: "Use estruturas aceitas como referência, sem copiar respostas.",
  },
  olympiad: {
    title: "Precisa de ajuda para se preparar?",
    eyebrow: "Preparação",
    aiTitle: "Montar plano de estudo",
    aiDescription: "Transforme seu tempo disponível em um plano realista.",
    aiPrompt: "Monte um plano de preparação para esta olimpíada usando minha disponibilidade semanal.",
    guideTitle: "Abrir recursos de estudo",
    guideDescription: "Encontre provas, roteiros e materiais recomendados.",
  },
};

export function DecisionHelp({ context, mode, onAsk, onOpenSection }: DecisionHelpProps) {
  const { isAuthenticated, openAuthentication } = useAuthentication();
  const copy = modeCopy[mode];

  const ask = () => {
    const continueQuestion = () => onAsk(copy.aiPrompt, context);
    if (isAuthenticated) {
      continueQuestion();
    } else {
      openAuthentication("aiMemory", continueQuestion);
    }
  };

  const cards = [
    { id: "ai", icon: BrainCircuit, title: copy.aiTitle, description: copy.aiDescription, action: ask },
    {
      id: "community",
      icon: MessageCircle,
      title: mode === "applying" ? "Perguntar à comunidade" : "Comunidade",
      description: mode === "applying"
        ? "Veja dúvidas e experiências de quem passou por esta candidatura."
        : "Veja perguntas, experiências e discussões desta oportunidade.",
      action: () => onOpenSection("community"),
    },
    { id: "guide", icon: BookOpen, title: copy.guideTitle, description: copy.guideDescription, action: () => onOpenSection("guide") },
    {
      id: "people",
      icon: Users,
      title: mode === "applying" ? "Falar com estudantes aprovados" : "Ver estudantes aprovados",
      description: "Conheça quem concluiu esta oportunidade e pode compartilhar uma experiência real.",
      action: () => onOpenSection("community"),
    },
  ];

  return (
    <section className="border-t border-[#dfe5e1] bg-white py-14 md:py-16" aria-labelledby="decision-help-title">
      <div className="mx-auto w-[min(1060px,calc(100%-48px))]">
        <header className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#078166]">{copy.eyebrow}</span>
          <h2 id="decision-help-title" className="mt-2 text-[clamp(1.7rem,3vw,2.25rem)] font-semibold tracking-[-.045em] text-[#1c372c]">
            {copy.title}
          </h2>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ id, icon: Icon, title, description, action }) => {
            const content = (
              <>
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-[13px] bg-[#eaf7f2] text-[#078166]">
                    <Icon size={18} />
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="text-[#94a09a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#078166]"
                  />
                </div>
                <h3 className="mt-5 text-[13px] font-semibold leading-5 text-[#29493c]">{title}</h3>
                <p className="mt-2 text-[11px] leading-5 text-[#748079]">{description}</p>
              </>
            );
            const className = "group min-h-44 rounded-[18px] border border-[#dbe3df] bg-[#fafbf9] p-5 text-left no-underline transition-all hover:-translate-y-0.5 hover:border-[#acd2c3] hover:bg-white hover:shadow-[0_10px_26px_rgba(28,54,43,.055)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079272]/35";

            return id === "people" || id === "community"
              ? <ComingSoon className="min-h-44 rounded-[18px]" key={id}><div className={className}>{content}</div></ComingSoon>
              : <button type="button" onClick={action} className={className} key={id}>{content}</button>;
          })}
        </div>
      </div>
    </section>
  );
}
