# Guias de oportunidades em Markdown

Cada guia curado fica em:

`content/opportunity-guides/<slug-da-oportunidade>.md`

Se o arquivo não existir, a plataforma monta automaticamente um guia a partir dos metadados da oportunidade. Assim, novas oportunidades não quebram a página enquanto aguardam curadoria.

## Metadados

O arquivo pode começar com:

```md
---
title: Guia para Nome da oportunidade
summary: Uma descrição curta do conteúdo.
updatedAt: Revisado em 23 de julho de 2026
readTime: 8 min de leitura
---
```

## Conteúdo suportado

Use Markdown padrão e GitHub Flavored Markdown:

- títulos, listas e links;
- tabelas;
- checklists com `- [ ]` e `- [x]`;
- citações;
- blocos de código;
- imagens;
- referências internas e externas.

Imagem:

```md
![Legenda da imagem](/images/guias/exemplo.jpg)
```

Vídeo do YouTube ou Vimeo:

```md
![Vídeo: Webinar de preparação](https://www.youtube.com/watch?v=VIDEO_ID)
```

Arquivo de vídeo:

```md
![Vídeo: Como organizar a candidatura](/videos/preparacao.mp4)
```

Links HTTP são abertos em uma nova aba. HTML arbitrário não é renderizado; isso mantém os guias seguros mesmo quando o conteúdo vier de um CMS no futuro.

## Editor mockado

O botão **Editar guia** está disponível para todos durante a fase de protótipo. A edição:

- abre um editor Markdown com pré-visualização;
- oferece atalhos para títulos, checklists, links, imagens e vídeos;
- salva uma cópia por oportunidade no `localStorage`;
- permite restaurar o conteúdo original do arquivo `.md`.

O componente recebe a prop `canEdit`. Quando as permissões existirem no backend, essa prop deve ser calculada a partir da função do usuário. O salvamento local deve então ser substituído por versionamento no serviço de conteúdo, sem alterar o renderer do Guia.
