import type { Metadata } from "next";
import { ConnectedAccounts } from "@/components/auth/connected-accounts";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = { title: "Configurações — seConecta", description: "Preferências e formas de continuar sua Jornada." };

export default function SettingsPage() {
  return <main className="min-h-screen bg-[#f4f7f5] font-[family-name:var(--font-poppins)]"><SiteHeader /><div className="mx-auto w-[min(820px,calc(100%-40px))] py-12 sm:py-16"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#078166]">Configurações</span><h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-.055em] text-[#17372b]">Sua Jornada, do seu jeito.</h1><p className="mt-3 max-w-xl text-[12px] leading-6 text-[#66736d]">Gerencie apenas o que ajuda você a continuar. O preenchimento do perfil permanece separado e progressivo.</p><div className="mt-9"><ConnectedAccounts /></div></div></main>;
}
