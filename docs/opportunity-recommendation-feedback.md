# Feedback de recomendação na oportunidade

Pergunta:

> Ela combina com o que você procura?

## Objetivo

Coletar um sinal de recomendação sem interromper a decisão, competir com ações importantes ou acompanhar o estudante para fora do contexto da oportunidade.

## Quando fica elegível

O prompt aparece apenas quando uma destas condições é atendida:

1. **12 segundos de tempo ativo + 28% da página percorrida**; ou
2. **25 segundos de tempo ativo**, como fallback para quem lê sem rolar muito.

Tempo em outra aba não conta. Salvar, participar ou abrir o site oficial não dispara o prompt imediatamente: a confirmação dessas ações deve ser o único feedback naquele momento.

## Limites

- no máximo uma exibição por oportunidade em cada sessão;
- desaparece automaticamente depois de 8 segundos;
- ao sair da rota da oportunidade, desaparece imediatamente;
- ao trocar diretamente entre duas oportunidades, o prompt anterior é cancelado e a nova oportunidade precisa conquistar sua própria elegibilidade;
- ao fechar explicitamente, entra em cooldown de 7 dias;
- depois de responder, não volta a aparecer para aquela oportunidade.

## Casos de navegação

| Situação | Comportamento |
| --- | --- |
| Abriu e saiu rapidamente | Não aparece |
| Leu e rolou a página | Pode aparecer após 12 s ativos |
| Ficou lendo o hero sem rolar | Pode aparecer após 25 s ativos |
| Trocou de oportunidade | Fecha o anterior; não transfere o prompt |
| Foi para Explorar, Jornada ou Comunidade | Fecha imediatamente |
| Voltou na mesma sessão | Não reaparece |
| Fechou no X | Pode voltar depois de 7 dias |
| Respondeu | Resposta persistida; não pergunta novamente |

## Evolução futura

Com backend, `recommendation_feedback` deve registrar `opportunity_id`, `user_id`, `feedback_score` e `timestamp`. Os limites de sessão e cooldown podem continuar locais para resposta imediata, sincronizados depois da autenticação.
