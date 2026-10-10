"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

export type OpportunityTimelineStep = {
  title: string;
  date: string;
  description: string;
};

type OpportunityTimelineProps = {
  steps?: OpportunityTimelineStep[];
  /** -1 means the cycle has not started; steps.length means it is complete. */
  currentStepIndex: number | null;
};

type TimelineColor = { solid: string; soft: string; text: string };

/**
 * Semantic color plan: blue = opening, coral = urgency/deadline,
 * violet = evaluation, gold = result and green = beginning/progress.
 */
export const timelineColorPlan = {
  opening: { solid: "#3f7fba", soft: "#eaf3fb", text: "#346b9d" },
  deadline: { solid: "#cf6b4f", soft: "#fff0eb", text: "#aa5037" },
  interview: { solid: "#7665c7", soft: "#f0eefb", text: "#6453af" },
  result: { solid: "#c18a2f", soft: "#fff6e6", text: "#97671b" },
  start: { solid: "#079272", soft: "#e8f7f1", text: "#057259" },
} satisfies Record<string, TimelineColor>;

function getStepColor(title: string, index: number): TimelineColor {
  const normalized = title.toLocaleLowerCase("pt-BR");
  if (/abert|inscriç.*abert/.test(normalized)) return timelineColorPlan.opening;
  if (/encerr|prazo|deadline/.test(normalized)) return timelineColorPlan.deadline;
  if (/entrevist|avaliaç|seleç/.test(normalized)) return timelineColorPlan.interview;
  if (/result|divulgaç/.test(normalized)) return timelineColorPlan.result;
  if (/início|inicio|começa|começo/.test(normalized)) return timelineColorPlan.start;
  return Object.values(timelineColorPlan)[index % Object.keys(timelineColorPlan).length];
}

/** A low-height lifecycle line that makes the current moment immediately visible. */
export function OpportunityTimeline({ steps, currentStepIndex }: OpportunityTimelineProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const relevantStepRef = useRef<HTMLLIElement>(null);
  const safeSteps = steps ?? [];
  const hasCurrentStep = currentStepIndex !== null && currentStepIndex >= 0 && currentStepIndex < safeSteps.length;
  const isComplete = currentStepIndex !== null && safeSteps.length > 0 && currentStepIndex >= safeSteps.length;
  const relevantIndex = hasCurrentStep ? currentStepIndex : isComplete ? safeSteps.length - 1 : 0;

  useEffect(() => {
    const scroller = scrollerRef.current;
    const relevantStep = relevantStepRef.current;
    if (!scroller || !relevantStep || scroller.scrollWidth <= scroller.clientWidth) return;
    scroller.scrollTo({ left: relevantStep.offsetLeft - (scroller.clientWidth - relevantStep.clientWidth) / 2, behavior: "auto" });
  }, [relevantIndex, safeSteps.length]);

  // Opportunities without reliable cycle metadata should not show an invented timeline.
  if (safeSteps.length === 0 || currentStepIndex === null) return null;

  return <section className="relative z-0 isolate" aria-label="Ciclo da oportunidade">
    <div ref={scrollerRef} className="overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" tabIndex={0}>
      <ol className="grid min-w-[650px] grid-cols-5">{safeSteps.map((step, index) => {
      const isPast = isComplete || (hasCurrentStep && index < currentStepIndex);
      const isCurrent = index === currentStepIndex;
      const isNext = !hasCurrentStep && !isComplete && index === 0;
      const color = getStepColor(step.title, index);
      const nextColor = getStepColor(safeSteps[index + 1]?.title ?? step.title, index + 1);
      return <li ref={index === relevantIndex ? relevantStepRef : undefined} className="relative min-h-[76px] px-2 text-center" title={step.description} key={`${step.title}-${step.date}`}>
        {index < safeSteps.length - 1 && <span className="absolute left-1/2 top-[10px] h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${color.solid}, ${nextColor.solid})`, opacity: isPast ? .9 : isCurrent ? .48 : .2 }} />}
        <span className="relative z-[1] mx-auto grid size-5 place-items-center rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: isCurrent ? color.solid : isPast ? color.solid : color.soft, color: isPast || isCurrent ? "white" : color.solid, boxShadow: isCurrent || isNext ? `0 0 0 5px ${color.soft}` : undefined }}>
          {isPast ? <Check size={11} strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
        </span>
        {isCurrent && <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-[.1em]" style={{ backgroundColor: color.soft, color: color.text }}>Agora</span>}
        {isNext && <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-[.1em]" style={{ backgroundColor: color.soft, color: color.text }}>Próxima</span>}
        {isComplete && index === safeSteps.length - 1 && <span className="mt-2 inline-block rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-[.1em]" style={{ backgroundColor: color.soft, color: color.text }}>Concluído</span>}
        <time className={isCurrent || isNext || (isComplete && index === safeSteps.length - 1) ? "mt-1 block text-[8px] font-bold uppercase tracking-[.08em]" : "mt-2 block text-[8px] font-bold uppercase tracking-[.08em] text-[#8a948f]"} style={isCurrent || isNext ? { color: color.text } : undefined}>{step.date}</time>
        <strong className={isCurrent ? "mt-0.5 block text-[9px] leading-4" : "mt-0.5 block text-[9px] leading-4 text-[#52615a]"} style={isCurrent ? { color: color.text } : undefined}>{step.title}</strong>
        <span className="sr-only">{step.description}</span>
      </li>;
    })}</ol>
    </div>
  </section>;
}
