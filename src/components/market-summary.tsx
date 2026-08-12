import { TrendingDown, ArrowUpRight, ArrowDownRight, ShoppingCart, DollarSign } from "lucide-react";

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

export function MarketSummary({ marketData, buyCount, sellCount }: MarketSummaryProps) {
  const renderIndexCard = (data: IndexData) => {
    const isPositive = data.change >= 0;
    return (
      <Card key={data.name} className="overflow-hidden bg-white transition-colors dark:bg-black">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {data.name}
            </span>
            <span
              className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] tracking-tight ${
                isPositive
                  ? "border border-emerald-100/50 bg-emerald-50 text-emerald-700 dark:border-emerald-900/20 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "border border-rose-100/50 bg-rose-50 text-rose-700 dark:border-rose-900/20 dark:bg-rose-950/20 dark:text-rose-400"
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
              <span className="text-lg font-bold tracking-tight text-gray-950 tabular-nums dark:text-gray-50">
                {data.value.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`ml-1.5 text-[11px] font-medium tabular-nums ${
                  isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {isPositive ? "+" : ""}
                {data.change.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 font-mono text-[10px] text-gray-400 dark:border-gray-900 dark:text-gray-500">
            <span className="flex items-center">
              <DollarSign className="mr-1 h-3 w-3 text-gray-400" />
              Thanh khoản
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-300">{data.volume}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="space-y-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
        <div className="h-1.5 w-1.5 bg-gray-900 dark:bg-gray-100" />
        <h2 className="font-mono text-[11px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
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
