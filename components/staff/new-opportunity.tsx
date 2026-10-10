"use client";

import { FormEvent, useState } from "react";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function NewOpportunity() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/staff/opportunities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        category: form.get("category"),
        description: form.get("description"),
        organization: form.get("organization") || null,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.detail || "Não foi possível criar o rascunho.");
      return;
    }
    router.push(`/staff/oportunidades/${body.opportunity.id}`);
    router.refresh();
  }

  return <>
    <button className="staff-primary-button" onClick={() => setOpen(true)}><Plus size={17} />Nova oportunidade</button>
    {open && <div className="staff-modal-backdrop" role="presentation">
      <form className="staff-modal" onSubmit={create}>
        <header><div><span className="staff-eyebrow">Stage 0</span><h2>Novo rascunho</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Fechar"><X /></button></header>
        <p>Comece com o mínimo para identificar a oportunidade. Você poderá salvar cada seção incompleta no editor.</p>
        <label>Título<input name="title" required /></label>
        <label>Organização<input name="organization" /></label>
        <label>Categoria<select name="category" defaultValue="EXTRACURRICULAR"><option>COMPETITION</option><option>OLYMPIAD</option><option>EXTRACURRICULAR</option><option>SCHOLARSHIP</option><option>VOLUNTEERING</option><option>SUMMER_PROGRAM</option><option>WORKSHOP</option><option>INITIATIVE</option><option>MUN</option></select></label>
        <label>Descrição inicial<textarea name="description" rows={3} required /></label>
        {error && <span className="staff-form-error">{error}</span>}
        <button className="staff-primary-button">Criar rascunho</button>
      </form>
    </div>}
  </>;
}
