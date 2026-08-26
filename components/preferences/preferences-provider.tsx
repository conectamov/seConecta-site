"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { PreferencesModal } from "@/components/preferences/preferences-modal";
import type { JourneyProfileExtension } from "@/types/journey-profile";

export const PROFILE_EXTENSION_UPDATED_EVENT = "seconecta:profile-extension-updated";

type PreferencesContextValue = {
  openPreferences: () => void;
  closePreferences: () => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({
    openPreferences: () => setOpen(true),
    closePreferences: () => setOpen(false),
  }), []);

  const publishProfileUpdate = (extension: JourneyProfileExtension) => {
    window.dispatchEvent(new CustomEvent(PROFILE_EXTENSION_UPDATED_EVENT, { detail: extension }));
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
      <PreferencesModal open={open} onClose={() => setOpen(false)} onSaved={publishProfileUpdate} />
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error("usePreferences must be used inside PreferencesProvider.");
  return context;
}
