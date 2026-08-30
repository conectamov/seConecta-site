import { AlertTriangle, Check, Circle, Clock3, Compass, Target } from "lucide-react";

type PreparationStep = {
  duration: string;
  task: string;
  detail?: string;
};

export function RealityCheckAlert({
  competitiveness = "Alta",
  message = "Como a concorrência é alta, trate esta oportunidade como um desafio extra. Não deixe de focar nas suas outras candidaturas.",
}: {
  competitiveness?: string;
  message?: string;
}) {
  return <section className="rounded-[20px] border border-[#f0d7a7] bg-[#fff8e9] px-5 py-4" aria-labelledby="reality-check-title">
    <div className="flex gap-3"><span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#f9e5b9] text-[#a96516]"><AlertTriangle size={16} /></span><div><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 id="reality-check-title" className="text-sm font-semibold text-[#714812]">Ponto de atenção</h3><span className="text-[10px] font-semibold text-[#a96516]">Concorrência {competitiveness.toLowerCase()}</span></div><p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-[#805a25]">{message}</p></div></div>
  </section>;
}

export function ReverseFitList({ items = ["Você busca um curso puramente teórico, sem desenvolvimento de projeto prático.", "Você não consegue reservar tempo para preparar materiais nas próximas semanas."] }: { items?: string[] }) {
  return <section className="rounded-[20px] border border-[#e2e6e3] bg-[#f7f8f7] p-5" aria-labelledby="reverse-fit-title">
    <span className="grid size-8 place-items-center rounded-full bg-white text-[#69756f]"><Compass size={16} /></span>
    <h3 id="reverse-fit-title" className="mt-4 text-sm font-semibold tracking-[-.02em] text-[#1c372c]">Pode não ser para você se...</h3>
    <ul className="mt-3 grid gap-2.5">{items.map((item) => <li className="flex gap-2 text-[11px] leading-5 text-[#596861]" key={item}><Circle className="mt-1 shrink-0 text-[#98a39d]" size={8} fill="currentColor" />{item}</li>)}</ul>
  </section>;
}

export function PreparationTimeline({ steps = [
  { duration: "2h", task: "Pesquisar conceitos de Machine Learning", detail: "Escolha um recorte que você consiga explicar com clareza." },
  { duration: "8h", task: "Rascunhar a carta de motivação", detail: "Conecte seu interesse em IA a experiências concretas." },
] }: { steps?: PreparationStep[] }) {
  return <section className="rounded-[20px] border border-[#dbe7e0] bg-[#f1f8f4] p-5" aria-labelledby="prep-timeline-title">
    <div className="flex items-start justify-between gap-4"><div><span className="grid size-8 place-items-center rounded-full bg-white text-[#079272]"><Clock3 size={16} /></span><h3 id="prep-timeline-title" className="mt-4 text-sm font-semibold tracking-[-.02em] text-[#1c372c]">Comece por aqui</h3><p className="mt-1 text-[10px] leading-5 text-[#69756f]">Um plano inicial para sair da intenção e avançar.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#056e57]">10h iniciais</span></div>
    <ol className="mt-5 border-l border-[#b9d9ca]">{steps.map((step) => <li className="relative pl-5 pb-5 last:pb-0" key={`${step.duration}-${step.task}`}><span className="absolute -left-[5px] top-1.5 size-[9px] rounded-full bg-[#079272] ring-4 ring-[#f1f8f4]" /><div className="flex flex-wrap items-baseline gap-x-2"><time className="text-[10px] font-bold text-[#056e57]">{step.duration}</time><strong className="text-[11px] text-[#1c372c]">{step.task}</strong></div>{step.detail && <p className="mt-1 text-[10px] leading-5 text-[#69756f]">{step.detail}</p>}</li>)}</ol>
  </section>;
}

export function ProfileGapIndicators({ matched, missing = [{ label: "Experiência em liderança", compensation: "Destaque momentos em que você organizou pessoas, tomou iniciativa ou conduziu uma entrega." }] }: { matched: string[]; missing?: { label: string; compensation: string }[] }) {
  return <section className="border-y border-[#dfe5e1] py-6" aria-labelledby="profile-gap-title">
    <div className="grid gap-6 lg:grid-cols-[1fr_.9fr]"><div><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#8a948f]">O que já combina</span><div className="mt-3 flex flex-wrap gap-2">{matched.map((item) => <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f2] px-3 py-2 text-[10px] font-semibold text-[#056e57]" key={item}><Check size={13} />{item}</span>)}</div></div><div><h3 id="profile-gap-title" className="text-[9px] font-bold uppercase tracking-[.12em] text-[#8a948f]">O que falta no seu perfil</h3><div className="mt-3 grid gap-2">{missing.map((item) => <div className="rounded-xl border border-dashed border-[#b7c0bb] bg-[#fafbf9] px-3 py-2.5" key={item.label}><span className="text-[10px] font-semibold text-[#52615a]">{item.label}</span><p className="mt-1 text-[9px] leading-4 text-[#78837d]">Como compensar: {item.compensation}</p></div>)}</div></div></div>
  </section>;
}

export function LongTermImpact({ text = "Concluir este projeto de IA te dará um portfólio prático, um diferencial importante para o seu objetivo de aplicar para universidades de ponta no ano que vem." }: { text?: string }) {
  return <section className="rounded-[20px] bg-[#1d4033] p-5 text-white" aria-labelledby="long-term-impact-title">
    <span className="grid size-8 place-items-center rounded-full bg-white/10 text-[#88e4cb]"><Target size={16} /></span>
    <h3 id="long-term-impact-title" className="mt-4 text-sm font-semibold tracking-[-.02em]">O impacto no seu futuro</h3>
    <p className="mt-2 text-[11px] leading-6 text-white/70">{text}</p>
  </section>;
}
