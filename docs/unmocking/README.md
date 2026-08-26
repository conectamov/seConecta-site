# Plano de desmockagem do seConecta

Este diretório registra o que hoje é simulado e, principalmente, quais contratos de produto devem permanecer quando APIs, banco de dados, IA e permissões reais forem conectados.

## Regra central

Desmockar não significa reescrever a experiência. A camada real deve substituir a origem dos dados e os efeitos externos, preservando:

- linguagem e hierarquia da interface;
- separação entre oportunidade e relação estudante–oportunidade;
- estados, transições e feedbacks já definidos;
- continuidade de ações iniciadas anonimamente;
- carregamento, vazio, erro e atualização otimista;
- contexto usado por Jornada, IA e recomendações.

## Ordem recomendada

1. Autenticação e identidade.
2. Perfil/onboarding e migração dos dados anônimos.
3. Catálogo e detalhes de oportunidades.
4. Relação estudante–oportunidade e checklist.
5. Planejamento e atividade da Jornada.
6. Recomendações e feedback.
7. Guias, permissões editoriais e mídia.
8. Comunidade e pessoas.
9. IA contextual e notificações.

## Mapa

| Domínio | Mock atual | Documento |
| --- | --- | --- |
| Identidade e perfil | `localStorage`, timers e identidades fixas | [authentication-and-profile.md](./authentication-and-profile.md) |
| Oportunidades e Jornada | objetos TypeScript e relacionamento local | [opportunities-and-journey.md](./opportunities-and-journey.md) |
| SEO de oportunidades | metadados e FAQ derivados do catálogo local | [opportunity-seo.md](./opportunity-seo.md) |
| Planejamento da Jornada | regras determinísticas, atividades e progresso inventados | [journey-planning.md](./journey-planning.md) |
| Guias | Markdown no filesystem e editor no navegador | [guides-and-content.md](./guides-and-content.md) |
| Comunidade e IA | listas fixas e respostas geradas no cliente | [community-ai-and-feedback.md](./community-ai-and-feedback.md) |

## Critério de conclusão por domínio

Um mock só deve ser considerado removido quando:

- existe contrato tipado entre UI e fonte real;
- loading, erro, vazio e retry foram tratados;
- atualização otimista possui rollback;
- dados anônimos são mesclados depois da autenticação;
- navegação e cópia permanecem coerentes;
- eventos importantes possuem telemetria;
- o fallback local foi removido ou explicitamente mantido para funcionamento offline.
