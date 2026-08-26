"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Compass, LogOut, Menu, Route, SlidersHorizontal, UserRound, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { usePreferences } from "@/components/preferences/preferences-provider";
import { useJourneyOnboarding } from "@/hooks/use-journey-onboarding";

export function SiteHeader() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { ready, isAuthenticated, logout } = useAuthentication();
  const { openPreferences } = usePreferences();
  const { startOnboarding } = useJourneyOnboarding();

  const closeMenu = () => {
    setMenuOpen(false);
    setProfileOpen(false);
  };

  useEffect(() => {
    if (!profileOpen) return;
    const closeProfileMenu = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    window.addEventListener("pointerdown", closeProfileMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeProfileMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  return (
    <header className="site-header">
      <nav className="site-shell site-header-inner" aria-label="Navegação principal">
        <Link href="/" className="site-brand" aria-label="seConecta, página inicial"><span>se</span>Conecta<i /></Link>
        <div className={`site-nav ${menuOpen ? "is-open" : ""}`}>
          <Link href="/explorar" onClick={closeMenu}>Explorar</Link>
          <Link href="/aprender" onClick={closeMenu}>Aprender</Link>
          <span className="relative cursor-not-allowed px-1 text-[#87918c]" aria-disabled="true"><span className="blur-[1.5px]">Histórias</span><small className="absolute -right-3 -top-2 rounded-full bg-[#edf1ef] px-1.5 py-0.5 text-[6px] font-bold uppercase tracking-wide text-[#6f7b75]">Em breve</small></span>
          <Link href="/sobre" onClick={closeMenu}>Sobre</Link>
        </div>
        <div className="site-header-actions">
          {!ready ? <span className="site-profile-loading" /> : !isAuthenticated ? (
            <button className="site-cta" type="button" onClick={startOnboarding}><span>Começar minha jornada</span><b aria-hidden="true">&gt;</b></button>
          ) : (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d5dfda] bg-white py-1 pl-1.5 pr-3 text-[11px] font-semibold text-[#365247] shadow-[0_5px_16px_rgba(28,54,43,.04)] transition hover:border-[#a8cbbf] hover:bg-[#f7faf8]"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
              >
                <span className="grid size-7 place-items-center rounded-full bg-[#e8f6f0] text-[#078166]"><UserRound size={14} /></span>
                <span className="hidden sm:inline">Meu perfil</span>
                <ChevronDown size={13} className={`hidden transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+10px)] z-[300] w-60 overflow-hidden rounded-[18px] border border-[#d9e2dd] bg-white p-2 shadow-[0_20px_55px_rgba(23,55,43,.16)]"
                    initial={{ opacity: 0, y: -5, scale: .98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: .985 }}
                    transition={{ duration: .16 }}
                  >
                    <Link href="/jornada" onClick={closeMenu} role="menuitem" className="flex min-h-10 items-center gap-3 rounded-[12px] px-3 text-[10px] font-semibold text-[#456156] no-underline transition hover:bg-[#edf7f3] hover:text-[#078166]"><Route size={14} />Minha Jornada</Link>
                    <button type="button" role="menuitem" onClick={() => { closeMenu(); openPreferences(); }} className="flex min-h-10 w-full items-center gap-3 rounded-[12px] px-3 text-left text-[10px] font-semibold text-[#456156] transition hover:bg-[#edf7f3] hover:text-[#078166]"><SlidersHorizontal size={14} />Minhas preferências</button>
                    <Link href="/explorar" onClick={closeMenu} role="menuitem" className="flex min-h-10 items-center gap-3 rounded-[12px] px-3 text-[10px] font-semibold text-[#456156] no-underline transition hover:bg-[#edf7f3] hover:text-[#078166]"><Compass size={14} />Explorar oportunidades</Link>
                    <button type="button" role="menuitem" onClick={() => { closeMenu(); logout(); router.replace("/"); }} className="mt-1 flex min-h-10 w-full items-center gap-3 border-t border-[#f0dfdc] px-3 pt-1 text-left text-[10px] font-semibold text-[#b44f3d] transition hover:bg-[#fff1ee]"><LogOut size={14} />Sair</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <button className="site-menu" type="button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
    </header>
  );
}
