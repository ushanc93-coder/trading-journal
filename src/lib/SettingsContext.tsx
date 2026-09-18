"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface UserPreferences {
  name: string;
  theme: string;
  geminiApiKey?: string;
}

type SettingsContextType = {
  accounts: Account[];
  activeAccountId: string | null;
  preferences: UserPreferences;
  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (id: string, updatedAccount: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  setActiveAccountId: (id: string) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  isLoaded: boolean;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({ name: "Trader", theme: "dark" });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedAccounts = localStorage.getItem("accounts");
    const storedActive = localStorage.getItem("activeAccountId");
    const storedPrefs = localStorage.getItem("preferences");

    let initialAccounts: Account[] = [];
    if (storedAccounts) {
      initialAccounts = JSON.parse(storedAccounts);
      setAccounts(initialAccounts);
    } else {
      // Default account
      initialAccounts = [{ id: "acc-1", name: "Main Account", balance: 10000 }];
      setAccounts(initialAccounts);
      localStorage.setItem("accounts", JSON.stringify(initialAccounts));
    }

    if (storedActive && initialAccounts.some(a => a.id === storedActive)) {
      setActiveAccountId(storedActive);
    } else {
      setActiveAccountId(initialAccounts[0].id);
      localStorage.setItem("activeAccountId", initialAccounts[0].id);
    }

    if (storedPrefs) {
      setPreferences(JSON.parse(storedPrefs));
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      document.documentElement.setAttribute("data-theme", preferences.theme || "dark-purple");
    }
  }, [preferences.theme, isLoaded]);

  const addAccount = (account: Omit<Account, "id">) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newAcc = { ...account, id: newId };
    const updated = [...accounts, newAcc];
    setAccounts(updated);
    localStorage.setItem("accounts", JSON.stringify(updated));
  };

  const updateAccount = (id: string, updatedData: Partial<Account>) => {
    const updated = accounts.map(acc => acc.id === id ? { ...acc, ...updatedData } : acc);
    setAccounts(updated);
    localStorage.setItem("accounts", JSON.stringify(updated));
  };

  const deleteAccount = (id: string) => {
    const updated = accounts.filter(acc => acc.id !== id);
    setAccounts(updated);
    localStorage.setItem("accounts", JSON.stringify(updated));
    if (activeAccountId === id) {
      const nextActive = updated.length > 0 ? updated[0].id : null;
      setActiveAccountId(nextActive);
      if (nextActive) localStorage.setItem("activeAccountId", nextActive);
      else localStorage.removeItem("activeAccountId");
    }
  };

  const changeActiveAccountId = (id: string) => {
    setActiveAccountId(id);
    localStorage.setItem("activeAccountId", id);
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...prefs };
    setPreferences(updated);
    localStorage.setItem("preferences", JSON.stringify(updated));
  };

  return (
    <SettingsContext.Provider value={{
      accounts, activeAccountId, preferences, addAccount, updateAccount, deleteAccount,
      setActiveAccountId: changeActiveAccountId, updatePreferences, isLoaded
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return context;
}


