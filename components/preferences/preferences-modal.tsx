"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock3, Globe2, Link2, MapPin, Save, SlidersHorizontal, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConnectedAccounts } from "@/components/auth/connected-accounts";
import { loadJourneyProfileExtension, saveJourneyProfileExtension } from "@/components/journey/profile-unlocks";
import { useOpportunityJourney } from "@/components/opportunity-journey-provider";
import { SelectBox } from "@/components/ui/select-box";
import { getOpportunityDetail } from "@/data/opportunity-details";
import { useJourneyOnboarding } from "@/hooks/use-journey-onboarding";
import { OPPORTUNITY_TYPES, THEMES } from "@/types/taxonomy";
import type { JourneyProfileExtension, LanguageProficiency } from "@/types/journey-profile";
import type { EducationLevel, Experience, OnboardingProfile, PreferredChannel, PrimaryGoal } from "@/types/onboarding";
import type { RecommendationFeedbackScore } from "@/types/opportunity-journey";

type PreferencesSection = "profile" | "recommendations" | "context" | "connections" | "history";

const defaultProfile: OnboardingProfile = { educationLevel: "Ensino Médio", previousExperiences: ["NONE"], themes: [], opportunityTypes: [], primaryGoal: "EXPLORING", preferredChannel: "Site" };
const educationOptions: EducationLevel[] = ["Ensino Fundamental II", "Ensino Médio", "Universidade", "Outro"];
const gradeOptions: Record<EducationLevel, string[]> = {
  "Ensino Fundamental II": ["6º ano", "7º ano", "8º ano", "9º ano"],
  "Ensino Médio": ["1º ano do Ensino Médio", "2º ano do Ensino Médio", "3º ano do Ensino Médio", "Ensino Médio concluído"],
  Universidade: ["1º ano da graduação", "2º ano da graduação", "3º ano da graduação", "4º ano da graduação", "5º ano ou mais", "Graduação concluída"],
  Outro: ["Conclusão em 2026", "Conclusão em 2027", "Conclusão em 2028", "Conclusão em 2029 ou depois", "Não se aplica"],
};
const experienceOptions: { value: Experience; label: string }[] = [
  { value: "OLYMPIADS", label: "Olimpíadas" }, { value: "RESEARCH", label: "Pesquisa" }, { value: "PROGRAMMING_PROJECTS", label: "Projetos de programação" }, { value: "HACKATHONS", label: "Hackathons" }, { value: "INTERNSHIPS", label: "Estágios" }, { value: "STUDY_ABROAD", label: "Experiências internacionais" }, { value: "COURSES", label: "Cursos" }, { value: "VOLUNTEERING", label: "Voluntariado" }, { value: "ENTREPRENEURSHIP", label: "Empreendedorismo" }, { value: "NONE", label: "Ainda não participei" },
];
const goalOptions: { value: PrimaryGoal; label: string }[] = [
  { value: "STUDY_ABROAD", label: "Estudar no exterior" }, { value: "OLYMPIADS", label: "Evoluir em olimpíadas" }, { value: "RESEARCH", label: "Fazer pesquisa" }, { value: "TECHNOLOGY", label: "Criar projetos de tecnologia" }, { value: "CAREER", label: "Desenvolver minha carreira" }, { value: "EXPLORING", label: "Explorar possibilidades" },
];
const futureOptions = ["Universidade no Brasil", "Universidade no exterior", "Pesquisa", "Olimpíadas", "Empreendedorismo", "Estágios", "Explorar carreiras", "Ainda não sei"];
const languageOptions = ["Português", "Inglês", "Espanhol", "Francês", "Outro"];
const proficiencies: LanguageProficiency[] = ["Básico", "Intermediário", "Avançado", "Fluente"];
const feedbackLabels: Record<RecommendationFeedbackScore, string> = { 1: "Combina muito", 0: "Combina um pouco", [-1]: "Não combina" };
const sections: { id: PreferencesSection; label: string; description: string; icon: typeof UserRound }[] = [
  { id: "profile", label: "Perfil", description: "Nome, etapa e idiomas", icon: UserRound },
  { id: "recommendations", label: "Recomendações", description: "Interesses e objetivos", icon: Sparkles },
  { id: "context", label: "Contexto", description: "Rotina e localização", icon: MapPin },
  { id: "connections", label: "Conexões", description: "Avisos e contas", icon: Link2 },
  { id: "history", label: "Histórico", description: "Preferências anteriores", icon: SlidersHorizontal },
];

const inputClass = "mt-1.5 h-11 w-full rounded-[13px] border border-[#d6e0db] bg-[#f9fbfa] px-3 text-[11px] text-[#29493c] outline-none transition focus:border-[#079272] focus:ring-2 focus:ring-[#079272]/10";

function PanelHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="mb-6"><span className="text-[8px] font-bold uppercase tracking-[.14em] text-[#078166]">{eyebrow}</span><h2 className="mt-1 text-2xl font-semibold tracking-[-.045em] text-[#17372b]">{title}</h2><p className="mt-2 max-w-2xl text-[10px] leading-5 text-[#6c7973]">{description}</p></header>;
}

function ToggleChoices<T extends string>({ options, selected, onToggle }: { options: readonly T[]; selected: T[]; onToggle: (value: T) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map((option) => <button type="button" onClick={() => onToggle(option)} className={`rounded-full border px-3 py-2 text-[9px] font-semibold transition ${selected.includes(option) ? "border-[#079272] bg-[#eaf7f1] text-[#08745d]" : "border-[#d8e1dc] bg-white text-[#607068] hover:border-[#a9cbbf]"}`} key={option}>{selected.includes(option) && <Check size={11} className="mr-1 inline" />}{option}</button>)}</div>;
}

export function PreferencesModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (extension: JourneyProfileExtension) => void }) {
  const { profile, updateProfile } = useJourneyOnboarding();
  const { recommendationFeedback, updateRecommendationFeedback } = useOpportunityJourney();
  const [activeSection, setActiveSection] = useState<PreferencesSection>("profile");
  const [profileDraft, setProfileDraft] = useState<OnboardingProfile>(profile ?? defaultProfile);
  const [extension, setExtension] = useState<JourneyProfileExtension>({});
  const [saved, setSaved] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setActiveSection("profile");
    setProfileDraft(profile ?? defaultProfile);
    setExtension(loadJourneyProfileExtension());
    setSaved(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  const toggleArray = <T extends string>(values: T[], value: T) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  const selectSection = (section: PreferencesSection) => {
    setActiveSection(section);
    window.requestAnimationFrame(() => contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  };
  const languageMap = Object.fromEntries((extension.languages ?? []).map((item) => [item.language, item.proficiency])) as Record<string, LanguageProficiency>;
  const updateLanguages = (next: Record<string, LanguageProficiency>) => setExtension((current) => ({ ...current, languages: Object.entries(next).map(([language, proficiency]) => ({ language, proficiency })) }));
  const changeEducationLevel = (educationLevel: EducationLevel) => {
    setProfileDraft((current) => ({ ...current, educationLevel }));
    setExtension((current) => ({ ...current, gradeOrGraduation: undefined }));
  };
  const save = () => {
    updateProfile(profileDraft);
    const next = { ...extension, updatedAt: new Date().toISOString() };
    saveJourneyProfileExtension(next);
    onSaved(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  };

  const panels: Record<PreferencesSection, React.ReactNode> = {
    profile: <div><PanelHeading eyebrow="Perfil" title="Como devemos conhecer você" description="Seu nome preferido e seus idiomas completam o perfil. A etapa acadêmica melhora os filtros de elegibilidade." /><div className="grid gap-5"><label className="text-[9px] font-semibold text-[#52615a]">Como você quer ser chamado?<input value={extension.preferredName ?? extension.firstName ?? ""} onChange={(event) => setExtension((current) => ({ ...current, preferredName: event.target.value }))} className={inputClass} placeholder="Seu nome preferido" /></label><div><span className="text-[9px] font-semibold text-[#52615a]">Em que etapa acadêmica você está?</span><div className="mt-2 grid gap-2 sm:grid-cols-2">{educationOptions.map((option) => <button type="button" onClick={() => changeEducationLevel(option)} className={`min-h-11 rounded-[13px] border px-3 text-left text-[9px] font-semibold ${profileDraft.educationLevel === option ? "border-[#079272] bg-[#eaf7f1] text-[#08745d]" : "border-[#d8e1dc] bg-white text-[#607068]"}`} key={option}>{profileDraft.educationLevel === option && <Check size={12} className="mr-1.5 inline" />}{option}</button>)}</div><div className="mt-4 text-[9px] font-semibold text-[#52615a]"><span>Série ou ano de conclusão</span><SelectBox value={extension.gradeOrGraduation ?? ""} options={gradeOptions[profileDraft.educationLevel].map((option) => ({ value: option, label: option }))} onValueChange={(gradeOrGraduation) => setExtension((current) => ({ ...current, gradeOrGraduation }))} ariaLabel="Selecionar série ou ano de conclusão" placeholder="Selecione uma opção" className="mt-1.5" /></div></div><label className="text-[9px] font-semibold text-[#52615a]">Escola ou universidade <span className="font-normal text-[#929b97]">(opcional)</span><input value={extension.institution ?? ""} onChange={(event) => setExtension((current) => ({ ...current, institution: event.target.value }))} className={inputClass} /></label><div><span className="text-[9px] font-semibold text-[#52615a]">Idiomas</span><div className="mt-2 grid gap-2">{languageOptions.map((language) => { const selected = languageMap[language]; return <div className="flex items-center gap-3 rounded-[13px] border border-[#dce4e0] bg-[#f9fbfa] px-3 py-2" key={language}><button type="button" onClick={() => { const next = { ...languageMap }; if (next[language]) delete next[language]; else next[language] = "Intermediário"; updateLanguages(next); }} className={`grid size-5 shrink-0 place-items-center rounded-md border ${selected ? "border-[#079272] bg-[#079272] text-white" : "border-[#b8c4be] bg-white"}`}>{selected && <Check size={12} />}</button><span className="flex-1 text-[10px] font-medium text-[#456156]">{language}</span>{selected && <SelectBox value={selected} options={proficiencies.map((level) => ({ value: level, label: level }))} onValueChange={(proficiency) => updateLanguages({ ...languageMap, [language]: proficiency })} ariaLabel={`Proficiência em ${language}`} size="compact" align="end" className="w-36" />}</div>; })}</div></div></div></div>,
    recommendations: <div><PanelHeading eyebrow="Recomendações" title="Interesses e objetivos" description="Revise o que direciona suas recomendações sem precisar refazer o onboarding." /><div className="grid gap-6"><div><span className="text-[9px] font-bold text-[#52615a]">Temas</span><div className="mt-2"><ToggleChoices options={THEMES} selected={profileDraft.themes} onToggle={(value) => setProfileDraft((current) => ({ ...current, themes: toggleArray(current.themes, value) }))} /></div></div><div><span className="text-[9px] font-bold text-[#52615a]">Tipos de oportunidade</span><div className="mt-2"><ToggleChoices options={OPPORTUNITY_TYPES} selected={profileDraft.opportunityTypes} onToggle={(value) => setProfileDraft((current) => ({ ...current, opportunityTypes: toggleArray(current.opportunityTypes, value) }))} /></div></div><div><span className="text-[9px] font-bold text-[#52615a]">Objetivo principal</span><div className="mt-2 flex flex-wrap gap-2">{goalOptions.map((goal) => <button type="button" onClick={() => setProfileDraft((current) => ({ ...current, primaryGoal: goal.value }))} className={`rounded-full border px-3 py-2 text-[9px] font-semibold ${profileDraft.primaryGoal === goal.value ? "border-[#079272] bg-[#eaf7f1] text-[#08745d]" : "border-[#d8e1dc] text-[#607068]"}`} key={goal.value}>{goal.label}</button>)}</div></div><div><span className="text-[9px] font-bold text-[#52615a]">Experiências anteriores</span><div className="mt-2 flex flex-wrap gap-2">{experienceOptions.map((experience) => <button type="button" onClick={() => setProfileDraft((current) => ({ ...current, previousExperiences: experience.value === "NONE" ? ["NONE"] : toggleArray(current.previousExperiences.filter((item) => item !== "NONE"), experience.value) }))} className={`rounded-full border px-3 py-2 text-[9px] font-semibold ${profileDraft.previousExperiences.includes(experience.value) ? "border-[#079272] bg-[#eaf7f1] text-[#08745d]" : "border-[#d8e1dc] text-[#607068]"}`} key={experience.value}>{experience.label}</button>)}</div></div><div><span className="text-[9px] font-bold text-[#52615a]">Planos futuros</span><div className="mt-2"><ToggleChoices options={futureOptions} selected={extension.futurePlans ?? []} onToggle={(value) => setExtension((current) => ({ ...current, futurePlans: toggleArray(current.futurePlans ?? [], value) }))} /></div></div></div></div>,
    context: <div><PanelHeading eyebrow="Contexto" title="O que cabe na sua realidade" description="Informações opcionais para recomendar oportunidades locais e planos que você consegue concluir." /><div className="grid gap-5 sm:grid-cols-2"><label className="text-[9px] font-semibold text-[#52615a]">Cidade<input value={extension.city ?? ""} onChange={(event) => setExtension((current) => ({ ...current, city: event.target.value }))} className={inputClass} /></label><label className="text-[9px] font-semibold text-[#52615a]">País<input value={extension.country ?? "Brasil"} onChange={(event) => setExtension((current) => ({ ...current, country: event.target.value }))} className={inputClass} /></label><div className="sm:col-span-2"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[9px] font-semibold text-[#52615a]"><Clock3 size={13} />Disponibilidade semanal</span><strong className="text-sm text-[#17372b]">{extension.weeklyAvailability ?? 6}h</strong></div><input type="range" min="2" max="15" value={extension.weeklyAvailability ?? 6} onChange={(event) => setExtension((current) => ({ ...current, weeklyAvailability: Number(event.target.value) }))} className="mt-3 w-full accent-[#079272]" /></div><label className="sm:col-span-2 text-[9px] font-semibold text-[#52615a]">O que você espera que mude com a seConecta? <span className="font-normal text-[#929b97]">(opcional)</span><textarea value={extension.motivation ?? ""} onChange={(event) => setExtension((current) => ({ ...current, motivation: event.target.value }))} className="mt-1.5 min-h-28 w-full resize-none rounded-[13px] border border-[#d6e0db] bg-[#f9fbfa] p-3 text-[11px] leading-5 outline-none focus:border-[#079272]" placeholder="Ex.: Quero estudar fora, mas ainda não sei por onde começar." /></label></div></div>,
    connections: <div><PanelHeading eyebrow="Conexões" title="Avisos e formas de continuar" description="Escolha como acompanhar sua Jornada e conecte WhatsApp ou Google à mesma identidade." /><div className="mb-5 rounded-[20px] border border-[#d8e1dc] bg-white p-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#eaf7f2] text-[#078166]"><Globe2 size={16} /></span><div><h3 className="text-[11px] font-semibold text-[#29493c]">Onde prefere receber atualizações?</h3><p className="mt-1 text-[9px] text-[#748079]">Conectar uma conta não ativa mensagens automaticamente.</p></div></div><div className="mt-4 flex flex-wrap gap-2">{(["WhatsApp", "Site", "E-mail"] as PreferredChannel[]).map((channel) => <button type="button" onClick={() => { setProfileDraft((current) => ({ ...current, preferredChannel: channel })); setExtension((current) => ({ ...current, notificationChannel: channel === "WhatsApp" ? "whatsapp" : channel === "E-mail" ? "email" : "none" })); }} className={`rounded-full border px-4 py-2.5 text-[9px] font-semibold ${profileDraft.preferredChannel === channel ? "border-[#079272] bg-[#eaf7f1] text-[#08745d]" : "border-[#d8e1dc] text-[#607068]"}`} key={channel}>{channel}</button>)}</div></div><ConnectedAccounts /></div>,
    history: <div><PanelHeading eyebrow="Histórico" title="Preferências de oportunidades" description="Revise os sinais que você já deu. As próximas recomendações usarão a escolha mais recente." />{recommendationFeedback.length > 0 ? <div className="grid gap-2.5">{recommendationFeedback.map((feedback) => { const opportunity = getOpportunityDetail(feedback.opportunityId); return <article className="rounded-[16px] border border-[#dbe3df] bg-white p-4" key={feedback.opportunityId}><strong className="block text-[11px] text-[#29493c]">{opportunity?.title ?? `Oportunidade ${feedback.opportunityId}`}</strong><div className="mt-3 flex flex-wrap gap-1.5">{([-1, 0, 1] as RecommendationFeedbackScore[]).map((score) => <button type="button" onClick={() => updateRecommendationFeedback(feedback.opportunityId, score)} className={`rounded-full border px-3 py-2 text-[8px] font-semibold ${feedback.feedbackScore === score ? "border-[#079272] bg-[#eaf7f1] text-[#08745d]" : "border-[#dbe3df] text-[#748079]"}`} key={score}>{feedbackLabels[score]}</button>)}</div></article>; })}</div> : <div className="rounded-[18px] border border-dashed border-[#cfd9d4] bg-white p-5"><p className="text-[10px] leading-5 text-[#748079]">Quando você avaliar uma recomendação, ela aparecerá aqui para revisão.</p></div>}</div>,
  };

  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-[1100] grid place-items-center bg-[#14221d]/45 p-0 backdrop-blur-sm sm:p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.currentTarget === event.target && onClose()}><motion.section role="dialog" aria-modal="true" aria-labelledby="preferences-title" className="flex h-[100svh] w-full flex-col overflow-hidden bg-[#f7f9f7] shadow-[0_30px_100px_rgba(17,39,30,.28)] sm:h-[min(820px,calc(100svh-40px))] sm:max-w-[1080px] sm:rounded-[28px] sm:border sm:border-white/70" initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .99 }} transition={{ duration: .22 }}><header className="flex min-h-17 items-center gap-4 border-b border-[#dce4e0] bg-white px-5 sm:px-7"><span className="grid size-9 place-items-center rounded-[13px] bg-[#eaf7f2] text-[#078166]"><SlidersHorizontal size={16} /></span><div className="min-w-0 flex-1"><span className="text-[8px] font-bold uppercase tracking-[.13em] text-[#078166]">Minha Jornada</span><h1 id="preferences-title" className="truncate text-base font-semibold tracking-[-.03em] text-[#17372b]">Minhas preferências</h1></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full text-[#65736c] hover:bg-[#f0f4f2]" aria-label="Fechar preferências"><X size={17} /></button></header><div className="grid min-h-0 flex-1 lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="overflow-x-auto border-b border-[#dce4e0] bg-white px-4 py-3 lg:border-b-0 lg:border-r lg:p-4"><nav className="flex min-w-max gap-2 lg:grid lg:min-w-0" aria-label="Seções das preferências">{sections.map(({ id, label, description, icon: Icon }) => { const active = activeSection === id; return <button type="button" onClick={() => selectSection(id)} className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition lg:w-full ${active ? "bg-[#e8f6f0] text-[#08745d]" : "text-[#607068] hover:bg-[#f2f5f3]"}`} aria-current={active ? "page" : undefined} key={id}><span className={`grid size-8 shrink-0 place-items-center rounded-[11px] ${active ? "bg-white text-[#079272] shadow-sm" : "bg-[#f0f3f1]"}`}><Icon size={15} /></span><span><strong className="block text-[10px] font-semibold">{label}</strong><small className="mt-0.5 hidden text-[7px] opacity-65 lg:block">{description}</small></span></button>; })}</nav></aside><div ref={contentRef} className="min-h-0 overflow-y-auto p-5 sm:p-7"><AnimatePresence mode="wait" initial={false}><motion.div key={activeSection} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: .16 }}>{panels[activeSection]}</motion.div></AnimatePresence></div></div><footer className="flex min-h-17 items-center justify-between gap-4 border-t border-[#dce4e0] bg-white px-5 sm:px-7"><p className="hidden text-[8px] text-[#7b8781] sm:block">As mudanças serão usadas nas próximas recomendações.</p><button type="button" onClick={save} className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-full bg-[#079272] px-5 text-[9px] font-semibold shadow-[0_7px_18px_rgba(7,146,114,.14)]" style={{ color: "#fff" }}>{saved ? <><Check size={13} />Preferências salvas</> : <><Save size={13} />Salvar alterações</>}</button></footer></motion.section></motion.div>}</AnimatePresence>;
}
