"use client";

import { useContext } from "react";
import { JourneyOnboardingContext } from "@/components/journey-onboarding";

export function useJourneyOnboarding() {
  const context = useContext(JourneyOnboardingContext);
  if (!context) throw new Error("useJourneyOnboarding must be used inside JourneyOnboardingProvider.");
  return context;
}
