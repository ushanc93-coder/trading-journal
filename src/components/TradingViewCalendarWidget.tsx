"use client";

import { useEffect, useRef, useState } from "react";
import { useSettingsContext } from "@/lib/SettingsContext";

export default function TradingViewCalendarWidget() {
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
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    containerRef.current.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: isDark ? "dark" : "light",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "0,1",
      countryFilter: "us,eu,gb,jp,ch,ca,au"
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
      className="tradingview-widget-container w-full h-full relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]"
      ref={containerRef}
      style={{ minHeight: "650px", height: "100%" }}
    >
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
