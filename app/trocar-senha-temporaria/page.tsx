"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function TemporaryPasswordPage() {
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("new_password") !== form.get("confirmation")) { setError("As novas senhas não coincidem."); setPending(false); return; }
    const response = await fetch("/api/account/complete-temporary-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), temporary_password: form.get("temporary_password"), new_password: form.get("new_password") }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.detail || "Credenciais temporárias inválidas ou expiradas."); setPending(false); return; }
    setComplete(true); setPending(false);
  }
  return <main className="staff-login-page">{complete ? <section className="staff-login-card"><div><span className="staff-eyebrow">Senha atualizada</span><h1>Tudo certo.</h1><p>A senha temporária foi invalidada. Agora você já pode entrar normalmente.</p></div><Link className="staff-primary-button" href="/staff/login">Voltar ao login staff</Link></section> : <form className="staff-login-card" onSubmit={submit}><div><span className="staff-eyebrow">Acesso emergencial</span><h1>Crie sua senha permanente.</h1><p>Use a credencial temporária fornecida pelo administrador. Ela funciona somente uma vez e expira em uma hora.</p></div><label>E-mail<input name="email" type="email" required autoComplete="username" /></label><label>Senha temporária<input name="temporary_password" type="password" required autoComplete="current-password" /></label><label>Nova senha<input name="new_password" type="password" minLength={12} maxLength={128} required autoComplete="new-password" /></label><label>Confirmar nova senha<input name="confirmation" type="password" minLength={12} maxLength={128} required autoComplete="new-password" /></label>{error && <p className="staff-form-error" role="alert">{error}</p>}<button className="staff-primary-button" disabled={pending}>{pending ? "Atualizando…" : "Definir senha permanente"}</button></form>}</main>;
}
