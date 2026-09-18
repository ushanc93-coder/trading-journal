"use client";

import React, { createContext, useContext } from "react";
import { useTrades } from "./useTrades";
import { Trade } from "./mock-data";

type TradesContextType = {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, "id">) => void;
  updateTrade: (id: string, updatedTrade: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  clearAllTrades: () => void;
  isLoaded: boolean;
};

const TradesContext = createContext<TradesContextType | undefined>(undefined);

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const tradesState = useTrades();

  return (
    <TradesContext.Provider value={tradesState}>
      {children}
    </TradesContext.Provider>
  );
}

export function useTradesContext() {
  const context = useContext(TradesContext);
  if (context === undefined) {
    throw new Error("useTradesContext must be used within a TradesProvider");
  }
  return context;
}
