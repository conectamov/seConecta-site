"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  Mail,
  MessageCircle,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import seconectaLogo from "@/assets/seconecta-logo.png";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { ComingSoon } from "@/components/coming-soon";
import { useOpportunityCatalog } from "@/components/opportunity-catalog-provider";
import { SiteHeader } from "@/components/site-header";
import { useJourneyOnboarding } from "@/hooks/use-journey-onboarding";
import "./landing.css";

const interests = ["Olimpíadas", "Pesquisa", "Bolsas", "Programação", "Ciência", "Tecnologia"];

const faqs = [
  ["O seConecta é gratuito?", "Sim. Descobrir, salvar e receber oportunidades é gratuito."],
  ["Que oportunidades vou encontrar?", "Bolsas, olimpíadas, pesquisa, competições, cursos e programas nacionais e internacionais."],
  ["Preciso instalar um aplicativo?", "Não. Você pode explorar pelo site ou receber oportunidades direto no WhatsApp."],
  ["Posso mudar meus interesses?", "Sim. Suas preferências podem acompanhar cada nova fase da sua jornada."],
];

const trajectories = [
  {
    category: "🧠 IA",
    headline: "Da escola pública à pesquisa em IA.",
    name: "Luiza Mendes",
    location: "Salvador · Escola pública",
    steps: ["Clube de Ciência", "Olimpíada Brasileira de IA", "Jovens Cientistas", "Pesquisa aplicada"],
    quote: "Eu achava que pesquisa era só para gênios.",
    image: "/trajectory-luiza.png",
    tone: "blue",
  },
  {
    category: "🏆 Matemática",
    headline: "Como a OBMEP abriu a primeira porta.",
    name: "Gabriel Nunes",
    location: "Belém · Ensino médio",
    steps: ["OBMEP", "PIC", "Iniciação Científica", "Mentoria olímpica"],
    quote: "A OBMEP foi a primeira porta que se abriu.",
    image: "/trajectory-gabriel.png",
    tone: "gold",
  },
  {
    category: "💻 Programação",
    headline: "Do primeiro código ao hackathon.",
    name: "Isadora Lima",
    location: "Recife · Ensino médio",
    steps: ["Curso gratuito", "Primeiro projeto", "Hackathon", "Bolsa em tecnologia"],
    quote: "Foi quando encontrei pessoas parecidas comigo.",
    image: "/trajectory-isadora.png",
    tone: "cyan",
  },
  {
    category: "🔬 Pesquisa",
    headline: "Da curiosidade ao laboratório.",
    name: "Rafael Costa",
    location: "Manaus · Escola pública",
    steps: ["Feira de Ciências", "Mentoria", "Laboratório", "Jovens Cientistas"],
    quote: "Passei meses sem saber que essa oportunidade existia.",
    image: "/trajectory-rafael.png",
    tone: "green",
  },
];

function Brand() {
  return <Link href="#inicio" className="tl-brand" aria-label="seConecta, início"><span>se</span>Conecta<i /></Link>;
}

function CTA({ onClick, children = "Começar minha jornada", inverse = false }: { onClick: () => void; children?: React.ReactNode; inverse?: boolean }) {
  return <button className={`tl-cta ${inverse ? "tl-cta-inverse" : ""}`} onClick={onClick}><span>{children}</span><b aria-hidden="true">&gt;</b></button>;
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div className={className} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: .5, ease: "easeOut" }}>{children}</motion.div>;
}

function TrajectoryTimeline({ steps }: { steps: string[] }) {
  return <ol className="tl-trajectory-timeline" aria-label="Etapas da trajetória">
    {steps.map((step, index) => <li key={step}><span className="tl-trajectory-point">{String(index + 1).padStart(2, "0")}</span><span>{step}</span></li>)}
  </ol>;
}

function TrajectoryCard({ trajectory, index, decorative = false }: { trajectory: typeof trajectories[number]; index: number; decorative?: boolean }) {
  return <motion.article className={`tl-trajectory-card tone-${trajectory.tone}`} aria-hidden={decorative} whileHover={{ y: -7 }} transition={{ duration: .25, ease: "easeOut" }}>
    <span className="tl-trajectory-category">{trajectory.category}</span>
    <h3 className="tl-trajectory-headline">{trajectory.headline}</h3>
    <div className="tl-trajectory-person"><div className="tl-trajectory-portrait"><img src={trajectory.image} alt={`Retrato de ${trajectory.name}`} /></div><div><h3>{trajectory.name}</h3><p>{trajectory.location}</p></div></div>
    <TrajectoryTimeline steps={trajectory.steps} />
    <p className="tl-trajectory-quote">“{trajectory.quote}”</p>
    <Link className="tl-trajectory-link" href={`/historias#${trajectory.name.toLowerCase().replaceAll(" ", "-")}`} tabIndex={decorative ? -1 : undefined}>Conhecer trajetória <ArrowRight size={15} /></Link>
  </motion.article>;
}

function TrajectorySection() {
  return <section className="tl-section tl-trajectories relative" id="historias">
    <ComingSoon className="min-h-[560px]">
    <div className="tl-container">
      <Reveal className="tl-trajectories-heading"><div><span className="tl-label">Histórias reais</span><h2>Trajetórias que inspiram.</h2><p>Aprenda com estudantes que percorreram caminhos parecidos com o seu.</p></div><Link href="/historias">Ver todas <ArrowRight size={16} /></Link></Reveal>
    </div>
    <div className="tl-trajectory-rail" aria-label="Trajetórias de estudantes">
      <div className="tl-trajectory-track">
        {[false, true].flatMap((duplicate) => trajectories.map((trajectory, index) => <TrajectoryCard trajectory={trajectory} index={index} decorative={duplicate} key={`${duplicate}-${trajectory.name}`} />))}
      </div>
    </div>
    </ComingSoon>
  </section>;
}

export default function LandingPage() {
  const router = useRouter();
  const { ready: authenticationReady, isAuthenticated } = useAuthentication();
  const {
    opportunities: catalogOpportunities,
    opportunityMetadata,
    ready: catalogReady,
    error: catalogError,
  } = useOpportunityCatalog();
  const [faq, setFaq] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const [showNewsletterCue, setShowNewsletterCue] = useState(false);
  const wheelLock = useRef(false);
  const { startOnboarding: start } = useJourneyOnboarding();
  const subscribe = (event: FormEvent) => { event.preventDefault(); setSent(true); };
  const featuredOpportunities = catalogOpportunities
    .filter((item) => {
      const status = opportunityMetadata[item.id]?.applicationStatus;
      return status === "open" || status === "endingSoon" || status === "evergreen";
    })
    .slice(0, 3);

  useEffect(() => {
    if (authenticationReady && isAuthenticated) router.replace("/jornada");
  }, [authenticationReady, isAuthenticated, router]);

  useEffect(() => {
    const visibleSections = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting
        ? visibleSections.add(entry.target.id)
        : visibleSections.delete(entry.target.id));
      setShowNewsletterCue(visibleSections.size > 0);
    }, { threshold: 0.2 });

    ["historias", "comunidade"].forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sectionIds = ["oportunidades"];
    const headerHeight = 72;
    let animationFrame = 0;
    let releaseTimer = 0;

    const getSectionTargets = (sections: HTMLElement[]) => {
      const sequence = document.querySelector<HTMLElement>(".tl-snap-sequence");
      if (!sequence) return [];

      const sequenceTop = window.scrollY + sequence.getBoundingClientRect().top - headerHeight;
      let precedingHeight = 0;
      return sections.map((section) => {
        const target = sequenceTop + precedingHeight;
        precedingHeight += section.offsetHeight;
        return target;
      });
    };

    const scrollToSection = (target: number) => {
      const start = window.scrollY;
      const distance = target - start;
      const duration = 320;
      const startedAt = performance.now();
      document.documentElement.classList.add("tl-wheel-stepping");

      const step = (now: number) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = progress < .5
          ? 4 * Math.pow(progress, 3)
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        window.scrollTo(0, start + distance * eased);
        if (progress < 1) animationFrame = requestAnimationFrame(step);
        else {
          window.scrollTo(0, target);
          document.documentElement.classList.remove("tl-wheel-stepping");
          releaseTimer = window.setTimeout(() => {
            wheelLock.current = false;
          }, 80);
        }
      };

      animationFrame = requestAnimationFrame(step);
    };

    const handleWheel = (event: WheelEvent) => {
      if (window.innerWidth <= 850 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const sections = sectionIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
      if (sections.length !== sectionIds.length) return;

      const targets = getSectionTargets(sections);
      if (targets.length !== sections.length) return;
      const currentIndex = targets.reduce((nearest, target, index) =>
        Math.abs(target - window.scrollY) < Math.abs(targets[nearest] - window.scrollY) ? index : nearest, 0);
      const isWithinSequence = window.scrollY >= targets[0] - 2 && window.scrollY <= targets[targets.length - 1] + 2;
      if (!isWithinSequence) return;

      if (wheelLock.current) {
        event.preventDefault();
        return;
      }

      if (Math.abs(event.deltaY) < 6) return;

      const targetIndex = currentIndex + (event.deltaY > 0 ? 1 : -1);
      if (!sections[targetIndex]) return;

      event.preventDefault();
      wheelLock.current = true;
      scrollToSection(targets[targetIndex]);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(releaseTimer);
      document.documentElement.classList.remove("tl-wheel-stepping");
    };
  }, []);

  if (!authenticationReady || isAuthenticated) {
    return <main className="min-h-screen bg-[#fafbf9]"><SiteHeader /><div className="mx-auto mt-20 h-52 w-[min(920px,calc(100%-40px))] animate-pulse rounded-[28px] bg-[#edf2ef]" /></main>;
  }

  return <main className="landing-page">
    <SiteHeader />

    <section className="tl-hero" id="inicio"><div className="tl-container tl-hero-layout">
      <div className="tl-hero-inner">
        <motion.div className="tl-hero-mark" initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .45 }}><Image src={seconectaLogo} alt="" width={34} height={34} priority /></motion.div>
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>Nunca mais perca uma <em>oportunidade.</em></motion.h1>
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .08 }}>Bolsas, olimpíadas, pesquisa e experiências escolhidas para o momento da sua jornada.</motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, delay: .15 }}><CTA onClick={start} /></motion.div>
        <span className="tl-hero-note">100% grátis para estudantes</span>
      </div>
    </div></section>

    <section className="tl-hero-phone-section"><div className="tl-container">
      <motion.div className="tl-hero-phone-stage" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65, delay: .12 }} aria-label="Exemplo de conversa com o seConecta no WhatsApp">
        <div className="tl-gradient-orbit" />
        <div className="tl-hero-phone">
          <div className="tl-phone-top"><span>9:41</span><i /><small>● ● ●</small></div>
          <div className="tl-phone-contact"><b>‹</b><span><img src="/seconecta-logo.png" alt="" /></span><div><strong>seConecta</strong><small>online agora</small></div><i>⋮</i></div>
          <div className="tl-phone-chat">
            <span className="tl-chat-date">HOJE</span>
            <div className="tl-phone-bubble student">Quero encontrar uma oportunidade de pesquisa em tecnologia.<small>10:32 ✓✓</small></div>
            <div className="tl-phone-bubble bot">Encontrei uma que combina com você. É gratuita e aceita estudantes do ensino médio.<small>10:32</small></div>
            <div className="tl-phone-result"><span>96% para você</span><strong>Jovens Cientistas<br />do Brasil</strong><small>Pesquisa · Online · Gratuito</small><button>Ver oportunidade <b>&gt;</b></button></div>
            <div className="tl-phone-bubble bot reminder">Quer que eu lembre você antes do prazo?<small>10:33</small></div>
            <div className="tl-phone-bubble student answer">Sim, por favor! 🙌<small>10:33 ✓✓</small></div>
          </div>
          <div className="tl-phone-input"><span>Mensagem</span><b>›</b></div>
        </div>
        <div className="tl-phone-status"><Check size={14} /><span><b>Lembrete ativado</b><small>Você não perde o prazo.</small></span></div>
      </motion.div>
    </div></section>
    <section className="tl-category-marquee" aria-label="Categorias de oportunidades">
      <div className="tl-category-track">
        {[0, 1].map((group) => <div className="tl-category-group" aria-hidden={group === 1} key={group}>
          {["Olimpíadas", "Pesquisa", "Bolsas", "Competições", "Programas de verão", "Programação", "Tecnologia", "Empreendedorismo", "Intercâmbios"].map((category, index) => <span key={category}><i className={`tone-${index % 3}`} />{category}</span>)}
        </div>)}
      </div>
    </section>

    <section className="tl-section tl-whatsapp" id="sobre"><div className="tl-container tl-two-cols">
      <Reveal className="tl-tablet"><span className="tl-tablet-camera" /><div className="tl-tablet-screen"><aside className="tl-tablet-sidebar"><div className="tl-sidebar-title"><img src="/seconecta-logo.png" alt="" /><b>Conversas</b></div><div className="tl-sidebar-search"><Search size={12} /><span>Buscar</span></div><div className="tl-sidebar-contact active"><span><img src="/seconecta-logo.png" alt="" /></span><div><b>seConecta</b><small>Encontrei uma oportunidade...</small></div><time>10:33</time></div><div className="tl-sidebar-contact"><span>G</span><div><b>Grupo de estudos</b><small>Até amanhã!</small></div></div><div className="tl-sidebar-contact"><span>A</span><div><b>Ana Clara</b><small>Obrigada :)</small></div></div></aside><div className="tl-tablet-conversation"><div className="tl-chat-head"><b>‹</b><span><img src="/seconecta-logo.png" alt="" /></span><div><strong>seConecta</strong><small>online agora</small></div><i>⋮</i></div><div className="tl-demo-body"><span className="tl-demo-date">HOJE</span><div className="tl-message mine">Tenho interesse em pesquisa sobre IA.<small>10:32 ✓✓</small></div><div className="tl-message">Encontrei uma oportunidade gratuita para estudantes do ensino médio.<small>10:32</small></div><div className="tl-chat-card"><span>96% para você</span><strong>Jovens Cientistas do Brasil</strong><small>Pesquisa · Online · Gratuito</small><div>Inscrições até 24 de julho</div><button>Ver oportunidade <b>&gt;</b></button></div><div className="tl-message">Quer que eu lembre você antes do prazo?<small>10:33</small></div><div className="tl-message mine short">Sim, por favor! 🙌<small>10:33 ✓✓</small></div><div className="tl-message confirmation">Pronto! Vou avisar você três dias antes.<small>10:33</small></div></div><div className="tl-demo-input"><span>Mensagem</span><b>›</b></div></div></div></Reveal>
      <Reveal className="tl-copy"><span className="tl-label">Direto no WhatsApp</span><h2>As oportunidades chegam até você.</h2><p>Sem um novo aplicativo para aprender. Descubra, salve e acompanhe tudo onde você já conversa.</p><ul><li><Sparkles size={18} /><span><b>Escolhidas para você</b><small>De acordo com seus interesses.</small></span></li><li><Bell size={18} /><span><b>Prazos sob controle</b><small>Lembretes antes que seja tarde.</small></span></li><li><MessageCircle size={18} /><span><b>Orientação simples</b><small>Entenda o próximo passo.</small></span></li></ul><CTA onClick={start}>Quero receber oportunidades</CTA></Reveal>
    </div></section>
    <div className="tl-snap-sequence">
    <section className="tl-section tl-snap-section" id="oportunidades"><div className="tl-container">
      <span className="tl-section-count" aria-hidden="true">01 / 02</span>
      <Reveal className="tl-heading tl-heading-row"><div><span className="tl-label">Oportunidades em destaque</span><h2>Seu próximo passo pode estar aqui.</h2><p>Programas selecionados para estudantes que querem aprender, criar e ir além.</p></div><Link href="/explorar">Explorar todas <span>›</span></Link></Reveal>
      <div className="tl-opportunities">
        {!catalogReady && <Reveal className="tl-opportunity"><div className="tl-opportunity-top"><span>Catálogo</span></div><h3>Carregando oportunidades...</h3><p>Buscando informações atualizadas.</p></Reveal>}
        {catalogReady && catalogError && <Reveal className="tl-opportunity"><div className="tl-opportunity-top"><span>Catálogo indisponível</span></div><h3>Não foi possível carregar agora.</h3><p>Tente novamente em alguns instantes.</p><div><Link href="/explorar">Abrir catálogo</Link><b>›</b></div></Reveal>}
        {catalogReady && !catalogError && featuredOpportunities.length === 0 && <Reveal className="tl-opportunity"><div className="tl-opportunity-top"><span>Catálogo</span></div><h3>Nenhuma oportunidade aberta agora.</h3><p>Veja o catálogo completo e acompanhe as próximas aberturas.</p><div><Link href="/explorar">Abrir catálogo</Link><b>›</b></div></Reveal>}
        {featuredOpportunities.map((item) => {
          const href = item.slug ? `/oportunidades/${item.slug}` : "/explorar";
          return <Reveal className="tl-opportunity" key={item.id}><div className="tl-opportunity-top"><span>{item.category}</span><button aria-label={`Salvar ${item.title}`} onClick={start}><Bookmark size={18} /></button></div><h3><Link href={href}>{item.title}</Link></h3><p>{item.organization}</p><div><span><Clock3 size={15} /> {item.deadline === "Prazo não informado" ? item.deadline : `Prazo ${item.deadline}`}</span><Link href={href} aria-label={`Ver ${item.title}`}>›</Link></div></Reveal>;
        })}
      </div>
    </div><div className="tl-deadline"><div className="tl-container tl-deadline-inner"><button className="tl-deadline-discover" type="button" onClick={start}><span>Descubra meu próximo passo</span><b aria-hidden="true">›</b></button></div></div></section>

    <TrajectorySection />

    <ComingSoon
      className="tl-community"
      message="A Comunidade está sendo preparada. Enquanto isso, participe do grupo oficial da seConecta."
      action={<a href={process.env.NEXT_PUBLIC_SECONNECTA_WHATSAPP_COMMUNITY_URL ?? "https://chat.whatsapp.com/"} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-5 text-[10px] font-semibold text-white no-underline"><MessageCircle size={14} />Entrar no grupo do WhatsApp</a>}
    ><section className="tl-section tl-community tl-community-compact" id="comunidade"><div className="tl-container tl-two-cols">
      <Reveal className="tl-copy"><span className="tl-label">Pessoas aceleram pessoas</span><h2>Você não precisa crescer sozinho.</h2><p>Estudantes que criam, pesquisam e compartilham. Mentores que abrem portas. Amizades que tornam novos caminhos possíveis.</p><a className="tl-text-link" href="#">Conhecer a comunidade <span>›</span></a></Reveal>
      <Reveal className="tl-community-list">{[["Criadores", "Transformam descobertas em conteúdo."], ["Pesquisadores", "Investigam perguntas que importam."], ["Construtores", "Criam projetos para outros estudantes."], ["Conectores", "Aproximam pessoas e oportunidades."]].map(([title, text], index) => <div key={title}><span>0{index + 1}</span><div><b>{title}</b><small>{text}</small></div><ArrowUpRight size={17} /></div>)}</Reveal>
    </div></section></ComingSoon>
    </div>

    <AnimatePresence>{showNewsletterCue && <motion.a className="tl-news-cue" href="#newsletter" aria-label="Receber a seleção semanal de oportunidades" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .25 }}><Mail size={14} /><span><small>Uma seleção por semana</small><b>Receber newsletter</b></span><i aria-hidden="true">›</i></motion.a>}</AnimatePresence>

    <section className="tl-news" id="newsletter"><div className="tl-container"><div><span className="tl-label">Uma seleção por semana</span><h3>Boas oportunidades no seu e-mail.</h3></div>{sent ? <span className="tl-news-success"><Check size={17} /> Tudo certo. Até sexta-feira.</span> : <form onSubmit={subscribe}><label className="sr-only" htmlFor="test-email">Seu e-mail</label><input id="test-email" type="email" placeholder="Seu melhor e-mail" required /><button>Quero receber <span>›</span></button></form>}</div></section>

    <section className="tl-section tl-faq"><div className="tl-container tl-two-cols"><Reveal className="tl-heading"><span className="tl-label">Dúvidas</span><h2>Antes de começar.</h2><p>O essencial para dar seu próximo passo com tranquilidade.</p></Reveal><Reveal className="tl-faq-list">{faqs.map(([question, answer], index) => <div className={faq === index ? "active" : ""} key={question}><button onClick={() => setFaq(faq === index ? null : index)} aria-expanded={faq === index}><span>{question}</span><ChevronDown size={18} /></button><AnimatePresence initial={false}>{faq === index && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{answer}</motion.p>}</AnimatePresence></div>)}</Reveal></div></section>

    <section className="tl-final"><div className="tl-container"><Reveal><span className="tl-final-mark"><Sparkles size={20} /></span><h2>Seu próximo passo pode começar agora.</h2><p>Conte o que interessa a você e encontre oportunidades para ir mais longe.</p><CTA onClick={start} inverse /></Reveal></div></section>

    <footer className="tl-footer"><div className="tl-container"><div className="tl-footer-top"><div><Brand /><p>Oportunidades e conexões para acelerar jornadas educacionais.</p></div><div><a href="#oportunidades">Oportunidades</a><a href="#historias">Histórias</a><a href="#comunidade">Comunidade</a></div><div><a href="#">Sobre</a><a href="#">Equipe</a><a href="#">Privacidade</a></div></div><div className="tl-footer-bottom"><span>© 2026 seConecta</span><span>Feito para quem quer ir além.</span></div></div></footer>
  </main>;
}
