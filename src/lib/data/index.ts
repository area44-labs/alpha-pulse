import type { HistoryIndex, MarketReport, Recommendation, RecommendationsReport } from "./types";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return import.meta.env.BASE_URL || "/";
  }
  return "/";
}

export async function getRecommendations(): Promise<RecommendationsReport | null> {
  const baseUrl = getBaseUrl();
  const ts = Date.now();
  const paths = [
    `${baseUrl}generated/recommendations.json?t=${ts}`,
    `/generated/recommendations.json?t=${ts}`,
    `generated/recommendations.json?t=${ts}`,
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = (await res.json()) as RecommendationsReport;
        if (data && data.recommendations) {
          return data;
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

export async function getMarket(): Promise<MarketReport | null> {
  const baseUrl = getBaseUrl();
  const ts = Date.now();
  const paths = [
    `${baseUrl}generated/market.json?t=${ts}`,
    `/generated/market.json?t=${ts}`,
    `generated/market.json?t=${ts}`,
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = (await res.json()) as MarketReport;
        if (data && data.market_context) {
          return data;
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

export async function getRecommendation(symbol: string): Promise<Recommendation | null> {
  const report = await getRecommendations();
  if (!report) return null;
  const target = symbol.toUpperCase();
  return report.recommendations.find((r) => r.symbol.toUpperCase() === target) || null;
}

export async function getHistoryIndex(): Promise<HistoryIndex | null> {
  const baseUrl = getBaseUrl();
  const ts = Date.now();
  const paths = [
    `${baseUrl}generated/history/index.json?t=${ts}`,
    `/generated/history/index.json?t=${ts}`,
    `generated/history/index.json?t=${ts}`,
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = (await res.json()) as HistoryIndex;
        if (data && data.dates) {
          return data;
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

export async function getHistoryReport(date: string): Promise<RecommendationsReport | null> {
  const baseUrl = getBaseUrl();
  const ts = Date.now();
  const paths = [
    `${baseUrl}generated/history/${date}.json?t=${ts}`,
    `/generated/history/${date}.json?t=${ts}`,
    `generated/history/${date}.json?t=${ts}`,
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = (await res.json()) as RecommendationsReport;
        if (data && data.recommendations) {
          return data;
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

export * from "./types";
