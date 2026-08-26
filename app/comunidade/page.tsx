import type { Metadata } from "next";
import { CommunityPage } from "@/components/community/community-page";

export const metadata: Metadata = { title: "Comunidade — seConecta", description: "Perguntas, dicas e conexões entre estudantes." };

export default function Page() { return <CommunityPage />; }
