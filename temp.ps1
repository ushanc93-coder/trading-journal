"use client";

import { useState } from "react";
import { useSettingsContext, Account } from "@/lib/SettingsContext";
import { useTrades } from "@/lib/useTrades";
import { useJournal } from "@/lib/useJournal";
import { useNotebook } from "@/lib/useNotebook";
import { User, Wallet, Moon, Sun, Plus, Pencil, Trash2, X, Save, Sparkles, Download, Upload } from "lucide-react";
import { useConfirm } from "@/lib/ConfirmContext";

export default function SettingsPage() {
  const { accounts, activeAccountId, preferences, addAccount, updateAccount, deleteAccount, updatePreferences, isLoaded: settingsLoaded } = useSettingsContext();
  const { seedMockData } = useTrades();
  const { seedMockJournal } = useJournal();
  const { seedMockNotebook, clearAllNotes } = useNotebook();
  const { clearAllTrades } = useTrades();
  const { clearAllEntries } = useJournal();
  const { confirm, alert } = useConfirm();

  const [editName, setEditName] = useState(preferences.name);
  
  // Modal states for Accounts
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  if (!settingsLoaded) return <div className="p-8 text-zinc-400">Loading settings...</div>;

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      setErrors({ editName: true });
      return;
    }
    setErrors({ ...errors, editName: false });
    updatePreferences({ name: editName });
  };

  const handleExportBackup = () => {
    const backup: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        backup[key] = localStorage.getItem(key) || "";
      }
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `uc-trade-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const backup = JSON.parse(content);
        const ok = await confirm({
          message: "This will overwrite ALL your current data. Are you sure you want to restore?",
          danger: true
        });
        if (ok) {
          localStorage.clear();
          Object.entries(backup).forEach(([key, value]) => {
            localStorage.setItem(key, value as string);
          });
          await alert({ message: "Backup restored successfully! The app will now reload." });
          window.location.reload();
        }
      } catch (err) {
        await alert({ message: "Failed to parse backup file.", danger: true });
      }
    };
    reader.readAsText(file);
    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  const openAddAccount = () => {
    setAccName("");
    setAccBalance("10000");
    setModalMode("add");
    setErrors({});
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (acc: Account) => {
    setEditingAccountId(acc.id);
    setAccName(acc.name);
    setAccBalance(acc.balance.toString());
    setModalMode("edit");
    setErrors({});
    setIsAccountModalOpen(true);
  };

  const confirmAccountModal = () => {
    const newErrors: Record<string, boolean> = {};
    if (!accName.trim()) newErrors.accName = true;
    
    const bal = parseFloat(accBalance);
    if (isNaN(bal)) newErrors.accBalance = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    if (modalMode === "add") {
      addAccount({ name: accName, balance: bal });
    } else if (modalMode === "edit" && editingAccountId) {
      updateAccount(editingAccountId, { name: accName, balance: bal });
    }
    setIsAccountModalOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-zinc-400 mt-1">Manage your trading accounts and personal preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile & Preferences */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-zinc-900/50 flex items-center">
              <User className="w-5 h-5 text-purple-400 mr-2" />
              <h3 className="font-semibold text-white">Profile</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => {
                    setEditName(e.target.value);
                    if (errors.editName) setErrors({ ...errors, editName: false });
                  }}
                  className={`w-full bg-zinc-950 border rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500 ${errors.editName ? '!border-rose-500' : 'border-[var(--border)]'}`}
                />
                {errors.editName && <p className="text-xs text-rose-500 mt-1">Name is required</p>}
              </div>
              <button 
                onClick={handleSaveProfile}
                className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </button>
            </div>
          </div>

          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-zinc-900/50">
              <h3 className="font-semibold text-white">Appearance</h3>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-3 rounded-lg border border-purple-500/30 bg-purple-500/10 cursor-pointer">
                <div className="flex items-center">
                  <Moon className="w-5 h-5 text-purple-400 mr-3" />
                  <div>
                    <div className="text-white font-medium">Dark Mode</div>
                    <div className="text-xs text-zinc-400">Default dark theme</div>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-purple-500 bg-purple-500"></div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-zinc-900/50 flex items-center">
              <Save className="w-5 h-5 text-blue-400 mr-2" />
              <h3 className="font-semibold text-white">Data Backup</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-400">Save a copy of your entire journal to your PC, or restore from a previous backup file.</p>
              
              <button 
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Backup to PC
              </button>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImportBackup}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  title="Restore from Backup"
                />
                <button className="w-full flex items-center justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md font-medium transition-colors border border-[var(--border)]">
                  <Upload className="w-4 h-4 mr-2 text-zinc-400" />
                  Restore from Backup
                </button>
              </div>
            </div>
          </div>

          {/* AI Integrations */}
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-zinc-900/50 flex items-center">
              <span className="w-5 h-5 text-amber-400 mr-2 flex items-center justify-center">✨</span>
              <h3 className="font-semibold text-white">AI Integrations</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-400">Add a free Google Gemini API key to enable automatic Trade Screenshot Extraction (MT4, MT5, TradingView).</p>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Gemini API Key</label>
                <input 
                  type="password" 
                  value={preferences.geminiApiKey || ''}
                  onChange={e => updatePreferences({ geminiApiKey: e.target.value })}
                  className="w-full bg-zinc-950 border border-[var(--border)] rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="AIzaSy..."
                />
              </div>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="block text-xs text-amber-500 hover:text-amber-400 transition-colors">
                Get a free API key from Google AI Studio &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center">
                <Wallet className="w-5 h-5 text-emerald-400 mr-2" />
                <h3 className="font-semibold text-white">Trading Accounts</h3>
              </div>
              <button 
                onClick={openAddAccount}
                className="flex items-center text-sm px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Account
              </button>
            </div>
            
            <div className="p-4 bg-purple-500/10 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-purple-400">Demo Data</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Load 25 realistic mock trades into the ACTIVE account to see how the dashboard looks.</p>
              </div>
              <button 
                onClick={async () => {
                  const ok = await confirm({
                    message: "This will overwrite your active account's trades, journal, and notebook with mock data. Are you sure?",
                    danger: true
                  });
                  if (ok) {
                    seedMockData();
                    seedMockJournal();
                    seedMockNotebook();
                    await alert({ message: "Mock data loaded! Go to the Dashboard to see it." });
                  }
                }}
                className="flex items-center text-xs px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-md transition-colors font-medium whitespace-nowrap"
              >
                <Sparkles className="w-3 h-3 mr-1.5" />
                Seed Demo Data
              </button>
            </div>

            <div className="divide-y divide-zinc-800/50">
              {accounts.map(acc => (
                <div key={acc.id} className="p-6 flex items-center justify-between group hover:bg-zinc-800/20 transition-colors">
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-lg font-semibold text-white">{acc.name}</h4>
                      {acc.id === activeAccountId && (
                        <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/20">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      Balance: <span className="text-emerald-400 font-mono">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(acc.balance)}
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openEditAccount(acc)}
                      className="p-2 text-zinc-500 hover:text-emerald-400 bg-zinc-900 hover:bg-zinc-800 rounded-md transition-all border border-transparent hover:border-emerald-500/30"
                      title="Edit Account"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={async () => {
                        if (accounts.length === 1) {
                          await alert({ message: "You must have at least one account.", danger: true });
                          return;
                        }
                        const ok = await confirm({
                          message: `Are you sure you want to delete ${acc.name}?`,
                          danger: true
                        });
                        if (ok) {
                          deleteAccount(acc.id);
                        }
                      }}
                      className={`p-2 rounded-md transition-all border border-transparent ${
                        accounts.length === 1 
                          ? 'text-zinc-700 bg-zinc-950 cursor-not-allowed' 
                          : 'text-zinc-500 hover:text-rose-400 bg-zinc-900 hover:bg-zinc-800 hover:border-rose-500/30'
                      }`}
                      title="Delete Account"
                      disabled={accounts.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Add / Edit Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] w-full max-w-sm rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)] bg-zinc-900/50">
              <h2 className="text-lg font-bold text-white">
                {modalMode === "add" ? "Add New Account" : "Edit Account"}
              </h2>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Account Name</label>
                <input 
                  type="text"
                  value={accName}
                  onChange={e => {
                    setAccName(e.target.value);
                    if (errors.accName) setErrors({ ...errors, accName: false });
                  }}
                  placeholder="e.g. Prop Firm Phase 1"
                  className={`w-full bg-zinc-950 border rounded-md px-3 py-2 text-white focus:outline-none focus:border-purple-500 ${errors.accName ? '!border-rose-500' : 'border-[var(--border)]'}`}
                  autoFocus
                />
                {errors.accName && <p className="text-xs text-rose-500 mt-1">Account name is required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Starting Balance (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-zinc-500">$</span>
                  <input 
                    type="number"
                    value={accBalance}
                    onChange={e => {
                      setAccBalance(e.target.value);
                      if (errors.accBalance) setErrors({ ...errors, accBalance: false });
                    }}
                    placeholder="10000"
                    className={`w-full bg-zinc-950 border rounded-md pl-7 pr-3 py-2 text-white focus:outline-none focus:border-purple-500 ${errors.accBalance ? '!border-rose-500' : 'border-[var(--border)]'}`}
                  />
                </div>
                {errors.accBalance && <p className="text-xs text-rose-500 mt-1">Valid balance is required</p>}
              </div>
            </div>
            
            <div className="p-4 border-t border-[var(--border)] bg-zinc-900/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAccountModalOpen(false)}
                className="px-4 py-2 rounded-md font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAccountModal}
                className="px-4 py-2 rounded-md font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                {modalMode === "add" ? "Add Account" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

