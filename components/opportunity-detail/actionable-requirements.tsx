import { ExternalLink } from "lucide-react";

export type ActionableRequirement = {
  name: string;
  description: string;
  resourceTitle?: string;
  resourceHref?: string;
  resourceFavicon?: string;
  required?: boolean;
};

type ActionableRequirementsProps = {
  requirements: ActionableRequirement[];
  onResourceClick?: (requirement: ActionableRequirement) => void;
};

/** A plain reference-link list that sits below a requirement checklist. */
export function ActionableRequirements({ requirements, onResourceClick }: ActionableRequirementsProps) {
  return <ul className="mt-6 grid gap-3" aria-label="Referências para preparação">{requirements.map((requirement) => {
    const action = <><img className="size-4 rounded-[4px]" src={requirement.resourceFavicon ?? "/icon.png"} alt="" /><span>{requirement.resourceTitle ?? `Guia para ${requirement.name.toLowerCase()}`}</span><ExternalLink size={12} className="shrink-0 opacity-55" /></>;
    return <li key={requirement.name}>{requirement.resourceHref
      ? <a href={requirement.resourceHref} className="inline-flex items-center gap-2 text-[11px] font-medium text-[#4e6258] no-underline hover:text-[#057259] hover:underline">{action}</a>
      : <button type="button" onClick={() => onResourceClick?.(requirement)} className="inline-flex items-center gap-2 border-0 bg-transparent p-0 text-left text-[11px] font-medium text-[#4e6258] hover:text-[#057259] hover:underline">{action}</button>}</li>;
  })}</ul>;
}
