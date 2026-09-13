import type {
  HistoryIndexPayload,
  MarketPayload,
  Recommendation,
  RecommendationsPayload,
} from "@/types/recommendation";

function getBaseUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  return base.endsWith("/") ? base : `${base}/`;
}

/**
 * Fetches canonical recommendations JSON artifact.
 */
export async function loadRecommendations(): Promise<RecommendationsPayload | null> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}generated/recommendations.json`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data: RecommendationsPayload = await res.json();
      if (data && data.recommendations) {
        return data;
      }
    }
  } catch (err) {
    console.error("Failed to load recommendations artifact:", err);
  }
  return null;
}

/**
 * Fetches canonical market summary JSON artifact.
 */
export async function loadMarket(): Promise<MarketPayload | null> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}generated/market.json`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data: MarketPayload = await res.json();
      if (data && data.market) {
        return data;
      }
    }
  } catch (err) {
    console.error("Failed to load market artifact:", err);
  }
  return null;
}

/**
 * Fetches history index JSON artifact.
 */
export async function loadHistoryIndex(): Promise<HistoryIndexPayload | null> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}generated/history/index.json`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data: HistoryIndexPayload = await res.json();
      if (data && data.dates) {
        return data;
      }
    }
  } catch (err) {
    console.error("Failed to load history index artifact:", err);
  }
  return null;
}

/**
 * Fetches historical recommendation report JSON artifact for a given date (YYYY-MM-DD).
 */
export async function loadHistoryReport(date: string): Promise<RecommendationsPayload | null> {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}generated/history/${date}.json`;

  try {
    const res = await fetch(url);
    if (res.ok) {
      const data: RecommendationsPayload = await res.json();
      if (data && data.recommendations) {
        return data;
      }
    }
  } catch (err) {
    console.error(`Failed to load historical report for ${date}:`, err);
  }
  return null;
}

/**
 * Finds a single stock recommendation by symbol from canonical recommendations.
 */
export async function loadStock(symbol: string): Promise<Recommendation | null> {
  if (!symbol) return null;
  const payload = await loadRecommendations();
  if (!payload || !payload.recommendations) return null;

  const target = symbol.toUpperCase();
  return payload.recommendations.find((r) => r.symbol.toUpperCase() === target) || null;
}
