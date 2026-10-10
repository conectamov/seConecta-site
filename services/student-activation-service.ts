import { apiRequest } from "@/services/seconecta-browser-api";

export type ActivationVariant = "WHATSAPP_PRIMARY" | "WEBSITE_PRIMARY";
export type ActivationEvent =
  | "ONBOARDING_RESULTS_VIEWED"
  | "WHATSAPP_SELECTED"
  | "HANDOFF_CONSUMED"
  | "WEBSITE_AUTH_SELECTED"
  | "OTP_COMPLETED"
  | "CONTINUED_WITHOUT_SAVING"
  | "FIRST_RECOMMENDATION_OPENED"
  | "FIRST_OPPORTUNITY_SAVED"
  | "FIRST_COACH_CONVERSATION"
  | "CONSENT_GRANTED"
  | "CONSENT_REVOKED";

export type ActivationContext = {
  sessionId: string;
  variant: ActivationVariant;
};

const STORAGE_KEY = "seconecta:activation-context:v1";

function configuredVariant(): ActivationVariant {
  return process.env.NEXT_PUBLIC_SECONNECTA_ACTIVATION_VARIANT === "WEBSITE_PRIMARY"
    ? "WEBSITE_PRIMARY"
    : "WHATSAPP_PRIMARY";
}

export function getActivationContext(): ActivationContext {
  if (typeof window === "undefined") {
    return { sessionId: "00000000-0000-4000-8000-000000000000", variant: configuredVariant() };
  }
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<ActivationContext> | null;
    if (stored?.sessionId && (stored.variant === "WHATSAPP_PRIMARY" || stored.variant === "WEBSITE_PRIMARY")) {
      return { sessionId: stored.sessionId, variant: stored.variant };
    }
  } catch {
    // Replace unreadable local activation state with a fresh pseudonymous id.
  }
  const next = { sessionId: window.crypto.randomUUID(), variant: configuredVariant() } satisfies ActivationContext;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function recordActivationEvent(
  eventType: ActivationEvent,
  idempotencyKey: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const context = getActivationContext();
  await apiRequest("student-activation/events", {
    method: "POST",
    body: JSON.stringify({
      activation_session_id: context.sessionId,
      event_type: eventType,
      variant: context.variant,
      idempotency_key: idempotencyKey,
      surface: "website",
      payload,
    }),
  }).catch(() => undefined);
}

export async function linkActivationSession(): Promise<void> {
  const context = getActivationContext();
  await apiRequest("student-activation/link", {
    method: "POST",
    body: JSON.stringify({ activation_session_id: context.sessionId }),
  }).catch(() => undefined);
}

export async function completeOtpActivation(): Promise<void> {
  await recordActivationEvent("OTP_COMPLETED", "otp-completed:v1");
  await linkActivationSession();
}
