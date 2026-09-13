import { Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Target } from "lucide-react";
import { useEffect, useState } from "react";

import type { Recommendation } from "@/types/recommendation";

import { Badge } from "@/components/ui/badge";
import { loadStock } from "@/data/loader";
import { formatPercent, formatRisk, formatScore, formatVnd } from "@/lib/format";

interface StockDetailProps {
  symbol?: string;
}

export function StockDetail({ symbol: propsSymbol }: StockDetailProps) {
  const activeSymbol = propsSymbol || "FPT";
  const [stock, setStock] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStock() {
      setLoading(true);
      const rec = await loadStock(activeSymbol);
      if (rec) {
        setStock(rec);
      }
      setLoading(false);
    }
    fetchStock();
  }, [activeSymbol]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-muted-foreground">
        Đang tải phân tích cổ phiếu {activeSymbol}...
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3 text-center">
        <p className="font-mono text-sm font-bold text-foreground">
          Không tìm thấy dữ liệu phân tích cho mã "{activeSymbol}"
        </p>
        <Link
          to="/"
          className="flex cursor-pointer items-center gap-1 font-mono text-xs text-muted-foreground underline hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Dashboard
        </Link>
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
        return <Badge variant="destructive">Tránh Giao Dịch (AVOID)</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const isBuy = stock.action === "BUY" || stock.action === "WATCH";

  const curPrice = stock.trade_plan.current_price;
  const tp1 = stock.trade_plan.tp1;
  const sl = stock.trade_plan.stop_loss;

  const returnPct = curPrice && tp1 ? ((tp1 - curPrice) / curPrice) * 100 : null;
  const lossPct = curPrice && sl ? ((sl - curPrice) / curPrice) * 100 : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-border bg-card text-muted-foreground hover:bg-accent"
            title="Quay lại Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Alpha Score */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Alpha Score
          </span>
          <span className="font-mono text-2xl font-extrabold text-foreground">
            {formatScore(stock.alpha_score)}
          </span>
        </div>

        {/* Risk Level */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Mức Độ Rủi Ro
          </span>
          <span className="font-mono text-sm font-bold text-foreground">
            {formatRisk(stock.risk_level)}
          </span>
        </div>

        {/* Risk Reward Ratio */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Tỷ Lệ Risk / Reward
          </span>
          <span className="font-mono text-2xl font-extrabold text-foreground">
            {stock.trade_plan.risk_reward ? `1:${stock.trade_plan.risk_reward}` : "—"}
          </span>
        </div>

        {/* Action Zone */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Vùng Giá Mua Khuyến Nghị
          </span>
          <span className="font-mono text-sm font-bold text-foreground">
            {isBuy && stock.trade_plan.entry_low != null
              ? `${formatVnd(stock.trade_plan.entry_low)} - ${formatVnd(stock.trade_plan.entry_high)}`
              : "Không khuyến nghị"}
          </span>
        </div>
      </div>

      {/* Expected Return & Trade Plan */}
      <div className="space-y-3 rounded-sm border border-border bg-card p-4">
        <h3 className="flex items-center font-mono text-xs font-bold text-muted-foreground uppercase">
          <Target className="mr-1.5 h-4 w-4" /> Kế Hoạch Giao Dịch & Mục Tiêu Price
        </h3>
        <div className="grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-3">
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Mục Tiêu Chốt Lời (TP1)
            </span>
            <span className="font-bold text-trend-up-text">
              {formatVnd(stock.trade_plan.tp1)} ({formatPercent(returnPct)})
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Ngưỡng Dừng Lỗ (SL)
            </span>
            <span className="font-bold text-trend-down-text">
              {formatVnd(stock.trade_plan.stop_loss)} ({formatPercent(lossPct)})
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Tỷ Trọng Khuyến Nghị
            </span>
            <span className="font-bold text-foreground">
              {stock.trade_plan.position_percent != null
                ? `${stock.trade_plan.position_percent}% tài khoản`
                : "0%"}
            </span>
          </div>
        </div>
      </div>

      {/* Reasons & Warnings Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <h4 className="flex items-center font-mono text-xs font-bold text-trend-up-text uppercase">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Lý Do Khuyến Nghị
          </h4>
          {stock.reasons && stock.reasons.length > 0 ? (
            <ul className="list-disc space-y-1.5 pl-4 text-xs text-foreground">
              {stock.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Không có lý do cụ thể.</p>
          )}
        </div>

        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <h4 className="flex items-center font-mono text-xs font-bold text-trend-down-text uppercase">
            Cảnh Báo Rủi Ro
          </h4>
          {stock.warnings && stock.warnings.length > 0 ? (
            <ul className="list-disc space-y-1.5 pl-4 text-xs text-foreground">
              {stock.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Không có cảnh báo đặc biệt.</p>
          )}
        </div>
      </div>
    </div>
  );
}
