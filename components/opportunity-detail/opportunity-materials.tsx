import { ArrowUpRight, BookOpen, FileText, GraduationCap, PenLine, PlayCircle } from "lucide-react";

export type OpportunityMaterial = {
  title: string;
  description: string;
  type: "official" | "introduction" | "video" | "application" | "recommended";
  href?: string;
};

type OpportunityMaterialsProps = {
  materials: OpportunityMaterial[];
  onOpen?: (material: OpportunityMaterial) => void;
};

const materialMeta = {
  official: { label: "Guia oficial", icon: FileText },
  introduction: { label: "Introdução", icon: BookOpen },
  video: { label: "Vídeo", icon: PlayCircle },
  application: { label: "Candidatura", icon: PenLine },
  recommended: { label: "Recomendado", icon: GraduationCap },
};

export function OpportunityMaterials({ materials, onOpen }: OpportunityMaterialsProps) {
  return <div className="grid gap-3 sm:grid-cols-2">
    {materials.map((material) => {
      const { icon: Icon, label } = materialMeta[material.type];
      const cardClass = "group flex min-h-48 flex-col rounded-[20px] border border-[#dfe5e1] bg-white p-5 text-left no-underline shadow-[0_8px_22px_rgba(28,54,43,.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#079272]/30 hover:bg-[#f8fcfa] hover:shadow-[0_14px_30px_rgba(28,54,43,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#079272]/30";
      const content = <><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-[#eef5f1] text-[#079272]"><Icon size={17} /></span><span className="text-[9px] font-bold uppercase tracking-[.1em] text-[#87928c]">{label}</span></div><h3 className="mt-5 text-sm font-semibold text-[#1c372c]">{material.title}</h3><p className="mt-2 text-[10px] leading-5 text-[#69756f]">{material.description}</p><span className="mt-auto inline-flex items-center justify-end gap-1.5 pt-5 text-[10px] font-semibold text-[#056e57]">Abrir material <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span></>;
      return material.href
        ? <a href={material.href} target="_blank" rel="noopener noreferrer" className={cardClass} key={material.title}>{content}</a>
        : <button type="button" className={cardClass} onClick={() => onOpen?.(material)} key={material.title}>{content}</button>;
    })}
  </div>;
}
