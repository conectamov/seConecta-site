# Comportamento do ciclo da oportunidade

A timeline é exibida como o primeiro elemento de **Visão geral** e não possui título próprio. Ela deve ocupar pouca altura e permitir rolagem horizontal em telas pequenas. Ao abrir a aba no mobile, a etapa relevante é centralizada automaticamente.

## Casos suportados

### Ciclo ativo

- Use o índice da etapa atual fornecido pelos metadados.
- Etapas anteriores aparecem concluídas.
- A etapa atual recebe o marcador `Agora`.
- Etapas posteriores permanecem visíveis com menor intensidade.

### Ciclo ainda não iniciado

- Passe `currentStepIndex = -1`.
- Nenhuma etapa aparece concluída.
- A primeira etapa recebe o marcador `Próxima`.

### Ciclo concluído

- Passe `currentStepIndex = steps.length`.
- Todas as etapas aparecem concluídas.
- A última etapa recebe o marcador `Concluído`.

### Sem ciclo confiável

- Passe uma lista vazia ou `currentStepIndex = null`.
- A timeline não é renderizada e nenhum ciclo é inventado.
- Os boxes de Visão geral tornam-se o primeiro conteúdo da aba.

## Distribuição de cores

- Azul: abertura das inscrições.
- Coral: prazo ou encerramento.
- Violeta: entrevistas, avaliação ou seleção.
- Dourado: divulgação de resultados.
- Verde: início do programa.
- Etapas desconhecidas usam a sequência semântica acima como fallback.
