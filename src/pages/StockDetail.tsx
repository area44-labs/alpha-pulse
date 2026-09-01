import { ArrowLeft, Target, ShieldAlert, Sparkles, Percent } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";

import type { Recommendation, RecommendationsPayload } from "./Dashboard";

interface StockDetailProps {
  symbol?: string;
  onBack?: () => void;
}

export function StockDetail({ symbol: propsSymbol, onBack }: StockDetailProps) {
  const [stock, setStock] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  const activeSymbol =
    propsSymbol || new URLSearchParams(window.location.search).get("symbol") || "FPT";

  useEffect(() => {
    async function loadStockData() {
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
            const payload: RecommendationsPayload = await res.json();
            if (payload && payload.recommendations) {
              const matched = payload.recommendations.find(
                (r) => r.symbol.toUpperCase() === activeSymbol.toUpperCase(),
              );
              if (matched) {
                setStock(matched);
                break;
              }
            }
          }
        } catch {
          // try next
        }
      }
      setLoading(false);
    }

    loadStockData();
  }, [activeSymbol]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-muted-foreground">
        Đang tải phân tích chi tiết cho mã {activeSymbol}...
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3 text-center">
        <p className="font-mono text-sm font-bold text-foreground">
          Không tìm thấy dữ liệu phân tích cho mã "{activeSymbol}"
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="flex cursor-pointer items-center gap-1 font-mono text-xs text-muted-foreground underline hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Dashboard
          </button>
        )}
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case "BUY":
        return <Badge variant="success">Khuyến Nghị MUA (BUY)</Badge>;
      case "WATCH":
        return <Badge variant="warning">Theo Dõi (WATCH)</Badge>;
      case "HOLD":
        return <Badge variant="outline">Nắm Giữ (HOLD)</Badge>;
      case "SELL":
        return <Badge variant="destructive">Khuyến Nghị BÁN (SELL)</Badge>;
      case "AVOID":
        return <Badge variant="destructive">Né Tránh (AVOID)</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatVnd = (val: number | null | undefined) => {
    if (val == null) return "—";
    return `${val.toLocaleString("vi-VN")} VNĐ`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-border bg-card text-muted-foreground hover:bg-accent"
              title="Quay lại Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-foreground">{stock.symbol}</h1>
              {getActionBadge(stock.action)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stock.company_name} • Sàn:{" "}
              <strong className="text-foreground">{stock.exchange}</strong> • Ngành:{" "}
              <strong className="text-foreground">{stock.sector}</strong>
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="block text-[10px] text-muted-foreground uppercase">Giá hiện tại</span>
          <span className="text-xl font-bold text-foreground">
            {formatVnd(stock.trade_plan.current_price)}
          </span>
        </div>
      </div>

      {/* Grid Overview Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Alpha Score */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Alpha Score
          </span>
          <span className="font-mono text-2xl font-extrabold text-foreground">
            {stock.alpha_score ?? "—"}{" "}
            <span className="text-xs font-normal text-subtle-foreground">/ 100</span>
          </span>
        </div>

        {/* Risk Adjusted Alpha */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Risk-Adjusted Alpha
          </span>
          <span className="font-mono text-2xl font-extrabold text-foreground">
            {stock.risk_adjusted_alpha ?? "—"}
          </span>
        </div>

        {/* Risk Level */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Phân Loại Rủi Ro
          </span>
          <span className="font-mono text-lg font-bold text-foreground uppercase">
            {stock.risk_level ?? "—"}
          </span>
        </div>
      </div>

      {/* Expected Returns Section */}
      <div className="space-y-3 rounded-sm border border-border bg-card p-4">
        <h3 className="flex items-center font-mono text-xs font-bold text-muted-foreground uppercase">
          <Percent className="mr-1.5 h-4 w-4" /> Lợi Nhuận Kỳ Vọng (Expected Return Model)
        </h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block font-mono text-[10px] text-muted-foreground">5 Ngày (5D)</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {stock.expected_return.expected_return_5d != null
                ? `${stock.expected_return.expected_return_5d}%`
                : "—"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block font-mono text-[10px] text-muted-foreground">10 Ngày (10D)</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {stock.expected_return.expected_return_10d != null
                ? `${stock.expected_return.expected_return_10d}%`
                : "—"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block font-mono text-[10px] text-muted-foreground">20 Ngày (20D)</span>
            <span className="font-mono text-sm font-bold text-foreground">
              {stock.expected_return.expected_return_20d != null
                ? `${stock.expected_return.expected_return_20d}%`
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* T+2.5 Risk Metrics Section */}
      <div className="space-y-3 rounded-sm border border-border bg-card p-4">
        <h3 className="flex items-center font-mono text-xs font-bold text-muted-foreground uppercase">
          <ShieldAlert className="mr-1.5 h-4 w-4 text-warning-icon" /> Chỉ Số Rủi Ro Đặc Thù Thị
          Trường Việt Nam (T+2.5 Horizon)
        </h3>
        <div className="grid grid-cols-2 gap-3 text-center font-mono text-xs sm:grid-cols-5">
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground">VaR 95% (T+2.5)</span>
            <span className="font-bold text-foreground">
              {stock.risk_metrics.var_t25 != null
                ? `${(stock.risk_metrics.var_t25 * 100).toFixed(1)}%`
                : "—"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground">Expected Shortfall</span>
            <span className="font-bold text-trend-down-text">
              {stock.risk_metrics.es_t25 != null
                ? `${(stock.risk_metrics.es_t25 * 100).toFixed(1)}%`
                : "—"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground">Biến Động 60D</span>
            <span className="font-bold text-foreground">
              {stock.risk_metrics.volatility_60d != null
                ? `${(stock.risk_metrics.volatility_60d * 100).toFixed(1)}%`
                : "—"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground">Max Drawdown</span>
            <span className="font-bold text-trend-down-text">
              {stock.risk_metrics.max_drawdown != null
                ? `${(stock.risk_metrics.max_drawdown * 100).toFixed(1)}%`
                : "—"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground">Điểm Thanh Khoản</span>
            <span className="font-bold text-foreground">
              {stock.risk_metrics.liquidity_score != null
                ? `${stock.risk_metrics.liquidity_score}`
                : "—"}{" "}
              <span className="text-[9px]">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {/* Trade Plan Section */}
      <div className="space-y-3 rounded-sm border border-border bg-card p-4">
        <h3 className="flex items-center font-mono text-xs font-bold text-muted-foreground uppercase">
          <Target className="mr-1.5 h-4 w-4" /> Kế Hoạch Giao Dịch (Trade Plan)
        </h3>
        <div className="grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-4">
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">Vùng Giá Mua</span>
            <span className="font-bold text-foreground">
              {stock.trade_plan.entry_low != null
                ? `${stock.trade_plan.entry_low.toLocaleString("vi-VN")} - ${stock.trade_plan.entry_high?.toLocaleString("vi-VN")} VNĐ`
                : "—"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Ngưỡng Dừng Lỗ (SL)
            </span>
            <span className="font-bold text-trend-down-text">
              {formatVnd(stock.trade_plan.stop_loss)}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Mục Tiêu 1 & 2 (TP)
            </span>
            <span className="font-bold text-trend-up-text">
              {stock.trade_plan.tp1 != null
                ? `${stock.trade_plan.tp1.toLocaleString("vi-VN")} / ${stock.trade_plan.tp2?.toLocaleString("vi-VN")} VNĐ`
                : "—"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Risk / Reward & Tỷ Trọng
            </span>
            <span className="font-bold text-foreground">
              R:R {stock.trade_plan.risk_reward != null ? `1:${stock.trade_plan.risk_reward}` : "—"}{" "}
              ({stock.trade_plan.position_percent ?? 0}% NAV)
            </span>
          </div>
        </div>
      </div>

      {/* Reasons & Warnings */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Reasons */}
        <div className="space-y-2 rounded-sm border border-border bg-card p-4">
          <h4 className="flex items-center font-mono text-xs font-bold text-trend-up-text uppercase">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Luận Điểm Khuyến Nghị
          </h4>
          <ul className="list-inside list-disc space-y-1 text-xs text-foreground">
            {stock.reasons.length === 0 ? (
              <li className="text-muted-foreground">Không có luận điểm đặc biệt.</li>
            ) : (
              stock.reasons.map((r, i) => <li key={i}>{r}</li>)
            )}
          </ul>
        </div>

        {/* Warnings */}
        <div className="space-y-2 rounded-sm border border-border bg-card p-4">
          <h4 className="flex items-center font-mono text-xs font-bold text-warning-text uppercase">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Cảnh Báo & Rủi Ro
          </h4>
          <ul className="list-inside list-disc space-y-1 text-xs text-foreground">
            {stock.warnings.length === 0 ? (
              <li className="text-muted-foreground">Không có cảnh báo rủi ro đặc biệt.</li>
            ) : (
              stock.warnings.map((w, i) => <li key={i}>{w}</li>)
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
