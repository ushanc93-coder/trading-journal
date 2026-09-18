"use client";

import { useState, useEffect } from "react";
import { useSettingsContext } from "./SettingsContext";

export interface Note {
  id: string;
  title: string;
  content: string;
  category?: string;
  coverImage?: string;
  images?: string[];
  updatedAt: string;
  aiSummary?: string;
}

export function useNotebook() {
  const { activeAccountId, isLoaded: settingsLoaded } = useSettingsContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!settingsLoaded || !activeAccountId) return;
    
    const key = `notebook_${activeAccountId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setNotes(JSON.parse(stored));
    } else {
      if (activeAccountId === "acc-1") {
        const initialNotes = [
          {
            id: "n1",
            title: "Trading Plan Outline",
            content: "1. Only trade NY session overlap.\n2. Risk max 1% per trade.\n3. Wait for 15m sweep before entering.\n4. Walk away after 2 consecutive losses.",
            category: "Strategy",
            updatedAt: new Date().toISOString()
          }
        ];
        setNotes(initialNotes);
        localStorage.setItem(key, JSON.stringify(initialNotes));
      } else {
        setNotes([]);
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
    setIsLoaded(true);
  }, [settingsLoaded, activeAccountId]);

  const saveNote = (note: Omit<Note, "updatedAt"> & { updatedAt?: string }) => {
    if (!activeAccountId) return;
    
    setNotes(prevNotes => {
      let updated: Note[];
      const existing = prevNotes.find(n => n.id === note.id);
      
      if (existing) {
        updated = prevNotes.map(n => 
          n.id === note.id ? { ...note, updatedAt: note.updatedAt || new Date().toISOString() } : n
        );
      } else {
        updated = [{ ...note, updatedAt: note.updatedAt || new Date().toISOString() }, ...prevNotes];
      }
      
      localStorage.setItem(`notebook_${activeAccountId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNote = (id: string) => {
    if (!activeAccountId) return;
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem(`notebook_${activeAccountId}`, JSON.stringify(updated));
  };

  const clearAllNotes = () => {
    if (!activeAccountId) return;
    setNotes([]);
    localStorage.setItem(`notebook_`, JSON.stringify([]));
  };

  const seedMockNotebook = () => {
    if (!activeAccountId) return;
    const mockNotes: Note[] = [
      { 
        id: "n1", 
        title: "Morning Routine & Reflection", 
        content: "Woke up at 5am. Did 30 mins of cardio. Feeling sharp today.\n\nMarket Bias: Bearish on EU.\nWaiting for London open to see if we sweep Asian highs.", 
        category: "Daily", 
        coverImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200&h=400",
        images: ["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800"],
        updatedAt: "2026-09-15T05:30:00.000Z" 
      },
      { 
        id: "n2", 
        title: "The Silver Bullet Playbook", 
        content: "I've been backtesting a new time-based setup from ICT. The rules are:\n\n1. Wait for 10:00 AM NY time.\n2. Look for a liquidity sweep.\n3. Enter on the first FVG in the opposite direction.\n4. Target 10-20 pips minimum.\n\nGoing to forward test this on a small account next month.", 
        category: "Strategy", 
        coverImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1200&h=400",
        updatedAt: "2026-09-15T09:15:00.000Z" 
      },
      { 
        id: "n3", 
        title: "Q4 Trading Goals", 
        content: "1. Pass the 100k Challenge.\n2. Do not revenge trade after a loss.\n3. Stick to max 1% risk per day.\n4. Withdraw 50% of profits at the end of the month.", 
        category: "Goals", 
        coverImage: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1200&h=400",
        updatedAt: "2026-09-01T10:00:00.000Z" 
      },
      { 
        id: "n4", 
        title: "Weekend Reset", 
        content: "Taking a complete break from the charts this weekend. Need to focus on mental health, reading, and spending time outside. The market will always be there on Monday.", 
        category: "Personal", 
        updatedAt: "2026-09-12T10:00:00.000Z" 
      }
    ];
    setNotes(mockNotes);
    localStorage.setItem(`notebook_${activeAccountId}`, JSON.stringify(mockNotes));
  };

  return { notes, saveNote, deleteNote, clearAllNotes, seedMockNotebook, isLoaded };
}

