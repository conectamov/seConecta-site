# Guias de oportunidades em Markdown

Cada guia publicado vem do contrato canônico da oportunidade na API. O portal de
staff é a única superfície de edição; a página pública apenas renderiza o Markdown
publicado e nunca salva rascunhos no navegador do estudante.

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

Rascunhos e publicação são autorizados pelo backend de staff. Uma edição local
nunca pode substituir o conteúdo que um Student vê.
