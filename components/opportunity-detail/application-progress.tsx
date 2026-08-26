"use client";

import { ArrowRight, Check, CheckCircle2, Circle, Clock3, ExternalLink, GraduationCap, ListChecks, XCircle } from "lucide-react";
import Link from "next/link";
import type { OpportunityDetail } from "@/data/opportunity-details";
import {
  APPLICATION_CONFIRM_SUBMISSION_ID,
  APPLICATION_REQUIREMENTS_ID,
  APPLICATION_SUBMIT_ID,
  APPLICATION_UNDERSTAND_ID,
  createRequirementChecklistId,
} from "@/services/opportunity-journey-service";
import { deriveJourneyStage } from "@/types/opportunity-journey";
import type { ApplicationResult, OpportunityJourney, OpportunityObjective } from "@/types/opportunity-journey";

type ChecklistItem = {
  id: string;
  label: string;
  detail: string;
  href?: string;
};

function getApplicationItems(opportunity: OpportunityDetail): ChecklistItem[] {
  return [
    { id: APPLICATION_UNDERSTAND_ID, label: "Entender o programa", detail: "Revise a proposta, o formato e o compromisso esperado." },
    { id: APPLICATION_REQUIREMENTS_ID, label: "Conferir requisitos", detail: "Confirme elegibilidade, regras e datas no site oficial.", href: opportunity.officialUrl },
    ...opportunity.requirements.map((requirement) => ({
      id: createRequirementChecklistId(requirement.label),
      label: requirement.label,
      detail: requirement.detail,
    })),
    { id: APPLICATION_SUBMIT_ID, label: "Enviar candidatura", detail: "Finalize o envio no canal oficial da organização.", href: opportunity.officialUrl },
    { id: APPLICATION_CONFIRM_SUBMISSION_ID, label: "Confirmar envio", detail: "Marque quando receber a confirmação. As etapas anteriores serão concluídas automaticamente." },
  ];
}

export function getApplicationProgress(opportunity: OpportunityDetail, journey: OpportunityJourney) {
  const items = getApplicationItems(opportunity);
  const completedIds = new Set(journey.applicationProgress.completedItemIds);
  const completed = items.filter((item) => completedIds.has(item.id)).length;
  return {
    completed,
    total: items.length,
    percentage: items.length === 0 ? 0 : Math.round((completed / items.length) * 100),
    nextItem: items.find((item) => !completedIds.has(item.id)),
  };
}

export function getJourneyProgressLabel(journey: OpportunityJourney) {
  if (journey.completed) return "Concluído automaticamente";
  if (journey.objective === "following") return "Só acompanhando";
  if (journey.objective === "participating") return "Participando";
  if (journey.applicationResult === "approved") return "Preparação concluída";
  if (journey.applicationResult === "rejected") return "Candidatura encerrada";
  const stage = deriveJourneyStage(journey);
  if (stage === "waitingForResult" || stage === "applied") return "Aguardando resultado";
  return "Candidatura em preparação";
}

type ApplicationProgressProps = {
  opportunity: OpportunityDetail;
  journey: OpportunityJourney;
  onToggleItem: (itemId: string) => void;
  onVisitOfficialSite: () => void;
  onResultChange: (result: ApplicationResult) => void;
  onObjectiveChange: (objective: OpportunityObjective) => void;
  onRemove: () => void;
};

function ChecklistRow({ item, completed, onToggle, onVisitOfficialSite }: { item: ChecklistItem; completed: boolean; onToggle: () => void; onVisitOfficialSite?: () => void }) {
  const content = <>
    <span className={completed ? "grid size-7 shrink-0 place-items-center rounded-full bg-[#079272] text-white" : "grid size-7 shrink-0 place-items-center rounded-full border border-[#c8d4ce] text-[#a1aca6] group-hover:border-[#82b6a3]"}>
      {completed ? <Check size={14} /> : <Circle size={13} />}
    </span>
    <span className="min-w-0 flex-1">
      <span className={completed ? "text-[11px] font-semibold text-[#718078] line-through" : "text-[11px] font-semibold text-[#29493c]"}>{item.label}</span>
      <span className="mt-1 block text-[9px] leading-4 text-[#7a8781]">{item.detail}</span>
    </span>
    {item.href && <ExternalLink size={14} className="shrink-0 text-[#8b9690] transition-colors group-hover:text-[#078166]" />}
  </>;

  if (item.href && !completed) return <a href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => { onVisitOfficialSite?.(); onToggle(); }} className="group flex min-h-16 items-center gap-3 px-5 py-4 no-underline transition hover:bg-[#f8faf9]">{content}</a>;
  return <button type="button" onClick={onToggle} className="group flex min-h-16 w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[#f8faf9]" aria-pressed={completed}>{content}</button>;
}

export function ApplicationProgress({ opportunity, journey, onToggleItem, onVisitOfficialSite, onResultChange, onObjectiveChange, onRemove }: ApplicationProgressProps) {
  const applicationItems = getApplicationItems(opportunity);
  const items: ChecklistItem[] = applicationItems;
  const completedIds = new Set(journey.applicationProgress.completedItemIds);
  const progress = getApplicationProgress(opportunity, journey);
  const submitted = journey.applicationProgress.completedItemIds.includes(APPLICATION_CONFIRM_SUBMISSION_ID);
  const header = submitted
    ? { eyebrow: "Minha candidatura", title: "Preparação concluída.", description: "Seu progresso fica registrado aqui. O resultado aparece separadamente logo abaixo." }
    : { eyebrow: "Minha candidatura", title: "Seu próximo passo está claro.", description: "Marque as ações conforme avançar. A plataforma entende automaticamente onde você está." };

  return <section aria-labelledby="application-progress-title">
    <header className="border-b border-[#e1e7e4] pb-7">
      <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#078166]">{header.eyebrow}</span>
      <h2 id="application-progress-title" className="mt-2 text-[clamp(1.65rem,3vw,2.25rem)] font-semibold tracking-[-.045em] text-[#1c372c]">
        {header.title}
      </h2>
      <p className="mt-2 max-w-xl text-xs leading-6 text-[#69756f]">{header.description}</p>
    </header>

    <div className="my-7 rounded-[20px] border border-[#d8e2dd] bg-[#f7faf8] p-5">
      <div className="flex items-end justify-between gap-5">
        <div><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#7c8882]">Progresso da candidatura</span><p className="mt-1 text-sm font-semibold text-[#29493c]">{progress.completed} de {progress.total} etapas concluídas</p></div>
        <strong className="text-2xl font-semibold tracking-[-.045em] text-[#078166]">{progress.percentage}%</strong>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4ebe7]" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.completed}>
        <span className="block h-full rounded-full bg-[#079272] transition-[width] duration-300" style={{ width: `${progress.percentage}%` }} />
      </div>
      {progress.nextItem && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e7e4] pt-4"><div><span className="text-[8px] font-bold uppercase tracking-[.1em] text-[#87928c]">Próximo passo</span><strong className="mt-1 block text-[11px] text-[#29493c]">{progress.nextItem.label}</strong></div><button type="button" onClick={() => onToggleItem(progress.nextItem!.id)} className="rounded-full bg-[#079272] px-4 py-2.5 text-[9px] font-semibold text-white">Continuar</button></div>}
    </div>

    {submitted && <section className={`mb-7 rounded-[20px] border p-5 ${journey.applicationResult === "approved" ? "border-[#bfe0d2] bg-[#eaf7f1]" : journey.applicationResult === "rejected" ? "border-[#ead8d2] bg-[#faf3f0]" : "border-[#d8e2dd] bg-white"}`} aria-labelledby="application-result-title">
      <span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#7c8882]">Resultado</span>
      {journey.applicationResult === "approved" ? <>
        <div className="mt-2 flex items-center gap-2 text-base font-semibold text-[#078166]"><CheckCircle2 size={19} /> <h3 id="application-result-title">Aprovado</h3></div>
        <p className="mt-3 text-xs font-semibold text-[#29493c]">Parabéns!</p>
        <p className="mt-1 max-w-xl text-[10px] leading-5 text-[#607068]">Agora acompanhe os próximos passos da oportunidade. Seu objetivo está como <strong>Participando</strong>, separado do resultado da candidatura.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={opportunity.officialUrl} target="_blank" rel="noopener noreferrer" onClick={onVisitOfficialSite} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-4 text-[9px] font-semibold text-white no-underline">Continuar <ArrowRight size={12} /></a>
          {journey.objective !== "participating" && <button type="button" onClick={() => onObjectiveChange("participating")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#bcd9ce] bg-white px-4 text-[9px] font-semibold text-[#078166]"><GraduationCap size={13} />Estou participando</button>}
        </div>
      </> : journey.applicationResult === "rejected" ? <>
        <div className="mt-2 flex items-center gap-2 text-base font-semibold text-[#a6523f]"><XCircle size={19} /> <h3 id="application-result-title">Não selecionado</h3></div>
        <p className="mt-3 max-w-xl text-[10px] leading-5 text-[#69756f]">Esta candidatura foi encerrada, mas a oportunidade pode abrir novamente no próximo ciclo.</p>
        <p className="mt-4 text-[10px] font-semibold text-[#3d554b]">Agora você está acompanhando esta oportunidade para uma possível próxima edição.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onRemove} className="rounded-full border border-[#e1cfc9] bg-white px-4 py-2.5 text-[9px] font-semibold text-[#9a4b39]">Remover da jornada</button>
          <Link href="/explorar" className="inline-flex min-h-10 items-center rounded-full px-3 text-[9px] font-semibold text-[#64726b] no-underline hover:bg-white">Ver oportunidades semelhantes</Link>
        </div>
      </> : <>
        <div className="mt-2 flex items-center gap-2 text-base font-semibold text-[#52615a]"><Clock3 size={19} className="text-[#b17a28]" /> <h3 id="application-result-title">Aguardando resposta</h3></div>
        <p className="mt-3 max-w-xl text-[10px] leading-5 text-[#69756f]">A candidatura foi enviada. Agora basta acompanhar as atualizações.</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#e5eae7] pt-4">
          <span className="mr-1 text-[9px] font-medium text-[#7b8781]">Recebeu o resultado?</span>
          <button type="button" onClick={() => onResultChange("approved")} className="rounded-full bg-[#079272] px-4 py-2.5 text-[9px] font-semibold text-white">Fui aprovado e vou participar</button>
          <button type="button" onClick={() => onResultChange("rejected")} className="rounded-full border border-[#d7dfdb] bg-white px-4 py-2.5 text-[9px] font-semibold text-[#64726b]">Não fui selecionado</button>
        </div>
      </>}
    </section>}

    <div className="overflow-hidden rounded-[20px] border border-[#d8e2dd] bg-white">
      <div className="flex items-center gap-3 border-b border-[#e4e9e6] bg-[#f5f8f6] px-5 py-4">
        <span className="grid size-9 place-items-center rounded-[12px] bg-white text-[#078166] shadow-sm"><ListChecks size={17} /></span>
        <div><h3 className="text-[12px] font-semibold text-[#29493c]">Checklist da candidatura</h3><p className="mt-0.5 text-[9px] text-[#7b8781]">O progresso é inferido pelas etapas concluídas.</p></div>
      </div>
      <div className="divide-y divide-[#e5eae7]">{items.map((item) => <ChecklistRow item={item} completed={completedIds.has(item.id)} onToggle={() => onToggleItem(item.id)} onVisitOfficialSite={onVisitOfficialSite} key={item.id} />)}</div>
    </div>
  </section>;
}
