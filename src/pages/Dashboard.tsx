import { Sparkles, ArrowDownRight, Eye, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";

export interface RiskMetrics {
  var_t25: number | null;
  es_t25: number | null;
  volatility_60d: number | null;
  max_drawdown: number | null;
  liquidity_score: number | null;
}

export interface ExpectedReturn {
  expected_return_5d: number | null;
  expected_return_10d: number | null;
  expected_return_20d: number | null;
}

export interface TradePlan {
  current_price: number | null;
  entry_low: number | null;
  entry_high: number | null;
  stop_loss: number | null;
  tp1: number | null;
  tp2: number | null;
  risk_reward: number | string | null;
  position_percent: number | null;
}

export interface Recommendation {
  symbol: string;
  company_name: string;
  exchange: "HOSE" | "HNX" | "UPCOM";
  sector: string;
  action: "BUY" | "WATCH" | "HOLD" | "SELL" | "AVOID";
  alpha_score: number | null;
  risk_adjusted_alpha: number | null;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | null;
  expected_return: ExpectedReturn;
  risk_metrics: RiskMetrics;
  trade_plan: TradePlan;
  reasons: string[];
  warnings: string[];
  divergence?: Record<string, "BULLISH" | "BEARISH" | "NONE"> | null;
}

export interface MarketData {
  regime: "STRONG_BULL" | "BULL" | "DEFENSIVE" | "BEAR" | "PANIC";
  confidence: number | null;
  regime_score?: number | null;
  metrics: {
    vnindex_value: number | null;
    vnindex_change_pct: number | null;
    vn30_change_pct: number | null;
    market_breadth_ratio: number | null;
    volatility: number | null;
    volume_20d_ratio: number | null;
  };
}

export interface RecommendationsPayload {
  schema_version: string;
  generated_at: string;
  source_date: string;
  market: MarketData;
  summary: {
    total_scanned: number;
    buy_count: number;
    watch_count: number;
    hold_count: number;
    sell_count: number;
    avoid_count: number;
  };
  recommendations: Recommendation[];
}

interface DashboardProps {
  onSelectStock: (symbol: string) => void;
}

export function Dashboard({ onSelectStock }: DashboardProps) {
  const [data, setData] = useState<RecommendationsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"BUY" | "WATCH" | "SELL">("BUY");

  useEffect(() => {
    async function fetchData() {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const ts = Date.now();
      const paths = [
        `${baseUrl}generated/recommendations.json?t=${ts}`,
        `/generated/recommendations.json?t=${ts}`,
        `generated/recommendations.json?t=${ts}`,
      ];

      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const json = await res.json();
            if (json && json.recommendations) {
              setData(json);
              break;
            }
          }
        } catch {
          // try next path
        }
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-muted-foreground">
        Đang tải dữ liệu phân tích thị trường v2...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-2 text-center">
        <p className="font-mono text-sm font-bold text-foreground">Chưa có dữ liệu báo cáo v2</p>
        <p className="text-xs text-muted-foreground">
          Vui lòng chạy `python scripts/generate_report.py` để tạo báo cáo JSON.
        </p>
      </div>
    );
  }

  const { market, summary, recommendations } = data;

  const buyList = recommendations.filter((r) => r.action === "BUY");
  const watchList = recommendations.filter((r) => r.action === "WATCH");
  const sellList = recommendations.filter((r) => r.action === "SELL" || r.action === "AVOID");

  const topBuys = buyList.slice(0, 5);
  const topWatch = watchList.slice(0, 5);
  const topSells = sellList.slice(0, 5);

  const activeList = activeTab === "BUY" ? buyList : activeTab === "WATCH" ? watchList : sellList;

  const getRegimeBadge = (regime: string) => {
    switch (regime) {
      case "STRONG_BULL":
      case "BULL":
        return <Badge variant="success">Thị Trường Tăng ({regime})</Badge>;
      case "DEFENSIVE":
        return <Badge variant="warning">Phòng Thủ ({regime})</Badge>;
      case "BEAR":
      case "PANIC":
        return <Badge variant="destructive">Rủi Ro Cao ({regime})</Badge>;
      default:
        return <Badge variant="outline">{regime}</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "BUY":
        return <Badge variant="success">BUY</Badge>;
      case "WATCH":
        return <Badge variant="warning">WATCH</Badge>;
      case "HOLD":
        return <Badge variant="outline">HOLD</Badge>;
      case "SELL":
        return <Badge variant="destructive">SELL</Badge>;
      case "AVOID":
        return <Badge variant="destructive">AVOID</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Market Regime Summary Banner */}
      <section className="space-y-4 rounded-sm border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Thị Trường Chứng Khoán Việt Nam
              </h2>
              {getRegimeBadge(market.regime)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              VN-Index:{" "}
              <strong className="text-foreground">{market.metrics.vnindex_value ?? "—"}</strong> (
              {market.metrics.vnindex_change_pct != null
                ? `${market.metrics.vnindex_change_pct >= 0 ? "+" : ""}${market.metrics.vnindex_change_pct}%`
                : "—"}
              )
              {market.regime_score != null && (
                <span className="ml-3 font-mono text-xs">
                  Điểm trạng thái: <strong>{market.regime_score}/100</strong>
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-sm border border-border bg-background px-3 py-1.5 text-center">
              <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                Mã MUA
              </span>
              <span className="font-mono text-sm font-bold text-trend-up-text">
                {summary.buy_count}
              </span>
            </div>
            <div className="rounded-sm border border-border bg-background px-3 py-1.5 text-center">
              <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                Theo Dõi
              </span>
              <span className="font-mono text-sm font-bold text-warning-text">
                {summary.watch_count}
              </span>
            </div>
            <div className="rounded-sm border border-border bg-background px-3 py-1.5 text-center">
              <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                Khuyên Bán
              </span>
              <span className="font-mono text-sm font-bold text-trend-down-text">
                {summary.sell_count + summary.avoid_count}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Top Section Highlight Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Top BUY */}
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="flex items-center font-mono text-xs font-bold text-trend-up-text uppercase">
              <Sparkles className="mr-1.5 h-4 w-4" /> Top Tín Hiệu Mua ({topBuys.length})
            </h3>
          </div>
          {topBuys.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Không có mã BUY thỏa mãn bộ lọc rủi ro.
            </p>
          ) : (
            <div className="space-y-2">
              {topBuys.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => onSelectStock(r.symbol)}
                  aria-label={`Xem chi tiết ${r.symbol}`}
                  className="flex w-full cursor-pointer items-center justify-between rounded-sm border border-border p-2 text-left hover:bg-accent/40"
                >
                  <div>
                    <span className="font-bold text-foreground">{r.symbol}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{r.sector}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {r.trade_plan.current_price != null ? `${r.trade_plan.current_price}k` : "—"}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-trend-up-text">
                      Score {r.alpha_score ?? "—"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top WATCH */}
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="flex items-center font-mono text-xs font-bold text-warning-text uppercase">
              <Eye className="mr-1.5 h-4 w-4" /> Danh Sách Theo Dõi ({topWatch.length})
            </h3>
          </div>
          {topWatch.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Không có mã trong danh sách WATCH.
            </p>
          ) : (
            <div className="space-y-2">
              {topWatch.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => onSelectStock(r.symbol)}
                  aria-label={`Xem chi tiết ${r.symbol}`}
                  className="flex w-full cursor-pointer items-center justify-between rounded-sm border border-border p-2 text-left hover:bg-accent/40"
                >
                  <div>
                    <span className="font-bold text-foreground">{r.symbol}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{r.sector}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {r.trade_plan.current_price != null ? `${r.trade_plan.current_price}k` : "—"}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-warning-text">
                      Score {r.alpha_score ?? "—"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top SELL / AVOID */}
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="flex items-center font-mono text-xs font-bold text-trend-down-text uppercase">
              <ArrowDownRight className="mr-1.5 h-4 w-4" /> Cảnh Báo Bán / Né Tránh (
              {topSells.length})
            </h3>
          </div>
          {topSells.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Không có mã bán hoặc né tránh.
            </p>
          ) : (
            <div className="space-y-2">
              {topSells.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => onSelectStock(r.symbol)}
                  aria-label={`Xem chi tiết ${r.symbol}`}
                  className="flex w-full cursor-pointer items-center justify-between rounded-sm border border-border p-2 text-left hover:bg-accent/40"
                >
                  <div>
                    <span className="font-bold text-foreground">{r.symbol}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{r.sector}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {r.trade_plan.current_price != null ? `${r.trade_plan.current_price}k` : "—"}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-trend-down-text">
                      {r.action}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Recommendations Table Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-foreground" />
            <h2 className="font-mono text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Danh Sách Báo Cáo Khuyến Nghị Giao Dịch
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("BUY")}
              className={`cursor-pointer rounded-sm px-3 py-1 font-mono text-xs font-bold transition-colors ${
                activeTab === "BUY"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              MUA ({buyList.length})
            </button>
            <button
              onClick={() => setActiveTab("WATCH")}
              className={`cursor-pointer rounded-sm px-3 py-1 font-mono text-xs font-bold transition-colors ${
                activeTab === "WATCH"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Theo Dõi ({watchList.length})
            </button>
            <button
              onClick={() => setActiveTab("SELL")}
              className={`cursor-pointer rounded-sm px-3 py-1 font-mono text-xs font-bold transition-colors ${
                activeTab === "SELL"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              Bán ({sellList.length})
            </button>
          </div>
        </div>

        {/* Table rendering */}
        <div className="overflow-x-auto rounded-sm border border-border bg-card">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[10px] text-muted-foreground uppercase">
                <th className="p-3">Mã CP & Ngành</th>
                <th className="p-3 text-center">Hành động</th>
                <th className="p-3 text-right">Alpha Score</th>
                <th className="p-3 text-right">Giá hiện tại</th>
                <th className="p-3 text-center">Rủi ro T+2.5 (ES)</th>
                <th className="p-3 text-center">Vùng mua / TP / SL</th>
                <th className="p-3">Lý do & Cảnh báo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {activeList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center font-mono text-xs text-muted-foreground"
                  >
                    Không có mã khuyến nghị nào thuộc danh mục này.
                  </td>
                </tr>
              ) : (
                activeList.map((rec) => (
                  <tr
                    key={rec.symbol}
                    onClick={() => onSelectStock(rec.symbol)}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <td className="p-3">
                      <div className="font-bold text-foreground">{rec.symbol}</div>
                      <div className="text-[10px] text-muted-foreground">{rec.company_name}</div>
                      <div className="font-mono text-[9px] text-subtle-foreground">
                        {rec.exchange} • {rec.sector}
                      </div>
                    </td>
                    <td className="p-3 text-center">{getActionBadge(rec.action)}</td>
                    <td className="p-3 text-right font-mono font-bold tabular-nums">
                      {rec.alpha_score ?? "—"}
                    </td>
                    <td className="p-3 text-right font-bold tabular-nums">
                      {rec.trade_plan.current_price != null
                        ? `${rec.trade_plan.current_price}k`
                        : "—"}
                    </td>
                    <td className="p-3 text-center font-mono text-[11px]">
                      <div>
                        VaR:{" "}
                        {rec.risk_metrics.var_t25 != null
                          ? `${(rec.risk_metrics.var_t25 * 100).toFixed(1)}%`
                          : "—"}
                      </div>
                      <div className="text-[10px] text-trend-down-text">
                        ES:{" "}
                        {rec.risk_metrics.es_t25 != null
                          ? `${(rec.risk_metrics.es_t25 * 100).toFixed(1)}%`
                          : "—"}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono text-[11px] tabular-nums">
                      <div>
                        Mua:{" "}
                        {rec.trade_plan.entry_low != null
                          ? `${rec.trade_plan.entry_low} - ${rec.trade_plan.entry_high}k`
                          : "—"}
                      </div>
                      <div className="text-trend-up-text">
                        TP1: {rec.trade_plan.tp1 != null ? `${rec.trade_plan.tp1}k` : "—"}
                      </div>
                      <div className="text-trend-down-text">
                        SL:{" "}
                        {rec.trade_plan.stop_loss != null ? `${rec.trade_plan.stop_loss}k` : "—"}
                      </div>
                    </td>
                    <td className="max-w-xs space-y-1 p-3 text-xs">
                      {rec.reasons.length > 0 && (
                        <p className="line-clamp-2 text-muted-foreground">• {rec.reasons[0]}</p>
                      )}
                      {rec.warnings.length > 0 && (
                        <p className="line-clamp-1 flex items-center gap-1 text-[11px] text-warning-text">
                          <AlertTriangle className="h-3 w-3 shrink-0" />
                          {rec.warnings[0]}
                        </p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
