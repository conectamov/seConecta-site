"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ClipboardCheck, LayoutDashboard, LogOut, Users } from "lucide-react";
import type { StaffMe } from "@/types/staff";

export function StaffShell({ me, children }: { me: StaffMe; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const links = [
    { href: "/staff", label: "Visão geral", icon: LayoutDashboard },
    { href: "/staff/oportunidades", label: "Oportunidades", icon: ClipboardCheck },
    ...(me.staff_role === "ADMIN" ? [{ href: "/staff/usuarios", label: "Pessoas e acessos", icon: Users }] : []),
  ];
  async function logout() {
    await fetch("/api/staff-auth/logout", { method: "POST" });
    router.replace("/staff/login");
    router.refresh();
  }
  return <div className="staff-app">
    <aside className="staff-sidebar">
      <Link href="/staff" className="staff-brand">se<span>Conecta</span><small>Equipe</small></Link>
      <nav>{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname === href || (href !== "/staff" && pathname.startsWith(href)) ? "active" : ""}><Icon size={18} />{label}</Link>)}</nav>
      <div className="staff-account"><div><strong>{me.full_name || me.email}</strong><span>{me.staff_role === "ADMIN" ? "Administrador" : "Curador"}</span></div><button onClick={logout} aria-label="Sair"><LogOut size={18} /></button></div>
    </aside>
    <main className="staff-main">{children}</main>
  </div>;
}
