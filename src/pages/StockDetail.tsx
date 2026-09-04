import { ArrowLeft, Target, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import stocksDataRaw from "@/data/stocks.json";

import type { StockRecommendation, StocksDataPayload } from "./Dashboard";

interface StockDetailProps {
  symbol?: string;
  onBack?: () => void;
}

export function StockDetail({ symbol: propsSymbol, onBack }: StockDetailProps) {
  const activeSymbol =
    propsSymbol || new URLSearchParams(window.location.search).get("symbol") || "FPT";

  const [stock, setStock] = useState<StockRecommendation | null>(() => {
    const payload = stocksDataRaw as unknown as StocksDataPayload;
    return (
      payload.recommendations.find((r) => r.symbol.toUpperCase() === activeSymbol.toUpperCase()) ||
      null
    );
  });

  useEffect(() => {
    async function loadRealtimeStockData() {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const ts = Date.now();
      const paths = [
        `${baseUrl}src/data/stocks.json?t=${ts}`,
        `/src/data/stocks.json?t=${ts}`,
        `data/stocks.json?t=${ts}`,
      ];

      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const payload: StocksDataPayload = await res.json();
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
    }

    loadRealtimeStockData();
  }, [activeSymbol]);

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

  const getActionBadge = (type: string) => {
    switch (type) {
      case "BUY":
        return <Badge variant="success">Khuyến Nghị MUA (BUY)</Badge>;
      case "WATCH":
        return <Badge variant="warning">Theo Dõi (WATCH)</Badge>;
      case "HOLD":
        return <Badge variant="outline">Nắm Giữ (HOLD)</Badge>;
      case "SELL":
        return <Badge variant="destructive">Khuyến Nghị BÁN (SELL)</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getRiskBadge = (risk: "LOW" | "MEDIUM" | "HIGH") => {
    switch (risk) {
      case "LOW":
        return <Badge variant="success">Rủi ro Thấp</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Rủi ro Trung bình</Badge>;
      case "HIGH":
        return <Badge variant="destructive">Rủi ro Cao</Badge>;
    }
  };

  const formatVnd = (val: number | null | undefined) => {
    if (val == null) return "—";
    const vndVal = val < 1000 ? val * 1000 : val;
    return `${vndVal.toLocaleString("vi-VN")} VNĐ`;
  };

  const isBuy = stock.type === "BUY";
  const currentPriceVnd =
    stock.currentPrice < 1000 ? stock.currentPrice * 1000 : stock.currentPrice;
  const targetSellPriceVnd =
    stock.targetSellPrice < 1000 ? stock.targetSellPrice * 1000 : stock.targetSellPrice;
  const stopLossPriceVnd =
    stock.stopLossPrice < 1000 ? stock.stopLossPrice * 1000 : stock.stopLossPrice;

  const returnPct = ((targetSellPriceVnd - currentPriceVnd) / currentPriceVnd) * 100;
  const lossPct = ((stopLossPriceVnd - currentPriceVnd) / currentPriceVnd) * 100;

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
              {getActionBadge(stock.type)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stock.companyName} • Ngành:{" "}
              <strong className="text-foreground">{stock.sector}</strong>
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="block text-[10px] text-muted-foreground uppercase">Giá hiện tại</span>
          <span className="text-xl font-bold text-foreground">{formatVnd(stock.currentPrice)}</span>
        </div>
      </div>

      {/* Grid Overview Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Risk Level */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Mức Độ Rủi Ro
          </span>
          <div className="mt-1 flex justify-center">{getRiskBadge(stock.riskLevel)}</div>
        </div>

        {/* Risk Reward Ratio */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Tỷ Lệ Risk / Reward
          </span>
          <span className="font-mono text-2xl font-extrabold text-foreground">
            {stock.riskRewardRatio || "1:1.5"}
          </span>
        </div>

        {/* Action Zone */}
        <div className="space-y-1 rounded-sm border border-border bg-card p-4 text-center">
          <span className="block font-mono text-[10px] text-muted-foreground uppercase">
            Vùng Giá Mua Khuyến Nghị
          </span>
          <span className="font-mono text-lg font-bold text-foreground">
            {isBuy ? `${stock.targetBuyPrice}đ` : "Không khuyến nghị"}
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
              Mục Tiêu Chốt Lời (TP)
            </span>
            <span className="font-bold text-trend-up-text">
              {formatVnd(stock.targetSellPrice)} ({returnPct >= 0 ? "+" : ""}
              {returnPct.toFixed(1)}%)
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Ngưỡng Dừng Lỗ (SL)
            </span>
            <span className="font-bold text-trend-down-text">
              {formatVnd(stock.stopLossPrice)} ({lossPct.toFixed(1)}%)
            </span>
          </div>
          <div className="rounded-sm border border-border bg-background p-3">
            <span className="block text-[10px] text-muted-foreground uppercase">
              Vùng Giá Khuyến Nghị
            </span>
            <span className="font-bold text-foreground">
              {isBuy ? stock.targetBuyPrice : "Không khuyến nghị"}
            </span>
          </div>
        </div>
      </div>

      {/* Rationale Section */}
      <div className="space-y-3 rounded-sm border border-border bg-card p-4">
        <h4 className="flex items-center font-mono text-xs font-bold text-trend-up-text uppercase">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Lý Do Khuyến Nghị Chi Tiết
        </h4>
        <p className="text-xs leading-relaxed text-foreground">{stock.rationale}</p>
      </div>
    </div>
  );
}
