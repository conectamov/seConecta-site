import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore oportunidades | seConecta",
  description: "Encontre oportunidades recomendadas para seus interesses, seu momento e seus próximos passos.",
};

export default function OpportunitiesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
