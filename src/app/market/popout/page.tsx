"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import TradingViewWidget from "@/components/TradingViewWidget";
import { Maximize2, Minimize2, ExternalLink } from "lucide-react";

const INSTRUMENTS = [
  { id: "XAUUSD", name: "Gold / USD", tvSymbol: "OANDA:XAUUSD", icon: "🥇" },
  { id: "EURUSD", name: "EUR / USD", tvSymbol: "FX:EURUSD", icon: "💶" },
  { id: "GBPUSD", name: "GBP / USD", tvSymbol: "FX:GBPUSD", icon: "💷" },
  { id: "US100", name: "Nasdaq 100", tvSymbol: "CAPITALCOM:US100", icon: "📊" },
  { id: "US30", name: "Dow Jones 30", tvSymbol: "CAPITALCOM:US30", icon: "🏛️" },
  { id: "USDJPY", name: "USD / JPY", tvSymbol: "FX:USDJPY", icon: "💴" },
  { id: "BTCUSD", name: "Bitcoin / USD", tvSymbol: "BINANCE:BTCUSDT", icon: "🪙" },
];

const TIMEFRAMES = [
  { label: "1m", value: "1" },
  { label: "5m", value: "5" },
  { label: "15m", value: "15" },
  { label: "1H", value: "60" },
  { label: "4H", value: "240" },
  { label: "1D", value: "D" },
];

function PopoutContent() {
  const searchParams = useSearchParams();
  const initialSymbol = searchParams.get("symbol") || "OANDA:XAUUSD";
  const initialTf = searchParams.get("tf") || "15";

  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTf);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentInst = INSTRUMENTS.find(i => i.tvSymbol === symbol) || INSTRUMENTS[0];

  return (
    <div className="w-screen h-screen flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Slim Topbar */}
      <header className="h-12 border-b border-[var(--border)] px-4 flex items-center justify-between bg-[var(--card)] shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-extrabold text-sm tracking-tight text-[var(--foreground)]">
              UC Market Terminal
            </span>
          </div>

          <div className="h-4 w-px bg-[var(--border)] mx-1" />

          {/* Quick Symbol Switcher */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {INSTRUMENTS.map((inst) => {
              const isSelected = inst.tvSymbol === symbol;
              return (
                <button
                  key={inst.id}
                  onClick={() => setSymbol(inst.tvSymbol)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#4F39F6] text-white shadow-xs"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/50 dark:hover:bg-black/20"
                  }`}
                >
                  <span className="mr-1">{inst.icon}</span>
                  {inst.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeframes & Window Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white/40 dark:bg-black/20 p-0.5 rounded-lg border border-[var(--border)]">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  timeframe === tf.value
                    ? "bg-[#4F39F6] text-white"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-white/50 dark:hover:bg-black/20 transition-all border border-[var(--border)] cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Edge-to-Edge Chart Container */}
      <main className="flex-1 w-full h-[calc(100vh-48px)] relative overflow-hidden bg-white dark:bg-slate-900">
        <TradingViewWidget
          symbol={symbol}
          interval={timeframe}
          className="w-full h-full"
        />
      </main>
    </div>
  );
}

export default function MarketPopoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-[var(--muted-foreground)]">Loading Market Terminal...</div>}>
      <PopoutContent />
    </Suspense>
  );
}
