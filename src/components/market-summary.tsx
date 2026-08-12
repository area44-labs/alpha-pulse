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

        {/* Card: BUY recommendations stats */}
        <Card className="border-gray-200 bg-white transition-colors dark:border-gray-900 dark:bg-black">
          <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                KHUYẾN NGHỊ MUA
              </span>
              <div className="text-emerald-650 dark:text-emerald-450 rounded-sm border border-emerald-100/50 bg-emerald-50 p-1 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-emerald-650 text-2xl font-bold tabular-nums dark:text-emerald-400">
                {buyCount}
              </span>
              <span className="ml-1 font-mono text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                mã nên mua
              </span>
            </div>
            <p className="mt-2 font-mono text-[9px] tracking-tight text-emerald-600/60 uppercase dark:text-emerald-400/60">
              Cơ hội gia tăng lợi nhuận
            </p>
          </CardContent>
        </Card>

        {/* Card: SELL recommendations stats */}
        <Card className="border-gray-200 bg-white transition-colors dark:border-gray-900 dark:bg-black">
          <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider text-rose-600 uppercase dark:text-rose-400">
                KHUYẾN NGHỊ BÁN
              </span>
              <div className="text-rose-650 dark:text-rose-450 rounded-sm border border-rose-100/50 bg-rose-50 p-1 dark:border-rose-900/30 dark:bg-rose-950/20">
                <TrendingDown className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-rose-650 text-2xl font-bold tabular-nums dark:text-rose-400">
                {sellCount}
              </span>
              <span className="ml-1 font-mono text-[10px] text-rose-600/70 dark:text-rose-400/70">
                mã nên bán
              </span>
            </div>
            <p className="mt-2 font-mono text-[9px] tracking-tight text-rose-600/60 uppercase dark:text-rose-400/60">
              Bảo toàn vốn & chốt lời
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
