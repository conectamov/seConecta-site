"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Calculator,
  Check,
  Code2,
  FlaskConical,
  Gift,
  Globe2,
  GraduationCap,
  HeartHandshake,
  Landmark,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trophy,
  UsersRound,
  Wifi,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { useOpportunityCatalog } from "@/components/opportunity-catalog-provider";
import { useOpportunityJourney } from "@/components/opportunity-journey-provider";
import { OpportunityWorkspaceNav } from "@/components/opportunity-workspace-nav";
import { SiteHeader } from "@/components/site-header";
import { useJourneyOnboarding } from "@/hooks/use-journey-onboarding";
import { useStudentRecommendations } from "@/hooks/use-student-recommendations";
import {
  countActiveFilters,
  emptyDiscoveryFilters,
  filterDiscoveryOpportunities,
  getOpportunityActionCue,
  getOpportunitySubjectLabels,
  getOpportunityTypePresentation,
  selectAnonymousRecommendations,
  selectApiRecommendations,
  sortDiscoveryOpportunities,
  type DiscoveryFilterState,
} from "@/services/opportunity-discovery-service";
import type { Opportunity, OpportunityMetadata } from "@/types/opportunity-catalog";
import type { OnboardingProfile } from "@/types/onboarding";
import type { OpportunityJourney } from "@/types/opportunity-journey";
import type { RecommendationItemApi } from "@/types/seconecta-api";

type FilterDimension = keyof DiscoveryFilterState;

const discoveryChips = [
  { label: "Matemática", dimension: "themes" as const, value: "Matemática", icon: Calculator, tone: "mint", profileMatch: (profile: OnboardingProfile) => profile.subjects.includes("MATHEMATICS") },
  { label: "Olimpíadas", dimension: "opportunityTypes" as const, value: "Olimpíada", icon: Trophy, tone: "lilac", profileMatch: (profile: OnboardingProfile) => profile.primary_goal === "OLYMPIAD_TRAINING" },
  { label: "Internacional", dimension: "locations" as const, value: "Internacional", icon: Globe2, tone: "blue", profileMatch: (profile: OnboardingProfile) => profile.primary_goal === "STUDY_ABROAD" },
  { label: "Pesquisa", dimension: "opportunityTypes" as const, value: "Pesquisa", icon: FlaskConical, tone: "peach", profileMatch: (profile: OnboardingProfile) => profile.primary_goal === "RESEARCH" },
  { label: "Gratuitas", dimension: "funding" as const, value: "free", icon: Gift, tone: "yellow", profileMatch: () => false },
  { label: "Online", dimension: "deliveryModes" as const, value: "ONLINE", icon: Wifi, tone: "rose", profileMatch: () => false },
];

const filterLabels: Record<string, string> = {
  free: "Gratuitas",
  fullScholarship: "Bolsa integral",
  partialScholarship: "Bolsa parcial",
  ONLINE: "Online",
  IN_PERSON: "Presencial",
  HYBRID: "Híbrido",
  open: "Abertas e próximas",
  unknown: "Prazo a confirmar",
  closed: "Encerradas",
};

const typeIcons: Record<ReturnType<typeof getOpportunityTypePresentation>["icon"], LucideIcon> = {
  trophy: Trophy,
  flask: FlaskConical,
  graduation: GraduationCap,
  sun: Sun,
  calendar: CalendarDays,
  users: UsersRound,
  heart: HeartHandshake,
  code: Code2,
  wrench: Wrench,
  landmark: Landmark,
  sparkles: Sparkles,
};

function toggleValue(filters: DiscoveryFilterState, dimension: FilterDimension, value: string) {
  const values = filters[dimension];
  return {
    ...filters,
    [dimension]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
  };
}

function DiscoveryCard({
  opportunity,
  metadata,
  journey,
  recommendation,
  onSave,
  onRemove,
  onRecommendationEvent,
}: {
  opportunity: Opportunity;
  metadata: OpportunityMetadata;
  journey?: OpportunityJourney;
  recommendation?: RecommendationItemApi;
  onSave: (opportunity: Opportunity) => void;
  onRemove: (id: number) => void;
  onRecommendationEvent?: (eventType: "IMPRESSION" | "OPEN", item: RecommendationItemApi) => void;
}) {
  const cardRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const typePresentation = getOpportunityTypePresentation(metadata.typeCode, metadata.opportunityTypes[0] ?? opportunity.category);
  const TypeIcon = typeIcons[typePresentation.icon];
  const actionCue = getOpportunityActionCue(opportunity, metadata);
  const subjectLabels = getOpportunitySubjectLabels(metadata.themes);

  useEffect(() => {
    const target = cardRef.current;
    if (!target || !recommendation || !onRecommendationEvent) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        onRecommendationEvent("IMPRESSION", recommendation);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [onRecommendationEvent, recommendation]);

  return (
    <motion.article
      ref={cardRef}
      layout={!prefersReducedMotion}
      className={`discovery-v2-card is-${typePresentation.tone}`}
      transition={{ duration: 0.18 }}
    >
      <Link
        className="discovery-v2-card-link"
        href={`/oportunidades/${opportunity.slug ?? opportunity.id}`}
        onClick={() => recommendation && onRecommendationEvent?.("OPEN", recommendation)}
        aria-label={`Abrir ${opportunity.title}`}
      >
        <span className={`discovery-v2-type is-${typePresentation.tone}`}>
          <TypeIcon size={15} aria-hidden="true" /> {typePresentation.label}
        </span>
        <h3>{opportunity.title}</h3>
        <p>{opportunity.description}</p>
        {subjectLabels.length > 0 && <span className="discovery-v2-subjects" aria-label="Assuntos da oportunidade">
          {subjectLabels.map((subject) => <span key={subject}>{subject}</span>)}
        </span>}
        <span className="discovery-v2-footer">
          <span className={`discovery-v2-action is-${actionCue.tone}`}>
            <CalendarDays size={15} aria-hidden="true" />
            <strong>{actionCue.label}</strong><i>·</i><span>{actionCue.detail}</span>
          </span>
          <span className="discovery-v2-open">
            Ver tudo <ArrowRight size={14} aria-hidden="true" />
          </span>
        </span>
      </Link>
      <button
        className={`discovery-v2-save ${journey ? "is-saved" : ""}`}
        type="button"
        onClick={() => journey ? onRemove(opportunity.id) : onSave(opportunity)}
        aria-label={journey ? `Remover ${opportunity.title} da Jornada` : `Salvar ${opportunity.title} na Jornada`}
        aria-pressed={Boolean(journey)}
      >
        <Bookmark size={19} fill={journey ? "currentColor" : "none"} />
      </button>
    </motion.article>
  );
}

function FilterGroup({ title, dimension, options, filters, onToggle }: {
  title: string;
  dimension: FilterDimension;
  options: string[];
  filters: DiscoveryFilterState;
  onToggle: (dimension: FilterDimension, value: string) => void;
}) {
  if (!options.length) return null;
  return <fieldset className="discovery-v2-filter-group">
    <legend>{title}</legend>
    <div>
      {options.map((value) => <label key={value}>
        <input type="checkbox" checked={filters[dimension].includes(value)} onChange={() => onToggle(dimension, value)} />
        <span><Check size={13} />{filterLabels[value] ?? value}</span>
      </label>)}
    </div>
  </fieldset>;
}

export function OpportunityDiscoveryV2() {
  const { profile, startOnboarding } = useJourneyOnboarding();
  const { session } = useAuthentication();
  const { journeys, startJourney, removeJourney } = useOpportunityJourney();
  const { opportunities, opportunityMetadata, ready, error } = useOpportunityCatalog();
  const recommendations = useStudentRecommendations();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<DiscoveryFilterState>(emptyDiscoveryFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recommendationInfoOpen, setRecommendationInfoOpen] = useState(false);
  const savedIds = useMemo(() => journeys.map((journey) => journey.opportunityId), [journeys]);

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("busca");
    if (initialQuery) setQuery(initialQuery);
  }, []);

  useEffect(() => {
    if (!filtersOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setFiltersOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [filtersOpen]);

  const orderedChips = useMemo(() => discoveryChips
    .map((chip, index) => ({ ...chip, index, selected: profile ? chip.profileMatch(profile) : false }))
    .sort((a, b) => Number(b.selected) - Number(a.selected) || a.index - b.index), [profile]);

  const recommendationById = useMemo(() => new Map(
    (recommendations.result?.items ?? []).map((item) => [item.opportunity_id, item]),
  ), [recommendations.result]);

  const recommendedOpportunities = useMemo(() => session
    ? selectApiRecommendations(opportunities, opportunityMetadata, [...recommendationById.keys()], savedIds)
    : selectAnonymousRecommendations(opportunities, opportunityMetadata, profile, savedIds),
  [opportunities, opportunityMetadata, profile, recommendationById, savedIds, session]);

  const filtered = useMemo(() => sortDiscoveryOpportunities(
    filterDiscoveryOpportunities(opportunities, opportunityMetadata, filters, query),
    opportunityMetadata,
  ), [filters, opportunities, opportunityMetadata, query]);

  const availableOptions = useMemo(() => {
    const metadata = opportunities.map((item) => opportunityMetadata[item.id]).filter(Boolean);
    const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR"));
    return {
      themes: unique(metadata.flatMap((item) => item.themes)),
      opportunityTypes: unique(metadata.flatMap((item) => item.opportunityTypes)),
      locations: unique(metadata.map((item) => item.location)),
      funding: unique(metadata.map((item) => item.funding).filter((value) => value !== "unknown")),
      deliveryModes: unique(metadata.map((item) => item.deliveryMode).filter((value) => value !== "UNKNOWN")),
      educationLevels: unique(metadata.flatMap((item) => item.educationLevels)),
      applicationStatuses: ["open", "unknown", "closed"].filter((status) => metadata.some((item) => status === "open" ? item.applicationStatus !== "closed" && item.applicationStatus !== "unknown" : item.applicationStatus === status)),
    };
  }, [opportunities, opportunityMetadata]);

  const activeCount = countActiveFilters(filters);
  const activeFilters = (Object.entries(filters) as [FilterDimension, string[]][]).flatMap(([dimension, values]) => values.map((value) => ({ dimension, value })));
  const updateFilter = (dimension: FilterDimension, value: string) => setFilters((current) => toggleValue(current, dimension, value));

  if (!ready) return <><SiteHeader /><main className="opportunities-page"><OpportunityWorkspaceNav active="explore" /><div className="explore-shell py-20"><div className="h-48 animate-pulse rounded-[24px] bg-[#e5ece8]" /></div></main></>;
  if (error) return <><SiteHeader /><main className="opportunities-page"><OpportunityWorkspaceNav active="explore" /><div className="explore-shell py-20 text-center"><h1 className="text-2xl font-semibold">Catálogo temporariamente indisponível</h1><p className="mt-3 text-sm text-[#66736d]">{error}</p><button className="mt-6 rounded-full bg-[#079272] px-5 py-3 text-sm font-semibold text-white" type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div></main></>;

  return <>
    <SiteHeader />
    <main className="opportunities-page discovery-v2">
      <OpportunityWorkspaceNav active="explore" />
      <section className="discovery-v2-search" aria-labelledby="discovery-v2-title">
        <div className="explore-shell">
          <h1 id="discovery-v2-title" className="sr-only">Descubra oportunidades para sua jornada</h1>
          <div className="discovery-v2-searchbox">
            <Search size={21} aria-hidden="true" />
            <label className="sr-only" htmlFor="discovery-v2-query">Pesquisar oportunidades</label>
            <input id="discovery-v2-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por nome, assunto ou objetivo…" autoComplete="off" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar pesquisa"><X size={18} /></button>}
          </div>
          <div className="discovery-v2-chips" aria-label="Sugestões para experimentar">
            <strong>Experimente:</strong>
            <div>
              {orderedChips.map(({ label, dimension, value, icon: Icon, tone }) => {
                const active = filters[dimension].includes(value);
                return <button className={`is-${tone} ${active ? "is-active" : ""}`} type="button" key={label} aria-pressed={active} onClick={() => updateFilter(dimension, value)}>
                  <Icon size={16} aria-hidden="true" />{label}
                </button>;
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="explore-shell discovery-v2-content">
        {recommendedOpportunities.length === 3 && <section className="discovery-v2-recommended" aria-labelledby="discovery-v2-recommended-title">
          <div className="discovery-v2-section-heading">
            <div><span>Uma seleção para começar</span><h2 id="discovery-v2-recommended-title">Recomendado para você</h2></div>
            <button type="button" onClick={() => setRecommendationInfoOpen((open) => !open)} aria-expanded={recommendationInfoOpen}>Como funciona?</button>
          </div>
          {recommendationInfoOpen && <div className="discovery-v2-recommendation-info"><p>Usamos suas preferências explícitas e apenas oportunidades verificadas. Não completamos esta seleção com sugestões genéricas.</p><button type="button" onClick={startOnboarding}>Atualizar preferências</button></div>}
          <div className="discovery-v2-grid">
            {recommendedOpportunities.map((item) => <DiscoveryCard key={item.id} opportunity={item} metadata={opportunityMetadata[item.id]} recommendation={recommendationById.get(item.id)} journey={journeys.find((journey) => journey.opportunityId === item.id)} onSave={startJourney} onRemove={removeJourney} onRecommendationEvent={recommendations.record} />)}
          </div>
        </section>}

        <section id="all-opportunities" className="discovery-v2-catalog" aria-labelledby="discovery-v2-catalog-title">
          <div className="discovery-v2-section-heading discovery-v2-catalog-heading">
            <div><span>Explore no seu ritmo</span><h2 id="discovery-v2-catalog-title">Oportunidades</h2><p>{filtered.length} {filtered.length === 1 ? "oportunidade encontrada" : "oportunidades encontradas"}</p></div>
            <button className="discovery-v2-filter-button" type="button" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
              <SlidersHorizontal size={17} /> Filtrar {activeCount > 0 && <b>{activeCount}</b>}
            </button>
          </div>

          {activeFilters.length > 0 && <div className="discovery-v2-active-filters" aria-label="Filtros ativos">
            {activeFilters.map(({ dimension, value }) => <button type="button" key={`${dimension}-${value}`} onClick={() => updateFilter(dimension, value)}>{filterLabels[value] ?? value}<X size={13} /></button>)}
            <button className="is-clear" type="button" onClick={() => setFilters(emptyDiscoveryFilters)}>Limpar filtros</button>
          </div>}

          {filtered.length > 0 ? <div className="discovery-v2-grid">
            {filtered.map((item) => <DiscoveryCard key={item.id} opportunity={item} metadata={opportunityMetadata[item.id]} journey={journeys.find((journey) => journey.opportunityId === item.id)} onSave={startJourney} onRemove={removeJourney} />)}
          </div> : <div className="discovery-v2-empty"><Search size={25} /><h3>Nenhuma oportunidade com esses filtros</h3><p>A busca considera apenas oportunidades verificadas. Remova os filtros para voltar ao catálogo principal.</p><button type="button" onClick={() => { setFilters(emptyDiscoveryFilters); setQuery(""); }}>Limpar filtros</button></div>}
        </section>
      </div>

      {filtersOpen && <div className="discovery-v2-filter-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}>
        <aside className="discovery-v2-filter-panel" role="dialog" aria-modal="true" aria-labelledby="discovery-v2-filter-title">
          <header><div><span>Refine sua busca</span><h2 id="discovery-v2-filter-title">Filtros</h2></div><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fechar filtros"><X size={20} /></button></header>
          <div className="discovery-v2-filter-scroll">
            <FilterGroup title="Tipo de oportunidade" dimension="opportunityTypes" options={availableOptions.opportunityTypes} filters={filters} onToggle={updateFilter} />
            <FilterGroup title="Assuntos" dimension="themes" options={availableOptions.themes} filters={filters} onToggle={updateFilter} />
            <FilterGroup title="Formato" dimension="deliveryModes" options={availableOptions.deliveryModes} filters={filters} onToggle={updateFilter} />
            <FilterGroup title="Custo e acesso" dimension="funding" options={availableOptions.funding} filters={filters} onToggle={updateFilter} />
            <FilterGroup title="Nível de ensino" dimension="educationLevels" options={availableOptions.educationLevels} filters={filters} onToggle={updateFilter} />
            <FilterGroup title="Localização" dimension="locations" options={availableOptions.locations} filters={filters} onToggle={updateFilter} />
            <FilterGroup title="Inscrições" dimension="applicationStatuses" options={availableOptions.applicationStatuses} filters={filters} onToggle={updateFilter} />
          </div>
          <footer><button type="button" onClick={() => setFilters(emptyDiscoveryFilters)}>Limpar</button><button type="button" onClick={() => setFiltersOpen(false)}>Ver {filtered.length} oportunidades <ArrowRight size={16} /></button></footer>
        </aside>
      </div>}
    </main>
  </>;
}
