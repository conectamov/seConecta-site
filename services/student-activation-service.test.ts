import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("multichannel activation contract", () => {
  const service = readFileSync(new URL("./student-activation-service.ts", import.meta.url), "utf8");
  const bff = readFileSync(new URL("../app/api/seconecta/[...path]/route.ts", import.meta.url), "utf8");
  const onboarding = readFileSync(new URL("../components/journey-onboarding.tsx", import.meta.url), "utf8");

  it("keeps a stable pseudonymous session and idempotency keys", () => {
    expect(service).toContain("seconecta:activation-context:v1");
    expect(service).toContain("activation_session_id: context.sessionId");
    expect(service).toContain("idempotency_key: idempotencyKey");
  });

  it("only exposes the additive activation routes through the BFF allowlist", () => {
    expect(bff).toContain('"POST student-activation/events"');
    expect(bff).toContain('"POST student-activation/link"');
    expect(bff).toContain('"GET student-activation/consents"');
  });

  it("offers WhatsApp, verified site persistence, and a discreet local path", () => {
    expect(onboarding).toContain("Receber oportunidades no WhatsApp");
    expect(onboarding).toContain("Salvar meu perfil e continuar no site");
    expect(onboarding).toContain("Continuar sem salvar");
  });
});
