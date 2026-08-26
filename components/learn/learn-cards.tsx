import { ArrowRight, Clock3, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { LearnGuide, LearnResource } from "@/data/learn-content";

const typeTone: Record<LearnResource["type"], string> = {
  Curso: "bg-[#eaf2ff] text-[#3568a8]",
  Template: "bg-[#f2edff] text-[#6c57bd]",
  Roadmap: "bg-[#e9f7f1] text-[#08745d]",
  Playlist: "bg-[#fff1e9] text-[#a35b30]",
  Livro: "bg-[#fff6d9] text-[#896916]",
  Repositório: "bg-[#edf0ef] text-[#42574e]",
  "Site oficial": "bg-[#e9f6f7] text-[#25727a]",
};

export function GuideCard({ guide, compact = false }: { guide: LearnGuide; compact?: boolean }) {
  return <Link href={`/aprender?busca=${encodeURIComponent(guide.title)}`} className={`group flex flex-col rounded-[20px] border border-[#dce4e0] bg-white p-5 text-[#29493c] no-underline transition hover:-translate-y-0.5 hover:border-[#afd0c3] hover:shadow-[0_12px_32px_rgba(28,54,43,.06)] ${compact ? "min-h-48" : "min-h-56"}`}>
    <div className="flex items-start justify-between gap-4"><span className="grid size-10 place-items-center rounded-[13px] bg-[#edf7f2] text-lg">{guide.icon}</span><span className="rounded-full bg-[#f2f4f3] px-2.5 py-1 text-[8px] font-semibold text-[#6f7b75]">{guide.difficulty}</span></div>
    <h3 className="mt-5 text-[14px] font-semibold leading-5 tracking-[-.025em]">{guide.title}</h3>
    {!compact && <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-[#718078]">{guide.summary}</p>}
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#e8ecea] pt-4 text-[8px] text-[#7d8983]"><span className="inline-flex items-center gap-1.5"><Clock3 size={11} />{guide.minutes} min</span><span>Atualizado {guide.updatedAt}</span><ArrowRight size={12} className="text-[#078166] transition group-hover:translate-x-1" /></div>
  </Link>;
}

export function ResourceCard({ resource }: { resource: LearnResource }) {
  const external = resource.href.startsWith("http");
  return <a href={resource.href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="group flex min-h-48 flex-col rounded-[20px] border border-[#dce4e0] bg-white p-5 text-[#29493c] no-underline transition hover:-translate-y-0.5 hover:border-[#afd0c3] hover:shadow-[0_12px_32px_rgba(28,54,43,.06)]">
    <div className="flex items-center justify-between gap-3"><span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${typeTone[resource.type]}`}>{resource.type}</span>{external && <ExternalLink size={12} className="text-[#98a39e]" />}</div>
    <h3 className="mt-5 text-[14px] font-semibold leading-5 tracking-[-.025em]">{resource.title}</h3>
    <p className="mt-2 text-[9px] text-[#748079]">por {resource.provider}</p>
    <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#e8ecea] pt-4"><div><span className="block text-[8px] font-semibold text-[#52615a]">{resource.difficulty}</span><span className="mt-1 block text-[8px] text-[#89938e]">{resource.estimatedTime}</span></div><ArrowRight size={13} className="text-[#078166] transition group-hover:translate-x-1" /></div>
  </a>;
}

