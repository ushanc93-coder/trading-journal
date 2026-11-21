import { NextResponse } from "next/server";

interface CalendarEvent {
  title: string;
  country: string;
  date: string;
  impact: "High" | "Medium" | "Low" | "Holiday";
  forecast: string;
  previous: string;
}

// In-memory cache for 5 minutes
let cachedData: CalendarEvent[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const FALLBACK_EVENTS: CalendarEvent[] = [
  {
    title: "US CPI Inflation Rate m/m",
    country: "USD",
    date: new Date(Date.now() + 3600000 * 2).toISOString(),
    impact: "High",
    forecast: "0.2%",
    previous: "0.3%",
  },
  {
    title: "FOMC Member Speech & Rate Outlook",
    country: "USD",
    date: new Date(Date.now() + 3600000 * 5).toISOString(),
    impact: "High",
    forecast: "",
    previous: "",
  },
  {
    title: "ECB Monetary Policy Statement",
    country: "EUR",
    date: new Date(Date.now() + 3600000 * 12).toISOString(),
    impact: "High",
    forecast: "3.25%",
    previous: "3.50%",
  },
  {
    title: "UK GDP Quarterly Estimate",
    country: "GBP",
    date: new Date(Date.now() + 3600000 * 18).toISOString(),
    impact: "Medium",
    forecast: "0.3%",
    previous: "0.2%",
  },
  {
    title: "US Initial Jobless Claims",
    country: "USD",
    date: new Date(Date.now() + 3600000 * 24).toISOString(),
    impact: "High",
    forecast: "215K",
    previous: "220K",
  },
];

export async function GET() {
  const now = Date.now();

  if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json({
      events: cachedData,
      cached: true,
      lastUpdated: new Date(lastFetchTime).toISOString(),
    });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
      },
      next: { revalidate: 300 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Failed to fetch Forex Factory calendar: ${res.status}`);
    }

    const data: CalendarEvent[] = await res.json();
    cachedData = data;
    lastFetchTime = now;

    return NextResponse.json({
      events: data,
      cached: false,
      lastUpdated: new Date(now).toISOString(),
    });
  } catch (err: any) {
    console.warn("Economic Calendar fetch failed, using cached or fallback:", err.message);

    return NextResponse.json({
      events: cachedData || FALLBACK_EVENTS,
      cached: true,
      isFallback: !cachedData,
      lastUpdated: new Date(now).toISOString(),
      error: err.message,
    });
  }
}
