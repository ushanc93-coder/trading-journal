const fs = require('fs');

const code = `
"use client";

import { useSettingsContext, Account } from "@/lib/SettingsContext";
import { useTrades } from "@/lib/useTrades";
import { useJournal } from "@/lib/useJournal";
import { useNotebook } from "@/lib/useNotebook";
import { useConfirm } from "@/lib/ConfirmContext";
import { useState, useRef, useEffect } from "react";
import { 
  User, Moon, Sun, Download, Upload, Database, 
  Trash2, Plus, Pencil, X, Sparkles, Sliders, Users,
  Shield, Bell, CreditCard, Info
} from "lucide-react";

export default function SettingsPage() {
  const { accounts, activeAccountId, preferences, addAccount, updateAccount, deleteAccount, updatePreferences, isLoaded: settingsLoaded } = useSettingsContext();
  const { seedMockData, clearAllTrades } = useTrades();
  const { seedMockJournal, clearAllEntries } = useJournal();
  const { seedMockNotebook, clearAllNotes } = useNotebook();
  const { confirm, alert } = useConfirm();

  const [activeTab, setActiveTab] = useState('profile');

  // Profile State
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // API Key State
  const [geminiKey, setGeminiKey] = useState("");

  // Accounts Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state on mount
  useEffect(() => {
    if (settingsLoaded) {
      setDisplayName(preferences.name || "Trader");
      setGeminiKey(preferences.geminiApiKey || "");
    }
  }, [preferences, settingsLoaded]);

  if (!settingsLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading settings...</div>;

  const handleSaveProfile = async () => {
    updatePreferences({ name: displayName });
    await alert({ message: "Profile saved successfully." });
  };

  const handleSaveApi = async () => {
    updatePreferences({ geminiApiKey: geminiKey });
    await alert({ message: "API Settings saved successfully." });
  };

  const handleExport = () => {
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
    a.download = \`uc-trade-journal-backup-\${new Date().toISOString().split('T')[0]}.json\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);
        const ok = await confirm({
          message: "Are you sure you want to restore from this backup? This will overwrite ALL your current data.",
          danger: true
        });
        if (ok) {
          for (const key in backup) {
            localStorage.setItem(key, backup[key]);
          }
          window.location.reload();
        }
      } catch (err) {
        await alert({ message: "Invalid backup file.", danger: true });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddAccount = () => {
    setModalMode("add");
    setAccName("");
    setAccBalance("");
    setErrors({});
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (acc: Account) => {
    setModalMode("edit");
    setEditingAccountId(acc.id);
    setAccName(acc.name);
    setAccBalance(acc.balance.toString());
    setErrors({});
    setIsAccountModalOpen(true);
  };

  const confirmAccountModal = () => {
    const newErrors = { accName: !accName.trim(), accBalance: !accBalance || isNaN(Number(accBalance)) };
    if (newErrors.accName || newErrors.accBalance) {
      setErrors(newErrors);
      return;
    }

    if (modalMode === "add") {
      addAccount(accName.trim(), Number(accBalance));
    } else if (modalMode === "edit" && editingAccountId) {
      updateAccount(editingAccountId, accName.trim(), Number(accBalance));
    }
    
    setIsAccountModalOpen(false);
  };

  const TABS = [
    { id: 'profile', label: 'General Information', icon: Info },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'security', label: 'Security & API', icon: Shield },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'accounts', label: 'Account Manager', icon: Users },
  ];

  return (
    <div className="min-h-full flex flex-col p-8 lg:p-12 animate-fade-in max-w-[1400px] mx-auto w-full">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Settings</h1>
          <p className="text-[var(--muted-foreground)] mt-2">Manage your trading accounts, preferences, and API integrations.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1">
        
        {/* Left Sidebar Navigation */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={\`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium text-sm \${
                    isActive 
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold' 
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]'
                  }\`}
                >
                  <Icon className={\`w-5 h-5 \${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}\`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden">
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="p-8 lg:p-10 animate-zoom-in">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">General Information</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-10">Update your personal profile information and display name.</p>
              
              <div className="mb-10">
                <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4">Profile picture</h3>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {displayName ? displayName.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--foreground)]">{displayName || "Trader"}</h4>
                    <p className="text-xs text-[var(--muted-foreground)] mb-3">Trader</p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-semibold rounded-lg transition-colors">
                        Upload New Photo
                      </button>
                      <button className="px-4 py-2 bg-transparent border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] text-xs font-semibold rounded-lg transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-2">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  />
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-[var(--border)] flex justify-end">
                <button 
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === 'preferences' && (
            <div className="p-8 lg:p-10 animate-zoom-in">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Preferences</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-10">Customize your app experience and appearance.</p>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-medium text-[var(--foreground)] mb-4">Appearance (Theme)</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-sm">
                    <button 
                      onClick={() => updatePreferences({ theme: 'dark' })}
                      className={\`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all \${preferences.theme === 'dark' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--muted-foreground)]/50'}\`}
                    >
                      <Moon className={\`w-8 h-8 mb-3 \${preferences.theme === 'dark' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}\`} />
                      <span className={\`font-medium \${preferences.theme === 'dark' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}\`}>Dark Theme</span>
                    </button>
                    <button 
                      onClick={() => updatePreferences({ theme: 'light' })}
                      className={\`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all \${preferences.theme === 'light' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--muted-foreground)]/50'}\`}
                    >
                      <Sun className={\`w-8 h-8 mb-3 \${preferences.theme === 'light' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}\`} />
                      <span className={\`font-medium \${preferences.theme === 'light' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}\`}>Light Theme</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY & API TAB */}
          {activeTab === 'security' && (
            <div className="p-8 lg:p-10 animate-zoom-in">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Security & API Integrations</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-10">Manage your API keys and security settings.</p>
              
              <div className="bg-gradient-to-br from-[var(--primary)]/5 to-purple-500/5 p-6 md:p-8 rounded-2xl border border-[var(--primary)]/20 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <Sparkles className="w-32 h-32 text-[var(--primary)]" />
                </div>
                
                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  Google Gemini Integration
                </h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-lg">
                  Add a free Google Gemini API key to enable automatic Trade Screenshot Extraction (MT4, MT5, TradingView).
                </p>

                <div className="max-w-md relative z-10">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Gemini API Key</label>
                  <input 
                    type="password" 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all mb-4 shadow-inner"
                  />
                  
                  <div className="flex items-center justify-between">
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-[var(--primary)] hover:underline flex items-center">
                      Get a free API key from Google AI Studio &rarr;
                    </a>
                    <button 
                      onClick={handleSaveApi}
                      className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-sm font-semibold rounded-lg transition-all shadow-md"
                    >
                      Save API Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DATA MANAGEMENT TAB */}
          {activeTab === 'data' && (
            <div className="p-8 lg:p-10 animate-zoom-in">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Data Management</h2>
              <p className="text-sm text-[var(--muted-foreground)] mb-10">Export, restore, or wipe your local journal data.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                      <Download className="w-5 h-5 text-blue-500" /> Export Backup
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-6">
                      Save a complete JSON copy of your entire journal, including all accounts, trades, and notes to your PC.
                    </p>
                  </div>
                  <button 
                    onClick={handleExport}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export to PC
                  </button>
                </div>
                
                <div className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)] flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-amber-500" /> Restore Backup
                    </h3>
                    <p className="text-sm text-[var(--muted-foreground)] mb-6">
                      Restore your journal from a previously exported JSON backup file. <span className="font-bold text-amber-500">This overwrites current data.</span>
                    </p>
                  </div>
                  <div>
                    <input 
                      type="file" 
                      accept=".json" 
                      ref={fileInputRef} 
                      onChange={handleImport} 
                      className="hidden" 
                      id="backup-upload" 
                    />
                    <label 
                      htmlFor="backup-upload"
                      className="w-full py-2.5 bg-[var(--muted)] hover:bg-[var(--muted-foreground)]/20 text-[var(--foreground)] font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-[var(--border)]"
                    >
                      <Upload className="w-4 h-4" /> Select Backup File
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-[var(--foreground)]">Seed Demo Data</h4>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Load realistic mock trades into the ACTIVE account.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      const ok = await confirm({
                        message: "This will inject mock trades into your currently active account. Are you sure?",
                      });
                      if (ok) {
                        seedMockData();
                        seedMockJournal();
                        seedMockNotebook();
                        await alert({ message: "Demo data injected successfully!" });
                      }
                    }}
                    className="shrink-0 flex items-center px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl transition-all font-semibold shadow-md"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Seed Demo Data
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-[var(--loss)]/10 border border-[var(--loss)]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-[var(--loss)]">Wipe Account Data</h4>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">Permanently delete ALL trades, journal entries, and notes for the ACTIVE account.</p>
                  </div>
                  <button 
                    onClick={async () => {
                      const ok = await confirm({
                        message: "WARNING: This will instantly delete everything in the active account. This cannot be undone. Are you sure?",
                        danger: true
                      });
                      if (ok) {
                        clearAllTrades();
                        clearAllEntries();
                        clearAllNotes();
                        await alert({ message: "All data for this account has been wiped clean." });
                      }
                    }}
                    className="shrink-0 flex items-center px-5 py-2.5 bg-[var(--loss)] hover:bg-red-600 text-white rounded-xl transition-all font-semibold shadow-md"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Wipe All Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNTS TAB */}
          {activeTab === 'accounts' && (
            <div className="animate-zoom-in h-full flex flex-col">
              <div className="p-8 lg:p-10 border-b border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--background)]/50">
                <div>
                  <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Account Manager</h2>
                  <p className="text-sm text-[var(--muted-foreground)]">Manage your multiple trading accounts or prop firm challenges.</p>
                </div>
                <button 
                  onClick={openAddAccount}
                  className="shrink-0 flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-semibold shadow-md"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Account
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-[var(--border)]">
                  {accounts.map(acc => (
                    <div key={acc.id} className="p-8 flex items-center justify-between group hover:bg-[var(--muted)]/10 transition-colors">
                      <div>
                        <div className="flex items-center">
                          <h4 className="text-lg font-bold text-[var(--foreground)]">{acc.name}</h4>
                          {acc.id === activeAccountId && (
                            <span className="ml-4 px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shadow-sm">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] mt-2 font-medium">
                          Starting Balance: <span className="text-[var(--foreground)] font-mono ml-1">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(acc.balance)}
                          </span>
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditAccount(acc)}
                          className="p-2.5 text-[var(--muted-foreground)] hover:text-blue-500 bg-[var(--background)] hover:bg-blue-500/10 rounded-lg transition-all border border-[var(--border)] hover:border-blue-500/30 shadow-sm"
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
                              message: \`Are you sure you want to delete \${acc.name}?\`,
                              danger: true
                            });
                            if (ok) {
                              deleteAccount(acc.id);
                            }
                          }}
                          className={\`p-2.5 rounded-lg transition-all border shadow-sm \${
                            accounts.length === 1 
                              ? 'border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--background)] cursor-not-allowed opacity-50' 
                              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--loss)] bg-[var(--background)] hover:bg-[var(--loss)]/10 hover:border-[var(--loss)]/30'
                          }\`}
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
          )}

        </div>
      </div>

      {/* Add / Edit Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--card)] w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col animate-zoom-in">
            <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--border)] bg-[var(--background)]/50">
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                {modalMode === "add" ? "Add New Account" : "Edit Account"}
              </h2>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1 bg-[var(--muted)]/50 hover:bg-[var(--muted)] rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Account Name</label>
                <input 
                  type="text"
                  value={accName}
                  onChange={e => {
                    setAccName(e.target.value);
                    if (errors.accName) setErrors({ ...errors, accName: false });
                  }}
                  placeholder="e.g. Prop Firm Phase 1"
                  className={\`w-full bg-[var(--background)] border rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all \${errors.accName ? '!border-[var(--loss)]/50' : 'border-[var(--border)]'}\`}
                  autoFocus
                />
                {errors.accName && <p className="text-xs text-[var(--loss)] mt-2 font-medium flex items-center gap-1"><Info className="w-3 h-3"/> Account name is required</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-2">Starting Balance (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-[var(--muted-foreground)] font-medium">$</span>
                  <input 
                    type="number"
                    value={accBalance}
                    onChange={e => {
                      setAccBalance(e.target.value);
                      if (errors.accBalance) setErrors({ ...errors, accBalance: false });
                    }}
                    placeholder="10000"
                    className={\`w-full bg-[var(--background)] border rounded-xl pl-9 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all \${errors.accBalance ? '!border-[var(--loss)]/50' : 'border-[var(--border)]'}\`}
                  />
                </div>
                {errors.accBalance && <p className="text-xs text-[var(--loss)] mt-2 font-medium flex items-center gap-1"><Info className="w-3 h-3"/> Valid balance is required</p>}
              </div>
            </div>
            
            <div className="p-5 border-t border-[var(--border)] bg-[var(--background)]/50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAccountModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAccountModal}
                className="px-6 py-2.5 rounded-xl font-bold bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white transition-all shadow-md"
              >
                {modalMode === "add" ? "Create Account" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`

fs.writeFileSync('src/app/settings/page.tsx', code);
console.log("Reconstructed exact logic with new UI");
