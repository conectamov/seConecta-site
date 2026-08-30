"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Languages, UserRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SelectBox } from "@/components/ui/select-box";
import type { JourneyProfileExtension, LanguageProficiency, ProfileStepId } from "@/types/journey-profile";
import type { OnboardingProfile } from "@/types/onboarding";

const STORAGE_KEY = "seconecta:journey-profile-extension";
const languageOptions = ["Português", "Inglês", "Espanhol", "Francês", "Outro"];
const proficiencies: LanguageProficiency[] = ["Básico", "Intermediário", "Avançado", "Fluente"];

export function saveJourneyProfileExtension(value: JourneyProfileExtension) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, updatedAt: new Date().toISOString() }));
}

export function loadJourneyProfileExtension() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const current = stored ? JSON.parse(stored) as JourneyProfileExtension : {};
    const legacyStored = window.localStorage.getItem("seconecta:journey-workspace-preferences");
    if (!legacyStored || current.weeklyAvailability) return current;
    const legacy = JSON.parse(legacyStored) as { weeklyMinutes?: number };
    return legacy.weeklyMinutes ? { ...current, weeklyAvailability: Math.max(2, Math.min(15, Math.round(legacy.weeklyMinutes / 60))) } : current;
  } catch {
    return {};
  }
}

type RequiredStep = { id: Extract<ProfileStepId, "name" | "languages">; title: string; purpose: string; benefit: string; icon: typeof UserRound };

const requiredSteps: RequiredStep[] = [
  { id: "name", title: "Como você quer ser chamado?", purpose: "Usaremos esse nome nas orientações e recomendações.", benefit: "Orientações mais pessoais", icon: UserRound },
  { id: "languages", title: "Quais idiomas você usa com conforto?", purpose: "Isso melhora a elegibilidade das oportunidades internacionais.", benefit: "Filtros internacionais habilitados", icon: Languages },
];

function completedStepIds(extension: JourneyProfileExtension) {
  const completed = new Set<ProfileStepId>();
  if (extension.preferredName || extension.firstName) completed.add("name");
  if (extension.languages?.length) completed.add("languages");
  return completed;
}

function StepShell({ step, onClose, children }: { step: RequiredStep; onClose: () => void; children: React.ReactNode }) {
  const Icon = step.icon;
  return <motion.section className="mt-3 rounded-[20px] border border-[#e5c56d] bg-[#fffdf6] p-5 shadow-[0_12px_32px_rgba(106,78,8,.08)] sm:p-6" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}><header className="flex items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#fff3c4] text-[#8a6511]"><Icon size={18} /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-4"><div><span className="text-[8px] font-bold uppercase tracking-[.13em] text-[#9a7010]">Leva menos de 1 minuto</span><h2 className="mt-1 text-lg font-semibold tracking-[-.035em] text-[#463710]">{step.title}</h2></div><button type="button" onClick={onClose} className="grid size-8 shrink-0 place-items-center rounded-full text-[#806f43] hover:bg-[#fff4ce]" aria-label="Fechar etapa"><X size={15} /></button></div><p className="mt-2 max-w-2xl text-[11px] leading-5 text-[#746640]">{step.purpose}</p></div></header><div className="mt-5 sm:ml-14">{children}</div></motion.section>;
}

export function ProfileUnlocks({ profile: _profile, value, onChange }: { profile: OnboardingProfile | null; value: JourneyProfileExtension; onChange: (value: JourneyProfileExtension) => void }) {
  const [activeStep, setActiveStep] = useState<RequiredStep["id"] | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [preferredName, setPreferredName] = useState(value.preferredName ?? value.firstName ?? "");
  const [languages, setLanguages] = useState<Record<string, LanguageProficiency>>(Object.fromEntries((value.languages ?? []).map((item) => [item.language, item.proficiency])));
  const completed = useMemo(() => completedStepIds(value), [value]);
  const remaining = requiredSteps.filter((step) => !completed.has(step.id));
  const nextStep = remaining[0];
  const percentage = Math.round(((requiredSteps.length - remaining.length) / requiredSteps.length) * 100);

  if (!nextStep) return null;

  const persist = (patch: Partial<JourneyProfileExtension>, message: string) => {
    const next = { ...value, ...patch, updatedAt: new Date().toISOString() };
    saveJourneyProfileExtension(next);
    onChange(next);
    setActiveStep(null);
    setReward(message);
    window.setTimeout(() => setReward(null), 2600);
  };
  const activeDefinition = requiredSteps.find((step) => step.id === activeStep);
  const inputClass = "h-11 w-full rounded-[13px] border border-[#dec77f] bg-white px-3 text-[11px] text-[#463710] outline-none transition focus:border-[#9a7010] focus:ring-2 focus:ring-[#d6a91d]/15";

  return <div className="border-b border-[#e5c86e] bg-[#fff4c9]"><div className="mx-auto w-[min(1180px,calc(100%-40px))] py-4"><section className="rounded-[20px] border border-[#e1c260] bg-[#fff8dc] px-5 py-4 shadow-[0_7px_22px_rgba(104,76,8,.06)]"><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-start gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#ffeaa1] text-[#85600a]"><UserRound size={18} /></span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[15px] font-semibold tracking-[-.025em] text-[#49380d]">Complete seu perfil</h2><span className="rounded-full bg-white/75 px-2.5 py-1 text-[8px] font-semibold text-[#80600d]">{percentage}% completo</span></div><p className="mt-1 max-w-2xl text-[10px] leading-5 text-[#74623a]">Faltam apenas nome e idiomas para personalizarmos sua Jornada. Todo o restante pode ser ajustado quando você quiser.</p></div></div><div className="min-w-0 lg:w-[220px]"><div className="flex items-center justify-between text-[8px] font-semibold text-[#806d3e]"><span>{remaining.length} {remaining.length === 1 ? "etapa restante" : "etapas restantes"}</span><span>{requiredSteps.length - remaining.length}/{requiredSteps.length}</span></div><div className="mt-2 grid grid-cols-2 gap-1.5">{requiredSteps.map((step) => <i className={`h-1.5 rounded-full ${completed.has(step.id) ? "bg-[#9a7010]" : "bg-white/80"}`} key={step.id} />)}</div><p className="mt-2 truncate text-[8px] text-[#857446]">Próximo: <strong className="text-[#6d500a]">{nextStep.benefit}</strong></p></div><button type="button" onClick={() => setActiveStep(activeStep ? null : nextStep.id)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#725307] px-5 text-[10px] font-semibold shadow-[0_8px_18px_rgba(104,76,8,.13)]" style={{ color: "#fff" }}>Completar agora <ArrowRight size={13} /></button></div></section>

    <AnimatePresence>{reward && <motion.div role="status" className="mt-3 flex items-center gap-2 rounded-[14px] border border-[#dfc26b] bg-[#fff9e4] px-4 py-3 text-[10px] font-semibold text-[#745509]" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Check size={14} />{reward}</motion.div>}</AnimatePresence>

    <AnimatePresence mode="wait">{activeDefinition && <StepShell step={activeDefinition} onClose={() => setActiveStep(null)}>
      {activeDefinition.id === "name" && <div><label className="text-[9px] font-semibold text-[#665627]">Como você quer ser chamado?<input className={`${inputClass} mt-1.5`} value={preferredName} onChange={(event) => setPreferredName(event.target.value)} placeholder="Seu nome preferido" autoFocus /></label><button type="button" disabled={!preferredName.trim()} onClick={() => persist({ preferredName: preferredName.trim() }, "Agora as orientações podem chamar você pelo nome.")} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full bg-[#725307] px-5 text-[10px] font-semibold disabled:opacity-35" style={{ color: "#fff" }}>Usar este nome <ArrowRight size={12} /></button></div>}

      {activeDefinition.id === "languages" && <div><div className="grid gap-2">{languageOptions.map((language) => <div className="flex items-center gap-3 rounded-[13px] border border-[#ead9a1] bg-white/80 px-3 py-2" key={language}><button type="button" onClick={() => setLanguages((current) => { const next = { ...current }; if (next[language]) delete next[language]; else next[language] = "Intermediário"; return next; })} className={`grid size-5 shrink-0 place-items-center rounded-md border ${languages[language] ? "border-[#80600d] bg-[#80600d]" : "border-[#cdbd89] bg-white"}`} style={languages[language] ? { color: "#fff" } : undefined}>{languages[language] && <Check size={12} />}</button><span className="flex-1 text-[10px] font-medium text-[#59491e]">{language}</span>{languages[language] && <SelectBox value={languages[language]} options={proficiencies.map((level) => ({ value: level, label: level }))} onValueChange={(proficiency) => setLanguages((current) => ({ ...current, [language]: proficiency }))} ariaLabel={`Proficiência em ${language}`} size="compact" tone="amber" align="end" className="w-36" />}</div>)}</div><button type="button" disabled={!Object.keys(languages).length} onClick={() => persist({ languages: Object.entries(languages).map(([language, proficiency]) => ({ language, proficiency })) }, "Filtros internacionais habilitados.")} className="mt-4 rounded-full bg-[#725307] px-5 py-2.5 text-[10px] font-semibold disabled:opacity-35" style={{ color: "#fff" }}>Salvar idiomas</button></div>}
    </StepShell>}</AnimatePresence>
  </div></div>;
}
