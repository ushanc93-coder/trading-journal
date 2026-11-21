"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Account {
  id: string;
  name: string;
  balance: number;
}

export interface NotificationSettings {
  enableNewsPopups: boolean;
  popupDurationSeconds: number;
  enableNewsSound: boolean;
  filterGoldOnly: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enableNewsPopups: true,
  popupDurationSeconds: 8,
  enableNewsSound: true,
  filterGoldOnly: true,
};

export interface UserPreferences {
  name: string;
  theme: string;
  geminiApiKey?: string;
  tradingViewLayoutUrl?: string;
  notifications?: NotificationSettings;
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
  updateNotificationSettings: (notif: Partial<NotificationSettings>) => void;
  isLoaded: boolean;
  activeDateRange: string;
  customDateRange: { start: string, end: string } | null;
  setCustomDateRange: (range: { start: string, end: string } | null) => void;
  setActiveDateRange: (range: string) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("preferences");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!parsed.tradingViewLayoutUrl) {
            parsed.tradingViewLayoutUrl = "https://www.tradingview.com/chart/I05w1M0O/";
          }
          return parsed;
        }
      } catch (e) {}
    }
    return { 
      name: "Trader", 
      theme: "light",
      tradingViewLayoutUrl: "https://www.tradingview.com/chart/I05w1M0O/"
    };
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState("All Time");
  const [customDateRange, setCustomDateRange] = useState<{ start: string, end: string } | null>(null);

  useEffect(() => {
    const storedAccounts = localStorage.getItem("accounts");
    const storedActive = localStorage.getItem("activeAccountId");
    const storedPrefs = localStorage.getItem("preferences");

    let initialAccounts: Account[] = [];
    if (storedAccounts) {
      try {
        initialAccounts = JSON.parse(storedAccounts);
        setAccounts(initialAccounts);
      } catch (e) {}
    } else {
      // Default account
      initialAccounts = [{ id: "acc-1", name: "Main Account", balance: 10000 }];
      setAccounts(initialAccounts);
      localStorage.setItem("accounts", JSON.stringify(initialAccounts));
    }

    if (storedActive && initialAccounts.some(a => a.id === storedActive)) {
      setActiveAccountId(storedActive);
    } else if (initialAccounts.length > 0) {
      setActiveAccountId(initialAccounts[0].id);
      localStorage.setItem("activeAccountId", initialAccounts[0].id);
    }

    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs);
        if (!parsed.notifications) {
          parsed.notifications = DEFAULT_NOTIFICATION_SETTINGS;
        } else {
          parsed.notifications = { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed.notifications };
        }
        setPreferences(parsed);
      } catch (e) {}
    } else {
      const initial = { name: "Trader", theme: "light" as const, notifications: DEFAULT_NOTIFICATION_SETTINGS };
      localStorage.setItem("preferences", JSON.stringify(initial));
      setPreferences(initial);
    }

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    const isDark = preferences.theme === "dark";
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.style.backgroundColor = "#0A0D14";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.backgroundColor = "#CBD5E1";
    }
  }, [preferences.theme]);

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
    setPreferences((prev) => {
      const updated = { ...prev, ...prefs };
      localStorage.setItem("preferences", JSON.stringify(updated));
      return updated;
    });
  };

  const updateNotificationSettings = (notif: Partial<NotificationSettings>) => {
    setPreferences((prev) => {
      const currentNotifs = prev.notifications || DEFAULT_NOTIFICATION_SETTINGS;
      const updated = {
        ...prev,
        notifications: { ...currentNotifs, ...notif }
      };
      localStorage.setItem("preferences", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{
      accounts, activeAccountId, preferences, addAccount, updateAccount, deleteAccount,
      setActiveAccountId: changeActiveAccountId, updatePreferences, updateNotificationSettings,
      isLoaded, activeDateRange, setActiveDateRange, customDateRange, setCustomDateRange
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



