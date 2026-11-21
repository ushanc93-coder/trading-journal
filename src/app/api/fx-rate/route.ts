import { NextResponse } from "next/server";

interface FxRateResponse {
  rate: number;
  base: string;
  target: string;
  lastUpdated: string;
  source: string;
}

// In-memory cache for 10 minutes
let cachedRate: number | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000;

const FALLBACK_LKR_RATE = 300.0;

export async function GET() {
  const now = Date.now();

  // Return cached rate if fresh
  if (cachedRate !== null && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json({
      rate: cachedRate,
      base: "USD",
      target: "LKR",
      lastUpdated: new Date(lastFetchTime).toISOString(),
      source: "cache"
    });
  }

  // Attempt 1: open.er-api.com
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 600 }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates.LKR === "number") {
        const rate = Number(data.rates.LKR.toFixed(2));
        cachedRate = rate;
        lastFetchTime = now;
        return NextResponse.json({
          rate,
          base: "USD",
          target: "LKR",
          lastUpdated: new Date(now).toISOString(),
          source: "open.er-api"
        });
      }
    }
  } catch (err) {
    console.warn("Primary FX rate fetch failed, trying secondary:", err);
  }

  // Attempt 2: jsdelivr Fawaz Ahmed Currency API
  try {
    const res2 = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", {
      next: { revalidate: 600 }
    });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2 && data2.usd && typeof data2.usd.lkr === "number") {
        const rate = Number(data2.usd.lkr.toFixed(2));
        cachedRate = rate;
        lastFetchTime = now;
        return NextResponse.json({
          rate,
          base: "USD",
          target: "LKR",
          lastUpdated: new Date(now).toISOString(),
          source: "jsdelivr-currency-api"
        });
      }
    }
  } catch (err2) {
    console.warn("Secondary FX rate fetch failed:", err2);
  }

  // Fallback if all external networks fail
  return NextResponse.json({
    rate: cachedRate || FALLBACK_LKR_RATE,
    base: "USD",
    target: "LKR",
    lastUpdated: new Date(now).toISOString(),
    source: "fallback"
  });
}
