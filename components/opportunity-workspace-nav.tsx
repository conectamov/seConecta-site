"use client";

import Link from "next/link";
import { useOpportunityJourney } from "@/components/opportunity-journey-provider";

export function OpportunityWorkspaceNav({ active }: { active: "journey" | "explore" }) {
  const { journeys } = useOpportunityJourney();

  return <div className="workspace-secondary-nav-wrap">
    <nav className="workspace-secondary-shell workspace-secondary-nav" aria-label="Navegação entre Jornada e oportunidades">
      <Link className={active === "journey" ? "is-active" : ""} href="/jornada">Minha Jornada{journeys.length > 0 && <span>{journeys.length}</span>}</Link>
      <Link className={active === "explore" ? "is-active" : ""} href="/explorar">Explorar</Link>
    </nav>
  </div>;
}
