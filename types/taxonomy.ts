export const THEMES = [
  "Inteligência Artificial", "Matemática", "Física", "Química", "Biologia", "Astronomia", "Ciências da Computação", "Robótica", "Música", "Artes", "História", "Geografia", "Filosofia", "Economia", "Direito", "Engenharia", "Medicina", "Meio Ambiente", "Empreendedorismo",
] as const;

export const OPPORTUNITY_TYPES = [
  "Olimpíada", "Pesquisa", "Bolsa", "Programa de Verão", "Competição", "Evento", "Hackathon", "Voluntariado", "Mentoria",
] as const;

export type Theme = (typeof THEMES)[number];
export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

// Skills remain a separate dimension when competency recommendations are introduced.
export type OpportunityTaxonomy = {
  themes: Theme[];
  opportunityTypes: OpportunityType[];
  competencies?: string[];
};

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function getTaxonomyFromSearch(query: string) {
  const normalizedQuery = normalize(query);
  const themes = THEMES.filter((theme) => normalizedQuery.includes(normalize(theme)) || (theme === "Inteligência Artificial" && /\b(ia|ai)\b/.test(normalizedQuery)));
  const opportunityTypes = OPPORTUNITY_TYPES.filter((type) => normalizedQuery.includes(normalize(type)) || (type === "Programa de Verão" && normalizedQuery.includes("summer school")));
  return { themes, opportunityTypes };
}
