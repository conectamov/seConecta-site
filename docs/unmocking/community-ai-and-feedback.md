# Comunidade, IA, recomendações e feedback

## Comunidade mockada

Fontes:

- `data/opportunity-knowledge-hubs.ts`;
- `components/community/opportunity-community-hub-page.tsx`;
- `components/opportunity-detail/opportunity-community-preview.tsx`.

Perguntas, respostas, experiências, recursos, pessoas, contadores e timestamps são fixos. Publicar apenas altera estado local. O grupo do WhatsApp usa uma variável de ambiente/fallback.

### Contrato de produto

- toda discussão pertence a uma oportunidade;
- ordem: Perguntas, Experiências, Recursos, Pessoas;
- não criar fórum genérico;
- não revelar quem está preparando; mostrar somente quantidade quando maior que 10;
- o detalhe da oportunidade mostra preview/CTA, não um feed completo;
- pessoas exibidas têm relação verificável com a oportunidade;
- recursos da comunidade permanecem separados do Guia curado.

Entidades mínimas:

```text
OpportunityHub
Question -> Answers
Experience
SharedResource
OpportunityPersonConnection
OpportunityUpdate
```

Perguntas precisam suportar criação, resposta, melhor resposta, moderação e paginação. O pipeline futuro é:

```text
Pergunta -> discussão -> melhores respostas -> sugestão editorial
-> revisão humana -> artigo do Guia -> contexto da IA
```

## IA mockada

Fonte atual: `components/opportunity-detail/opportunity-community-preview.tsx`.

A resposta é escolhida por palavras-chave e aparece após um timer. Não há chamada de modelo, memória ou streaming.

### Contexto obrigatório

Ao conectar uma IA real, enviar:

- oportunidade atual e versão dos metadados;
- perfil/onboarding autorizado;
- raciocínio real da recomendação;
- outras oportunidades salvas;
- relação e estágio atual;
- checklist;
- fontes do Guia;
- pergunta original.

A resposta deve distinguir fatos de orientação, citar fontes para regras/prazos e nunca afirmar experiência pessoal. Eligibility, deadline e requisitos devem vir de dados estruturados, não da memória do modelo.

Preservar loading, resposta contextual, “o que considerei”, próximo passo e ligação ao checklist. Adicionar erro, retry, cancelamento e streaming.

## Recomendação e orientação

Orientações em `data/opportunity-details.ts` são mockadas. O sistema real deve ser honesto:

- oportunidade recomendada: explicar sinais reais;
- oportunidade descoberta fora das recomendações: dizer isso;
- baixa prioridade: explicar naturalmente e sugerir alternativa;
- não mostrar percentuais artificiais;
- não expor “relatório de IA”.

Persistir `recommendationId`, `reasonCodes`, versão do perfil/modelo e oportunidade para que a explicação seja reproduzível.

## Feedback

O comportamento completo está em `docs/opportunity-recommendation-feedback.md`.

O backend deve receber:

```ts
type RecommendationFeedbackPayload = {
  opportunityId: string;
  recommendationId?: string;
  feedbackScore: -1 | 0 | 1;
  context?: "opportunity_detail";
  timestamp: string;
};
```

Preservar limites de sessão/cooldown na UI. Enviar de forma assíncrona e manter fila local caso a rede falhe.

## Notificações

Lembretes e mensagens ainda não são enviados. Quando conectados:

- respeitar canal e consentimento;
- nunca inferir candidatura pela visita ao site;
- deduplicar eventos;
- registrar entrega/leitura;
- permitir desligar por oportunidade e globalmente;
- usar timezone do estudante e datas ISO da oportunidade.

