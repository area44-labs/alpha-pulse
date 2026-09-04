/* Data Contract Types (matching Schema v3.0) */

export interface DataQuality {
  status: "REAL" | "CACHE" | "SYNTHETIC";
  source: string;
  market_date: string;
  is_stale: boolean;
}

export interface UniverseInfo {
  universe_type: string;
  universe_size: number;
  version?: number;
}

export interface MarketMetrics {
  vnindex_value: number | null;
  vnindex_change_pct: number | null;
  vn30_change_pct?: number | null;
  market_breadth_ratio?: number | null;
  volatility?: number | null;
  volume_20d_ratio?: number | null;
}

export interface MarketContext {
  regime: "STRONG_BULL" | "BULL" | "DEFENSIVE" | "BEAR" | "PANIC";
  regime_score?: number | null;
  confidence: number | null;
  metrics: MarketMetrics;
}

export interface ReportSummary {
  total_scanned: number;
  buy_count: number;
  watch_count: number;
  hold_count: number;
  sell_count: number;
  avoid_count: number;
}

export interface TradePlan {
  signal_date: string;
  execution_date: string;
  settlement_date: string;
  settlement_model: "T+2.5";
  current_price: number | null;
  entry_low: number | null;
  entry_high: number | null;
  stop_loss: number | null;
  tp1: number | null;
  tp2: number | null;
  risk_reward: number | null;
  position_percent: number | null;
}

export interface StockRisk {
  risk_level: "LOW" | "MEDIUM" | "HIGH" | null;
  var_t25: number | null;
  es_t25: number | null;
  volatility_60d: number | null;
  max_drawdown: number | null;
  liquidity_score: number | null;
  avg_value_20d?: number | null;
}

export interface DivergenceStatus {
  [key: string]: "BULLISH" | "BEARISH" | "NONE";
}

export interface Recommendation {
  symbol: string;
  company_name: string;
  exchange: "HOSE" | "HNX" | "UPCOM";
  sector: string;
  signal: "BUY" | "WATCH" | "HOLD" | "SELL" | "AVOID";
  score: number | null;
  confidence: number | null;
  market_regime: "STRONG_BULL" | "BULL" | "DEFENSIVE" | "BEAR" | "PANIC";
  risk: StockRisk;
  trade_plan: TradePlan;
  data_quality: DataQuality;
  reasons: string[];
  warnings: string[];
  divergence?: DivergenceStatus | null;
}

export interface RecommendationsReport {
  schema_version: "3.0";
  market: "VN";
  market_date: string;
  generated_at: string;
  data_quality: DataQuality;
  universe_info?: UniverseInfo;
  market_context: MarketContext;
  summary: ReportSummary;
  recommendations: Recommendation[];
}

export interface MarketReport {
  market: "VN";
  market_date: string;
  generated_at: string;
  data_quality: DataQuality;
  universe_info?: UniverseInfo;
  market_context: MarketContext;
  summary: ReportSummary;
}

export interface HistoryIndex {
  last_updated: string;
  total_reports: number;
  dates: string[];
}
