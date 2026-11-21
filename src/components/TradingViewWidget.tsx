"use client";

import { useEffect, useRef, useState } from "react";
import { useSettingsContext } from "@/lib/SettingsContext";

interface TradingViewWidgetProps {
  symbol?: string;
  interval?: string;
  className?: string;
  hideToolbar?: boolean;
}

export default function TradingViewWidget({
  symbol = "OANDA:XAUUSD",
  interval = "15",
  className = "w-full h-full",
  hideToolbar = false
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { preferences } = useSettingsContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";

    const isDark = 
      preferences?.theme === "dark" || 
      (typeof document !== "undefined" && document.documentElement.classList.contains("dark"));

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: "Etc/UTC",
      theme: isDark ? "dark" : "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_side_toolbar: hideToolbar,
      hide_top_toolbar: false,
      save_image: true,
      withdateranges: true,
      details: true,
      hotlist: false,
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
      backgroundColor: isDark ? "rgba(16, 22, 34, 1)" : "rgba(255, 255, 255, 1)",
      gridColor: isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(226, 232, 240, 0.7)",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [mounted, symbol, interval, preferences?.theme, hideToolbar]);

  return (
    <div 
      className={`tradingview-widget-container ${className} relative overflow-hidden`}
      ref={containerRef}
      style={{ minHeight: "520px", height: "100%" }}
    >
      {!mounted && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--card)] text-[var(--muted-foreground)] text-sm">
          Loading live market feed...
        </div>
      )}
    </div>
  );
}
