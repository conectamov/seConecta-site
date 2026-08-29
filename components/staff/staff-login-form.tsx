"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function StaffLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/staff-auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.detail === "PASSWORD_CHANGE_REQUIRED" ? "Sua conta exige a troca da senha temporária antes de entrar." : body.detail ?? "Não foi possível entrar.");
      setPending(false);
      return;
    }
    router.replace("/staff");
    router.refresh();
  }

  return <form className="staff-login-card" onSubmit={submit}>
    <div><span className="staff-eyebrow">Espaço da equipe</span><h1>Curadoria seConecta</h1><p>Entre com a conta que recebeu acesso de administrador ou curador.</p></div>
    <label>E-mail<input name="email" type="email" required autoComplete="username" /></label>
    <label>Senha<input name="password" type="password" required autoComplete="current-password" /></label>
    {error && <p className="staff-form-error" role="alert">{error} {error.includes("temporária") && <Link href="/trocar-senha-temporaria">Trocar agora</Link>}</p>}
    <button className="staff-primary-button" disabled={pending}>{pending ? "Entrando…" : "Entrar com segurança"}</button>
  </form>;
}
