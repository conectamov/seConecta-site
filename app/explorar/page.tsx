"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  FlaskConical,
  Gauge,
  GraduationCap,
  LayoutGrid,
  MapPin,
  Monitor,
  RotateCcw,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type Dispatch, type MouseEvent as ReactMouseEvent, type SetStateAction } from "react";
import { SiteHeader } from "@/components/site-header";
import { OpportunityWorkspaceNav } from "@/components/opportunity-workspace-nav";
import { OpportunityDiscoveryV2 } from "@/components/opportunity-discovery-v2";
import { useOpportunityJourney } from "@/components/opportunity-journey-provider";
import { useOpportunityCatalog } from "@/components/opportunity-catalog-provider";
import { OpportunityShareModal, type ShareableOpportunity } from "@/components/opportunity-share-modal";
import { whatsappCommunityUrl } from "@/components/whatsapp-help-link";
import { SelectBox } from "@/components/ui/select-box";
import { useJourneyOnboarding } from "@/hooks/use-journey-onboarding";
import { useStudentRecommendations } from "@/hooks/use-student-recommendations";
import { discoveryV2Enabled } from "@/services/feature-flags";
import type { Opportunity } from "@/types/opportunity-catalog";
import type { OnboardingProfile } from "@/types/onboarding";
import type { OpportunityJourney } from "@/types/opportunity-journey";
import type { RecommendationItemApi } from "@/types/seconecta-api";
import { getTaxonomyFromSearch, OPPORTUNITY_TYPES, THEMES, type OpportunityType, type Theme } from "@/types/taxonomy";
import "./opportunities.css";

const quickInterests = [
  "pesquisa em IA",
  "estudar fora",
  "bolsas para ensino médio",
  "olimpíadas de matemática",
];

const categoryShelves = [
  { label: "Pesquisa", icon: FlaskConical, tone: "green", copy: "Projetos, mentoria e primeiras descobertas." },
  { label: "Olimpíada", icon: Star, tone: "purple", copy: "Desafios para avançar com intenção." },
  { label: "Bolsa", icon: GraduationCap, tone: "green", copy: "Apoio para ir mais longe." },
  { label: "Programa de Verão", icon: MapPin, tone: "blue", copy: "Experiências intensivas para ampliar horizontes." },
  { label: "Competição", icon: ArrowRight, tone: "orange", copy: "Desafios para colocar conhecimento em prática." },
  { label: "Evento", icon: CalendarDays, tone: "purple", copy: "Encontros para descobrir novas possibilidades." },
  { label: "Hackathon", icon: Monitor, tone: "blue", copy: "Construa soluções com outras pessoas." },
  { label: "Mentoria", icon: Monitor, tone: "blue", copy: "Orientação para decidir e avançar." },
  { label: "Voluntariado", icon: Users, tone: "green", copy: "Aprenda gerando impacto na sua comunidade." },
];

function getOpportunityTypeScore(type: string, profile: OnboardingProfile | null) {
  if (!profile) return 0;
  return profile.opportunityTypes.includes(type as OpportunityType) ? 100 : 0;
}

function OpportunityCard({
  opportunity,
  journey,
  onStartJourney,
  onRemoveJourney,
  onShare,
  recommendation,
  onRecommendationEvent,
  compact = false,
}: {
  opportunity: Opportunity;
  journey?: OpportunityJourney;
  onStartJourney: (opportunity: Opportunity) => void;
  onRemoveJourney: (opportunityId: number) => void;
  onShare: (opportunity: ShareableOpportunity) => void;
  recommendation?: RecommendationItemApi;
  onRecommendationEvent?: (eventType: "IMPRESSION" | "OPEN", item: RecommendationItemApi) => void;
  compact?: boolean;
}) {
  const { opportunityMetadata } = useOpportunityCatalog();
  const cardRef = useRef<HTMLElement | null>(null);
  const metadata = opportunityMetadata[opportunity.id];
  useEffect(() => {
    const target = cardRef.current;
    if (!target || !recommendation || !onRecommendationEvent) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) { onRecommendationEvent("IMPRESSION", recommendation); observer.disconnect(); }
    }, { threshold: 0.5 });
    observer.observe(target);
    return () => observer.disconnect();
  }, [onRecommendationEvent, recommendation]);
  const fundingLabel = { free: "Gratuito", fullScholarship: "Bolsa integral", partialScholarship: "Bolsa parcial", unknown: "Consulte os custos" }[metadata.funding];
  const deadline = (() => {
    if (metadata.applicationStatus === "openingSoon") return { label: metadata.openingForecast ?? "Abre em breve", tone: "is-opening" };
    if (metadata.applicationStatus === "evergreen") return { label: "Inscrições abertas", tone: "is-evergreen" };
    if (metadata.applicationStatus === "closed") return { label: "Inscrições encerradas", tone: "is-closed" };
    if (metadata.applicationStatus === "unknown") return { label: "Prazo a confirmar", tone: "is-closed" };
    if (opportunity.daysLeft === 0) return { label: "Encerra hoje", tone: "is-today" };
    if (opportunity.daysLeft <= 7) return { label: opportunity.daysLeft === 1 ? "Fecha em 1 dia" : `Fecha em ${opportunity.daysLeft} dias`, tone: "is-urgent" };
    return { label: `Até ${opportunity.deadline}`, tone: "" };
  })();

  return (
    <motion.article
      ref={cardRef}
      layout
      className={`opportunity-card opportunity-card--${opportunity.accent} ${compact ? "opportunity-card--compact" : ""}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.24 }}
    >
      <div className="opportunity-card-topline">
        <span className="opportunity-category">{opportunityMetadata[opportunity.id].opportunityTypes[0]}</span>
        <div className="opportunity-actions">
          <button className="icon-button" type="button" onClick={() => onShare(opportunity)} aria-label={`Compartilhar ${opportunity.title}`}>
            <Share2 size={17} />
          </button>
          <button
            className={`icon-button ${journey ? "is-saved" : ""}`}
            type="button"
            onClick={() => journey ? onRemoveJourney(opportunity.id) : onStartJourney(opportunity)}
            aria-label={journey ? `Remover ${opportunity.title} da sua jornada` : `Adicionar ${opportunity.title} à sua jornada`}
            aria-pressed={Boolean(journey)}
            title={journey ? "Remover da sua jornada" : "Adicionar à sua jornada"}
          >
            <Bookmark size={17} fill={journey ? "currentColor" : "none"} />
          </button>
        </div>
      </div>

      <div>
        <p className="opportunity-org">{opportunity.organization}</p>
        <h3>{opportunity.title}</h3>
        <p className="opportunity-description">{opportunity.description}</p>
        {metadata.editorialPick && <span className="opportunity-context-badge">Escolha da seConecta</span>}
      </div>

      {!compact && (
        <div className="opportunity-meta-grid">
          <span><MapPin size={15} /> {metadata.location === "Brasil" ? "Brasil" : "Internacional"}</span>
          <span><Monitor size={15} /> {opportunity.format}</span>
          <span><GraduationCap size={15} /> {metadata.educationLevels.join(" · ")}</span>
          <span><Gauge size={15} /> {fundingLabel}</span>
        </div>
      )}
      {compact && <div className="opportunity-compact-meta"><MapPin size={14} /> {metadata.location === "Brasil" ? "Brasil" : "Internacional"}<span>·</span><GraduationCap size={14} /> {metadata.educationLevels[0]}{metadata.funding !== "free" && <><span>·</span><Gauge size={14} /> {fundingLabel}</>}</div>}

      <div className="opportunity-card-footer">
        <div className={`deadline-pill ${deadline.tone}`}>
          <CalendarDays size={15} />
          <span>{deadline.label}</span>
        </div>
        <Link className="card-open-button" href={`/oportunidades/${opportunity.slug ?? opportunity.id}`} onClick={() => recommendation && onRecommendationEvent?.("OPEN", recommendation)} aria-label={`Ver detalhes de ${opportunity.title}`}>
          Ver oportunidade <ArrowRight size={16} />
        </Link>
      </div>
    </motion.article>
  );
}

function FilterGroup({ title, options, selected, onChange, initiallyOpen = false }: { title: string; options: { value: string; label: string }[]; selected: string[]; onChange: (value: string) => void; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return <section className="filter-group">
    <button className="filter-group-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{title}<ChevronDown size={16} /></button>
    <AnimatePresence initial={false}>{open && <motion.div className="filter-options" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
      {options.map((option) => <label className="check-row" key={option.value}><input type="checkbox" checked={selected.includes(option.value)} onChange={() => onChange(option.value)} /><i><Check size={13} /></i>{option.label}</label>)}
    </motion.div>}</AnimatePresence>
  </section>;
}

function FilterContent({ formatAccess, setFormatAccess, educationLevels, setEducationLevels, themes, setThemes, opportunityTypes, setOpportunityTypes, locations, setLocations, applicationStatuses, setApplicationStatuses, durations, setDurations, competitionLevels, setCompetitionLevels, languages, setLanguages, resetFilters }: { formatAccess: string[]; setFormatAccess: (value: string) => void; educationLevels: string[]; setEducationLevels: (value: string) => void; themes: string[]; setThemes: (value: string) => void; opportunityTypes: string[]; setOpportunityTypes: (value: string) => void; locations: string[]; setLocations: (value: string) => void; applicationStatuses: string[]; setApplicationStatuses: (value: string) => void; durations: string[]; setDurations: (value: string) => void; competitionLevels: string[]; setCompetitionLevels: (value: string) => void; languages: string[]; setLanguages: (value: string) => void; resetFilters: () => void }) {
  return (
    <div className="filter-content">
      <div className="filter-heading">
        <span>Filtros</span>
        <button type="button" onClick={resetFilters}><RotateCcw size={14} /> Limpar</button>
      </div>

      <FilterGroup title="Categorias" initiallyOpen selected={opportunityTypes} onChange={setOpportunityTypes} options={OPPORTUNITY_TYPES.map((value) => ({ value, label: value }))} />
      <FilterGroup title="Matérias" initiallyOpen selected={themes} onChange={setThemes} options={THEMES.map((value) => ({ value, label: value }))} />
      <FilterGroup title="Formato e acesso" initiallyOpen selected={formatAccess} onChange={setFormatAccess} options={[{ value: "Online", label: "Online" }, { value: "Presencial", label: "Presencial" }, { value: "Híbrido", label: "Híbrido" }, { value: "free", label: "Gratuito" }, { value: "fullScholarship", label: "Bolsa integral" }, { value: "partialScholarship", label: "Bolsa parcial" }]} />
      <FilterGroup title="Nível de ensino" selected={educationLevels} onChange={setEducationLevels} options={["Ensino Fundamental", "Ensino Médio", "Técnico", "Graduação", "Pós-graduação"].map((value) => ({ value, label: value }))} />
      <FilterGroup title="Localização" selected={locations} onChange={setLocations} options={["Brasil", "Internacional"].map((value) => ({ value, label: value }))} />
      <FilterGroup title="Prazo de inscrição" initiallyOpen selected={applicationStatuses} onChange={setApplicationStatuses} options={[{ value: "open", label: "Abertas agora" }, { value: "endingSoon", label: "Encerrando em breve" }, { value: "openingSoon", label: "Abrem em breve" }, { value: "evergreen", label: "Sempre disponíveis" }, { value: "closed", label: "Encerradas" }]} />
      <FilterGroup title="Duração" selected={durations} onChange={setDurations} options={[{ value: "upToWeek", label: "Até 1 semana" }, { value: "oneToFourWeeks", label: "1–4 semanas" }, { value: "oneToThreeMonths", label: "1–3 meses" }, { value: "overThreeMonths", label: "Mais de 3 meses" }]} />
      <FilterGroup title="Nível de concorrência" selected={competitionLevels} onChange={setCompetitionLevels} options={[{ value: "veryCompetitive", label: "Muito competitivo" }, { value: "competitive", label: "Competitivo" }, { value: "accessible", label: "Acessível" }, { value: "unknown", label: "Não informado" }]} />
      <FilterGroup title="Idioma" selected={languages} onChange={setLanguages} options={["Português", "Inglês", "Espanhol", "Outros"].map((value) => ({ value, label: value }))} />
    </div>
  );
}

function LegacyOpportunitiesPage() {
  const { profile, startOnboarding } = useJourneyOnboarding();
  const { journeys, startJourney, removeJourney } = useOpportunityJourney();
  const { opportunities, opportunityMetadata, ready: catalogReady, error: catalogError } = useOpportunityCatalog();
  const recommendations = useStudentRecommendations();
  const [query, setQuery] = useState("");
  const [intent, setIntent] = useState("");
  const [sort, setSort] = useState("recommended");
  const [formatAccess, setFormatAccess] = useState<string[]>([]);
  const [educationLevels, setEducationLevels] = useState<string[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [selectedOpportunityTypes, setSelectedOpportunityTypes] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [applicationStatuses, setApplicationStatuses] = useState<string[]>(["open", "evergreen"]);
  const [durations, setDurations] = useState<string[]>([]);
  const [competitionLevels, setCompetitionLevels] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(6);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recommendationInfoOpen, setRecommendationInfoOpen] = useState(false);
  const [shareOpportunity, setShareOpportunity] = useState<ShareableOpportunity | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const categoryRailRef = useRef<HTMLDivElement>(null);
  const categoryRailDragRef = useRef<{ startX: number; scrollLeft: number } | null>(null);
  const categoryRailDidDragRef = useRef(false);
  const onboardingFiltersInitialized = useRef(false);
  const saved = useMemo(() => journeys.map((journey) => journey.opportunityId), [journeys]);

  useEffect(() => {
    const initialQuery = new URLSearchParams(window.location.search).get("busca");
    if (initialQuery) setQuery(initialQuery);
  }, []);

  useEffect(() => {
    if (profile?.themes[0]) setIntent(profile.themes[0]);
  }, [profile]);

  useEffect(() => {
    if (!profile || onboardingFiltersInitialized.current) return;
    setSelectedThemes(profile.themes);
    setSelectedOpportunityTypes(profile.opportunityTypes);
    onboardingFiltersInitialized.current = true;
  }, [profile]);

  const toggleFilter = (setter: Dispatch<SetStateAction<string[]>>, value: string) => setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const normalizedIntent = intent === "IA" ? "Inteligência Artificial" : intent === "Outro" ? "" : intent;
  const profileThemes = profile?.themes ?? [];
  const orderedCategoryShelves = useMemo(() => {
    const ranked = categoryShelves.map((category, index) => ({ ...category, index, score: getOpportunityTypeScore(category.label, profile) })).sort((a, b) => b.score - a.score || a.index - b.index);
    return ranked;
  }, [profile]);
  const matchesPersonalization = (item: Opportunity) => {
    const metadata = opportunityMetadata[item.id];
    return metadata.themes.some((theme) => profileThemes.includes(theme as Theme)) || metadata.opportunityTypes.some((type) => profile?.opportunityTypes.includes(type as OpportunityType)) || metadata.themes.includes(normalizedIntent as Theme) || metadata.opportunityTypes.includes(normalizedIntent as OpportunityType);
  };
  const recommended = useMemo(() => {
    if (recommendations.enabled) {
      const itemsById = new Map((recommendations.result?.items ?? []).map((item) => [item.opportunity_id, item]));
      return opportunities.filter((item) => itemsById.has(item.id) && !saved.includes(item.id)).map((opportunity) => ({ opportunity, recommendation: itemsById.get(opportunity.id) }));
    }
    if (!profile) return [];
    const preferenceMatches = opportunities.filter(matchesPersonalization);
    const savedOpportunityIds = new Set(saved);
    return [...preferenceMatches, ...opportunities]
      .filter((item, index, items) => items.indexOf(item) === index)
      .filter((item) => !savedOpportunityIds.has(item.id))
      .slice(0, 3)
      .map((opportunity) => ({ opportunity, recommendation: undefined }));
  }, [normalizedIntent, opportunities, profile, profileThemes, profile?.opportunityTypes, recommendations.enabled, recommendations.result, saved]);

  const searchContext = useMemo(() => {
    if (!query.trim()) return [];
    const taxonomy = getTaxonomyFromSearch(query);
    const context: string[] = [...taxonomy.themes, ...taxonomy.opportunityTypes];
    const normalizedQuery = query.toLowerCase();
    if (normalizedQuery.includes("fora") || normalizedQuery.includes("exterior") || normalizedQuery.includes("internacional")) context.push("Oportunidades internacionais");
    if (normalizedQuery.includes("bolsa")) context.push("Bolsas e apoio financeiro");
    if (normalizedQuery.includes("ensino médio")) context.push("Ensino Médio");
    return [...new Set(context)].slice(0, 4);
  }, [query]);

  const upcoming = useMemo(() => opportunities.filter((item) => opportunityMetadata[item.id].applicationStatus === "openingSoon").slice(0, 2), []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const result = opportunities.filter((item) => {
      const metadata = opportunityMetadata[item.id];
      const searchTaxonomy = getTaxonomyFromSearch(query);
      const hasTaxonomyQuery = searchTaxonomy.themes.length > 0 || searchTaxonomy.opportunityTypes.length > 0;
      const searchable = `${item.title} ${item.organization} ${item.category} ${item.area} ${item.description} ${metadata.themes.join(" ")} ${metadata.opportunityTypes.join(" ")}`.toLowerCase();
      const selectedFormats = formatAccess.filter((value) => ["Online", "Presencial", "Híbrido"].includes(value));
      const selectedFunding = formatAccess.filter((value) => ["free", "fullScholarship", "partialScholarship"].includes(value));
      return (
        (!term || searchable.includes(term) || (hasTaxonomyQuery && searchTaxonomy.themes.every((theme) => metadata.themes.includes(theme)) && searchTaxonomy.opportunityTypes.every((type) => metadata.opportunityTypes.includes(type)))) &&
        (!selectedFormats.length || selectedFormats.includes(item.format)) &&
        (!selectedFunding.length || selectedFunding.includes(metadata.funding)) &&
        (!educationLevels.length || educationLevels.some((level) => metadata.educationLevels.includes(level))) &&
        (!selectedThemes.length || selectedThemes.some((theme) => metadata.themes.includes(theme as Theme))) &&
        (!selectedOpportunityTypes.length || selectedOpportunityTypes.some((type) => metadata.opportunityTypes.includes(type as OpportunityType))) &&
        (!locations.length || locations.includes(metadata.location)) &&
        applicationStatuses.some((status) => status === "open" ? ["open", "endingSoon"].includes(metadata.applicationStatus) : status === metadata.applicationStatus) &&
        (!durations.length || durations.includes(metadata.duration)) &&
        (!competitionLevels.length || competitionLevels.includes(metadata.competition)) &&
        (!languages.length || languages.includes(metadata.language))
      );
    });

    return [...result].sort((a, b) => {
      if (sort === "newest") return a.added - b.added;
      if (sort === "deadline") return a.daysLeft - b.daysLeft;
      if (sort === "popular") return b.popularity - a.popularity;
      const score = (item: Opportunity) => item.popularity +
        (matchesPersonalization(item) ? 200 : 0);
      return score(b) - score(a);
    });
  }, [applicationStatuses, competitionLevels, durations, educationLevels, formatAccess, languages, locations, normalizedIntent, profile, profileThemes, query, selectedOpportunityTypes, selectedThemes, sort]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visibleCount >= filtered.length) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount((count) => Math.min(count + 3, filtered.length));
    }, { rootMargin: "180px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const chooseInterest = (value: string) => {
    setIntent("");
    setQuery(value);
    const taxonomy = getTaxonomyFromSearch(value);
    if (taxonomy.themes.length) setSelectedThemes(taxonomy.themes);
    if (taxonomy.opportunityTypes.length) setSelectedOpportunityTypes(taxonomy.opportunityTypes);
  };

  const exploreCategory = (value: string) => {
    if (categoryRailDidDragRef.current) return;
    setIntent(value);
    setSelectedOpportunityTypes([value]);
    setQuery(value);
    document.getElementById("all-opportunities")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exploreRecommendedCategories = () => {
    if (categoryRailDidDragRef.current) return;
    setSelectedOpportunityTypes(profile?.opportunityTypes ?? []);
    setQuery("");
    document.getElementById("all-opportunities")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startCategoryRailDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    categoryRailDragRef.current = { startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
    categoryRailDidDragRef.current = false;
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const drag = categoryRailDragRef.current;
      const rail = categoryRailRef.current;
      if (!drag || !rail) return;
      const distance = event.clientX - drag.startX;
      if (Math.abs(distance) > 4 && !categoryRailDidDragRef.current) {
        categoryRailDidDragRef.current = true;
        rail.classList.add("is-dragging");
      }
      if (!categoryRailDidDragRef.current) return;
      event.preventDefault();
      rail.scrollLeft = drag.scrollLeft - distance;
    };
    const handleMouseUp = () => {
      if (!categoryRailDragRef.current) return;
      categoryRailDragRef.current = null;
      categoryRailRef.current?.classList.remove("is-dragging");
      if (categoryRailDidDragRef.current) window.setTimeout(() => { categoryRailDidDragRef.current = false; }, 0);
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const resetFilters = () => {
    setFormatAccess([]);
    setEducationLevels([]);
    setSelectedThemes([]);
    setSelectedOpportunityTypes([]);
    setLocations([]);
    setApplicationStatuses(["open", "evergreen"]);
    setDurations([]);
    setCompetitionLevels([]);
    setLanguages([]);
    setQuery("");
  };

  if (!catalogReady) return <><SiteHeader /><main className="opportunities-page"><OpportunityWorkspaceNav active="explore" /><div className="explore-shell py-20"><div className="h-48 animate-pulse rounded-[24px] bg-[#e5ece8]" /></div></main></>;
  if (catalogError) return <><SiteHeader /><main className="opportunities-page"><OpportunityWorkspaceNav active="explore" /><div className="explore-shell py-20 text-center"><h1 className="text-2xl font-semibold">Catálogo temporariamente indisponível</h1><p className="mt-3 text-sm text-[#66736d]">{catalogError}</p><button className="mt-6 rounded-full bg-[#079272] px-5 py-3 text-sm font-semibold text-white" type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div></main></>;

  return (
    <>
      <SiteHeader />

      <main className="opportunities-page">
        <OpportunityWorkspaceNav active="explore" />

      <section className="workspace-search" aria-labelledby="workspace-search-title">
        <div className="explore-shell workspace-search-inner">
          <h1 id="workspace-search-title">Encontre sua próxima oportunidade.</h1>
          <div className="workspace-search-input">
            <Search size={21} />
            <label htmlFor="opportunity-search" className="sr-only">Pesquisar oportunidades</label>
            <input id="opportunity-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquise por pesquisa científica, IA, bolsas..." autoComplete="off" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar pesquisa"><X size={18} /></button>}
          </div>
          <div className="quick-filters" aria-label="Tópicos populares">
            <span>Experimente:</span>
            {quickInterests.map((item) => <button type="button" className={intent === item ? "is-active" : ""} onClick={() => chooseInterest(item)} key={item}>{item}</button>)}
          </div>
          <AnimatePresence initial={false}>{query.trim() && <motion.div className="search-context" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            <span>Pesquisando por: <strong>“{query}”</strong></span>
            {searchContext.length > 0 && <span>Considerando: {searchContext.join(" · ")}</span>}
          </motion.div>}</AnimatePresence>
        </div>
      </section>

      <div className="explore-shell explore-content">
        {(profile || recommendations.enabled) && <section className="recommendation-section section-block" aria-labelledby="recommended-title">
          <div className="section-heading">
            <div>
              <h2 id="recommended-title">Recomendado para você</h2>
              <p>Baseado nos seus interesses e na sua jornada educacional.</p>
            </div>
            <button className="text-link" type="button" onClick={() => document.getElementById("all-opportunities")?.scrollIntoView({ behavior: "smooth" })}>
              Ver todas <ArrowRight size={16} />
            </button>
          </div>
          <>
            <div className="recommendation-context">
              <div className="recommendation-info-wrap">
                <button type="button" onClick={() => setRecommendationInfoOpen((open) => !open)} aria-expanded={recommendationInfoOpen}>Como funciona?</button>
                <AnimatePresence initial={false}>{recommendationInfoOpen && <motion.div className="recommendation-info-popover" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}>
                  <strong>Como selecionamos essas oportunidades</strong>
                  <p>Consideramos sua série, os assuntos escolhidos, os prazos e a relevância de cada oportunidade.</p>
                  <span>Você pode ajustar esses interesses quando quiser.</span>
                  <button type="button" onClick={startOnboarding}>Atualizar preferências</button>
                </motion.div>}</AnimatePresence>
              </div>
            </div>
            {!recommendations.ready && recommendations.enabled ? <div className="h-36 animate-pulse rounded-[24px] bg-[#e5ece8]" /> : recommended.length > 0 ? <div className="recommendation-grid">
              {recommended.map(({ opportunity: item, recommendation }) => <OpportunityCard key={item.id} opportunity={item} recommendation={recommendation} onRecommendationEvent={recommendations.record} journey={journeys.find((journey) => journey.opportunityId === item.id)} onStartJourney={startJourney} onRemoveJourney={removeJourney} onShare={setShareOpportunity} compact />)}
            </div> : <div className="personalization-empty"><span><Check size={18} /></span><div><h3>{recommendations.error ?? "Ainda não há novas recomendações para mostrar."}</h3><p>Explore o catálogo enquanto a seConecta aprende com suas preferências e sua Jornada.</p></div><button type="button" onClick={() => document.getElementById("all-opportunities")?.scrollIntoView({ behavior: "smooth" })}>Explorar catálogo <ArrowRight size={16} /></button></div>}
          </>
        </section>}

        <section className="section-block category-section" aria-labelledby="categories-title">
          <div className="section-heading">
            <div>
              <h2 id="categories-title">Explore por tipo de oportunidade</h2>
            </div>
            <span className="drag-hint">Arraste para explorar <ArrowRight size={15} /></span>
          </div>
          <div className="category-rail" ref={categoryRailRef} onMouseDown={startCategoryRailDrag}>
            {profile && <motion.button type="button" className="category-card category-card--recommended" onClick={exploreRecommendedCategories} whileHover={{ y: -4 }}>
              <span className="category-icon"><Sparkles size={20} /></span>
              <span className="category-count">Seleção personalizada</span>
              <strong>Recomendadas</strong>
              <small>{profile ? "Tipos que combinam com sua jornada." : "Uma seleção para começar a explorar."}</small>
              <span className="category-arrow"><ArrowRight size={17} /></span>
            </motion.button>}
            {orderedCategoryShelves.map(({ label, icon: Icon, tone, copy }) => (
              <motion.button
                type="button"
                className={`category-card category-card--${tone}`}
                key={label}
                onClick={() => exploreCategory(label)}
                whileHover={{ y: -4 }}
              >
                <span className="category-icon"><Icon size={20} /></span>
                <span className="category-count">{(() => { const count = opportunities.filter((item) => opportunityMetadata[item.id].opportunityTypes.includes(label as OpportunityType)).length; return `${count} ${count === 1 ? "oportunidade" : "oportunidades"}`; })()}</span>
                <strong>{label}</strong>
                <small>{copy}</small>
                <span className="category-arrow"><ArrowRight size={17} /></span>
              </motion.button>
            ))}
            <motion.button type="button" className="category-card category-card--all" onClick={() => { setSelectedOpportunityTypes([]); setQuery(""); document.getElementById("all-opportunities")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} whileHover={{ y: -4 }}>
              <span className="category-icon"><LayoutGrid size={20} /></span>
              <span className="category-count">Explorar sem filtro</span>
              <strong>Todas</strong>
              <small>Veja todos os tipos de oportunidade.</small>
              <span className="category-arrow"><ArrowRight size={17} /></span>
            </motion.button>
          </div>
        </section>

        <section className="section-block feed-section" id="all-opportunities" aria-labelledby="feed-title">
          <div className="section-heading feed-heading">
            <div>
              <span className="section-kicker">Todas as oportunidades</span>
              <h2 id="feed-title">Encontre o que procura</h2>
              <p>{filtered.length} oportunidades encontradas para você.</p>
            </div>
            <div className="feed-controls">
              <button className="mobile-filter-button" type="button" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal size={17} /> Filtros
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-[#7a847e]">Ordenar por</span>
                <SelectBox
                  value={sort}
                  options={[
                    { value: "recommended", label: "Mais recomendadas" },
                    { value: "newest", label: "Mais recentes" },
                    { value: "deadline", label: "Encerram primeiro" },
                    { value: "popular", label: "Mais populares" },
                  ]}
                  onValueChange={setSort}
                  ariaLabel="Ordenar oportunidades"
                  size="compact"
                  align="end"
                  className="w-48"
                />
              </div>
              <span className="grid-view"><LayoutGrid size={18} /></span>
            </div>
          </div>

          <div className="feed-layout">
            <aside className="desktop-filters" aria-label="Filtros de oportunidades">
              <FilterContent
                formatAccess={formatAccess}
                setFormatAccess={(value) => toggleFilter(setFormatAccess, value)}
                educationLevels={educationLevels}
                setEducationLevels={(value) => toggleFilter(setEducationLevels, value)}
                themes={selectedThemes}
                setThemes={(value) => toggleFilter(setSelectedThemes, value)}
                opportunityTypes={selectedOpportunityTypes}
                setOpportunityTypes={(value) => toggleFilter(setSelectedOpportunityTypes, value)}
                locations={locations}
                setLocations={(value) => toggleFilter(setLocations, value)}
                applicationStatuses={applicationStatuses}
                setApplicationStatuses={(value) => toggleFilter(setApplicationStatuses, value)}
                durations={durations}
                setDurations={(value) => toggleFilter(setDurations, value)}
                competitionLevels={competitionLevels}
                setCompetitionLevels={(value) => toggleFilter(setCompetitionLevels, value)}
                languages={languages}
                setLanguages={(value) => toggleFilter(setLanguages, value)}
                resetFilters={resetFilters}
              />
            </aside>

            <div>
              {filtered.length ? (
                <motion.div layout className="feed-grid">
                  <AnimatePresence>
                    {filtered.slice(0, visibleCount).map((item) => (
                      <OpportunityCard key={item.id} opportunity={item} journey={journeys.find((journey) => journey.opportunityId === item.id)} onStartJourney={startJourney} onRemoveJourney={removeJourney} onShare={setShareOpportunity} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="empty-state">
                  <span><Search size={25} /></span>
                  <h3>Nenhuma oportunidade combina com esses filtros.</h3>
                  <p>Tente ampliar sua busca ou deixe a seConecta encontrar opções parecidas para você.</p>
                  <div>
                    <button type="button" onClick={resetFilters}>Limpar filtros</button>
                    <button type="button" onClick={startOnboarding}>Personalizar recomendações</button>
                  </div>
                </div>
              )}
              {visibleCount < filtered.length && <div className="opportunity-sentinel" ref={loadMoreRef}>Carregando mais oportunidades...</div>}
            </div>
          </div>
        </section>
      </div>

      <footer className="explore-footer">
        <div className="explore-shell">
          <Link href="/" className="site-brand" aria-label="seConecta, página inicial"><span>se</span>Conecta<i /></Link>
          <p>Oportunidades certas. No momento certo.</p>
          <div><Link href="/jornada">Minha Jornada</Link><a href={whatsappCommunityUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a><Link href="/">Voltar ao início</Link></div>
        </div>
      </footer>

        <AnimatePresence>
          {filtersOpen && (
            <>
              <motion.button className="filter-backdrop" type="button" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              <motion.aside className="mobile-filter-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
                <div className="sheet-handle" />
                <div className="sheet-title"><strong>Refinar oportunidades</strong><button type="button" onClick={() => setFiltersOpen(false)} aria-label="Fechar"><X size={20} /></button></div>
                <FilterContent
                  formatAccess={formatAccess}
                  setFormatAccess={(value) => toggleFilter(setFormatAccess, value)}
                  educationLevels={educationLevels}
                  setEducationLevels={(value) => toggleFilter(setEducationLevels, value)}
                  themes={selectedThemes}
                  setThemes={(value) => toggleFilter(setSelectedThemes, value)}
                  opportunityTypes={selectedOpportunityTypes}
                  setOpportunityTypes={(value) => toggleFilter(setSelectedOpportunityTypes, value)}
                  locations={locations}
                  setLocations={(value) => toggleFilter(setLocations, value)}
                  applicationStatuses={applicationStatuses}
                  setApplicationStatuses={(value) => toggleFilter(setApplicationStatuses, value)}
                  durations={durations}
                  setDurations={(value) => toggleFilter(setDurations, value)}
                  competitionLevels={competitionLevels}
                  setCompetitionLevels={(value) => toggleFilter(setCompetitionLevels, value)}
                  languages={languages}
                  setLanguages={(value) => toggleFilter(setLanguages, value)}
                  resetFilters={resetFilters}
                />
                <button className="apply-filters" type="button" onClick={() => setFiltersOpen(false)}>Ver {filtered.length} oportunidades</button>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </main>
      <OpportunityShareModal opportunity={shareOpportunity} onClose={() => setShareOpportunity(null)} />
    </>
  );
}

export default function OpportunitiesPage() {
  return discoveryV2Enabled ? <OpportunityDiscoveryV2 /> : <LegacyOpportunitiesPage />;
}
