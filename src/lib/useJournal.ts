"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useSettingsContext } from "./SettingsContext";

export interface ProcessEntry {
  id: string;
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

  useEffect(() => {
    if (!settingsLoaded || !activeAccountId) return;
    
    const key = `process_journal_${activeAccountId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      let parsed = JSON.parse(stored);
      // Migration for old pairSession -> pair and session
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
        return p;
      });
      setEntries(parsed);
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

  const addEntry = (entry: Omit<ProcessEntry, "id"> | Omit<ProcessEntry, "id" | "date">) => {
    if (!activeAccountId) return;
    const newEntry: ProcessEntry = {
      date: format(new Date(), "yyyy-MM-dd"), // default if not provided
      ...entry,
      id: Math.random().toString(36).substr(2, 9)
    };
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(updated));
  };

  const deleteEntry = (id: string) => {
    if (!activeAccountId) return;
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(updated));
  };

  const updateEntry = (id: string, updatedFields: Partial<ProcessEntry>) => {
    if (!activeAccountId) return;
    const updated = entries.map(e => e.id === id ? { ...e, ...updatedFields } : e);
    setEntries(updated);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(updated));
  };

  const clearAllEntries = () => {
    if (!activeAccountId) return;
    setEntries([]);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify([]));
  };

  const seedMockJournal = () => {
    if (!activeAccountId) return;
    const mockJournal: ProcessEntry[] = [
      { id: "j1", date: "2026-09-01", pair: "EURUSD", session: "London", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Win", outcome: "Followed the plan perfectly." },
      { id: "j2", date: "2026-09-02", pair: "GBPUSD", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Loss", outcome: "Setup was A+, just got stopped out normally." },
      { id: "j3", date: "2026-09-03", pair: "XAUUSD", session: "London", entryRules: true, max2Trades: true, maxRisk: false, maxTp: true, maxProfit: false, result: "Bad Win", outcome: "Position sized way too big out of greed. Got lucky it hit TP." },
      { id: "j4", date: "2026-09-04", pair: "US30", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: false, maxProfit: true, result: "Bad Win", outcome: "Got scared of a pullback and closed before 2R." },
      { id: "j5", date: "2026-09-05", pair: "USDJPY", session: "Asian", entryRules: false, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Bad Loss", outcome: "Traded out of boredom during Asian session." },
      { id: "j6", date: "2026-09-08", pair: "USDCAD", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Win", outcome: "Clean breakout and hit target exactly." },
      { id: "j7", date: "2026-09-09", pair: "EURGBP", session: "London", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Win", outcome: "Great setup." },
      { id: "j8", date: "2026-09-09", pair: "US100", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: true, maxProfit: true, result: "Good Win", outcome: "Moved stop to BE manually." },
      { id: "j9", date: "2026-09-09", pair: "GER40", session: "New York", entryRules: true, max2Trades: false, maxRisk: true, maxTp: true, maxProfit: true, result: "Bad Loss", outcome: "Over-traded. This was my 3rd trade today." },
      { id: "j10", date: "2026-09-10", pair: "XAGUSD", session: "New York", entryRules: true, max2Trades: true, maxRisk: true, maxTp: false, maxProfit: true, result: "Bad Win", outcome: "Moved my TP further than my plan allowed to try and get 3R." }
    ];
    setEntries(mockJournal);
    localStorage.setItem(`process_journal_${activeAccountId}`, JSON.stringify(mockJournal));
  };

  return { entries, addEntry, deleteEntry, updateEntry, clearAllEntries, seedMockJournal, isLoaded };
}
