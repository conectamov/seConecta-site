# Planejamento e atividade da Minha Jornada

## O que está mockado

Fonte principal: `services/journey-planner-service.ts`.

Hoje são calculados ou inventados localmente:

- prioridade e “saúde” da oportunidade;
- missão de hoje e próximo passo;
- estimativa de tempo;
- progresso semanal e streak;
- marcos;
- atualizações de prazo/material/resultado;
- atividade de mentores e comunidade;
- materiais recomendados;
- lembretes;
- texto do Coach;
- quantidade de estudantes e aprovados disponíveis.

Algumas regras usam strings como `deadlineNote` para extrair dias. Isso é provisório.

O check-in do Coach também é mockado: a resposta fica em
`seconecta:coach-check-in:<opportunityId>` no `localStorage`. Quando houver
backend, cada resposta deve virar um evento de coaching ligado à oportunidade,
à recomendação exibida e ao momento em que a pergunta foi feita.

## Dados reais necessários

- deadlines em ISO com timezone;
- status de cada ciclo;
- checklist e eventos de progresso;
- evento de visita à página oficial;
- publicações e respostas da comunidade;
- materiais ligados à oportunidade e à etapa;
- disponibilidade semanal do estudante;
- prioridade explícita e sinais de recomendação;
- histórico de ações e notificações.

## Contrato que deve permanecer

Minha Jornada responde “o que devo fazer agora?”, não “o que salvei?”.

- uma missão principal;
- no máximo 2–3 prioridades;
- exatamente uma próxima ação por oportunidade;
- separar candidaturas, observando e conquistas;
- progresso reduz incerteza, sem XP;
- atividades são eventos cronológicos, não notificações genéricas;
- ajuda é contextual ao próximo passo;
- oportunidades com fluxos diferentes podem mostrar etapas diferentes.

## Arquitetura sugerida

O backend deve produzir fatos; o planejador deve produzir recomendações explicáveis.

```ts
type JourneyPlanningInput = {
  profile: StudentProfile;
  relationships: StudentOpportunityRelationship[];
  opportunities: OpportunitySnapshot[];
  events: JourneyEvent[];
  availableMaterials: Material[];
};

type PlannedAction = {
  id: string;
  opportunityId?: string;
  label: string;
  reasonCodes: string[];
  explanation: string;
  estimatedMinutes?: number;
  href: string;
};
```

O texto pode ser gerado por IA, mas prazo, pendências, estágio e duração devem vir de dados estruturados. Guardar `reasonCodes` permite auditoria, feedback e fallback determinístico.

## Eventos mínimos

```text
opportunity_saved
intent_changed
official_page_visited
checklist_item_completed
stage_changed
coach_check_in_answered
material_opened
community_question_created
mentor_replied
deadline_changed
result_published
```

O feed deve derivar desses eventos e suportar paginação. Não persistir frases prontas como fonte única do histórico.
