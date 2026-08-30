import { ArrowRight, Award, BookOpen, Compass, Users } from "lucide-react";

export type AlternativePath = {
  title: string;
  description: string;
  iconType: "olympiad" | "mentoring" | "research" | "explore";
  href?: string;
};

type AlternativePathsProps = { paths: AlternativePath[] };

const icons = { olympiad: Award, mentoring: Users, research: BookOpen, explore: Compass };

/** Discovery cards for the next best action when this specific cycle is unavailable. */
export function AlternativePaths({ paths }: AlternativePathsProps) {
  return <section className="mt-8" aria-labelledby="alternative-paths-title">
    <h3 id="alternative-paths-title" className="text-base font-semibold tracking-[-.025em] text-[#1c372c]">Caminhos que podem fazer sentido agora</h3>
    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">{paths.map((path) => { const Icon = icons[path.iconType]; return <a href={path.href ?? "/explorar"} className="group flex min-h-40 cursor-pointer flex-col rounded-[18px] border border-[#dfe5e1] bg-white p-4 text-left no-underline transition-all hover:-translate-y-0.5 hover:border-[#079272]/25 hover:bg-[#f4faf7] hover:shadow-md" key={path.title}><span className="grid size-8 place-items-center rounded-xl bg-[#eef7f3] text-[#079272]"><Icon size={16} /></span><h4 className="mt-5 text-xs font-semibold text-[#1c372c]">{path.title}</h4><p className="mt-2 text-[10px] leading-5 text-[#69756f]">{path.description}</p><ArrowRight className="mt-auto self-end text-[#079272] transition-transform group-hover:translate-x-1" size={15} /></a>; })}</div>
  </section>;
}
