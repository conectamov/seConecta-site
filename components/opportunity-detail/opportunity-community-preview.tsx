"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Check, CheckCircle2, ExternalLink, FileText, GraduationCap, Heart, MessageCircle, MessagesSquare, Send, UserRoundCheck, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { ComingSoon } from "@/components/coming-soon";
import type { OpportunityDetail } from "@/data/opportunity-details";
import type { JourneyStage } from "@/types/opportunity-journey";
import type { CommunityQuestion, OpportunityCommunityHub } from "@/types/opportunity-knowledge-hub";

type CommunityTab = "discussions" | "approved" | "experiences" | "resources";

type OpportunityCommunitySectionProps = {
  opportunity: OpportunityDetail;
  hub: OpportunityCommunityHub;
  applicationStage?: JourneyStage;
};

type DiscussionDraft = {
  opportunityId: number;
  title: string;
  description: string;
  topic: string;
  difficulty: "Inicial" | "Intermediária" | "Avançada";
  applicationStage: string;
};

const tabs: { id: CommunityTab; label: string; icon: typeof MessagesSquare }[] = [
  { id: "discussions", label: "Discussões", icon: MessagesSquare },
  { id: "approved", label: "Aprovados", icon: UserRoundCheck },
  { id: "experiences", label: "Experiências", icon: MessageCircle },
  { id: "resources", label: "Materiais e Recursos", icon: BookOpen },
];

const mockAnswers = [
  {
    author: "Luiza Mendes",
    badge: "Participou",
    time: "Há 12 min",
    body: "O que mais me ajudou foi começar cedo e pedir feedback para alguém que não conhecia minha história. Se a pessoa entende sua motivação sem contexto extra, o texto está no caminho certo.",
    likes: 8,
  },
  {
    author: "Rafael Costa",
    badge: "Aprovado em 2025",
    time: "Há 5 min",
    body: "Também recomendo usar exemplos concretos. Uma experiência pequena, bem explicada, costuma dizer mais sobre você do que uma lista longa de atividades.",
    likes: 4,
  },
];

const stageLabels: Partial<Record<JourneyStage, string>> = {
  watching: "Explorando",
  interested: "Interessado",
  visitedOfficialPage: "Revisando requisitos",
  preparing: "Preparando candidatura",
  applied: "Candidatura enviada",
  waitingForResult: "Aguardando resultado",
  accepted: "Aprovado",
  participating: "Participando",
};

function inferTopic(question: string) {
  if (/carta|motiv|redaç|texto/i.test(question)) return "Carta de motivação";
  if (/entrevista/i.test(question)) return "Entrevista";
  if (/portfólio|portfolio|projeto/i.test(question)) return "Portfólio";
  if (/elegib|requisito|ano|idade/i.test(question)) return "Elegibilidade";
  if (/compet|aprova|seleção/i.test(question)) return "Processo seletivo";
  return "Preparação";
}

function createDraft(opportunity: OpportunityDetail, question: string, applicationStage?: JourneyStage, directedTo?: string): DiscussionDraft {
  const normalized = question.trim();
  const topic = inferTopic(normalized);
  return {
    opportunityId: opportunity.id,
    title: directedTo
      ? `Pergunta para ${directedTo} sobre ${topic.toLocaleLowerCase("pt-BR")}`
      : normalized.replace(/[?.!]+$/, "") || `Dúvida sobre ${topic.toLocaleLowerCase("pt-BR")}`,
    description: normalized || `Quero ouvir experiências de quem conhece ${opportunity.title}, especialmente sobre ${topic.toLocaleLowerCase("pt-BR")}.`,
    topic,
    difficulty: normalized.length > 120 ? "Avançada" : /carta|entrevista|portfólio|compet/i.test(normalized) ? "Intermediária" : "Inicial",
    applicationStage: stageLabels[applicationStage ?? "interested"] ?? "Interessado",
  };
}

function DiscussionComposer({ draft, onChange, onClose, onConfirm }: { draft: DiscussionDraft | null; onChange: (draft: DiscussionDraft) => void; onClose: () => void; onConfirm: () => void }) {
  return <AnimatePresence>{draft && <motion.div className="fixed inset-0 z-[1100] grid place-items-center bg-[#10231c]/45 p-5 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-labelledby="discussion-draft-title" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <motion.section className="relative w-[min(540px,100%)] rounded-[24px] border border-white/60 bg-white p-6 shadow-[0_28px_80px_rgba(12,38,29,.26)] sm:p-8" initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .98 }}>
      <button type="button" onClick={onClose} className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-[#f0f4f2] text-[#66736d]" aria-label="Fechar"><X size={16} /></button>
      <span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Perguntar a estudantes</span>
      <h3 id="discussion-draft-title" className="mt-2 pr-8 text-2xl font-semibold tracking-[-.04em] text-[#17372b]">Compartilhe sua dúvida.</h3>
      <p className="mt-2 text-[10px] leading-5 text-[#718078]">Ela ficará ligada somente a esta oportunidade.</p>
      <label className="mt-5 block text-[9px] font-bold uppercase tracking-[.1em] text-[#78857e]" htmlFor="community-draft-title">Título</label>
      <input id="community-draft-title" value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} className="mt-2 h-11 w-full rounded-[13px] border border-[#d5dfda] px-4 text-[11px] font-semibold text-[#29493c] outline-none focus:border-[#079272]" />
      <label className="mt-4 block text-[9px] font-bold uppercase tracking-[.1em] text-[#78857e]" htmlFor="community-draft-description">Contexto</label>
      <textarea id="community-draft-description" value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} rows={4} className="mt-2 w-full resize-none rounded-[13px] border border-[#d5dfda] p-4 text-[10px] leading-5 text-[#52615a] outline-none focus:border-[#079272]" />
      <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-[#edf5f1] px-3 py-1.5 text-[8px] font-semibold text-[#52615a]">Oportunidade #{draft.opportunityId}</span><span className="rounded-full bg-[#edf5f1] px-3 py-1.5 text-[8px] font-semibold text-[#52615a]">{draft.topic}</span><span className="rounded-full bg-[#edf5f1] px-3 py-1.5 text-[8px] font-semibold text-[#52615a]">{draft.applicationStage}</span></div>
      <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 px-4 text-[9px] font-semibold text-[#64726b]">Cancelar</button><button type="button" onClick={onConfirm} disabled={!draft.title.trim() || !draft.description.trim()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-5 text-[9px] font-semibold text-white disabled:opacity-40"><Send size={12} />Publicar pergunta</button></div>
    </motion.section>
  </motion.div>}</AnimatePresence>;
}

export function OpportunityCommunitySection({ opportunity, hub, applicationStage }: OpportunityCommunitySectionProps) {
  const { isAuthenticated, openAuthentication } = useAuthentication();
  const [activeTab, setActiveTab] = useState<CommunityTab>("discussions");
  const [draft, setDraft] = useState<DiscussionDraft | null>(null);
  const [localQuestions, setLocalQuestions] = useState<CommunityQuestion[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [likedQuestions, setLikedQuestions] = useState<Set<string>>(new Set());
  const [likedAnswers, setLikedAnswers] = useState<Set<string>>(new Set());
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [localReplies, setLocalReplies] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const compose = (event: Event) => {
      const question = (event as CustomEvent<{ question?: string }>).detail?.question ?? "";
      setActiveTab("discussions");
      setDraft(createDraft(opportunity, question, applicationStage));
    };
    window.addEventListener("seconecta:community-compose", compose);
    return () => window.removeEventListener("seconecta:community-compose", compose);
  }, [applicationStage, opportunity]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const openDraft = (question = "", directedTo?: string) => {
    const action = () => setDraft(createDraft(opportunity, question, applicationStage, directedTo));
    if (isAuthenticated) action();
    else openAuthentication("community", action);
  };

  const publishQuestion = () => {
    if (!draft) return;
    setLocalQuestions((current) => [{
      id: `local-${Date.now()}`,
      opportunityId: draft.opportunityId,
      title: draft.title,
      preview: draft.description,
      author: "Você",
      replies: 0,
      lastActivity: "Agora",
      topic: draft.topic,
      difficulty: draft.difficulty,
      applicationStage: draft.applicationStage,
    }, ...current]);
    setDraft(null);
    setActiveTab("discussions");
    setNotice("Pergunta publicada para esta oportunidade.");
  };

  const toggleLike = (questionId: string) => {
    setLikedQuestions((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const toggleAnswerLike = (answerId: string) => {
    setLikedAnswers((current) => {
      const next = new Set(current);
      if (next.has(answerId)) next.delete(answerId);
      else next.add(answerId);
      return next;
    });
  };

  const toggleAnswers = (questionId: string) => {
    setExpandedQuestions((current) => {
      const next = new Set(current);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const submitReply = (questionId: string) => {
    const reply = replyDrafts[questionId]?.trim();
    if (!reply) return;
    setLocalReplies((current) => ({ ...current, [questionId]: [...(current[questionId] ?? []), reply] }));
    setReplyDrafts((current) => ({ ...current, [questionId]: "" }));
    setNotice("Sua resposta foi publicada.");
  };

  const questions = [...localQuestions, ...hub.questions];
  const studentResources = hub.sharedResources.filter((resource) => !/oficial|equipe seConecta/i.test(`${resource.type} ${resource.sharedBy}`));
  const panels: Record<CommunityTab, React.ReactNode> = {
    discussions: <div className="min-h-[660px]">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h3 className="text-[22px] font-semibold tracking-[-.04em] text-[#29493c]">Dúvidas de quem está se candidatando</h3>
          <p className="mt-2 text-xs leading-5 text-[#718078]">Respostas e experiências exclusivamente sobre esta oportunidade.</p>
        </div>
        <button type="button" onClick={() => openDraft()} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#079272] px-5 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(7,146,114,.18)] transition hover:-translate-y-0.5 hover:bg-[#067c61]">
          <MessageCircle size={15} />Fazer uma pergunta
        </button>
      </div>

      {questions.length === 0 ? <div className="rounded-[24px] border border-dashed border-[#cad7d1] bg-[#fafcfb] px-8 py-16 text-center">
        <h3 className="text-xl font-semibold text-[#29493c]">Ainda não existem perguntas.</h3>
        <p className="mt-2 text-xs text-[#748079]">Você pode ser o primeiro.</p>
        <button type="button" onClick={() => openDraft()} className="mt-6 rounded-full bg-[#079272] px-5 py-3 text-[11px] font-semibold text-white">Perguntar à comunidade</button>
      </div> : <div className="overflow-hidden rounded-[22px] border border-[#dfe5e1] bg-white">{questions.map((question) => {
        const isLiked = likedQuestions.has(question.id);
        const isExpanded = expandedQuestions.has(question.id);
        const replies = localReplies[question.id] ?? [];
        const replyCount = question.replies + replies.length;
        const initials = question.author.split(" ").map((part) => part[0]).join("").slice(0, 2);

        return <article className="border-b border-[#e6ebe8] p-5 last:border-b-0 sm:p-6" key={question.id}>
          <div className="flex gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#eaf5f0] text-[11px] font-bold text-[#078166]">{initials}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <strong className="text-[11px] text-[#29493c]">{question.author}</strong>
                <span className="text-[9px] text-[#8a958f]">{question.applicationStage} · {question.lastActivity}</span>
              </div>
              <h3 className="mt-3 text-[15px] font-semibold leading-6 text-[#29493c]">{question.title}</h3>
              <p className="mt-1.5 text-[11px] leading-5 text-[#65736c]">{question.preview}</p>
              <span className="mt-3 inline-flex rounded-full bg-[#f1f4f2] px-2.5 py-1 text-[8px] font-medium text-[#6f7d76]">{question.topic}</span>

              <div className="mt-4 flex items-center gap-5">
                <button type="button" onClick={() => toggleLike(question.id)} className={`inline-flex items-center gap-1.5 text-[10px] font-semibold transition ${isLiked ? "text-[#079272]" : "text-[#77847e] hover:text-[#079272]"}`} aria-pressed={isLiked}>
                  <Heart size={14} fill={isLiked ? "currentColor" : "none"} />{isLiked ? "Curtido" : "Curtir"} <span className="font-normal">{Math.max(2, Math.ceil(question.replies / 2)) + (isLiked ? 1 : 0)}</span>
                </button>
                <button type="button" onClick={() => toggleAnswers(question.id)} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#77847e] transition hover:text-[#079272]" aria-expanded={isExpanded}>
                  <MessageCircle size={14} />{isExpanded ? "Ocultar respostas" : `Ver ${replyCount} respostas`}
                </button>
                <button type="button" onClick={() => { if (!isExpanded) toggleAnswers(question.id); }} className="text-[10px] font-semibold text-[#77847e] transition hover:text-[#079272]">Responder</button>
              </div>

              <AnimatePresence initial={false}>{isExpanded && <motion.div className="mt-5 border-l-2 border-[#e3e9e6] pl-4" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <div className="grid gap-5">
                  {mockAnswers.map((answer) => {
                    const answerId = `${question.id}-${answer.author}`;
                    const isAnswerLiked = likedAnswers.has(answerId);
                    return <div className="flex gap-3" key={answerId}>
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f0f3f1] text-[9px] font-bold text-[#637169]">{answer.author.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><strong className="text-[10px] text-[#29493c]">{answer.author}</strong><span className="rounded-full bg-[#eaf7f1] px-2 py-0.5 text-[8px] font-semibold text-[#078166]">{answer.badge}</span><span className="text-[8px] text-[#939d98]">{answer.time}</span></div>
                        <p className="mt-1.5 text-[10px] leading-5 text-[#65736c]">{answer.body}</p>
                        <button type="button" onClick={() => toggleAnswerLike(answerId)} className={`mt-2 inline-flex items-center gap-1 text-[9px] font-medium transition ${isAnswerLiked ? "text-[#079272]" : "text-[#84908a] hover:text-[#079272]"}`} aria-pressed={isAnswerLiked}><Heart size={11} fill={isAnswerLiked ? "currentColor" : "none"} />{isAnswerLiked ? "Curtido" : "Curtir"} · {answer.likes + (isAnswerLiked ? 1 : 0)}</button>
                      </div>
                    </div>;
                  })}
                  {replies.map((reply, index) => <div className="flex gap-3" key={`${question.id}-local-${index}`}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eaf5f0] text-[9px] font-bold text-[#078166]">VC</span>
                    <div><div className="flex items-center gap-2"><strong className="text-[10px] text-[#29493c]">Você</strong><span className="text-[8px] text-[#939d98]">Agora</span></div><p className="mt-1.5 text-[10px] leading-5 text-[#65736c]">{reply}</p></div>
                  </div>)}
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eaf5f0] text-[9px] font-bold text-[#078166]">VC</span>
                  <input value={replyDrafts[question.id] ?? ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [question.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") submitReply(question.id); }} placeholder="Escreva uma resposta..." className="h-10 min-w-0 flex-1 rounded-full border border-[#d9e2dd] bg-[#fafcfb] px-4 text-[10px] text-[#29493c] outline-none placeholder:text-[#98a29d] focus:border-[#079272]" />
                  <button type="button" onClick={() => submitReply(question.id)} disabled={!replyDrafts[question.id]?.trim()} className="grid size-10 shrink-0 place-items-center rounded-full bg-[#079272] text-white disabled:opacity-35" aria-label="Enviar resposta"><Send size={14} /></button>
                </div>
              </motion.div>}</AnimatePresence>
            </div>
          </div>
        </article>;
      })}</div>}
    </div>,
    approved: <ComingSoon className="min-h-[660px]"><div className="min-h-[660px]">
      <div className="mb-7"><span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Trajetórias reais</span><h3 className="mt-2 text-[22px] font-semibold tracking-[-.04em] text-[#29493c]">Histórias dessa oportunidade</h3><p className="mt-2 max-w-xl text-xs leading-5 text-[#718078]">Conheça estudantes aprovados, como se prepararam e o que aprenderam durante o processo.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">{hub.approvedStudents.map((student) => <article className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-[24px] border border-[#d4e1db] bg-white p-6 shadow-[0_10px_30px_rgba(28,54,43,.045)] transition duration-200 hover:-translate-y-0.5 hover:border-[#b6d4c7] hover:shadow-[0_18px_42px_rgba(28,54,43,.08)]" key={student.id}>
        <span className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#079272,#54c3a6)]" />
        <div className="flex items-center gap-4">
          <div className="relative"><Image className="size-[72px] rounded-[20px] object-cover ring-4 ring-[#f1f6f3]" src={student.image} alt={`Retrato de ${student.name}`} width={72} height={72} /><span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border-2 border-white bg-[#079272] text-white"><Check size={11} strokeWidth={3} /></span></div>
          <div className="min-w-0"><h4 className="text-[15px] font-semibold tracking-[-.025em] text-[#29493c]">{student.name}</h4><span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#eaf7f1] px-2.5 py-1 text-[9px] font-semibold text-[#078166]"><CheckCircle2 size={11} />Aprovado em {student.acceptedYear}</span></div>
        </div>
        <p className="mt-5 flex items-start gap-2.5 text-[10px] leading-5 text-[#69766f]"><GraduationCap size={15} className="mt-0.5 shrink-0 text-[#078166]" /><span><span className="block text-[8px] font-bold uppercase tracking-[.09em] text-[#8a958f]">Instituição</span>{student.institution}</span></p>
        <div className="mt-5 rounded-[16px] bg-[#f5f8f6] px-4 py-3.5"><span className="text-[8px] font-bold uppercase tracking-[.1em] text-[#87928c]">Um pouco da história</span><p className="mt-1.5 line-clamp-3 text-[10px] leading-5 text-[#586a61]">{student.story}</p></div>
        <button type="button" onClick={() => setNotice(`História de ${student.name} aberta.`)} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#079272] px-5 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(7,146,114,.16)] transition hover:bg-[#06785f]">
          Ver história <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </article>)}</div>
    </div></ComingSoon>,
    experiences: <ComingSoon className="min-h-[660px]"><div className="min-h-[660px]">
      <div className="mb-7"><h3 className="text-[22px] font-semibold tracking-[-.04em] text-[#29493c]">Experiências compartilhadas</h3><p className="mt-2 text-xs leading-5 text-[#718078]">O que estudantes aprenderam antes, durante e depois da oportunidade.</p></div>
      <div className="grid gap-4">{hub.experiences.map((experience) => <article className="rounded-[24px] border border-[#d9e2dd] bg-white p-6 shadow-[0_8px_26px_rgba(28,54,43,.035)] sm:p-7" key={experience.id}><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#078166]">{experience.connection}</span><h3 className="mt-3 text-base font-semibold leading-6 text-[#29493c]">{experience.title}</h3><p className="mt-3 text-[11px] leading-6 text-[#718078]">{experience.excerpt}</p><div className="mt-6 flex items-center justify-between border-t border-[#e9eeeb] pt-4 text-[10px] text-[#89938e]"><span>Por {experience.author} · {experience.readTime}</span><button type="button" onClick={() => setNotice("Experiência aberta.")} className="inline-flex items-center gap-1.5 font-semibold text-[#078166]">Ler experiência <ArrowRight size={12} /></button></div></article>)}</div>
    </div></ComingSoon>,
    resources: <div className="min-h-[660px]">
      <div className="mb-7"><span className="inline-flex rounded-full bg-[#edf7f2] px-3 py-1.5 text-[9px] font-bold text-[#078166]">Compartilhados por estudantes</span><h3 className="mt-3 text-[22px] font-semibold tracking-[-.04em] text-[#29493c]">Materiais práticos da comunidade</h3><p className="mt-2 text-xs leading-5 text-[#718078]">Templates, portfólios, relatos, cartas e notas pessoais — não materiais oficiais.</p></div>
      <div className="divide-y divide-[#e3e9e6] overflow-hidden rounded-[24px] border border-[#d9e2dd] bg-white shadow-[0_8px_26px_rgba(28,54,43,.035)]">{studentResources.map((resource) => <a href={resource.href} target="_blank" rel="noopener noreferrer" className="group flex min-h-[92px] items-center gap-4 p-5 no-underline transition hover:bg-[#f7faf8] sm:p-6" key={resource.id}><span className="grid size-12 shrink-0 place-items-center rounded-[15px] bg-[#edf6f2] text-[#078166]"><FileText size={18} /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-xs text-[#29493c]">{resource.title}</strong><b className="rounded-full bg-[#f0f3f1] px-2.5 py-1 text-[8px] text-[#77837d]">{resource.type}</b></span><span className="mt-1.5 block text-[10px] leading-4 text-[#748079]">Compartilhado por {resource.sharedBy} · {resource.saves} pessoas salvaram</span></span><ExternalLink size={15} className="shrink-0 text-[#9aa49f] transition group-hover:text-[#078166]" /></a>)}</div>
    </div>,
  };

  return <div>
    <nav className="-mx-1 min-w-0 overflow-x-auto px-1 pb-2" aria-label="Áreas da comunidade">
      <div className="flex min-w-max gap-2">{tabs.map(({ id, label, icon: Icon }) => { const comingSoon = id === "approved" || id === "experiences"; return <button type="button" onClick={() => setActiveTab(id)} className={`relative inline-flex min-h-[58px] items-center gap-2.5 rounded-[17px] border px-4 text-[10px] font-semibold transition ${activeTab === id ? "border-[#b8ddce] bg-[#eaf8f2] text-[#06775d] shadow-[0_7px_18px_rgba(7,146,114,.08)]" : "border-[#dfe6e2] bg-white text-[#69766f] hover:border-[#c8d6cf] hover:bg-[#f7f9f8]"}`} aria-current={activeTab === id ? "page" : undefined} key={id}>
        <span className={`grid size-8 place-items-center rounded-[10px] ${activeTab === id ? "bg-white text-[#079272]" : "bg-[#f1f4f2] text-[#748079]"}`}><Icon size={15} /></span>
        <span className={comingSoon ? "blur-[1.5px] opacity-60" : ""}>{label}</span>{comingSoon && <small className="rounded-full bg-[#edf1ef] px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-wide text-[#6f7b75]">Em breve</small>}
      </button>; })}</div>
    </nav>
    <div className="mt-2 flex justify-start">
      <a href={hub.whatsappGroupUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#d8e2dd] bg-white px-3.5 text-[9px] font-semibold text-[#65736c] no-underline transition hover:border-[#aad0c1] hover:bg-[#f3f8f5] hover:text-[#078166] sm:self-auto">
        <MessageCircle size={13} />
        Grupo no WhatsApp
        <ExternalLink size={10} className="opacity-55" />
      </a>
    </div>
    <div className="pt-8"><AnimatePresence mode="wait" initial={false}><motion.div key={activeTab} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} transition={{ duration: .15 }}>{panels[activeTab]}</motion.div></AnimatePresence></div>
    <DiscussionComposer draft={draft} onChange={setDraft} onClose={() => setDraft(null)} onConfirm={publishQuestion} />
    <AnimatePresence>{notice && <motion.div className="fixed bottom-5 left-1/2 z-[1200] inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#173b30] px-5 py-3 text-[9px] font-semibold text-white shadow-xl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} role="status"><Check size={12} />{notice}</motion.div>}</AnimatePresence>
  </div>;
}
