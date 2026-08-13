import { ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface IndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  volume: string;
}

interface MarketSummaryProps {
  marketData: {
    vnIndex: IndexData;
    hoseIndex: IndexData;
    hnxIndex: IndexData;
    upcomIndex: IndexData;
  };
  buyCount: number;
  sellCount: number;
}

export function MarketSummary({
  marketData,
  buyCount: _buyCount,
  sellCount: _sellCount,
}: MarketSummaryProps) {
  const renderIndexCard = (data: IndexData) => {
    const isPositive = data.change >= 0;
    return (
      <Card
        key={data.name}
        className="overflow-hidden border-border bg-background transition-colors"
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              {data.name}
            </span>
            <span
              className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] tracking-tight ${
                isPositive
                  ? "border border-trend-up-border bg-trend-up-bg text-trend-up-text"
                  : "border border-trend-down-border bg-trend-down-bg text-trend-down-text"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="mr-0.5 h-3 w-3" />
              ) : (
                <ArrowDownRight className="mr-0.5 h-3 w-3" />
              )}
              {isPositive ? "+" : ""}
              {data.changePercent}%
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground tabular-nums">
                {data.value.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`ml-1.5 text-[11px] font-medium tabular-nums ${
                  isPositive ? "text-trend-up-text" : "text-trend-down-text"
                }`}
              >
                {isPositive ? "+" : ""}
                {data.change.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 font-mono text-[10px] text-subtle-foreground">
            <span className="flex items-center">
              <DollarSign className="mr-1 h-3 w-3 text-muted-foreground" />
              Thanh khoản
            </span>
            <span className="font-semibold text-foreground">{data.volume}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="space-y-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
        <div className="h-1.5 w-1.5 bg-foreground" />
        <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
          Tổng Quan Thị Trường Ngày Hôm Nay
        </h2>
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {renderIndexCard(marketData.vnIndex)}
        {renderIndexCard(marketData.hoseIndex)}
        {renderIndexCard(marketData.hnxIndex)}
        {renderIndexCard(marketData.upcomIndex)}
      </div>
    </section>
  );
}
