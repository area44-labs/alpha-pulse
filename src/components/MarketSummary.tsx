import { TrendingDown, ArrowUpRight, ArrowDownRight, ShoppingCart, DollarSign } from "lucide-react";

import { Card, CardContent } from "./ui/Card";

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
      <Card key={data.name} className="overflow-hidden transition-all duration-300 hover:shadow-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
              {data.name}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
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

          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100">
                {data.value.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}
              </span>
              <span
                className={`ml-2 text-xs font-semibold ${
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

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5 text-[11px] font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <span className="flex items-center">
              <DollarSign className="mr-1 h-3 w-3 text-gray-400 dark:text-gray-500" />
              Thanh khoản
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-200">{data.volume}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="space-y-4">
      {/* Title */}
      <div className="flex items-center space-x-2">
        <div className="h-1.5 w-4 rounded-full bg-indigo-600 dark:bg-indigo-500" />
        <h2 className="text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-gray-200">
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
        <Card className="border-emerald-200/50 bg-emerald-50/10 transition-all duration-300 hover:shadow-md dark:border-emerald-950/20 dark:bg-emerald-950/5">
          <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                KHUYẾN NGHỊ MUA
              </span>
              <div className="rounded-full bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {buyCount}
              </span>
              <span className="ml-1 text-xs font-semibold text-emerald-600/70 dark:text-emerald-400/70">
                mã nên mua
              </span>
            </div>
            <p className="mt-2 text-[10px] font-medium text-emerald-600/70 dark:text-emerald-400/70">
              Cơ hội gia tăng lợi nhuận
            </p>
          </CardContent>
        </Card>

        {/* Card: SELL recommendations stats */}
        <Card className="border-rose-200/50 bg-rose-50/10 transition-all duration-300 hover:shadow-md dark:border-rose-950/20 dark:bg-rose-950/5">
          <CardContent className="flex h-full flex-col justify-between p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-rose-600 uppercase dark:text-rose-400">
                KHUYẾN NGHỊ BÁN
              </span>
              <div className="rounded-full bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                <TrendingDown className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400">
                {sellCount}
              </span>
              <span className="ml-1 text-xs font-semibold text-rose-600/70 dark:text-rose-400/70">
                mã nên bán
              </span>
            </div>
            <p className="mt-2 text-[10px] font-medium text-rose-600/70 dark:text-rose-400/70">
              Bảo toàn vốn và chốt lời
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
