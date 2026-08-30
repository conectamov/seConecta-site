"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthentication } from "@/components/auth/authentication-provider";
import { multichannelActivationEnabled, recommendationApiEnabled } from "@/services/feature-flags";
import { apiRequest } from "@/services/seconecta-browser-api";
import { linkActivationSession, recordActivationEvent } from "@/services/student-activation-service";
import type { RecommendationItemApi, RecommendationResultApi } from "@/types/seconecta-api";

export function useStudentRecommendations() {
  const { session, ready: authReady } = useAuthentication();
  const [result, setResult] = useState<RecommendationResultApi | null>(null);
  const [ready, setReady] = useState(!recommendationApiEnabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recommendationApiEnabled || !authReady) return;
    if (!session) { setResult(null); setReady(true); return; }
    let active = true;
    setReady(false); setError(null);
    apiRequest<RecommendationResultApi>("students/me/recommendations?surface=website&limit=12")
      .then((next) => { if (active) setResult(next); })
      .catch(() => { if (active) { setResult(null); setError("Não foi possível atualizar suas recomendações agora."); } })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [authReady, session]);

  const record = useCallback((eventType: "IMPRESSION" | "OPEN", item: RecommendationItemApi) => {
    if (!recommendationApiEnabled || !session || !result) return;
    const storageKey = `seconecta:telemetry:${eventType}:${item.impression_id}`;
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, "1");
    void apiRequest("students/me/recommendations/events", {
      method: "POST",
      body: JSON.stringify({ event_type: eventType, source_channel: "website", idempotency_key: `${eventType.toLowerCase()}:${item.impression_id}`, opportunity_id: item.opportunity_id, recommendation_run_id: result.run_id, impression_id: item.impression_id }),
    }).catch(() => window.sessionStorage.removeItem(storageKey));
    if (eventType === "OPEN" && multichannelActivationEnabled) {
      void recordActivationEvent("FIRST_RECOMMENDATION_OPENED", "first-recommendation-opened:v1", { opportunity_id: item.opportunity_id })
        .then(linkActivationSession);
    }
  }, [result, session]);

  return { enabled: recommendationApiEnabled, result, ready, error, record };
}
