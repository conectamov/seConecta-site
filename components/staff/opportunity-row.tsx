"use client";

import { useEffect, useState } from "react";

export function OpportunityRow({ opportunityId }: { opportunityId: number }) {
  const [json, setJson] = useState("");
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/staff/opportunities/${opportunityId}/row`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const row = await response.text();
        if (!controller.signal.aborted) setJson(row);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [opportunityId, attempt]);

  return <section className="staff-panel staff-opportunity-json" aria-label="Dados da oportunidade em JSON">
    {error ? <div role="alert">
      <p>Não foi possível carregar os dados da oportunidade.</p>
      <button className="staff-secondary-button" onClick={() => { setError(false); setAttempt(attempt + 1); }}>Tentar novamente</button>
    </div> : json ? <pre tabIndex={0}>{json}</pre> : <p role="status">Carregando dados…</p>}
  </section>;
}
