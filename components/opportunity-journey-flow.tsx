"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Eye, GraduationCap, Rocket, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { OpportunityIntent, OpportunityJourney, OpportunityObjective } from "@/types/opportunity-journey";
import { createOpportunityJourney } from "@/types/opportunity-journey";
import "./opportunity-journey-flow.css";

type JourneyFlowProps = {
  opportunity: { id: number; title: string } | null;
  initialIntent?: OpportunityIntent | null;
  onClose: () => void;
  onComplete: (journey: OpportunityJourney) => void;
};

const objectives: { value: OpportunityObjective; icon: typeof Rocket; title: string; copy: string }[] = [
  { value: "following", icon: Eye, title: "Só acompanhando", copy: "Quero apenas receber atualizações." },
  { value: "applying", icon: Rocket, title: "Quero me candidatar", copy: "Quero organizar minha candidatura com um checklist." },
  { value: "participating", icon: GraduationCap, title: "Participando", copy: "Já fui aceito e estou participando desta oportunidade." },
];

export function OpportunityJourneyFlow({ opportunity, initialIntent = null, onClose, onComplete }: JourneyFlowProps) {
  const [objective, setObjective] = useState<OpportunityObjective | null>(
    initialIntent === "follow" ? "following" : initialIntent === "apply" ? "applying" : null,
  );

  useEffect(() => {
    if (opportunity) setObjective(initialIntent === "follow" ? "following" : initialIntent === "apply" ? "applying" : null);
  }, [initialIntent, opportunity]);

  const close = () => {
    setObjective(null);
    onClose();
  };

  const chooseObjective = (value: OpportunityObjective) => {
    if (!opportunity) return;
    setObjective(value);
    const journey = createOpportunityJourney({
      opportunityId: opportunity.id,
      intent: value === "following" ? "follow" : "apply",
      priority: value === "following" ? "low" : "high",
    });
    onComplete({ ...journey, objective: value });
    close();
  };

  return <AnimatePresence>{opportunity && <motion.div className="opportunity-journey-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && close()}>
    <motion.section className="opportunity-journey-flow" role="dialog" aria-modal="true" aria-labelledby="journey-flow-title" initial={{ opacity: 0, y: 14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }} transition={{ duration: .18 }}>
      <button className="opportunity-journey-close" type="button" onClick={close} aria-label="Fechar"><X size={18} /></button>
      <motion.div key="objective" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
        <span className="opportunity-journey-kicker">Meu objetivo</span>
        <h2 id="journey-flow-title">O que você quer com esta oportunidade?</h2>
        <p className="opportunity-journey-opportunity">{opportunity.title}</p>
        <div className="opportunity-journey-options">
          {objectives.map(({ value, icon: Icon, title, copy }) => <button type="button" onClick={() => chooseObjective(value)} aria-pressed={objective === value} key={value}><span className="opportunity-journey-icon"><Icon size={19} /></span><span><strong>{title}</strong><small>{copy}</small></span></button>)}
        </div>
      </motion.div>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}
