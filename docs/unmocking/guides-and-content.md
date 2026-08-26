# Guias, conteúdo e edição

## O que está mockado

Fontes:

- `content/opportunity-guides/*.md`;
- `services/opportunity-guide-markdown-service.ts`;
- `components/opportunity-detail/opportunity-guide.tsx`;
- `components/opportunity-detail/opportunity-guide-editor.tsx`.

O conteúdo curado vem do filesystem. O editor está aberto para todos e salva em `localStorage`; não existe publicação compartilhada, upload, histórico ou permissão.

## O que deve permanecer

- Markdown é o formato editorial;
- imagens, vídeos, tabelas, checklists e referências continuam suportados;
- HTML arbitrário permanece desativado;
- oportunidades sem guia curado recebem fallback por metadados;
- o Guia é estável e organizado; discussões da comunidade não são inseridas diretamente;
- referências ficam no fim do artigo;
- a UI de leitura e o renderer não dependem do futuro CMS.

## Modelo sugerido

```ts
type GuideRevision = {
  id: string;
  opportunityId: string;
  markdown: string;
  title: string;
  summary: string;
  status: "draft" | "review" | "published" | "archived";
  version: number;
  authorId: string;
  createdAt: string;
  publishedAt?: string;
};
```

## Desmockagem

1. Criar serviço de conteúdo que retorne a revisão publicada.
2. Manter fallback local enquanto o conteúdo ainda não existir.
3. Trocar `localStorage` do editor por autosave de rascunho.
4. Adicionar versionamento otimista e conflito de edição.
5. Inserir permissão no `canEdit`, sem alterar o renderer.
6. Upload deve retornar URL de mídia; o editor insere a sintaxe Markdown atual.
7. Publicar deve invalidar cache/SSG da rota da oportunidade.
8. Registrar autor, revisão, fonte e data de verificação.

## Permissões futuras

Papéis possíveis:

- leitor;
- colaborador;
- revisor;
- editor/publicador;
- administrador.

Contribuições da comunidade devem entrar como sugestão/revisão, nunca substituir silenciosamente o Guia publicado.

