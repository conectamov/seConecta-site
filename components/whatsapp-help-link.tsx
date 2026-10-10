import { MessageCircle } from "lucide-react";

export const whatsappCommunityUrl = process.env.NEXT_PUBLIC_SECONNECTA_WHATSAPP_URL ?? "https://wa.me/";

export function WhatsAppHelpLink({ floating = false, className = "", label = "Precisa de ajuda?" }: { floating?: boolean; className?: string; label?: string }) {
  return <a href={whatsappCommunityUrl} target="_blank" rel="noopener noreferrer" className={floating
    ? `fixed bottom-5 right-5 z-[900] inline-flex min-h-12 items-center gap-2 rounded-full border border-[#cde0d8] bg-white px-4 text-[10px] font-semibold text-[#29493c] no-underline shadow-[0_12px_34px_rgba(18,55,42,.16)] transition hover:-translate-y-0.5 hover:border-[#9fc9ba] ${className}`
    : className} aria-label={`${label}, abrir o seConecta no WhatsApp`}>
    <span className={floating ? "grid size-8 place-items-center rounded-full bg-[#079272] text-white" : ""}><MessageCircle size={floating ? 14 : 15} /></span>{label}
  </a>;
}
