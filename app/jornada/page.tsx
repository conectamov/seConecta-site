import type { Metadata } from "next";
import { JourneyPage } from "@/components/journey/journey-page";

export const metadata: Metadata = {
  title: "Minha Jornada — seConecta",
  description: "Priorize oportunidades, acompanhe candidaturas e entenda seu próximo passo.",
};

export default function Page() {
  return <JourneyPage />;
}
