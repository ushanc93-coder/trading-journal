"use client";

import { useState, useEffect } from "react";
import { Trade, MOCK_TRADES } from "./mock-data";
import { useSettingsContext } from "./SettingsContext";

export function useTrades() {
  const { activeAccountId, isLoaded: settingsLoaded } = useSettingsContext();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!settingsLoaded || !activeAccountId) return;
    
    const key = `trades_${activeAccountId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      setTrades(JSON.parse(stored));
    } else {
      // Only load mock trades for the default main account to show examples
      if (activeAccountId === "acc-1") {
        setTrades(MOCK_TRADES);
        localStorage.setItem(key, JSON.stringify(MOCK_TRADES));
      } else {
        setTrades([]);
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
    setIsLoaded(true);
  }, [settingsLoaded, activeAccountId]);

  const addTrade = (trade: Omit<Trade, "id">) => {
    if (!activeAccountId) return;
    const newTrade = { ...trade, id: Math.random().toString(36).substr(2, 9) } as Trade;
    const updated = [newTrade, ...trades];
    setTrades(updated);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(updated));
  };

  const updateTrade = (id: string, updatedTrade: Partial<Trade>) => {
    if (!activeAccountId) return;
    const updated = trades.map(t => t.id === id ? { ...t, ...updatedTrade } : t);
    setTrades(updated);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(updated));
  };

  const deleteTrade = (id: string) => {
    if (!activeAccountId) return;
    const updated = trades.filter(t => t.id !== id);
    setTrades(updated);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(updated));
  };

  const clearAllTrades = () => {
    if (!activeAccountId) return;
    setTrades([]);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify([]));
  };

  const seedMockData = () => {
    if (!activeAccountId) return;
    setTrades(MOCK_TRADES);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(MOCK_TRADES));
  };

  return { trades, addTrade, updateTrade, deleteTrade, clearAllTrades, seedMockData, isLoaded };
}
