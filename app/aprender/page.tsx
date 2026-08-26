import type { Metadata } from "next";
import { LearnPage } from "@/components/learn/learn-page";

export const metadata: Metadata = {
  title: "Aprender | Conhecimento para avançar | seConecta",
  description: "Guias, recursos, objetivos e oportunidades conectados ao que você precisa aprender para avançar.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ busca?: string }> }) {
  const { busca } = await searchParams;
  return <LearnPage initialQuery={busca ?? ""} />;
}

