# Oportunidades e relação com a Jornada

## O que está mockado

### Catálogo

Fonte atual: `data/opportunity-details.ts`.

Estão fixos em TypeScript:

- título, organização e URL oficial;
- logo/capa;
- prazo e estado do ciclo;
- requisitos e timeline;
- competitividade e preparação estimada;
- orientação e motivos da recomendação;
- pessoas, FAQ, semelhantes e descoberta.

### Relação estudante–oportunidade

Fontes atuais:

- `types/opportunity-journey.ts`;
- `services/opportunity-journey-service.ts`;
- `components/opportunity-journey-provider.tsx`.

Jornadas e feedback ficam em `localStorage`; `userId` é `local-student`.

## Separação que não pode ser perdida

`OpportunityDetail` descreve a oportunidade. `OpportunityJourney` descreve a relação de um estudante com ela.

Nunca inserir checklist concluído, prioridade, intenção ou etapa do usuário no registro global da oportunidade.

```text
Opportunity
  id, organization, officialUrl, requirements, cycle...

StudentOpportunityRelationship
  userId, opportunityId, modelId, intent, priority, stage,
  officialPageVisitedAt, checklist, timestamps...
```

## Estados preservados

Modelo de candidatura:

- `watching`;
- `interested`;
- `visitedOfficialPage`;
- `preparing`;
- `applied`;
- `waitingForResult`;
- `accepted`;
- `participating`;
- `rejected`;
- `completed`;
- `archived`.

O usuário pode alternar entre observar e candidatar-se. Essa mudança atualiza intenção, prioridade e estágio de forma coerente.

Abrir a URL oficial significa apenas `visitedOfficialPage`. Nunca inferir que houve candidatura.

## Ações e efeitos esperados

| Ação | Persistência |
| --- | --- |
| Acompanhar | `intent=follow`, `priority=low`, `stage=watching` |
| Participar | `intent=apply`, `priority=high`, `stage=interested` |
| Abrir página oficial | preencher `officialPageVisitedAt`; avançar apenas de `interested` |
| Marcar checklist | atualizar relação; pode iniciar `preparing` |
| Alterar status | validar transição pelo `JourneyModel` |
| Remover | remover/arquivar a relação e mostrar “Removido da sua jornada.” |

## API sugerida

```text
GET    /opportunities
GET    /opportunities/:id
GET    /me/opportunity-relationships
PUT    /me/opportunity-relationships/:opportunityId
PATCH  /me/opportunity-relationships/:opportunityId/stage
PATCH  /me/opportunity-relationships/:opportunityId/checklist
POST   /me/opportunity-relationships/:opportunityId/official-visit
DELETE /me/opportunity-relationships/:opportunityId
```

Mutations devem ser otimistas, com `updatedAt`/versão para evitar sobrescrever mudanças feitas em outro dispositivo.

## Regra da seção “Recomendado para você”

O ranking ainda é calculado no cliente em `app/explorar/page.tsx`. A seção pode repetir uma oportunidade já visualizada, mas nunca deve mostrar uma oportunidade que já possua uma relação salva em `OpportunityJourney`.

Ao mover o ranking para o backend:

```text
GET /me/recommendations?surface=explore
```

o serviço deve excluir os `opportunityId` já presentes em `/me/opportunity-relationships`. O catálogo e a busca continuam mostrando essas oportunidades normalmente. Não criar histórico de impressão para implementar essa regra: o critério é a oportunidade estar salva, não ter sido exibida.

## Ciclos futuros

Não hardcodar candidatura na página. O backend deve entregar um `JourneyModel` ou template:

- candidatura;
- olimpíada/competição;
- evento;
- programa com fases próprias.

Cada modelo define etapas permitidas, transições, checklist e nomenclatura, sem espalhar condições pela UI.
