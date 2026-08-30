"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, ChevronDown, LogIn, LogOut, Menu, MessageCircle, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { whatsappCommunityUrl } from "@/components/whatsapp-help-link";

export function SiteHeader() {
  const { ready, session, openAuthentication, logout } = useAuthentication();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileOpen) return;
    const close = (event: PointerEvent) => { if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false); };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [profileOpen]);

  const closeMenu = () => { setMenuOpen(false); setProfileOpen(false); };

  return <header className="site-header">
    <nav className="site-shell site-header-inner" aria-label="Navegação principal">
      <Link href="/" className="site-brand" aria-label="seConecta, página inicial"><span>se</span>Conecta<i /></Link>
      <div className={`site-nav ${menuOpen ? "is-open" : ""}`}>
        <Link href="/explorar" onClick={closeMenu}>Explorar</Link>
        <Link href="/jornada" onClick={closeMenu}>Minha Jornada</Link>
        <a href={whatsappCommunityUrl} target="_blank" rel="noopener noreferrer" onClick={closeMenu} className="inline-flex items-center gap-1.5"><MessageCircle size={13} />WhatsApp</a>
      </div>
      <div className="site-header-actions">
        {!ready ? <span className="site-profile-loading" /> : !session ? <button className="site-cta" type="button" onClick={() => openAuthentication()}><span>Entrar</span><LogIn size={14} /></button> : <div className="relative" ref={profileRef}>
          <button type="button" onClick={() => setProfileOpen((open) => !open)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d5dfda] bg-white py-1 pl-1.5 pr-3 text-[11px] font-semibold text-[#365247] shadow-[0_5px_16px_rgba(28,54,43,.04)] transition hover:border-[#a8cbbf]" aria-expanded={profileOpen}>
            <span className="grid size-7 place-items-center rounded-full bg-[#e8f6f0] text-[#078166]"><UserRound size={14} /></span><span className="hidden sm:inline">{session.name.split(" ")[0]}</span><ChevronDown size={13} className="hidden sm:block" />
          </button>
          <AnimatePresence>{profileOpen && <motion.div role="menu" className="absolute right-0 top-[calc(100%+10px)] z-[300] w-56 rounded-[18px] border border-[#d9e2dd] bg-white p-2 shadow-[0_20px_55px_rgba(23,55,43,.16)]" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
            <div className="border-b border-[#e7ece9] px-3 py-2"><strong className="block text-[10px] text-[#29493c]">{session.name}</strong><small className="mt-0.5 block truncate text-[8px] text-[#87928c]">Conta conectada pelo WhatsApp</small></div>
            <Link href="/jornada" onClick={closeMenu} role="menuitem" className="mt-1 flex min-h-10 items-center gap-3 rounded-xl px-3 text-[10px] font-semibold text-[#456156] no-underline hover:bg-[#edf7f3]"><Bookmark size={14} />Minha Jornada</Link>
            <button type="button" role="menuitem" onClick={() => { logout(); closeMenu(); }} className="flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[10px] font-semibold text-[#b44f3d] hover:bg-[#fff1ee]"><LogOut size={14} />Sair</button>
          </motion.div>}</AnimatePresence>
        </div>}
        <button className="site-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>{menuOpen ? <X /> : <Menu />}</button>
      </div>
    </nav>
  </header>;
}
