"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  Menu,
  MessageCircle,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import seconectaLogo from "@/assets/seconecta-logo.png";
import "./test-landing.css";

const interests = ["Olimpíadas", "Pesquisa", "Bolsas", "Programação", "Ciência", "Tecnologia"];

const opportunities = [
  { type: "Pesquisa", title: "Jovens Cientistas do Brasil", org: "Programa nacional", date: "24 jul" },
  { type: "Olimpíada", title: "Olimpíada Brasileira de IA", org: "Online e gratuita", date: "31 jul" },
  { type: "Bolsa", title: "Jovens Talentos para a Ciência", org: "CAPES", date: "05 ago" },
];

const faqs = [
  ["O seConecta é gratuito?", "Sim. Descobrir, salvar e receber oportunidades é gratuito."],
  ["Que oportunidades vou encontrar?", "Bolsas, olimpíadas, pesquisa, competições, cursos e programas nacionais e internacionais."],
  ["Preciso instalar um aplicativo?", "Não. Você pode explorar pelo site ou receber oportunidades direto no WhatsApp."],
  ["Posso mudar meus interesses?", "Sim. Suas preferências podem acompanhar cada nova fase da sua jornada."],
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

function SimpleOnboarding({ open, close }: { open: boolean; close: () => void }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const finish = () => { close(); window.setTimeout(() => setStep(0), 250); };
  const toggle = (item: string) => setSelected((items) => items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);

  return <AnimatePresence>{open && <motion.div className="tl-modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && finish()}>
    <motion.div className="tl-modal" role="dialog" aria-modal="true" aria-label="Comece sua jornada" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
      <div className="tl-modal-head"><Brand /><span>{step + 1} de 2</span><button onClick={finish} aria-label="Fechar"><X size={19} /></button></div>
      {step === 0 ? <div className="tl-modal-body">
        <span className="tl-label">Vamos começar</span>
        <h2>O que você quer descobrir?</h2>
        <p>Escolha tudo que faz sentido para você agora.</p>
        <div className="tl-interest-list">{interests.map((item) => <button className={selected.includes(item) ? "active" : ""} onClick={() => toggle(item)} key={item}>{selected.includes(item) && <Check size={14} />}{item}</button>)}</div>
        <button className="tl-modal-next" disabled={!selected.length} onClick={() => setStep(1)}>Continuar <span>›</span></button>
      </div> : <div className="tl-modal-body tl-modal-done">
        <span className="tl-done-icon"><Check size={24} /></span>
        <span className="tl-label">Tudo pronto</span>
        <h2>Sua jornada começa agora.</h2>
        <p>Vamos mostrar oportunidades de {selected.slice(0, 2).join(" e ")} para você.</p>
        <button className="tl-modal-next" onClick={finish}>Ver oportunidades <span>›</span></button>
      </div>}
    </motion.div>
  </motion.div>}</AnimatePresence>;
}

export default function TestLanding() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const start = () => setOpen(true);
  const subscribe = (event: FormEvent) => { event.preventDefault(); setSent(true); };

  return <main className="test-landing">
    <header className="tl-header"><nav className="tl-container tl-nav"><Brand /><div className={`tl-links ${menu ? "open" : ""}`}><a href="#como-funciona">Como funciona</a><a href="#oportunidades">Oportunidades</a><a href="#historias">Histórias</a><a href="#comunidade">Comunidade</a></div><CTA onClick={start}>Começar</CTA><button className="tl-menu" onClick={() => setMenu(!menu)} aria-label="Abrir menu">{menu ? <X /> : <Menu />}</button></nav></header>

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
          <div className="tl-phone-contact"><b>‹</b><span>se</span><div><strong>seConecta</strong><small>online</small></div><i>⋮</i></div>
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

    <section className="tl-section tl-whatsapp"><div className="tl-container tl-two-cols">
      <Reveal className="tl-chat"><div className="tl-chat-head"><span>se</span><div><b>seConecta</b><small>WhatsApp</small></div></div><div className="tl-message mine">Tenho interesse em pesquisa sobre IA.</div><div className="tl-message">Encontrei uma oportunidade  do ensino médio. É gratuita e as inscrições terminam em 8 dias.</div><div className="tl-chat-card"><span>Pesquisa</span><strong>Jovens Cientistas do Brasil</strong><small>Online · Gratuito · Até 24 de julho</small><button>Ver oportunidade <b>›</b></button></div><div className="tl-message">Quer que eu lembre você antes do prazo?</div></Reveal>
      <Reveal className="tl-copy"><span className="tl-label">Direto no WhatsApp</span><h2>As oportunidades chegam até você.</h2><p>Sem um novo aplicativo para aprender. Descubra, salve e acompanhe tudo onde você já conversa.</p><ul><li><Sparkles size={18} /><span><b>Escolhidas para você</b><small>De acordo com seus interesses.</small></span></li><li><Bell size={18} /><span><b>Prazos sob controle</b><small>Lembretes antes que seja tarde.</small></span></li><li><MessageCircle size={18} /><span><b>Orientação simples</b><small>Entenda o próximo passo.</small></span></li></ul><CTA onClick={start}>Quero receber oportunidades</CTA></Reveal>
    </div></section>



    <section className="tl-section" id="como-funciona"><div className="tl-container">
      <Reveal className="tl-heading"><span className="tl-label">Como funciona</span><h2>Menos procura.<br />Mais próximos passos.</h2><p>Você conta o que busca. O seConecta ajuda a transformar interesse em ação.</p></Reveal>
      <div className="tl-steps">{[
        ["01", "Conte seus interesses", "Diga o que você quer aprender, construir ou experimentar."],
        ["02", "Receba bons caminhos", "Veja oportunidades relevantes, explicadas com clareza."],
        ["03", "Aja no tempo certo", "Salve, acompanhe prazos e saiba como se candidatar."],
      ].map(([number, title, text]) => <Reveal className="tl-step" key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></Reveal>)}</div>
    </div></section>


    <section className="tl-section" id="oportunidades"><div className="tl-container">
      <Reveal className="tl-heading tl-heading-row"><div><span className="tl-label">Oportunidades em destaque</span><h2>Um bom caminho pode começar hoje.</h2></div><a href="#">Explorar todas <span>›</span></a></Reveal>
      <div className="tl-opportunities">{opportunities.map((item) => <Reveal className="tl-opportunity" key={item.title}><div className="tl-opportunity-top"><span>{item.type}</span><button aria-label="Salvar"><Bookmark size={18} /></button></div><h3>{item.title}</h3><p>{item.org}</p><div><span><Clock3 size={15} /> Inscrições até {item.date}</span><b>›</b></div></Reveal>)}</div>
    </div></section>

    <section className="tl-deadline"><div className="tl-container tl-deadline-inner"><div><Bell size={20} /><span><small>Prazo mais próximo</small><strong>Bolsa Tech para Todos fecha hoje</strong></span></div><button>Ver agora <span>›</span></button></div></section>

    <section className="tl-section tl-stories" id="historias"><div className="tl-container">
      <Reveal className="tl-heading"><span className="tl-label">Histórias reais</span><h2>Uma descoberta pode mudar uma trajetória inteira.</h2></Reveal>
      <Reveal className="tl-story"><div className="tl-story-image"><Image src="/students-community.png" alt="Estudantes brasileiros desenvolvendo um projeto juntos" fill sizes="(max-width: 800px) 100vw, 50vw" /></div><div className="tl-story-copy"><span>“</span><blockquote>Eu nem sabia que estudantes do ensino médio podiam fazer pesquisa. Hoje, trabalho com uma mentora que me inspira a ir além.</blockquote><div><b>Marina Oliveira</b><small>17 anos · Recife, PE</small></div><a href="#">Ler mais histórias <b>›</b></a></div></Reveal>
    </div></section>

    <section className="tl-section tl-community" id="comunidade"><div className="tl-container tl-two-cols">
      <Reveal className="tl-copy"><span className="tl-label">Pessoas aceleram pessoas</span><h2>Você não precisa crescer sozinho.</h2><p>Estudantes que criam, pesquisam e compartilham. Mentores que abrem portas. Amizades que tornam novos caminhos possíveis.</p><a className="tl-text-link" href="#">Conhecer a comunidade <span>›</span></a></Reveal>
      <Reveal className="tl-community-list">{[["Criadores", "Transformam descobertas em conteúdo."], ["Pesquisadores", "Investigam perguntas que importam."], ["Construtores", "Criam projetos para outros estudantes."], ["Conectores", "Aproximam pessoas e oportunidades."]].map(([title, text], index) => <div key={title}><span>0{index + 1}</span><div><b>{title}</b><small>{text}</small></div><ArrowUpRight size={17} /></div>)}</Reveal>
    </div></section>

    <section className="tl-section tl-faq"><div className="tl-container tl-two-cols"><Reveal className="tl-heading"><span className="tl-label">Dúvidas</span><h2>Antes de começar.</h2><p>O essencial para dar seu próximo passo com tranquilidade.</p></Reveal><Reveal className="tl-faq-list">{faqs.map(([question, answer], index) => <div className={faq === index ? "active" : ""} key={question}><button onClick={() => setFaq(faq === index ? null : index)} aria-expanded={faq === index}><span>{question}</span><ChevronDown size={18} /></button><AnimatePresence initial={false}>{faq === index && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{answer}</motion.p>}</AnimatePresence></div>)}</Reveal></div></section>

    <section className="tl-final"><div className="tl-container"><Reveal><span className="tl-final-mark"><Sparkles size={20} /></span><h2>Seu próximo passo pode começar agora.</h2><p>Conte o que interessa a você e encontre oportunidades para ir mais longe.</p><CTA onClick={start} inverse /></Reveal></div></section>

    <section className="tl-news"><div className="tl-container"><div><span className="tl-label">Uma seleção por semana</span><h3>Boas oportunidades no seu e-mail.</h3></div>{sent ? <span className="tl-news-success"><Check size={17} /> Tudo certo. Até sexta-feira.</span> : <form onSubmit={subscribe}><label className="sr-only" htmlFor="test-email">Seu e-mail</label><input id="test-email" type="email" placeholder="Seu melhor e-mail" required /><button>Quero receber <span>›</span></button></form>}</div></section>

    <footer className="tl-footer"><div className="tl-container"><div className="tl-footer-top"><div><Brand /><p>Oportunidades e conexões para acelerar jornadas educacionais.</p></div><div><a href="#oportunidades">Oportunidades</a><a href="#historias">Histórias</a><a href="#comunidade">Comunidade</a></div><div><a href="#">Sobre</a><a href="#">Equipe</a><a href="#">Privacidade</a></div></div><div className="tl-footer-bottom"><span>© 2026 seConecta</span><span>Feito para quem quer ir além.</span></div></div></footer>
    <SimpleOnboarding open={open} close={() => setOpen(false)} />
  </main>;
}
