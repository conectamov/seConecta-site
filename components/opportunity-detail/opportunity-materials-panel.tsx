import { ArrowUpRight, BookOpenCheck, ExternalLink, MessageCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import type { OpportunityDetail } from "@/data/opportunity-details";
import { getOpportunityCommunityHub } from "@/data/opportunity-knowledge-hubs";

type CuratedMaterial = {
  id: string;
  title: string;
  description: string;
  type: string;
  site: string;
  href: string;
  favicon: string;
  reason: string;
};

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

function getExtraMaterials(opportunity: OpportunityDetail): CuratedMaterial[] {
  const context = `${opportunity.type} ${opportunity.title}`.toLocaleLowerCase("pt-BR");

  if (/olimp|obi|obmep|matem|programaç/.test(context)) {
    const programming = /obi|programaç|comput/.test(context);
    return programming ? [
      { id: "practice-beecrowd", title: "Problemas para praticar lógica e algoritmos", description: "Exercícios progressivos para transformar teoria em resolução de problemas.", type: "Prática", site: "beecrowd", href: "https://judge.beecrowd.com/pt", favicon: favicon("beecrowd.com"), reason: "Ajuda a criar consistência antes de provas e seletivas." },
      { id: "github-skills", title: "GitHub Skills para organizar seus projetos", description: "Cursos curtos e práticos para aprender GitHub construindo.", type: "Curso", site: "GitHub", href: "https://skills.github.com/", favicon: "https://github.com/favicon.ico", reason: "Útil para registrar soluções e demonstrar evolução." },
    ] : [
      { id: "obmep-problems", title: "Banco de provas e soluções da OBMEP", description: "Provas anteriores organizadas por edição e nível, com soluções oficiais.", type: "Provas", site: "OBMEP", href: "https://www.obmep.org.br/provas.htm", favicon: favicon("obmep.org.br"), reason: "É a referência mais direta para entender o nível das questões." },
      { id: "khan-math", title: "Fundamentos de matemática para revisar", description: "Aulas e exercícios gratuitos para reforçar lacunas antes de avançar.", type: "Curso", site: "Khan Academy", href: "https://pt.khanacademy.org/math", favicon: favicon("khanacademy.org"), reason: "Ajuda a revisar somente os fundamentos que ainda travam sua prática." },
    ];
  }

  if (/pesquisa|cient|biotec|laborat/.test(context)) return [
    { id: "google-scholar", title: "Como encontrar referências para sua pergunta", description: "Busque artigos, autores e trabalhos relacionados ao tema que você quer investigar.", type: "Pesquisa", site: "Google Acadêmico", href: "https://scholar.google.com.br/", favicon: favicon("scholar.google.com.br"), reason: "Ajuda a verificar o que já foi estudado antes de definir um projeto." },
    { id: "scielo", title: "Artigos científicos em acesso aberto", description: "Biblioteca de periódicos com forte presença de pesquisa brasileira.", type: "Biblioteca", site: "SciELO", href: "https://www.scielo.br/", favicon: favicon("scielo.br"), reason: "Oferece referências acessíveis e próximas do contexto brasileiro." },
  ];

  if (/inteligência artificial|tecnologia|hackathon|programaç|comput/.test(context)) return [
    { id: "freecodecamp", title: "Cursos práticos para construir fundamentos", description: "Trilhas gratuitas de programação, dados e desenvolvimento de projetos.", type: "Curso", site: "freeCodeCamp", href: "https://www.freecodecamp.org/portuguese/learn/", favicon: favicon("freecodecamp.org"), reason: "Permite aprender fazendo antes de montar o projeto da candidatura." },
    { id: "github-skills", title: "GitHub Skills para seu primeiro repositório", description: "Cursos curtos para aprender versionamento e apresentar projetos.", type: "Curso", site: "GitHub", href: "https://skills.github.com/", favicon: "https://github.com/favicon.ico", reason: "Ajuda a transformar o que você construiu em evidência organizada." },
  ];

  if (/bolsa|verão|summer|internacional|intercâmbio/.test(context)) return [
    { id: "educationusa", title: "Orientações para candidaturas internacionais", description: "Informações confiáveis sobre planejamento, documentos e bolsas.", type: "Orientação", site: "EducationUSA", href: "https://educationusa.state.gov/", favicon: favicon("educationusa.state.gov"), reason: "Ajuda a organizar decisões e documentos com antecedência." },
    { id: "owl-writing", title: "Como estruturar textos pessoais com clareza", description: "Referências de escrita para organizar argumento, exemplos e revisão.", type: "Escrita", site: "Purdue OWL", href: "https://owl.purdue.edu/owl/general_writing/index.html", favicon: favicon("purdue.edu"), reason: "Útil para revisar cartas e respostas sem copiar modelos prontos." },
  ];

  return [
    { id: "khan-learning", title: "Reforce os fundamentos do tema", description: "Conteúdo gratuito e exercícios para construir uma base antes de avançar.", type: "Curso", site: "Khan Academy", href: "https://pt.khanacademy.org/", favicon: favicon("khanacademy.org"), reason: "Ajuda a transformar interesse em preparação consistente." },
    { id: "github-projects", title: "Referências para documentar um projeto", description: "Veja como projetos organizam objetivos, processo, decisões e resultados.", type: "Exemplos", site: "GitHub", href: "https://github.com/explore", favicon: "https://github.com/favicon.ico", reason: "Mostra como tornar seu trabalho compreensível para outras pessoas." },
  ];
}

function getCuratedMaterials(opportunity: OpportunityDetail): CuratedMaterial[] {
  const shared = getOpportunityCommunityHub(opportunity).sharedResources;
  const official: CuratedMaterial = {
    id: "official",
    title: `Informações oficiais de ${opportunity.organization}`,
    description: "Requisitos, datas e regras publicados pela própria organização.",
    type: "Oficial",
    site: opportunity.organization,
    href: opportunity.officialUrl,
    favicon: opportunity.organizationLogo ?? favicon(new URL(opportunity.officialUrl).hostname),
    reason: "Use esta fonte para confirmar qualquer informação antes de agir.",
  };
  const practical = shared.filter((item) => ["checklist", "project-examples", "interview-notes"].includes(item.id)).slice(0, 2).map((item): CuratedMaterial => ({
    ...item,
    reason: item.id === "checklist" ? "Evita esquecer documentos e ações perto do prazo." : item.id === "interview-notes" ? "Ajuda a chegar à conversa com exemplos concretos preparados." : "Mostra o nível de clareza e profundidade esperado em projetos.",
  }));
  return [official, ...getExtraMaterials(opportunity), ...practical].slice(0, 5);
}

export function OpportunityMaterialsPanel({ opportunity }: { opportunity: OpportunityDetail }) {
  const hub = getOpportunityCommunityHub(opportunity);
  const materials = getCuratedMaterials(opportunity);
  const people = opportunity.people.slice(0, 3);

  return <div>
    <header className="mb-7 border-b border-[#e5e9e6] pb-6">
      <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#079272]">Curadoria para avançar</span>
      <h2 className="mt-2 text-[clamp(1.65rem,3vw,2.25rem)] font-semibold leading-tight tracking-[-.045em] text-[#1c372c]">Materiais para esta oportunidade.</h2>
      <p className="mt-2 max-w-2xl text-xs leading-6 text-[#69756f]">Referências escolhidas pelo que podem destravar na sua preparação — não uma biblioteca genérica.</p>
    </header>

    <section aria-labelledby="material-people-title">
      <div className="mb-4 flex items-end justify-between gap-4"><div><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#7d8983]">Pessoas de referência</span><h3 id="material-people-title" className="mt-1 text-lg font-semibold tracking-[-.035em] text-[#29493c]">Quem pode orientar sua preparação</h3></div><span className="hidden text-[8px] text-[#89938e] sm:block">Selecionadas por experiência relacionada</span></div>
      <div className="grid gap-3 sm:grid-cols-3">{people.map((person) => <article className="rounded-[18px] border border-[#dce4e0] bg-white p-4 shadow-[0_7px_20px_rgba(28,54,43,.035)]" key={person.name}>
        <div className="flex items-center gap-3"><Image className="size-11 rounded-[13px] object-cover" src={person.image} alt={`Retrato de ${person.name}`} width={44} height={44} /><div className="min-w-0"><h4 className="truncate text-[11px] font-semibold text-[#29493c]">{person.name}</h4><p className="mt-0.5 text-[8px] font-semibold text-[#078166]">{person.role}</p></div></div>
        <p className="mt-3 line-clamp-2 text-[9px] leading-4 text-[#748079]">{person.journey}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">{person.helpsWith.slice(0, 2).map((topic) => <span className="rounded-full bg-[#eef5f1] px-2 py-1 text-[7px] font-semibold text-[#607068]" key={topic}>{topic}</span>)}</div>
      </article>)}</div>
    </section>

    <section className="mt-9" aria-labelledby="curated-materials-title">
      <div className="mb-4"><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#7d8983]">Links selecionados</span><h3 id="curated-materials-title" className="mt-1 text-lg font-semibold tracking-[-.035em] text-[#29493c]">O que vale abrir agora</h3></div>
      <div className="divide-y divide-[#e5ebe8] overflow-hidden rounded-[20px] border border-[#d8e1dc] bg-white">{materials.map((material) => <a href={material.href} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4 p-4 text-[#29493c] no-underline transition hover:bg-[#f7faf8] sm:p-5" key={material.id}>
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-[#e0e6e3] bg-white"><img src={material.favicon} alt="" className="size-5 object-contain" /></span>
        <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><b className="rounded-full bg-[#edf5f1] px-2 py-1 text-[7px] font-bold uppercase tracking-[.08em] text-[#078166]">{material.type}</b><small className="text-[8px] text-[#89938e]">{material.site}</small></span><strong className="mt-2 block text-[11px] leading-5">{material.title}</strong><span className="mt-1 block text-[9px] leading-4 text-[#748079]">{material.description}</span><span className="mt-2 inline-flex items-start gap-1.5 text-[8px] leading-4 text-[#5c6d65]"><Sparkles size={10} className="mt-0.5 shrink-0 text-[#079272]" /><b>Por que escolhemos:</b> {material.reason}</span></span>
        <ExternalLink size={14} className="mt-1 shrink-0 text-[#9aa49f] transition group-hover:text-[#078166]" />
      </a>)}</div>
    </section>

    <aside className="mt-7 flex flex-col gap-5 rounded-[20px] border border-[#bcdacf] bg-[#edf8f3] p-5 sm:flex-row sm:items-center">
      <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-white text-[#078166] shadow-sm"><MessageCircle size={18} /></span>
      <div className="min-w-0 flex-1"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[#078166]">Ajuda humana</span><h3 className="mt-1 text-[13px] font-semibold text-[#29493c]">Quer ajuda para escolher ou usar um material?</h3><p className="mt-1 text-[9px] leading-4 text-[#65756d]">Converse com estudantes no grupo da seConecta no WhatsApp.</p></div>
      <a href={hub.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-[#079272] px-5 text-[9px] font-semibold text-white no-underline transition hover:bg-[#06775e]">Entrar no grupo <ArrowUpRight size={12} /></a>
    </aside>

    <p className="mt-4 flex items-center gap-2 text-[8px] leading-4 text-[#8a958f]"><BookOpenCheck size={12} className="shrink-0" />A seConecta organiza referências; requisitos e prazos devem ser confirmados na fonte oficial.</p>
  </div>;
}
