"use client";

import { useState, useEffect, useCallback } from "react";
import { Trade, MOCK_TRADES } from "./mock-data";
import { useSettingsContext } from "./SettingsContext";
import { processStatementSync } from "./tradeSyncEngine";

export function useTrades() {
  const { activeAccountId, isLoaded: settingsLoaded } = useSettingsContext();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadTrades = useCallback(() => {
    if (!settingsLoaded || !activeAccountId) return;
    
    const key = `trades_${activeAccountId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      try {
        const parsed: Trade[] = JSON.parse(stored);
        let updatedStorage = false;
        const sanitized = parsed.map(t => {
          if (
            t.symbol === "USDJPY" && 
            (t.lotSize === 232 || t.entryPrice === 232 || t.exitPrice === 2323 || t.notes === "232" || t.date === "2026-09-21")
          ) {
            updatedStorage = true;
            return {
              ...t,
              ticket: t.ticket || "TKT-011",
              lotSize: 0.50,
              entryPrice: 145.20,
              exitPrice: 145.50,
              netPnL: 150,
              mistake: "None" as const,
              notes: "Clean bounce off support during London/NY overlap.",
              rulesFollowed: true,
              status: "Win" as const,
              rMultiple: 2
            };
          }
          if (t.date === "2026-09-05" && t.symbol === "USDJPY") {
            updatedStorage = true;
            return {
              ...t,
              date: "2026-09-04"
            };
          }
          return t;
        });
        setTrades(sanitized);
        if (updatedStorage) {
          localStorage.setItem(key, JSON.stringify(sanitized));
        }
      } catch (e) {
        setTrades(JSON.parse(stored));
      }
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

  useEffect(() => {
    loadTrades();

    const handleUpdate = () => loadTrades();
    window.addEventListener("trades_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("trades_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadTrades]);

  const notifyChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("trades_updated"));
    }
  };

  const addTrade = (trade: Omit<Trade, "id">) => {
    if (!activeAccountId) return;
    const isExecuted = (trade.entryPrice && trade.entryPrice > 0) || Math.abs(trade.netPnL || 0) > 0 || Boolean(trade.ticket && !trade.ticket.startsWith("#TR-"));
    
    // If incoming trade has execution data, check if it matches an unfilled pre-trade plan
    if (isExecuted) {
      const { updatedFullTrades } = processStatementSync([trade], trades);
      setTrades(updatedFullTrades);
      localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(updatedFullTrades));
    } else {
      const newTrade = { 
        ...trade, 
        id: Math.random().toString(36).substr(2, 9),
        isPlanned: true 
      } as Trade;
      const updated = [newTrade, ...trades];
      setTrades(updated);
      localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(updated));
    }
    notifyChange();
  };

  const addMultipleTrades = (newTradesList: Omit<Trade, "id">[]) => {
    if (!activeAccountId || newTradesList.length === 0) return;

    // Use intelligent sync engine: auto-merges with matching planned trades, skips exact duplicates, adds new
    const { updatedFullTrades } = processStatementSync(newTradesList, trades);
    setTrades(updatedFullTrades);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(updatedFullTrades));
    notifyChange();
  };

  const setAllTrades = (newTrades: Trade[]) => {
    if (!activeAccountId) return;
    setTrades(newTrades);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(newTrades));
    notifyChange();
  };

  const updateTrade = (id: string, updatedTrade: Partial<Trade>) => {
    if (!activeAccountId) return;
    const updated = trades.map(t => t.id === id ? { ...t, ...updatedTrade } : t);
    setTrades(updated);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(updated));
    notifyChange();
  };

  const deleteTrade = (id: string) => {
    if (!activeAccountId) return;
    const updated = trades.filter(t => t.id !== id);
    setTrades(updated);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(updated));
    notifyChange();
  };

  const clearAllTrades = () => {
    if (!activeAccountId) return;
    setTrades([]);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify([]));
    notifyChange();
  };

  const seedMockData = () => {
    if (!activeAccountId) return;
    setTrades(MOCK_TRADES);
    localStorage.setItem(`trades_${activeAccountId}`, JSON.stringify(MOCK_TRADES));
    notifyChange();
  };

  return { trades, addTrade, addMultipleTrades, updateTrade, deleteTrade, clearAllTrades, seedMockData, setAllTrades, isLoaded };
}
