"use client";

import { useEffect, useRef, useState } from "react";
import { useSettingsContext } from "@/lib/SettingsContext";

export default function TradingViewTickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { preferences } = useSettingsContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    containerRef.current.innerHTML = "";

    const isDark =
      preferences?.theme === "dark" ||
      (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:DXY", title: "US Dollar (DXY)" },
        { proName: "OANDA:XAUUSD", title: "Gold (XAU/USD)" },
        { proName: "FX:EURUSD", title: "EUR/USD" },
        { proName: "FX:GBPUSD", title: "GBP/USD" },
        { proName: "FX:USDJPY", title: "USD/JPY" },
        { proName: "CAPITALCOM:US100", title: "Nasdaq 100" },
        { proName: "CAPITALCOM:US30", title: "Dow 30" },
        { proName: "TVC:US10Y", title: "US 10Y Yield" },
        { proName: "BINANCE:BTCUSDT", title: "Bitcoin" },
        { proName: "TVC:UKOIL", title: "Brent Oil" }
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: isDark ? "dark" : "light",
      locale: "en"
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [mounted, preferences?.theme]);

  return (
    <div 
      className="tradingview-widget-container w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xs transition-all"
      ref={containerRef}
      style={{ minHeight: "46px" }}
    >
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}
