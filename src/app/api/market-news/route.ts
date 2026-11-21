import { NextResponse } from "next/server";
import {
  analyzeNewsArticle,
  analyzeGoldMarketPulse,
  ArticleAnalysis,
  GoldMarketPulse,
} from "@/lib/macroNewsAnalyzer";

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  source: string; // "Reuters" | "FXStreet" | "ForexLive" | "Financial Wire"
  summary: string;
  category: "Fed / Rates" | "Forex / FX" | "Commodities / Gold" | "Macro / Global";
  isBreaking?: boolean;
  analysis?: ArticleAnalysis;
}

let cachedNews: NewsItem[] | null = null;
let lastNewsFetchTime = 0;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for ultra-fresh breaking news

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "news-fallback-1",
    title: "Gold eases on strong dollar, oil prices; US inflation data eyed - Reuters",
    link: "https://www.reuters.com",
    pubDate: new Date().toISOString(),
    source: "Reuters",
    summary:
      "Gold bullion prices fluctuated as the US dollar firmed while markets look ahead to crucial CPI inflation prints and Fed speech.",
    category: "Commodities / Gold",
    isBreaking: true,
  },
  {
    id: "news-fallback-2",
    title: "US Treasury Yields Edge Higher as Traders Reprice Fed Rate Path - Reuters",
    link: "https://www.reuters.com",
    pubDate: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    source: "Reuters",
    summary:
      "Benchmark 10-year yields gained momentum following central bank commentary and resilient labor market signals.",
    category: "Fed / Rates",
    isBreaking: true,
  },
  {
    id: "news-fallback-3",
    title: "Gold hits one-week high, heads for weekly gain on safe-haven buying - FXStreet",
    link: "https://www.fxstreet.com",
    pubDate: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    source: "FXStreet",
    summary:
      "Spot Gold (XAU/USD) finds solid buyers near critical technical support as geopolitical uncertainties support precious metals.",
    category: "Commodities / Gold",
  },
];

function determineCategory(title: string, summary: string): NewsItem["category"] {
  const text = (title + " " + summary).toLowerCase();
  if (
    text.includes("gold") ||
    text.includes("xau") ||
    text.includes("bullion") ||
    text.includes("silver") ||
    text.includes("metal") ||
    text.includes("oil") ||
    text.includes("brent") ||
    text.includes("crude") ||
    text.includes("commodity")
  ) {
    return "Commodities / Gold";
  }
  if (
    text.includes("fed") ||
    text.includes("powell") ||
    text.includes("fomc") ||
    text.includes("yield") ||
    text.includes("rate") ||
    text.includes("ecb") ||
    text.includes("boe") ||
    text.includes("boj") ||
    text.includes("inflation") ||
    text.includes("cpi") ||
    text.includes("ppi")
  ) {
    return "Fed / Rates";
  }
  if (
    text.includes("usd") ||
    text.includes("eur") ||
    text.includes("gbp") ||
    text.includes("jpy") ||
    text.includes("forex") ||
    text.includes("currency") ||
    text.includes("dxy") ||
    text.includes("dollar")
  ) {
    return "Forex / FX";
  }
  return "Macro / Global";
}

function cleanHtmlSnippet(raw: string, title: string): string {
  if (!raw) return "";
  let text = raw;
  // Decode common HTML entities (repeating twice for doubly-encoded items)
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Strip all HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode again in case entities were inside tags
  text = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  // Clean whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Strip raw Google News or generic article URLs
  text = text.replace(/https?:\/\/news\.google\.com\S*/gi, "").trim();

  // If description is empty or too short, synthesize a clean summary
  if (!text || text.length < 15) {
    if (/gold|xau|bullion/i.test(title)) {
      return "Spot gold price action update covering US dollar dynamics, technical resistance, and institutional safe-haven sentiment.";
    }
    if (/fed|rate|yield|cpi|inflation/i.test(title)) {
      return "Central bank and macroeconomic report detailing interest rate path expectations, inflation data, and Treasury yield dynamics.";
    }
    return "Real-time institutional financial wire dispatch covering key global market catalysts, price action, and sentiment.";
  }

  if (text.length > 210) {
    text = text.substring(0, 207).trim() + "...";
  }
  return text;
}

function parseRssFeed(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 35) {
    const itemBlock = match[1];

    // Extract title
    const titleMatch = itemBlock.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    let title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1").trim() : "";
    title = title
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
    title = title.replace(/^investingLive\s*/i, "").replace(/^[a-z]+Live\s*:\s*/i, "").trim();

    // Extract link
    const linkMatch = itemBlock.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const link = linkMatch ? linkMatch[1].trim() : "#";

    // Extract pubDate
    const pubDateMatch = itemBlock.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const pubDateStr = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
    const pubTimestamp = new Date(pubDateStr).getTime();

    // Extract description
    const descMatch = itemBlock.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const rawDesc = descMatch ? descMatch[1] : "";
    const cleanDesc = cleanHtmlSnippet(rawDesc, title);

    // Detect exact source if from Google News aggregator
    let actualSource = sourceName;
    const sourceMatch = itemBlock.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    if (sourceMatch && sourceMatch[1]) {
      actualSource = sourceMatch[1].trim();
    } else if (title.includes(" - Reuters") || title.includes("Reuters")) {
      actualSource = "Reuters";
    }

    const isBreaking = !isNaN(pubTimestamp) && pubTimestamp > twoHoursAgo;

    if (title && title.length > 5) {
      const item: NewsItem = {
        id: `news-${Math.random().toString(36).substring(2, 9)}`,
        title,
        link,
        pubDate: !isNaN(pubTimestamp) ? new Date(pubTimestamp).toISOString() : new Date().toISOString(),
        source: actualSource,
        summary: cleanDesc,
        category: determineCategory(title, cleanDesc),
        isBreaking,
      };

      // Generate instant AI macro analysis
      item.analysis = analyzeNewsArticle(item.title, item.summary, item.source);
      items.push(item);
    }
  }

  return items;
}

async function fetchWithTimeout(url: string, sourceName: string, timeoutMs = 4500): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        Accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 120 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const text = await res.text();
    return parseRssFeed(text, sourceName);
  } catch (err) {
    return [];
  }
}

export async function GET() {
  const now = Date.now();

  if (cachedNews && now - lastNewsFetchTime < CACHE_TTL_MS) {
    return NextResponse.json({
      news: cachedNews,
      goldPulse: analyzeGoldMarketPulse(cachedNews),
      cached: true,
      lastUpdated: new Date(lastNewsFetchTime).toISOString(),
    });
  }

  try {
    // Parallel fetch from Reuters Gold, Reuters Macro, FXStreet, and ForexLive
    const reutersGoldUrl = `https://news.google.com/rss/search?q=${encodeURIComponent('Reuters Gold OR XAUUSD Reuters')}&hl=en-US&gl=US&ceid=US:en`;
    const reutersMacroUrl = `https://news.google.com/rss/search?q=${encodeURIComponent('source:Reuters when:1d (Fed OR Dollar OR Economy OR Inflation)')}&hl=en-US&gl=US&ceid=US:en`;
    const fxStreetUrl = "https://www.fxstreet.com/rss/news";
    const forexliveUrl = "https://www.forexlive.com/feed/news";

    const results = await Promise.allSettled([
      fetchWithTimeout(reutersGoldUrl, "Reuters", 4500),
      fetchWithTimeout(reutersMacroUrl, "Reuters", 4500),
      fetchWithTimeout(fxStreetUrl, "FXStreet", 4000),
      fetchWithTimeout(forexliveUrl, "ForexLive", 3500),
    ]);

    const combined: NewsItem[] = [];
    const seenTitles = new Set<string>();

    for (const r of results) {
      if (r.status === "fulfilled" && Array.isArray(r.value)) {
        for (const item of r.value) {
          // Normalise title to deduplicate
          const normTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 45);
          if (!seenTitles.has(normTitle)) {
            seenTitles.add(normTitle);
            combined.push(item);
          }
        }
      }
    }

    if (combined.length > 0) {
      // Sort newest first
      combined.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

      cachedNews = combined;
      lastNewsFetchTime = now;

      return NextResponse.json({
        news: combined,
        goldPulse: analyzeGoldMarketPulse(combined),
        cached: false,
        count: combined.length,
        lastUpdated: new Date(now).toISOString(),
      });
    }

    throw new Error("No news items retrieved from feeds");
  } catch (err: any) {
    console.warn("Market news multi-feed fetch failed, using fallback:", err.message);
    const fallbackWithAnalysis = FALLBACK_NEWS.map((item) => ({
      ...item,
      analysis: analyzeNewsArticle(item.title, item.summary, item.source),
    }));

    return NextResponse.json({
      news: cachedNews || fallbackWithAnalysis,
      goldPulse: analyzeGoldMarketPulse(cachedNews || fallbackWithAnalysis),
      cached: true,
      isFallback: !cachedNews,
      lastUpdated: new Date(now).toISOString(),
      error: err.message,
    });
  }
}
