import { ArrowLeft, Target, Sparkles, ShieldAlert } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { getRecommendation, type Recommendation } from "@/lib/data";

interface StockDetailProps {
  symbol?: string;
  onBack?: () => void;
}

export function StockDetail({ symbol: propsSymbol, onBack }: StockDetailProps) {
  const activeSymbol =
    propsSymbol || new URLSearchParams(window.location.search).get("symbol") || "FPT";

  const [stock, setStock] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStock() {
      setLoading(true);
      const data = await getRecommendation(activeSymbol);
      setStock(data);
      setLoading(false);
    }
    loadStock();
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

  const getSignalBadge = (sig: string) => {
    switch (sig) {
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
        return <Badge variant="outline">{sig}</Badge>;
    }
  };

  const getRiskBadge = (risk: "LOW" | "MEDIUM" | "HIGH" | null) => {
    switch (risk) {
      case "LOW":
        return <Badge variant="success">Rủi ro Thấp</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Rủi ro Trung bình</Badge>;
      case "HIGH":
        return <Badge variant="destructive">Rủi ro Cao</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  const formatVnd = (val: number | null | undefined) => {
    if (val == null) return "—";
    return `${val.toLocaleString("vi-VN")} VNĐ`;
  };

  const isBuy = stock.signal === "BUY";
  const currentPriceVnd = stock.trade_plan.current_price ?? 0;
  const tp1Vnd = stock.trade_plan.tp1 ?? 0;
  const slVnd = stock.trade_plan.stop_loss ?? 0;

  const returnPct = currentPriceVnd > 0 ? ((tp1Vnd - currentPriceVnd) / currentPriceVnd) * 100 : 0;
  const lossPct = currentPriceVnd > 0 ? ((slVnd - currentPriceVnd) / currentPriceVnd) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
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
              {getSignalBadge(stock.signal)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stock.company_name} • Ngành:{" "}
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
        {/* Risk Level */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Mức Độ Rủi Ro
          </span>
          <div className="mt-1 flex justify-center">{getRiskBadge(stock.risk.risk_level)}</div>
        </div>

        {/* Risk Reward Ratio */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Tỷ Lệ Risk / Reward
          </span>
          <span className="font-mono text-2xl font-extrabold text-foreground">
            1:{stock.trade_plan.risk_reward ?? 1.5}
          </span>
        </div>

        {/* Alpha Score */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Alpha Score
          </span>
          <span className="font-mono text-2xl font-extrabold text-foreground">
            {stock.score ?? "—"} / 100
          </span>
        </div>
      </div>

      {/* Trade Plan & Settlement */}
      <div className="space-y-3 rounded-sm border border-border bg-card p-4">
        <h3 className="flex items-center font-mono text-xs font-bold text-muted-foreground uppercase">
          <Target className="mr-1.5 h-4 w-4" /> Kế Hoạch Giao Dịch (
          {stock.trade_plan.settlement_model})
        </h3>
        <div className="grid grid-cols-1 gap-3 font-mono text-xs sm:grid-cols-3">
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Vùng Giá Khuyến Nghị
            </span>
            <span className="font-bold text-foreground">
              {isBuy && stock.trade_plan.entry_low != null
                ? `${stock.trade_plan.entry_low.toLocaleString("vi-VN")} - ${stock.trade_plan.entry_high?.toLocaleString("vi-VN")} VNĐ`
                : "Khuyên Bán / Tránh"}
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Mục Tiêu Chốt Lời (TP1)
            </span>
            <span className="font-bold text-trend-up-text">
              {formatVnd(stock.trade_plan.tp1)} ({returnPct >= 0 ? "+" : ""}
              {returnPct.toFixed(1)}%)
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Ngưỡng Cắt Lỗ (SL)
            </span>
            <span className="font-bold text-trend-down-text">
              {formatVnd(stock.trade_plan.stop_loss)} ({lossPct.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Technical Reasons */}
      <div className="space-y-3 rounded-sm border border-border bg-card p-4">
        <h4 className="flex items-center font-mono text-xs font-bold text-trend-up-text uppercase">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Lý Do Kỹ Thuật Khuyến Nghị
        </h4>
        <ul className="list-disc space-y-1 pl-4 text-xs text-foreground">
          {stock.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>

      {/* Warnings */}
      {stock.warnings.length > 0 && (
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <h4 className="flex items-center font-mono text-xs font-bold text-trend-down-text uppercase">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Cảnh Báo Rủi Ro
          </h4>
          <ul className="list-disc space-y-1 pl-4 text-xs text-foreground">
            {stock.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
