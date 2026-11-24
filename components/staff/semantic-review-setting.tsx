"use client";

import { useState } from "react";

export function SemanticReviewSetting({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function change(enabled: boolean) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/staff/admin/settings/semantic-review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error();
      const saved: { enabled: boolean } = await response.json();
      setEnabled(saved.enabled);
      setMessage("Configuração atualizada.");
    } catch {
      setMessage("Não foi possível confirmar a alteração. Recarregue a página para consultar a configuração.");
    } finally {
      setPending(false);
    }
  }

  return <section className="staff-panel">
    <label className="admin-checkbox-filter">
      <input type="checkbox" role="switch" checked={enabled} disabled={pending}
        onChange={event => void change(event.target.checked)} />
      Revisar interpretações com IA
    </label>
    <p role="status">{pending ? "Salvando…" : message}</p>
  </section>;
}
