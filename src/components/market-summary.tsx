import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

import type { MarketContext } from "@/lib/data";

import { Card, CardContent } from "@/components/ui/card";

interface MarketSummaryProps {
  marketContext: MarketContext;
  marketDate: string;
  buyCount: number;
  sellCount: number;
}

export function MarketSummary({
  marketContext,
  marketDate,
  buyCount,
  sellCount,
}: MarketSummaryProps) {
  const { regime, regime_score, confidence, metrics } = marketContext;
  const vnValue = metrics.vnindex_value ?? 0;
  const vnChange = metrics.vnindex_change_pct ?? 0;
  const isPositive = vnChange >= 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="h-1.5 w-1.5 bg-foreground" />
        <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          Tổng Quan Thị Trường VN ({marketDate})
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Market Regime */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="block font-mono text-[10px] text-muted-foreground uppercase">
              Trạng Thái Thị Trường
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-base font-extrabold text-foreground">{regime}</span>
              <span className="rounded-sm border border-border px-2 py-0.5 font-mono text-xs font-bold text-muted-foreground">
                Điểm: {regime_score ?? "—"}
              </span>
            </div>
            <span className="mt-1 block text-[10px] text-muted-foreground">
              Độ tin cậy: {confidence ? `${(confidence * 100).toFixed(0)}%` : "—"}
            </span>
          </CardContent>
        </Card>

        {/* VN-Index Benchmark */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="block font-mono text-[10px] text-muted-foreground uppercase">
              VN-Index Benchmark
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold text-foreground">
                {vnValue.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`inline-flex items-center font-mono text-xs font-bold ${
                  isPositive ? "text-trend-up-text" : "text-trend-down-text"
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="mr-0.5 h-3 w-3" />
                ) : (
                  <ArrowDownRight className="mr-0.5 h-3 w-3" />
                )}
                {isPositive ? "+" : ""}
                {vnChange.toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Market Breadth */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="block font-mono text-[10px] text-muted-foreground uppercase">
              Độ Rộng Thị Trường (MA20)
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-lg font-bold text-foreground">
                {metrics.market_breadth_ratio != null
                  ? `${(metrics.market_breadth_ratio * 100).toFixed(0)}%`
                  : "—"}
              </span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Total Recommendations Summary */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <span className="block font-mono text-[10px] text-muted-foreground uppercase">
              Tín Hiệu Khuyến Nghị
            </span>
            <div className="mt-2 flex items-center space-x-3 font-mono text-xs font-bold">
              <span className="text-trend-up-text">MUA: {buyCount}</span>
              <span className="text-trend-down-text">BÁN: {sellCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
