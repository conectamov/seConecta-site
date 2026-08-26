"use client";

import { Check, Link2, MessageCircle } from "lucide-react";
import { useAuthentication, type AuthenticationProviderId } from "@/components/auth/authentication-provider";

function maskedIdentifier(provider: AuthenticationProviderId, identifier?: string) {
  if (!identifier) return "Conectado";
  if (provider === "google") return identifier;
  return `WhatsApp terminado em ${identifier.slice(-4)}`;
}

export function ConnectedAccounts() {
  const { session, connectAccount } = useAuthentication();
  const accounts = [
    { id: "whatsapp" as const, label: "WhatsApp", description: "Identidade, lembretes e conversas com o Coach.", icon: MessageCircle },
    { id: "google" as const, label: "Google", description: "Acesso rápido e continuidade entre dispositivos.", icon: null },
  ];

  return <section className="rounded-[24px] border border-[#d8e1dc] bg-white p-6 shadow-[0_12px_34px_rgba(28,54,43,.05)]"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-[#eaf7f2] text-[#078166]"><Link2 size={18} /></span><div><span className="text-[9px] font-bold uppercase tracking-[.13em] text-[#078166]">Continuidade</span><h2 className="mt-1 text-xl font-semibold tracking-[-.04em] text-[#17372b]">Contas conectadas</h2><p className="mt-2 text-[11px] leading-5 text-[#66736d]">Os dois métodos podem levar à mesma Jornada. Conecte o segundo para ter outra forma de continuar.</p></div></div><div className="mt-6 divide-y divide-[#e5ebe8]">{accounts.map(({ id, label, description, icon: Icon }) => { const account = session.connectedAccounts[id]; return <div className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center" key={id}><span className="grid size-10 shrink-0 place-items-center rounded-[13px] bg-[#f1f5f3] text-[#365247]">{Icon ? <Icon size={17} /> : <strong className="text-base text-[#4285f4]">G</strong>}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><strong className="text-[12px] text-[#29493c]">{label}</strong>{account.connected && <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf7f1] px-2 py-1 text-[8px] font-semibold text-[#078166]"><Check size={10} />Conectado</span>}</div><p className="mt-1 text-[9px] leading-4 text-[#7b8781]">{account.connected ? maskedIdentifier(id, account.identifier) : description}</p></div>{account.connected ? <span className="text-[9px] font-medium text-[#718079]">Disponível para continuar</span> : <button type="button" onClick={() => connectAccount(id)} className="min-h-10 rounded-full border border-[#cfdad5] bg-white px-4 text-[9px] font-semibold text-[#08745d] hover:bg-[#f1f8f5]">Conectar {label}</button>}</div>; })}</div></section>;
}
