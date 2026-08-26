import { getOpportunityDetail } from "@/data/opportunity-details";
import {
  APPLICATION_CONFIRM_SUBMISSION_ID,
  APPLICATION_REQUIREMENTS_ID,
  APPLICATION_SUBMIT_ID,
  APPLICATION_UNDERSTAND_ID,
  createRequirementChecklistId,
} from "@/services/opportunity-journey-service";
import type { JourneyCommunityActivity, JourneyDailyAction, JourneyGroup, JourneyMaterialGroup, JourneyOpportunityItem, JourneyPlan, JourneyPriority, JourneyReminder, JourneyUpdate } from "@/types/journey-plan";
import { deriveJourneyStage } from "@/types/opportunity-journey";
import type { JourneyStage, OpportunityJourney } from "@/types/opportunity-journey";
import type { OnboardingProfile } from "@/types/onboarding";

function getDaysLeft(note: string) {
  const value = Number(note.match(/(\d+)\s+dias?/i)?.[1]);
  return Number.isFinite(value) ? value : undefined;
}

function hydrate(journeys: OpportunityJourney[]): JourneyOpportunityItem[] {
  return journeys.flatMap((relationship) => {
    const opportunity = getOpportunityDetail(relationship.opportunityId);
    return opportunity ? [{ relationship: { ...relationship, stage: deriveJourneyStage(relationship) }, opportunity, daysLeft: getDaysLeft(opportunity.deadlineNote) }] : [];
  });
}

function priorityScore(item: JourneyOpportunityItem) {
  const priority = { high: 80, medium: 45, low: 10 }[item.relationship.priority];
  const stageWeights: Partial<Record<JourneyStage, number>> = { preparing: 35, interested: 25, visitedOfficialPage: 22, applied: 15, waitingForResult: 12, accepted: 8 };
  const stage = stageWeights[item.relationship.stage] ?? 0;
  const deadline = item.daysLeft === undefined ? 0 : item.daysLeft <= 3 ? 45 : item.daysLeft <= 7 ? 32 : item.daysLeft <= 30 ? 12 : 0;
  return priority + stage + deadline;
}

function priorityReason(item: JourneyOpportunityItem) {
  if (item.daysLeft !== undefined && item.daysLeft <= 7) return `O prazo termina em ${item.daysLeft} ${item.daysLeft === 1 ? "dia" : "dias"} e ainda há etapas para concluir.`;
  if (item.relationship.stage === "interested") return "Você marcou esta oportunidade como importante, mas ainda não começou a preparação.";
  if (item.relationship.stage === "visitedOfficialPage") return "Você já consultou a página oficial. O próximo passo é organizar a preparação.";
  if (item.relationship.stage === "preparing") return "Esta candidatura já está em preparação e merece continuidade.";
  if (item.relationship.stage === "applied") return "A candidatura foi enviada. Mantenha datas e mensagens da organização por perto.";
  if (item.relationship.stage === "waitingForResult") return "O processo está na fase de acompanhamento do resultado.";
  return "Esta oportunidade está entre as prioridades que você definiu.";
}

function nextAction(item: JourneyOpportunityItem) {
  const actions: Partial<Record<JourneyStage, { label: string; estimate?: string }>> = {
    watching: { label: "Revisar detalhes", estimate: "≈ 5 minutos" },
    interested: { label: "Abrir candidatura", estimate: "≈ 2 minutos" },
    visitedOfficialPage: { label: "Organizar requisitos", estimate: "≈ 15 minutos" },
    preparing: { label: "Continuar preparação", estimate: "≈ 1 hora" },
    applied: { label: "Conferir confirmação", estimate: "≈ 2 minutos" },
    waitingForResult: { label: "Acompanhar resultado", estimate: "≈ 2 minutos" },
    accepted: { label: "Confirmar participação", estimate: "≈ 5 minutos" },
    participating: { label: "Ver próxima etapa", estimate: "≈ 5 minutos" },
  };
  return actions[item.relationship.stage] ?? { label: "Ver oportunidade" };
}

function opportunityHealth(item: JourneyOpportunityItem) {
  const activeBeforeApplication = ["interested", "visitedOfficialPage", "preparing"].includes(item.relationship.stage);
  if (activeBeforeApplication && item.daysLeft !== undefined && item.daysLeft <= 3) return { id: "urgent" as const, label: "Urgente" };
  if (activeBeforeApplication && (item.daysLeft === undefined || item.daysLeft <= 7)) return { id: "attention" as const, label: "Atenção necessária" };
  return { id: "onTrack" as const, label: "Em dia" };
}

function opportunityProgress(item: JourneyOpportunityItem) {
  if (item.relationship.workflowStage?.position && item.relationship.workflowStage.total) return {
    completed: Math.max(0, item.relationship.workflowStage.position - 1),
    total: item.relationship.workflowStage.total,
    label: item.relationship.workflowStage.label,
  };

  const applicationIds = [
    APPLICATION_UNDERSTAND_ID,
    APPLICATION_REQUIREMENTS_ID,
    ...item.opportunity.requirements.map((requirement) => createRequirementChecklistId(requirement.label)),
    APPLICATION_SUBMIT_ID,
    APPLICATION_CONFIRM_SUBMISSION_ID,
  ];
  const checklistIds = applicationIds;
  const completedChecklistIds = new Set(item.relationship.applicationProgress.completedItemIds);
  const checklistCompleted = checklistIds.filter((id) => completedChecklistIds.has(id)).length;
  const checklistTotal = checklistIds.length;
  if (checklistCompleted > 0) {
    return {
      completed: checklistCompleted,
      total: checklistTotal,
      label: checklistCompleted === checklistTotal ? "Preparação concluída" : `${checklistTotal - checklistCompleted} ${checklistTotal - checklistCompleted === 1 ? "item pendente" : "itens pendentes"}`,
    };
  }

  const stages: JourneyStage[] = ["interested", "visitedOfficialPage", "preparing", "applied", "waitingForResult", "completed"];
  const index = stages.indexOf(item.relationship.stage);
  const completed = item.relationship.stage === "participating" || item.relationship.stage === "accepted" ? 5 : index >= 0 ? index : 0;
  const labels: Partial<Record<JourneyStage, string>> = {
    interested: "Candidatura ainda não iniciada",
    visitedOfficialPage: "Requisitos pendentes",
    preparing: "Preparação em andamento",
    applied: "Candidatura enviada",
    waitingForResult: "Resultado aguardado",
    accepted: "Participação pendente",
    participating: "Participando",
    completed: "Ciclo concluído",
  };
  return { completed, total: 5, label: labels[item.relationship.stage] ?? "Primeiro passo pendente" };
}

function communitySignal(item: JourneyOpportunityItem) {
  const signals = [
    { text: "5 estudantes também estão preparando esta candidatura.", actionLabel: "Ver conversa" },
    { text: "Um participante compartilhou uma dica nova.", actionLabel: "Ver dica" },
    { text: "Há mentores disponíveis para esta oportunidade.", actionLabel: "Encontrar alguém" },
  ];
  return signals[item.opportunity.id % signals.length];
}

function latestOpportunityUpdate(item: JourneyOpportunityItem) {
  if (item.daysLeft !== undefined && item.daysLeft <= 7) return { text: `Prazo confirmado: faltam ${item.daysLeft} dias.`, timestamp: "Há 2 h", kind: "deadline" as const };
  if (item.relationship.stage === "preparing") return { text: "Novo exemplo de candidatura adicionado.", timestamp: "Hoje", kind: "material" as const };
  if (item.relationship.stage === "watching") return { text: "FAQ da edição recebeu novas respostas.", timestamp: "Ontem", kind: "faq" as const };
  return { text: "Uma nova discussão começou na comunidade.", timestamp: "Há 3 h", kind: "discussion" as const };
}

function createGroups(items: JourneyOpportunityItem[]): JourneyGroup[] {
  const activeStages = new Set(["interested", "visitedOfficialPage", "preparing", "applied", "waitingForResult", "accepted", "participating"]);
  const archivedStages = new Set(["rejected", "completed", "archived"]);
  return [
    { id: "active", title: "Em andamento", description: "Oportunidades que pedem alguma ação ou acompanhamento.", items: items.filter((item) => item.relationship.objective !== "participating" && activeStages.has(item.relationship.stage)) },
    { id: "watching", title: "Acompanhando", description: "Oportunidades mantidas por perto, sem prioridade imediata.", items: items.filter((item) => item.relationship.stage === "watching") },
    { id: "archived", title: "Arquivadas", description: "Ciclos concluídos ou que não exigem mais atenção.", items: items.filter((item) => item.relationship.objective === "participating" || archivedStages.has(item.relationship.stage)) },
  ];
}

function createFocus(items: JourneyOpportunityItem[], priorities: JourneyPriority[]) {
  if (items.length === 0) return ["Você ainda não adicionou oportunidades à sua Jornada.", "Comece explorando e escolha apenas o que realmente merece sua atenção agora."];
  if (items.every((item) => item.relationship.stage === "watching")) return [`Você acompanha ${items.length} ${items.length === 1 ? "oportunidade" : "oportunidades"}, mas nenhuma exige ação imediata.`, "Use este momento para conhecer melhor as opções e decidir qual merece virar prioridade."];
  const first = priorities[0];
  const second = priorities[1];
  if (!first) return ["Sua Jornada está em fase de acompanhamento.", "Revise os próximos resultados e mantenha os prazos importantes por perto."];
  const deadline = first.daysLeft !== undefined ? `, pois o prazo termina em ${first.daysLeft} ${first.daysLeft === 1 ? "dia" : "dias"}` : "";
  return [`Esta semana vale priorizar ${first.opportunity.title}${deadline}.`, second ? `${second.opportunity.title} também merece atenção, mas pode avançar depois do primeiro passo.` : "Concentrar energia em uma oportunidade por vez deve tornar o próximo passo mais simples."];
}

function createReminders(items: JourneyOpportunityItem[]): JourneyReminder[] {
  return items.flatMap((item) => {
    if (item.daysLeft !== undefined && item.daysLeft <= 3 && !["applied", "waitingForResult", "completed"].includes(item.relationship.stage)) return [{ opportunityId: item.opportunity.id, text: `Últimos ${item.daysLeft} ${item.daysLeft === 1 ? "dia" : "dias"} para ${item.opportunity.title}.` }];
    if (item.relationship.stage === "waitingForResult") return [{ opportunityId: item.opportunity.id, text: `Acompanhe a divulgação do resultado de ${item.opportunity.title}.` }];
    return [];
  }).slice(0, 3);
}

function createUpdates(items: JourneyOpportunityItem[]): JourneyUpdate[] {
  const first = items[0];
  if (!first) return [];
  const updates: JourneyUpdate[] = [];
  if (first.relationship.stage === "preparing") updates.push({ id: `checklist-${first.opportunity.id}`, opportunityId: first.opportunity.id, icon: "checklist", text: `Etapa concluída em ${first.opportunity.title}. Você avançou.`, timestamp: "Há 18 min", actionLabel: "Ver progresso", href: `/explorar/${first.opportunity.id}` });
  updates.push({ id: `material-${first.opportunity.id}`, opportunityId: first.opportunity.id, icon: "material", text: `Sua preparação avançou — separamos novos exemplos para ${first.opportunity.title}.`, timestamp: "Há 1 h", actionLabel: "Abrir material", href: `/explorar/${first.opportunity.id}#materiais` });
  updates.push({ id: `mentor-${first.opportunity.id}`, opportunityId: first.opportunity.id, icon: "mentor", text: `Sua dúvida sobre ${first.opportunity.title} recebeu uma nova resposta.`, timestamp: "Há 3 h", actionLabel: "Ler resposta", href: `/comunidade?oportunidade=${first.opportunity.id}` });
  const deadlineItem = items.find((item) => item.daysLeft !== undefined);
  if (deadlineItem) updates.push({ id: `deadline-${deadlineItem.opportunity.id}`, opportunityId: deadlineItem.opportunity.id, icon: "deadline", text: `O prazo de ${deadlineItem.opportunity.title} está a ${deadlineItem.daysLeft} dias. Seu plano foi ajustado.`, timestamp: "Ontem", actionLabel: "Revisar prazo", href: `/explorar/${deadlineItem.opportunity.id}` });
  const resultItem = items.find((item) => item.relationship.stage === "waitingForResult");
  if (resultItem) updates.push({ id: `result-${resultItem.opportunity.id}`, opportunityId: resultItem.opportunity.id, icon: "result", text: `O resultado de ${resultItem.opportunity.title} foi publicado.`, timestamp: "Ontem", actionLabel: "Ver resultado", href: `/explorar/${resultItem.opportunity.id}` });
  const newest = items[items.length - 1];
  updates.push({ id: `saved-${newest.opportunity.id}`, opportunityId: newest.opportunity.id, icon: "saved", text: `${newest.opportunity.title} entrou na sua Jornada. O primeiro passo já está pronto.`, timestamp: "Há 2 dias", actionLabel: "Ver oportunidade", href: `/explorar/${newest.opportunity.id}` });
  return updates.slice(0, 6);
}

function createDailyActions(projects: JourneyPriority[]): JourneyDailyAction[] {
  const first = projects[0];
  if (!first) return [];
  const actions: JourneyDailyAction[] = [{ id: `next-${first.opportunity.id}`, opportunityId: first.opportunity.id, title: first.nextAction, context: first.opportunity.title, minutes: first.relationship.stage === "preparing" ? 12 : 4, actionLabel: "Continuar", href: `/explorar/${first.opportunity.id}`, kind: "application" }];
  if (["interested", "visitedOfficialPage", "preparing"].includes(first.relationship.stage)) actions.push({ id: `read-${first.opportunity.id}`, opportunityId: first.opportunity.id, title: "Ler novo material", context: "Guia recomendado para esta etapa", minutes: 4, actionLabel: "Ler agora", href: `/explorar/${first.opportunity.id}#materiais`, kind: "material" });
  actions.push({ id: `reply-${first.opportunity.id}`, opportunityId: first.opportunity.id, title: "Responder à comunidade", context: "Uma nova resposta espera por você", minutes: 2, actionLabel: "Responder", href: `/comunidade?oportunidade=${first.opportunity.id}`, kind: "community" });
  return actions.slice(0, 3);
}

function createCommunityActivity(items: JourneyOpportunityItem[]): JourneyCommunityActivity[] {
  if (items.length === 0) return [];
  const people = [
    { person: "Marina Alves", initials: "MA", text: "concluiu a etapa de redação", actionLabel: "Conversar" as const },
    { person: "Pedro Lima", initials: "PL", text: "perguntou como escolher um tema para o projeto", actionLabel: "Responder" as const },
    { person: "Ana Costa", initials: "AC", text: "compartilhou uma dica de candidatura", actionLabel: "Ver discussão" as const },
    { person: "Lucas Rocha", initials: "LR", text: "foi aprovado na edição mais recente e compartilhou seu processo", actionLabel: "Conversar" as const },
  ];
  return people.map((activity, index) => ({ ...activity, id: `community-${items[index % items.length].opportunity.id}-${index}`, opportunityId: items[index % items.length].opportunity.id, timestamp: index === 0 ? "Há 18 min" : index === 1 ? "Há 1 h" : "Ontem" }));
}

function createMomentum(items: JourneyOpportunityItem[], projects: JourneyPriority[]) {
  if (items.length === 0) return ["Seu primeiro avanço será escolher uma oportunidade que mereça seu tempo."];
  const progressed = projects.filter((item) => item.progress.completed > 0);
  const almostDone = projects.find((item) => item.progress.total - item.progress.completed === 1);
  const messages = [`Você concluiu ${Math.max(1, progressed.length + 1)} etapas esta semana.`];
  if (almostDone) messages.push(`Falta apenas uma etapa para avançar em ${almostDone.opportunity.title}.`);
  else if (progressed.length > 0) messages.push("Você está mais avançado do que ontem.");
  else messages.push("Seu próximo passo já está definido — agora basta começar.");
  return messages;
}

function createMission(projects: JourneyPriority[]) {
  const project = projects[0];
  if (!project) return { title: "Escolher sua primeira oportunidade", context: "Sua Jornada começa com uma decisão clara.", why: "Ainda não há uma oportunidade ativa para priorizar.", minutes: 5, unlocks: "Um plano personalizado de próximos passos.", href: "/explorar" };
  const minutes = project.relationship.stage === "preparing" ? 12 : project.relationship.stage === "interested" ? 4 : 5;
  return { opportunityId: project.opportunity.id, title: project.nextAction, context: project.opportunity.title, why: project.reason, minutes, unlocks: project.progress.completed + 1 >= project.progress.total ? "A conclusão deste ciclo." : `A etapa ${Math.min(project.progress.total, project.progress.completed + 1)} de ${project.progress.total} da sua preparação.`, href: `/explorar/${project.opportunity.id}` };
}

function createGlobalProgress(items: JourneyOpportunityItem[], projects: JourneyPriority[]) {
  const completedOpportunities = items.filter((item) => ["rejected", "completed", "archived"].includes(item.relationship.stage)).length;
  const completedSteps = projects.reduce((total, project) => total + project.progress.completed, 0);
  const weeklyCompleted = Math.max(items.length > 0 ? 1 : 0, Math.min(5, completedSteps));
  return {
    completedOpportunities,
    activeOpportunities: projects.length,
    streakDays: items.length > 0 ? Math.min(7, Math.max(2, projects.length + 1)) : 0,
    weeklyCompleted,
    weeklyTotal: Math.max(4, weeklyCompleted + 2),
    milestones: items.length > 0 ? ["Primeira prioridade definida", ...(completedSteps > 0 ? ["Preparação iniciada"] : []), ...(items.some((item) => item.relationship.officialPageVisitedAt) ? ["Página oficial visitada"] : [])] : [],
  };
}

function createMaterialGroups(items: JourneyOpportunityItem[]): JourneyMaterialGroup[] {
  return items.filter((item) => ["interested", "visitedOfficialPage", "preparing"].includes(item.relationship.stage)).slice(0, 3).map((item) => ({
    opportunityId: item.opportunity.id,
    opportunityTitle: item.opportunity.title,
    materials: [
      { opportunityId: item.opportunity.id, opportunityTitle: item.opportunity.title, title: item.opportunity.requirements.some((requirement) => /texto|carta/i.test(requirement.label)) ? "Como escrever uma candidatura clara e pessoal" : "Como organizar sua preparação", type: "Guia seConecta" },
      { opportunityId: item.opportunity.id, opportunityTitle: item.opportunity.title, title: "Relato de quem já participou", type: "Experiência" },
    ],
  }));
}

export function createJourneyPlan(journeys: OpportunityJourney[], profile: OnboardingProfile | null = null): JourneyPlan {
  const items = hydrate(journeys);
  const enrich = (item: JourneyOpportunityItem): JourneyPriority => {
    const action = nextAction(item);
    const health = opportunityHealth(item);
    return { ...item, reason: priorityReason(item), nextAction: action.label, actionEstimate: action.estimate, health: health.id, healthLabel: health.label, progress: opportunityProgress(item), community: communitySignal(item), latestUpdate: latestOpportunityUpdate(item) };
  };
  const enrichedItems = items.map(enrich);
  const observing = enrichedItems.filter((item) => item.relationship.stage === "watching").sort((a, b) => b.relationship.updatedAt.localeCompare(a.relationship.updatedAt));
  const projects = enrichedItems.filter((item) => item.relationship.objective !== "participating" && !["watching", "rejected", "completed", "archived"].includes(item.relationship.stage)).sort((a, b) => priorityScore(b) - priorityScore(a));
  const accomplishments = enrichedItems.filter((item) => item.relationship.objective === "participating" || ["rejected", "completed", "archived"].includes(item.relationship.stage)).sort((a, b) => b.relationship.updatedAt.localeCompare(a.relationship.updatedAt));
  const priorities = projects.slice(0, 3);
  const dailyActions = createDailyActions(priorities);
  const watchingCount = items.filter((item) => item.relationship.stage === "watching").length;
  const preparingCount = items.filter((item) => item.relationship.stage === "preparing").length;
  const profileTheme = profile?.themes[0];
  const coachInsight = watchingCount >= 4
    ? `Você está acompanhando ${watchingCount} oportunidades. Escolher apenas uma ou duas como prioridade nesta semana pode reduzir a dispersão.`
    : preparingCount > 0
      ? "Você já começou uma preparação. Proteja tempo para concluí-la antes de assumir uma nova candidatura."
      : items.length > 0
        ? "Sua Jornada ainda está concentrada em descoberta. Quando uma oportunidade se destacar, transforme interesse em um próximo passo concreto."
        : profileTheme
          ? `Você indicou interesse em ${profileTheme}. Comece explorando esse tema e adicione somente oportunidades que façam sentido para seu momento.`
          : "Sua Jornada começa com uma boa escolha. Explore com calma e adicione somente oportunidades que façam sentido para seus objetivos.";

  return {
    focus: createFocus(items, priorities),
    updates: createUpdates(items),
    mission: createMission(priorities.length > 0 ? priorities : projects),
    globalProgress: createGlobalProgress(items, projects),
    priorities,
    observing,
    projects,
    accomplishments,
    dailyActions,
    totalDailyMinutes: dailyActions.reduce((total, action) => total + action.minutes, 0),
    communityActivity: createCommunityActivity(items),
    groups: createGroups(items),
    reminders: createReminders(items),
    materialGroups: createMaterialGroups(items),
    coachInsight,
    coachReasons: priorities[0] ? [priorities[0].daysLeft !== undefined ? `prazo em ${priorities[0].daysLeft} dias` : "oportunidade marcada como importante", priorities[0].progress.completed === 0 ? "próximo passo ainda não iniciado" : priorities[0].progress.label.toLowerCase()] : ["nenhuma prioridade definida", profileTheme ? `interesse em ${profileTheme}` : "perfil ainda em construção"],
    progress: [
      { label: "encontrou oportunidades", complete: items.length > 0 },
      { label: "definiu prioridades", complete: items.some((item) => item.relationship.priority === "high") },
      { label: "iniciou uma candidatura", complete: items.some((item) => ["preparing", "applied", "waitingForResult", "accepted", "participating", "completed"].includes(item.relationship.stage)) },
    ],
    momentum: createMomentum(items, projects),
  };
}
