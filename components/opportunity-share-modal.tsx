"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Linkedin, Mail, MessageCircle, Send, Share2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getOpportunityDetail } from "@/data/opportunity-details";
import { getOpportunityCanonicalPath } from "@/services/opportunity-seo-service";

export type ShareableOpportunity = {
  id: number;
  title: string;
  organization: string;
};

type OpportunityShareModalProps = {
  opportunity: ShareableOpportunity | null;
  onClose: () => void;
};

export function OpportunityShareModal({ opportunity, onClose }: OpportunityShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!opportunity) return;
    setCopied(false);
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [onClose, opportunity]);

  const opportunityDetail = opportunity ? getOpportunityDetail(opportunity.id) : null;
  const shareUrl = opportunity && origin ? `${origin}${opportunityDetail ? getOpportunityCanonicalPath(opportunityDetail) : `/explorar/${opportunity.id}`}` : "";
  const message = useMemo(() => opportunity
    ? `Encontrei esta oportunidade na seConecta e lembrei de você: ${opportunity.title}, da ${opportunity.organization}.`
    : "", [opportunity]);

  const copyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const nativeShare = async () => {
    if (!opportunity || !shareUrl) return;
    if (navigator.share) {
      await navigator.share({ title: opportunity.title, text: message, url: shareUrl }).catch(() => undefined);
    } else {
      await copyLink();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(<AnimatePresence>{opportunity && <motion.div
    className="fixed inset-0 z-[4000] flex items-end justify-center bg-[#10231c]/65 p-0 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onMouseDown={(event) => event.currentTarget === event.target && onClose()}
  >
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-opportunity-title"
      className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] border border-white/70 bg-[#fbfcfb] p-5 shadow-[0_28px_90px_rgba(10,35,26,.3)] sm:w-[min(520px,100%)] sm:rounded-[30px] sm:p-7"
      initial={{ opacity: 0, y: 28, scale: .985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: .985 }}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
    >
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#d6dfda] sm:hidden" />
      <button type="button" onClick={onClose} className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-[#edf2ef] text-[#66736d] transition hover:bg-[#e4ebe7]" aria-label="Fechar compartilhamento"><X size={16} /></button>

      <span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Compartilhar</span>
      <h2 id="share-opportunity-title" className="mt-1 pr-12 text-[24px] font-semibold leading-8 tracking-[-.045em] text-[#17372b]">Envie para alguém que vai aproveitar</h2>

      <div className="mt-5 overflow-hidden rounded-[20px] border border-[#dce4e0] bg-white shadow-[0_10px_28px_rgba(28,54,43,.06)]">
        <div className="h-1.5 bg-gradient-to-r from-[#079272] via-[#34aa86] to-[#8bcab4]" />
        <div className="flex items-start gap-4 p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-[#eaf7f1] text-[#078166]"><Share2 size={19} /></span>
          <div className="min-w-0">
            <span className="text-[8px] font-bold uppercase tracking-[.11em] text-[#829088]">seConecta · Oportunidade</span>
            <h3 className="mt-1.5 line-clamp-2 text-[14px] font-semibold leading-5 text-[#29493c]">{opportunity.title}</h3>
            <p className="mt-1 text-[9px] text-[#76827c]">{opportunity.organization}</p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[10px] font-semibold text-[#52615a]">Compartilhar em</p>
      <div className="mt-3 grid grid-cols-4 gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(`${message}\n\n${shareUrl}`)}`} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 text-center text-[8px] font-semibold text-[#52615a] no-underline"><span className="grid size-12 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_7px_18px_rgba(37,211,102,.23)] transition group-hover:-translate-y-1"><MessageCircle size={19} /></span>WhatsApp</a>
        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 text-center text-[8px] font-semibold text-[#52615a] no-underline"><span className="grid size-12 place-items-center rounded-full bg-[#0A66C2] text-white shadow-[0_7px_18px_rgba(10,102,194,.2)] transition group-hover:-translate-y-1"><Linkedin size={18} /></span>LinkedIn</a>
        <a href={`mailto:?subject=${encodeURIComponent(`Olha esta oportunidade: ${opportunity.title}`)}&body=${encodeURIComponent(`${message}\n\n${shareUrl}`)}`} className="group flex flex-col items-center gap-2 text-center text-[8px] font-semibold text-[#52615a] no-underline"><span className="grid size-12 place-items-center rounded-full bg-[#7967d8] text-white shadow-[0_7px_18px_rgba(121,103,216,.2)] transition group-hover:-translate-y-1"><Mail size={18} /></span>E-mail</a>
        <button type="button" onClick={nativeShare} className="group flex flex-col items-center gap-2 text-center text-[8px] font-semibold text-[#52615a]"><span className="grid size-12 place-items-center rounded-full bg-[#173b30] text-white shadow-[0_7px_18px_rgba(23,59,48,.2)] transition group-hover:-translate-y-1"><Send size={18} /></span>Mais</button>
      </div>

      <div className="mt-7 rounded-[16px] border border-[#d8e1dc] bg-white p-1.5">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate px-2 text-[9px] text-[#77847d]">{shareUrl || "Preparando link..."}</span>
          <button type="button" onClick={copyLink} disabled={!shareUrl} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[12px] px-4 text-[9px] font-semibold transition ${copied ? "bg-[#e8f6f0] text-[#06765d]" : "bg-[#173b30] text-white hover:bg-[#225244]"}`}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copiado!" : "Copiar link"}</button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-4 text-center text-[8px] text-[#87918c]">{copied ? "Pronto — o link já está na sua área de transferência." : "O link abre diretamente nesta oportunidade."}</p>
    </motion.section>
  </motion.div>}</AnimatePresence>, document.body);
}
