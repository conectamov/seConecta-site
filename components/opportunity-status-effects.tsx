"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, PartyPopper, Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import type { JourneyOpportunityRef } from "@/components/opportunity-journey-provider";

export type OpportunityExperienceScore = "great" | "good" | "neutral" | "difficult";

const experienceOptions: { value: OpportunityExperienceScore; emoji: string; label: string }[] = [
  { value: "great", emoji: "😍", label: "Excelente" },
  { value: "good", emoji: "🙂", label: "Boa" },
  { value: "neutral", emoji: "😐", label: "Regular" },
  { value: "difficult", emoji: "😕", label: "Difícil" },
];

const confetti = [
  { x: "8%", color: "#079272", delay: 0, rotate: 18 },
  { x: "17%", color: "#f4b942", delay: .08, rotate: 55 },
  { x: "28%", color: "#7967d8", delay: .16, rotate: 92 },
  { x: "39%", color: "#ef7d65", delay: .04, rotate: 130 },
  { x: "51%", color: "#22b8a2", delay: .2, rotate: 165 },
  { x: "62%", color: "#f4b942", delay: .1, rotate: 205 },
  { x: "73%", color: "#7967d8", delay: .24, rotate: 245 },
  { x: "84%", color: "#ef7d65", delay: .13, rotate: 285 },
  { x: "93%", color: "#079272", delay: .03, rotate: 330 },
];

export function ApprovalCelebration({
  opportunity,
  onClose,
}: {
  opportunity: JourneyOpportunityRef | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!opportunity) return;
    const timeout = window.setTimeout(onClose, 5200);
    return () => window.clearTimeout(timeout);
  }, [onClose, opportunity]);

  return <AnimatePresence>{opportunity && <motion.div
    className="opportunity-celebration-backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="opportunity-celebration-title"
    onMouseDown={(event) => event.currentTarget === event.target && onClose()}
  >
    <div className="opportunity-confetti" aria-hidden="true">
      {confetti.map((piece, index) => <motion.i
        key={`${piece.x}-${piece.color}`}
        style={{ left: piece.x, background: piece.color }}
        initial={{ y: -50, opacity: 0, rotate: piece.rotate }}
        animate={{ y: "92vh", opacity: [0, 1, 1, 0], rotate: piece.rotate + 430 }}
        transition={{ duration: 2.7 + (index % 3) * .35, delay: piece.delay, ease: "easeIn" }}
      />)}
    </div>
    <motion.section
      className="opportunity-celebration-card"
      initial={{ opacity: 0, y: 18, scale: .9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: .96 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <button type="button" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
      <motion.span className="opportunity-celebration-icon" initial={{ rotate: -12, scale: .7 }} animate={{ rotate: [0, -8, 8, 0], scale: 1 }} transition={{ delay: .16, duration: .65 }}>
        <PartyPopper size={31} />
      </motion.span>
      <span className="opportunity-celebration-kicker"><Sparkles size={13} /> Uma conquista para celebrar</span>
      <h2 id="opportunity-celebration-title">Parabéns, você foi aprovado!</h2>
      <p>Que notícia incrível. Sua dedicação em <strong>{opportunity.title}</strong> trouxe você até aqui.</p>
      <button className="opportunity-celebration-action" type="button" onClick={onClose}>Continuar minha jornada</button>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

export function ApplicationExperienceModal({
  opportunity,
  submitted,
  onSubmit,
  onClose,
}: {
  opportunity: JourneyOpportunityRef | null;
  submitted: boolean;
  onSubmit: (score: OpportunityExperienceScore) => void;
  onClose: () => void;
}) {
  return <AnimatePresence>{opportunity && <motion.div
    className="application-experience-backdrop"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="application-experience-title"
    onMouseDown={(event) => event.currentTarget === event.target && onClose()}
  >
    <motion.section className="application-experience-modal" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }}>
      <button className="application-experience-close" type="button" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
      <AnimatePresence mode="wait" initial={false}>
        {!submitted ? <motion.div key="question" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
          <span className="application-experience-kicker">Candidatura enviada</span>
          <h2 id="application-experience-title">Como foi sua experiência com a seConecta ao longo desta oportunidade?</h2>
          <p>Sua resposta rápida nos ajuda a tornar as próximas jornadas ainda melhores.</p>
          <div className="application-experience-options">
            {experienceOptions.map((option) => <button type="button" onClick={() => onSubmit(option.value)} key={option.value}>
              <span aria-hidden="true">{option.emoji}</span>
              <strong>{option.label}</strong>
            </button>)}
          </div>
        </motion.div> : <motion.div className="application-experience-thanks" key="thanks" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
          <span className="application-experience-check"><Check size={22} /></span>
          <span className="application-experience-kicker">Feedback recebido</span>
          <h2 id="application-experience-title">Obrigado por compartilhar.</h2>
          <p>Sua resposta vai nos ajudar a cuidar melhor de cada etapa da experiência.</p>
          <button type="button" disabled title="Pesquisa detalhada disponível em breve">Responder uma pesquisa mais detalhada <span>Em breve</span></button>
          <button className="application-experience-done" type="button" onClick={onClose}>Concluir</button>
        </motion.div>}
      </AnimatePresence>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
