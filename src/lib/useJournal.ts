"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useSettingsContext } from "./SettingsContext";

export interface ProcessEntry {
  id: string;
  ticket?: string;
  date: string;
  pair: string;
  session: string;
  entryRules: boolean;
  max2Trades: boolean;
  maxRisk: boolean;
  maxTp: boolean;
  maxProfit: boolean;
  result: "Good Win" | "Good Loss" | "Bad Win" | "Bad Loss" | "";
  outcome: string;
}

export function useJournal() {
  const { activeAccountId, isLoaded: settingsLoaded } = useSettingsContext();
  const [entries, setEntries] = useState<ProcessEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadEntries = useCallback(() => {
    if (!settingsLoaded || !activeAccountId) return;
    
    const key = `process_journal_${activeAccountId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        let parsed = JSON.parse(stored);
        parsed = parsed.map((p: any) => {
          if (p.pairSession) {
            const parts = p.pairSession.split(" / ");
            p.pair = parts[0] || "Unknown";
            p.session = parts[1] || "London";
            delete p.pairSession;
          }
          if (p.date && p.date.includes(".")) {
            const parts = p.date.split(".");
            if (parts.length === 3) {
              p.date = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
          }
          if (p.outcome === "23" || (p.date === "2026-09-21" && p.pair === "USDJPY" && (p.outcome === "23" || !p.outcome))) {
            p.outcome = "Clean bounce off support during London session.";
          }
          if (p.outcome === "sa" || (p.date === "2026-09-11" && p.pair === "XAUUSD" && (p.outcome === "sa" || !p.outcome))) {
            p.outcome = "Followed breakout plan with disciplined position sizing.";
          }
          if (p.date === "2026-09-05" && p.pair === "USDJPY") {
            p.date = "2026-09-04";
          }
          return p;
        });
        setEntries(parsed);
      } catch (e) {
        setEntries([]);
      }
    } else {
      if (activeAccountId === "acc-1") {
        const initial: ProcessEntry[] = [
          {
            id: "1",
            date: format(new Date(), "yyyy-MM-dd"),
            pair: "EURUSD",
            session: "London",
            entryRules: true,
            max2Trades: true,
            maxRisk: true,
            maxTp: true,
            maxProfit: true,
            result: "Good Win",
            outcome: "Successful day"
          },
          {
            id: "2",
            date: format(new Date(), "yyyy-MM-dd"),
            pair: "EURUSD",
            session: "London",
            entryRules: true,
            max2Trades: true,
            maxRisk: true,
            maxTp: true,
            maxProfit: true,
            result: "Good Loss",
            outcome: "0.5%"
          },
          {
            id: "3",
            date: format(new Date(), "yyyy-MM-dd"),
            pair: "XAUUSD",
            session: "London",
            entryRules: true,
            max2Trades: false,
            maxRisk: true,
            maxTp: true,
            maxProfit: true,
            result: "Bad Win",
            outcome: "Unsuccessful day"
          }
        ];
        setEntries(initial);
        localStorage.setItem(key, JSON.stringify(initial));
      } else {
        setEntries([]);
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
    setIsLoaded(true);
  }, [settingsLoaded, activeAccountId]);

  useEffect(() => {
    loadEntries();

    const handleUpdate = () => loadEntries();
    window.addEventListener("journal_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("journal_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadEntries]);

  const notifyChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("journal_updated"));
    }
  };

  const addEntry = (entry: Omit<ProcessEntry, "id"> | Omit<ProcessEntry, "id" | "date">) => {
    if (!activeAccountId) return;
    const newEntry: ProcessEntry = {
      date: format(new Date(), "yyyy-MM-dd"),
      ...entry,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(updated));
    notifyChange();
  };

  const addMultipleEntries = (newEntriesList: Omit<ProcessEntry, "id">[]) => {
    if (!activeAccountId || newEntriesList.length === 0) return;

    const currentEntries = [...entries];
    const brandNewEntries: Omit<ProcessEntry, "id">[] = [];

    for (const incoming of newEntriesList) {
      // 1. Check if exact duplicate
      const isExactDuplicate = currentEntries.some(existing => {
        if (incoming.ticket && existing.ticket) {
          const incT = incoming.ticket.replace(/^#TR-|^#/, '').trim();
          const extT = existing.ticket.replace(/^#TR-|^#/, '').trim();
          if (incT && extT && incT === extT) return true;
        }
        return existing.date === incoming.date && existing.pair === incoming.pair && existing.outcome === incoming.outcome;
      });
      if (isExactDuplicate) continue;

      // 2. Check if there is an existing journal entry for this date & pair that was pre-logged
      const existingMatchIdx = currentEntries.findIndex(existing => {
        const sameDate = existing.date === incoming.date;
        const samePair = existing.pair.toUpperCase().replace(/[^A-Z0-9]/g, '') === incoming.pair.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return sameDate && samePair;
      });

      if (existingMatchIdx !== -1) {
        // Sync / Update the existing journal entry
        currentEntries[existingMatchIdx] = {
          ...currentEntries[existingMatchIdx],
          ticket: incoming.ticket || currentEntries[existingMatchIdx].ticket,
          session: incoming.session || currentEntries[existingMatchIdx].session,
          result: incoming.result,
          outcome: incoming.outcome,
          entryRules: incoming.entryRules,
          max2Trades: incoming.max2Trades,
          maxRisk: incoming.maxRisk,
          maxTp: incoming.maxTp,
          maxProfit: incoming.maxProfit
        };
      } else {
        brandNewEntries.push(incoming);
      }
    }

    if (brandNewEntries.length === 0 && currentEntries.length === entries.length) {
      // Check if any entries were updated
      const hasChanges = JSON.stringify(currentEntries) !== JSON.stringify(entries);
      if (!hasChanges) return;
    }

    const formatted = brandNewEntries.map(e => ({
      ...e,
      id: Math.random().toString(36).substr(2, 9)
    }));
    const updated = [...formatted, ...currentEntries];
    setEntries(updated);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(updated));
    notifyChange();
  };

  const deleteEntry = (id: string) => {
    if (!activeAccountId) return;
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(updated));
    notifyChange();
  };

  const updateEntry = (id: string, updatedFields: Partial<ProcessEntry>) => {
    if (!activeAccountId) return;
    const updated = entries.map(e => e.id === id ? { ...e, ...updatedFields } : e);
    setEntries(updated);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(updated));
    notifyChange();
  };

  const setAllEntries = (newEntries: ProcessEntry[]) => {
    if (!activeAccountId) return;
    setEntries(newEntries);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(newEntries));
    notifyChange();
  };

  const clearAllEntries = () => {
    if (!activeAccountId) return;
    setEntries([]);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify([]));
    notifyChange();
  };

  const seedMockJournal = () => {
    if (!activeAccountId) return;
    const mockJournal: ProcessEntry[] = [
      { id: "j1", ticket: "TKT-001", date: "2026-09-01", pair: "EURUSD", session: "London", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Win", outcome: "Followed the plan perfectly." },
      { id: "j2", ticket: "TKT-002", date: "2026-09-02", pair: "GBPUSD", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Loss", outcome: "Setup was A+, just got stopped out normally." },
      { id: "j3", ticket: "TKT-003", date: "2026-09-03", pair: "XAUUSD", session: "London", entryRules: true, max2Trades: true, maxRisk: false, maxTp: true, maxProfit: false, result: "Bad Win", outcome: "Position sized way too big out of greed. Got lucky it hit TP." },
      { id: "j4", ticket: "TKT-004", date: "2026-09-04", pair: "US30", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: false, maxProfit: true, result: "Bad Win", outcome: "Got scared of a pullback and closed before 2R." },
      { id: "j5", ticket: "TKT-005", date: "2026-09-04", pair: "USDJPY", session: "Asian", entryRules: false, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Bad Loss", outcome: "Traded out of boredom during Asian session." },
      { id: "j6", ticket: "TKT-006", date: "2026-09-08", pair: "USDCAD", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Win", outcome: "Clean breakout and hit target exactly." },
      { id: "j7", ticket: "TKT-007", date: "2026-09-09", pair: "EURGBP", session: "London", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Win", outcome: "Great setup." },
      { id: "j8", ticket: "TKT-008", date: "2026-09-09", pair: "US100", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Win", outcome: "Moved stop to BE manually." },
      { id: "j9", ticket: "TKT-009", date: "2026-09-09", pair: "GER40", session: "New York", entryRules: true, max2Trades: false, maxRisk: true, maxTp: true, maxProfit: true, result: "Bad Loss", outcome: "Over-traded. This was my 3rd trade today." },
      { id: "j10", ticket: "TKT-010", date: "2026-09-10", pair: "XAGUSD", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: false, maxProfit: true, result: "Bad Win", outcome: "Moved my TP further than my plan allowed to try and get 3R." },
      { id: "j11", ticket: "TKT-011", date: "2026-09-21", pair: "USDJPY", session: "London", entryRules: true, max2Trades: true, maxRisk: true, maxTp: false, maxProfit: true, result: "Bad Win", outcome: "Clean bounce off support during London session." }
    ];
    setEntries(mockJournal);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(mockJournal));
    notifyChange();
  };

  return { entries, addEntry, addMultipleEntries, deleteEntry, updateEntry, setAllEntries, clearAllEntries, seedMockJournal, isLoaded };
}
