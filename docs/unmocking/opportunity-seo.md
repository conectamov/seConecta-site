# SEO das oportunidades

## Fonte única

`OpportunityDetail` é a fonte de:

- slug e URL canônica;
- título e descrição;
- OpenGraph e Twitter Card;
- dados estruturados da oportunidade;
- breadcrumbs;
- FAQ visível e `FAQPage`;
- entradas do sitemap.

Adicionar uma oportunidade ao catálogo já cria a rota `/oportunidades/[slug]` e todos esses artefatos. A implementação compartilhada fica em `services/opportunity-seo-service.ts`.

## FAQ

`generateOpportunityFaqs` combina:

1. informações oficiais registradas na oportunidade;
2. perguntas recorrentes do hub da comunidade;
3. resumos determinísticos da seConecta sobre preparação.

Cada item mantém `source`. A mesma coleção alimenta a interface e o JSON-LD para impedir divergência entre conteúdo visível e schema.

Ao conectar IA real, ela deve somente resumir fontes persistidas. A resposta precisa guardar IDs das fontes, data de geração e versão do modelo. Não publicar no schema respostas sem fonte ou confiança suficiente.

## Backend/CMS

O futuro endpoint de oportunidade deve entregar um slug único e estável:

```text
GET /opportunities/:slug
GET /opportunities/:slug/faq
```

Campos editoriais recomendados:

```ts
type OpportunitySeo = {
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
  socialImageUrl?: string;
  editionYear?: number;
  verifiedAt?: string;
};
```

Overrides são opcionais. Sem eles, os geradores continuam produzindo metadata automaticamente.

## Publicação

- Definir `NEXT_PUBLIC_SITE_URL` com a origem pública.
- Invalidar a rota e o sitemap quando a oportunidade mudar.
- Manter redirect permanente de URLs numéricas antigas.
- Não indexar páginas inexistentes ou rascunhos.
- Validar JSON-LD no Rich Results Test antes de publicar mudanças de schema.
