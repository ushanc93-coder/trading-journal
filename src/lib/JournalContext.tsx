"use client";

import React, { createContext, useContext } from "react";
import { useJournal, ProcessEntry } from "./useJournal";

type JournalContextType = ReturnType<typeof useJournal>;

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export function JournalProvider({ children }: { children: React.ReactNode }) {
  const journalState = useJournal();

  return (
    <JournalContext.Provider value={journalState}>
      {children}
    </JournalContext.Provider>
  );
}

export function useJournalContext() {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error("useJournalContext must be used within a JournalProvider");
  }
  return context;
}

// Re-export ProcessEntry
export type { ProcessEntry };
