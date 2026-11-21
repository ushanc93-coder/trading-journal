
"use client";

import { useSettingsContext, Account, DEFAULT_NOTIFICATION_SETTINGS } from "@/lib/SettingsContext";
import { useTradesContext } from "@/lib/TradesContext";
import { useJournal } from "@/lib/useJournal";
import { useNotebook } from "@/lib/useNotebook";
import { useConfirm } from "@/lib/ConfirmContext";
import { useState, useRef, useEffect } from "react";
import { 
  User, Moon, Sun, Download, Upload, Database, 
  Trash2, Plus, Pencil, X, Sparkles, Sliders, Users,
  Shield, Bell, CreditCard, Info, AlertTriangle, AlertCircle, LineChart,
  Zap, Copy, Check, Terminal, ExternalLink, Play, Radio, Volume2
} from "lucide-react";
import { playNotificationChime } from "@/lib/notificationSound";

const CTRADER_CBOT_CODE = `using System;
using System.Net.Http;
using System.Text;
using System.Globalization;
using cAlgo.API;
using cAlgo.API.Internals;

namespace cAlgo.Robots
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.FullAccess)]
    public class JournalSync_cBot : Robot
    {
        [Parameter("Journal Webhook URL", DefaultValue = "http://localhost:3000/api/trades/webhook")]
        public string WebhookUrl { get; set; }

        private static readonly HttpClient client = new HttpClient();

        protected override void OnStart()
        {
            Print("UC Trade Journal Sync cBot active on IC Markets cTrader.");
            Positions.Opened += OnPositionOpened;
            Positions.Closed += OnPositionClosed;
        }

        private async void OnPositionOpened(PositionOpenedEventArgs args)
        {
            var p = args.Position;
            try
            {
                var sym = Symbols.GetSymbol(p.SymbolName);
                double volumeInLots = sym != null && sym.LotSize > 0 
                    ? (double)p.VolumeInUnits / sym.LotSize 
                    : (double)p.Quantity / 100000.0;

                string slStr = p.StopLoss.HasValue ? p.StopLoss.Value.ToString(CultureInfo.InvariantCulture) : "null";
                string tpStr = p.TakeProfit.HasValue ? p.TakeProfit.Value.ToString(CultureInfo.InvariantCulture) : "null";
                string entryStr = p.EntryPrice.ToString(CultureInfo.InvariantCulture);
                string lotsStr = volumeInLots.ToString(CultureInfo.InvariantCulture);

                var payload = $@"{{
                    ""source"": ""ctrader"",
                    ""broker"": ""IC Markets"",
                    ""event"": ""opened"",
                    ""positionId"": ""{p.Id}"",
                    ""symbol"": ""{p.SymbolName}"",
                    ""tradeType"": ""{p.TradeType}"",
                    ""entryPrice"": {entryStr},
                    ""volumeInLots"": {lotsStr},
                    ""stopLoss"": {slStr},
                    ""takeProfit"": {tpStr},
                    ""openTime"": ""{p.EntryTime:O}""
                }}";

                var content = new StringContent(payload, Encoding.UTF8, "application/json");
                await client.PostAsync(WebhookUrl, content);
            }
            catch (Exception ex)
            {
                Print($"[Journal Sync Error] {ex.Message}");
            }
        }

        private async void OnPositionClosed(PositionClosedEventArgs args)
        {
            var p = args.Position;
            try
            {
                var sym = Symbols.GetSymbol(p.SymbolName);
                double volumeInLots = sym != null && sym.LotSize > 0 
                    ? (double)p.VolumeInUnits / sym.LotSize 
                    : (double)p.Quantity / 100000.0;

                var hist = History.FindLast(p.SymbolName, p.Id);
                double exitPrice = hist != null ? hist.ClosingPrice : (p.Price.HasValue ? p.Price.Value : p.EntryPrice);
                double netProfit = hist != null ? hist.NetProfit : p.NetProfit;

                string slStr = p.StopLoss.HasValue ? p.StopLoss.Value.ToString(CultureInfo.InvariantCulture) : "null";
                string tpStr = p.TakeProfit.HasValue ? p.TakeProfit.Value.ToString(CultureInfo.InvariantCulture) : "null";
                string entryStr = p.EntryPrice.ToString(CultureInfo.InvariantCulture);
                string exitStr = exitPrice.ToString(CultureInfo.InvariantCulture);
                string lotsStr = volumeInLots.ToString(CultureInfo.InvariantCulture);
                string pnlStr = netProfit.ToString(CultureInfo.InvariantCulture);

                var payload = $@"{{
                    ""source"": ""ctrader"",
                    ""broker"": ""IC Markets"",
                    ""event"": ""closed"",
                    ""positionId"": ""{p.Id}"",
                    ""symbol"": ""{p.SymbolName}"",
                    ""tradeType"": ""{p.TradeType}"",
                    ""entryPrice"": {entryStr},
                    ""exitPrice"": {exitStr},
                    ""volumeInLots"": {lotsStr},
                    ""stopLoss"": {slStr},
                    ""takeProfit"": {tpStr},
                    ""netProfit"": {pnlStr},
                    ""closeTime"": ""{DateTime.UtcNow:O}""
                }}";

                var content = new StringContent(payload, Encoding.UTF8, "application/json");
                await client.PostAsync(WebhookUrl, content);
            }
            catch (Exception ex)
            {
                Print($"[Journal Sync Error] {ex.Message}");
            }
        }
    }
}`;

const TRADINGVIEW_JSON_TEMPLATE = `{
  "source": "tradingview",
  "symbol": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": {{close}},
  "contracts": {{strategy.order.contracts}},
}`;

const TABS = [
  { id: 'profile', label: 'General Information', icon: Info },
  { id: 'notifications', label: 'Notifications & Wire Alerts', icon: Bell },
  { id: 'integrations', label: 'Auto-Sync (TradingView & cTrader)', icon: Zap },
  { id: 'preferences', label: 'Preferences', icon: Sliders },
  { id: 'security', label: 'Security & API', icon: Shield },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'accounts', label: 'Account Manager', icon: Users },
];

export default function SettingsPage() {
  const { accounts, activeAccountId, preferences, addAccount, updateAccount, deleteAccount, updatePreferences, updateNotificationSettings, isLoaded: settingsLoaded } = useSettingsContext();
  const { seedMockData, clearAllTrades } = useTradesContext();
  const { seedMockJournal, clearAllEntries } = useJournal();
  const { seedMockNotebook, clearAllNotes } = useNotebook();
  const { confirm, alert } = useConfirm();

  const [activeTab, setActiveTab] = useState('profile');
  const notifSettings = preferences.notifications || DEFAULT_NOTIFICATION_SETTINGS;

  // Profile State
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // API Key State
  const [geminiKey, setGeminiKey] = useState("");

  // TradingView Layout URL State
  const [tvLayoutUrl, setTvLayoutUrl] = useState("");

  // Accounts Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accName, setAccName] = useState("");
  const [accBalance, setAccBalance] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSendingTestTrade, setIsSendingTestTrade] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state on mount
  useEffect(() => {
    if (settingsLoaded) {
      setDisplayName(preferences.name || "Trader");
      setGeminiKey(preferences.geminiApiKey || "");
      setTvLayoutUrl(preferences.tradingViewLayoutUrl || "https://www.tradingview.com/chart/I05w1M0O/");
    }
  }, [preferences, settingsLoaded]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && TABS.some(t => t.id === tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  if (!settingsLoaded) return <div className="p-8 text-[var(--muted-foreground)]">Loading settings...</div>;

  const handleSaveProfile = async () => {
    updatePreferences({ name: displayName });
    await alert({ message: "Profile saved successfully." });
  };

  const handleSaveApi = async () => {
    updatePreferences({ geminiApiKey: geminiKey });
    await alert({ message: "API Settings saved successfully." });
  };

  const handleSaveTradingView = async () => {
    updatePreferences({ tradingViewLayoutUrl: tvLayoutUrl });
    await alert({ message: "TradingView Chart Layout URL saved successfully." });
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
    a.download = `uc-trade-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
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
      addAccount({ name: accName.trim(), balance: Number(accBalance) });
    } else if (modalMode === "edit" && editingAccountId) {
      updateAccount(editingAccountId, { name: accName.trim(), balance: Number(accBalance) });
    }
    
    setIsAccountModalOpen(false);
  };

  const handleSyncAccountWithCtrader = async (accId: string) => {
    try {
      const res = await fetch("/api/ctrader/detect");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.found && typeof data.detectedBalance === "number") {
          updateAccount(accId, { balance: data.detectedBalance });
          await alert({ 
            message: `Account balance successfully synced to cTrader statement (${data.fileName}): $${data.detectedBalance.toFixed(2)}` 
          });
        } else {
          await alert({ message: "No cTrader statements detected in your Downloads folder. Please export one first." });
        }
      }
    } catch (e: any) {
      await alert({ message: "Failed to scan cTrader statements: " + e.message, danger: true });
    }
  };


  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendTestTrade = async (source: "tradingview" | "ctrader") => {
    setIsSendingTestTrade(true);
    try {
      const payload = source === "ctrader" ? {
        source: "ctrader",
        broker: "IC Markets",
        event: "opened",
        positionId: Math.floor(1000000 + Math.random() * 9000000),
        symbol: "EURUSD",
        tradeType: "Buy",
        entryPrice: 1.0850,
        volumeInLots: 1.0,
        stopLoss: 1.0820,
        takeProfit: 1.0910,
        notes: "Test Auto-Sync execution from IC Markets cTrader"
      } : {
        source: "tradingview",
        symbol: "XAUUSD",
        action: "buy",
        price: 2650.50,
        sl: 2640.00,
        tp: 2670.00,
        lot: 0.5,
        notes: "Test Webhook Alert from TradingView"
      };

      const res = await fetch("/api/trades/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await alert({ message: `Test trade for ${source === "ctrader" ? "IC Markets cTrader" : "TradingView"} sent successfully! Watch for the top-right Auto-Sync notification banner.` });
      }
    } catch {
      await alert({ message: "Failed to send test trade.", danger: true });
    } finally {
      setIsSendingTestTrade(false);
    }
  };

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
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium text-sm ${
                    isActive 
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold' 
                      : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
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

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="p-8 lg:p-10 animate-zoom-in space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-1">Notifications &amp; Wire Alerts</h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Configure how Reuters wire dispatches, gold catalysts, and discipline alerts pop up and play sounds.
                </p>
              </div>

              {/* Card 1: Pop-up Alerts */}
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--foreground)]">Floating Wire Flash Pop-up</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Top Toast
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-xl">
                      Displays a floating headline pill at the top of the screen when a new Reuters or Gold macro catalyst breaks.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => updateNotificationSettings({ enableNewsPopups: !notifSettings.enableNewsPopups })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifSettings.enableNewsPopups ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifSettings.enableNewsPopups ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto-Dismiss Duration */}
                {notifSettings.enableNewsPopups && (
                  <div className="pt-4 border-t border-[var(--border)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[var(--foreground)]">Auto-Dismiss Timer</div>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        How long the pop-up stays on screen before disappearing (mouse hover pauses the timer).
                      </p>
                    </div>

                    <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-1 text-xs">
                      {[
                        { label: "5s", value: 5 },
                        { label: "8s (Default)", value: 8 },
                        { label: "12s", value: 12 },
                        { label: "Manual Only", value: 0 },
                      ].map(opt => {
                        const isSelected = notifSettings.popupDurationSeconds === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => updateNotificationSettings({ popupDurationSeconds: opt.value })}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold'
                                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Audio & Chime Alerts */}
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--foreground)]">Sound Chime on Breaking News</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                        Audio
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-xl">
                      Plays a pleasant financial terminal dual-tone chime when market-moving headlines break.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => updateNotificationSettings({ enableNewsSound: !notifSettings.enableNewsSound })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      notifSettings.enableNewsSound ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        notifSettings.enableNewsSound ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-foreground)]">Test chime sound:</span>
                  <button
                    onClick={() => playNotificationChime()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--accent)] text-xs font-semibold text-[var(--foreground)] transition-colors cursor-pointer active:scale-95"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Play Test Chime</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Target Filter */}
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--foreground)]">Market Catalyst Filter</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Filter
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-xl">
                      Choose whether alerts should only trigger for Gold (XAUUSD) &amp; high-impact dispatches, or for all financial news.
                    </p>
                  </div>

                  <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-1 text-xs">
                    <button
                      onClick={() => updateNotificationSettings({ filterGoldOnly: true })}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        notifSettings.filterGoldOnly
                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      Gold (XAUUSD) Focus
                    </button>
                    <button
                      onClick={() => updateNotificationSettings({ filterGoldOnly: false })}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        !notifSettings.filterGoldOnly
                          ? 'bg-[var(--card)] text-[var(--foreground)] shadow-xs font-semibold'
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      All Market News
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4: Understood News History & Reset */}
              <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">Understood News History</div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Reset your marked "Understood" history if you want active wire dispatches to re-notify for testing.
                  </p>
                </div>

                <button
                  onClick={() => {
                    localStorage.removeItem("understood_news_ids");
                    window.dispatchEvent(new Event("reset-wire-understood"));
                    alert({ message: "News history reset! Active wire headlines will now show as unread." });
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
                >
                  Reset Read History
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
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${preferences.theme === 'dark' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--muted-foreground)]/50'}`}
                    >
                      <Moon className={`w-8 h-8 mb-3 ${preferences.theme === 'dark' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                      <span className={`font-medium ${preferences.theme === 'dark' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>Dark Theme</span>
                    </button>
                    <button 
                      onClick={() => updatePreferences({ theme: 'light' })}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${preferences.theme === 'light' ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-[var(--border)] hover:border-[var(--muted-foreground)]/50'}`}
                    >
                      <Sun className={`w-8 h-8 mb-3 ${preferences.theme === 'light' ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                      <span className={`font-medium ${preferences.theme === 'light' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'}`}>Light Theme</span>
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

              {/* TradingView Personal Chart Layout Integration */}
              <div className="bg-gradient-to-br from-[#4F39F6]/5 to-indigo-500/5 p-6 md:p-8 rounded-2xl border border-[#4F39F6]/20 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <LineChart className="w-5 h-5 text-[#4F39F6]" />
                  <h3 className="text-lg font-bold text-[var(--foreground)]">
                    TradingView Personal Chart Layout Integration
                  </h3>
                </div>
                <p className="text-sm text-[var(--muted-foreground)] mb-6 max-w-xl">
                  Connect your personal TradingView chart layout so all your custom drawings, favorite toolbars, and colors can be opened directly with 1-click.
                </p>

                <div className="max-w-xl relative z-10">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">My Saved Chart Layout URL</label>
                  <input 
                    type="url" 
                    value={tvLayoutUrl}
                    onChange={(e) => setTvLayoutUrl(e.target.value)}
                    placeholder="https://www.tradingview.com/chart/..."
                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[#4F39F6] focus:ring-1 focus:ring-[#4F39F6] transition-all mb-4 text-sm"
                  />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <a 
                      href={tvLayoutUrl || "https://www.tradingview.com/chart/I05w1M0O/"} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs text-[#4F39F6] hover:underline flex items-center gap-1 font-bold"
                    >
                      Test &amp; Open My Layout in New Tab &rarr;
                    </a>
                    <button 
                      onClick={handleSaveTradingView}
                      className="px-5 py-2 bg-[#4F39F6] hover:bg-[#4338CA] text-white text-sm font-semibold rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Save Layout Link
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
                    className="shrink-0 flex items-center px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl transition-all font-semibold shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Seed Demo Data
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-[var(--border)]">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--loss)] mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Danger Zone
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Clear All Trades & Logs */}
                    <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--loss)]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                          <Trash2 className="w-4 h-4 text-[var(--loss)]" />
                          Clear All Data (Trades & Trade Log)
                        </h4>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                          Permanently delete all trades, trade log records, and trade journal entries for the active account. Notebook notes will be kept.
                        </p>
                      </div>
                      <button 
                        onClick={async () => {
                          const ok = await confirm({
                            message: "Are you sure you want to delete all trades? This will wipe your trade log and dashboard clean. This action cannot be undone.",
                            danger: true
                          });
                          if (ok) {
                            clearAllTrades();
                            clearAllEntries();
                            await alert({ message: "All trades and trade logs have been cleared." });
                          }
                        }}
                        className="shrink-0 flex items-center px-5 py-2.5 bg-[var(--loss)]/15 hover:bg-[var(--loss)]/25 text-[var(--loss)] border border-[var(--loss)]/30 rounded-xl transition-all font-semibold cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All Data
                      </button>
                    </div>

                    {/* Wipe All Account Data */}
                    <div className="p-6 rounded-2xl bg-[var(--loss)]/10 border border-[var(--loss)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-base font-bold text-[var(--loss)] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Wipe Account Data (Complete Reset)
                        </h4>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                          Permanently delete ALL trades, journal entries, and notebook pages for the active account.
                        </p>
                      </div>
                      <button 
                        onClick={async () => {
                          const ok = await confirm({
                            message: "WARNING: This will instantly delete everything (trades, journal entries, and notes) in the active account. This cannot be undone. Are you sure?",
                            danger: true
                          });
                          if (ok) {
                            clearAllTrades();
                            clearAllEntries();
                            clearAllNotes();
                            await alert({ message: "All data for this account has been wiped clean." });
                          }
                        }}
                        className="shrink-0 flex items-center px-5 py-2.5 bg-[var(--loss)] hover:bg-red-600 text-white rounded-xl transition-all font-semibold shadow-md cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Wipe All Data
                      </button>
                    </div>
                  </div>
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
                          Starting Balance: <span className="text-[var(--foreground)] tabular-nums ml-1">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(acc.balance)}
                          </span>
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleSyncAccountWithCtrader(acc.id)}
                          className="p-2.5 text-[var(--muted-foreground)] hover:text-emerald-500 bg-[var(--background)] hover:bg-emerald-500/10 rounded-lg transition-all border border-[var(--border)] hover:border-emerald-500/30 shadow-sm"
                          title="Sync Balance with cTrader Statement"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                        </button>
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
                              message: `Are you sure you want to delete ${acc.name}?`,
                              danger: true
                            });
                            if (ok) {
                              deleteAccount(acc.id);
                            }
                          }}
                          className={`p-2.5 rounded-lg transition-all border shadow-sm ${
                            accounts.length === 1 
                              ? 'border-[var(--border)] text-[var(--muted-foreground)] bg-[var(--background)] cursor-not-allowed opacity-50' 
                              : 'border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--loss)] bg-[var(--background)] hover:bg-[var(--loss)]/10 hover:border-[var(--loss)]/30'
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
          )}

          {/* AUTO-SYNC (TRADINGVIEW & CTRADER) TAB */}
          {activeTab === 'integrations' && (
            <div className="p-8 lg:p-10 animate-zoom-in space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    <Zap className="w-5 h-5 fill-emerald-500" />
                  </span>
                  <h2 className="text-2xl font-bold text-[var(--foreground)]">Auto-Sync &amp; Broker Webhooks</h2>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Automatically record your trades in real-time as you enter or exit on <strong>IC Markets cTrader</strong> or <strong>TradingView</strong> without manual entry.
                </p>
              </div>

              {/* 1. Global Webhook URL Box */}
              <div className="p-5 rounded-2xl bg-[var(--muted)]/20 border border-[var(--border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-[var(--primary)] flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" /> Your Journal Webhook URL
                  </span>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Paste this URL into TradingView Alerts or your IC Markets cTrader cBot settings.
                  </p>
                  <code className="text-xs font-mono font-bold bg-[var(--background)] px-2.5 py-1.5 rounded-lg border border-[var(--border)] block select-all text-emerald-600 dark:text-emerald-400">
                    {typeof window !== "undefined" ? `${window.location.origin}/api/trades/webhook` : "http://localhost:3000/api/trades/webhook"}
                  </code>
                </div>
                <button
                  onClick={() => {
                    const url = typeof window !== "undefined" ? `${window.location.origin}/api/trades/webhook` : "http://localhost:3000/api/trades/webhook";
                    handleCopy(url, "webhook_url");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  {copiedKey === "webhook_url" ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === "webhook_url" ? "Copied URL!" : "Copy Webhook URL"}</span>
                </button>
              </div>

              {/* 2. IC Markets cTrader Section */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/20 via-[var(--card)] to-[var(--muted)]/20 border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-600 text-white">
                        IC Markets cTrader
                      </span>
                      <span className="text-xs font-bold text-emerald-500">
                        ⚡ 100% Real-Time Execution Sync
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">cTrader Automate Sync cBot</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Runs natively inside IC Markets cTrader. Every time you open or close a trade on PC, Web, or Mobile, it automatically records it here!
                    </p>
                  </div>
                  <button
                    onClick={() => handleSendTestTrade("ctrader")}
                    disabled={isSendingTestTrade}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Send Test cTrader Trade</span>
                  </button>
                </div>

                {/* 3 Step Guide */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                    <span className="font-extrabold text-[var(--primary)] block mb-1">Step 1: Open cTrader</span>
                    <p className="text-[var(--muted-foreground)] leading-relaxed">
                      In IC Markets cTrader, click the <strong>Automate</strong> tab on the left navigation rail.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                    <span className="font-extrabold text-[var(--primary)] block mb-1">Step 2: Add New cBot</span>
                    <p className="text-[var(--muted-foreground)] leading-relaxed">
                      Click <strong>+ New</strong> (New cBot), replace with the script below, and click <strong>Build</strong>.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)]">
                    <span className="font-extrabold text-[var(--primary)] block mb-1">Step 3: Click Play</span>
                    <p className="text-[var(--muted-foreground)] leading-relaxed">
                      Right-click the cBot -&gt; <strong>Add an Instance</strong> on any chart, and click <strong>Start / Play</strong>!
                    </p>
                  </div>
                </div>

                {/* Code Block Container */}
                <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[#0A0E17]">
                  <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10 text-xs">
                    <span className="font-mono text-white/70 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" /> JournalSync_cBot.cs (C#)
                    </span>
                    <button
                      onClick={() => handleCopy(CTRADER_CBOT_CODE, "cbot_code")}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {copiedKey === "cbot_code" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === "cbot_code" ? "Copied Script!" : "Copy C# Script"}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[180px] custom-scrollbar leading-relaxed">
                    {CTRADER_CBOT_CODE}
                  </pre>
                </div>
              </div>

              {/* 3. TradingView Section */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/20 via-[var(--card)] to-[var(--muted)]/20 border border-amber-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-black">
                        TradingView
                      </span>
                      <span className="text-xs font-bold text-amber-500">
                        Alert Webhook Integration
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">TradingView Alerts Auto-Sync</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Sync orders from TradingView chart alerts, Pine Script indicators, or strategies directly into this journal.
                    </p>
                  </div>
                  <button
                    onClick={() => handleSendTestTrade("tradingview")}
                    disabled={isSendingTestTrade}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Send Test TradingView Trade</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[var(--foreground)] block">
                    TradingView Alert Message JSON Template:
                  </span>
                  <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[#0A0E17]">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10 text-xs">
                      <span className="font-mono text-white/70">alert_payload.json</span>
                      <button
                        onClick={() => handleCopy(TRADINGVIEW_JSON_TEMPLATE, "tv_template")}
                        className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {copiedKey === "tv_template" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === "tv_template" ? "Copied JSON!" : "Copy JSON Template"}</span>
                      </button>
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-amber-200 overflow-x-auto leading-relaxed">
                      {TRADINGVIEW_JSON_TEMPLATE}
                    </pre>
                  </div>
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
                  className={`w-full bg-[var(--background)] border rounded-xl px-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all ${errors.accName ? '!border-[var(--loss)]/50' : 'border-[var(--border)]'}`}
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
                    className={`w-full bg-[var(--background)] border rounded-xl pl-9 pr-4 py-3 text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all ${errors.accBalance ? '!border-[var(--loss)]/50' : 'border-[var(--border)]'}`}
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
