# Backlog de produto — descoberta de oportunidades

Este documento registra decisões deliberadamente adiadas no redesign V2 de `/explorar`. A interface atual não deve mascarar essas lacunas com resultados genéricos ou regras inventadas no frontend.

## Critério definitivo de recomendação

- Definir o score mínimo e a confiança necessária para uma oportunidade ser chamada de recomendação.
- Definir como qualidade editorial, aderência ao perfil, prazo e momento da Jornada entram no ranking.
- Validar a regra de no mínimo três oportunidades por experimento, sem completar a seção com itens genéricos.
- Explicar recomendações com razões estruturadas e auditáveis, sem deixar o LLM decidir elegibilidade.
- Medir qualidade por abertura, save, início de preparação, feedback explícito e aplicação, com proteção contra loops de popularidade.
- Expor no catálogo público o action mode canônico e personalizado; até lá, os cards usam somente uma orientação temporal determinística baseada em lifecycle, prazo e `actionable`.

## Qualidade do catálogo

- Reduzir progressivamente oportunidades com lifecycle ou prazo desconhecido por meio do workflow de curadoria.
- Definir quando oportunidades recorrentes sem edição atual podem aparecer como caminho de preparação.
- Tornar os filtros disponíveis dependentes da cobertura real de dados, sem exibir dimensões vazias.

## Ativação multicanal

- Comparar WhatsApp versus autenticação no site como CTA principal após uma ação de valor.
- Definir o momento e a frequência do convite após o primeiro save, sem interromper exploração repetidamente.
- Preservar saves anônimos até a autenticação e importar a Jornada exatamente uma vez.
- Medir onboarding concluído, identidade verificada, handoff consumido, primeira ação significativa e retorno em sete dias.

## Métricas de descoberta

- Registrar uso de busca, chips e filtros com eventos idempotentes e taxonomia versionada.
- Medir consulta sem resultado, refinamento posterior, abertura e save por origem da descoberta.
- Diferenciar recomendação personalizada, busca explícita, chip editorial e navegação do catálogo.
- Não usar dados comportamentais para adaptar pesos automaticamente antes de haver critérios de segurança, explicabilidade e avaliação offline.
