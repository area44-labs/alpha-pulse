import { Sparkles, ArrowDownRight } from "lucide-react";
import { useState, useEffect } from "react";

import { MarketSummary } from "@/components/market-summary";
import { StockTable } from "@/components/stock-table";
import stocksDataRaw from "@/data/stocks.json";

export interface StockRecommendation {
  symbol: string;
  companyName: string;
  sector: string;
  type: "BUY" | "SELL" | "WATCH" | "HOLD";
  currentPrice: number;
  targetBuyPrice: string;
  targetSellPrice: number;
  stopLossPrice: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
  riskRewardRatio?: string;
  divergenceByTf?: {
    H?: "BULLISH" | "BEARISH" | "NONE";
    D?: "BULLISH" | "BEARISH" | "NONE";
    W?: "BULLISH" | "BEARISH" | "NONE";
    T?: "BULLISH" | "BEARISH" | "NONE";
  };
}

export interface MarketIndexData {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  volume: string;
}

export interface StocksDataPayload {
  lastUpdated: string;
  marketSummary: {
    vnIndex: MarketIndexData;
    hoseIndex: MarketIndexData;
    hnxIndex: MarketIndexData;
    upcomIndex: MarketIndexData;
  };
  recommendations: StockRecommendation[];
}

interface DashboardProps {
  onSelectStock: (symbol: string) => void;
}

export function Dashboard({ onSelectStock }: DashboardProps) {
  const [data, setData] = useState<StocksDataPayload>(
    stocksDataRaw as unknown as StocksDataPayload,
  );
  const [activeTab, setActiveTab] = useState<string>("BUY");

  useEffect(() => {
    async function fetchRealtimeStocksData() {
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
            const json = await res.json();
            if (json && json.recommendations) {
              setData(json);
              break;
            }
          }
        } catch {
          // ignore
        }
      }
    }
    fetchRealtimeStocksData();
  }, []);

  const { marketSummary, recommendations, lastUpdated } = data;

  const buyList = recommendations.filter((r) => r.type === "BUY");
  const sellList = recommendations.filter((r) => r.type === "SELL");

  const topBuys = buyList.slice(0, 5);
  const topSells = sellList.slice(0, 5);

  const formatVnd = (val: number) => {
    const vndVal = val < 1000 ? val * 1000 : val;
    return `${vndVal.toLocaleString("vi-VN")}đ`;
  };

  return (
    <div className="space-y-8">
      {/* Real-time Market Overview Banner */}
      <MarketSummary
        marketData={marketSummary}
        buyCount={buyList.length}
        sellCount={sellList.length}
      />

      {/* Top Highlight Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Top BUY */}
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="flex items-center font-mono text-xs font-bold text-trend-up-text uppercase">
              <Sparkles className="mr-1.5 h-4 w-4" /> Top Tín Hiệu Mua ({topBuys.length})
            </h3>
            <span className="font-mono text-[10px] text-muted-foreground">
              Cập nhật: {lastUpdated}
            </span>
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
                      {formatVnd(r.currentPrice)}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-trend-up-text">
                      Mục tiêu: {formatVnd(r.targetSellPrice)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Top SELL */}
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="flex items-center font-mono text-xs font-bold text-trend-down-text uppercase">
              <ArrowDownRight className="mr-1.5 h-4 w-4" /> Cảnh Báo Khuyên Bán ({topSells.length})
            </h3>
            <span className="font-mono text-[10px] text-muted-foreground">
              Cập nhật: {lastUpdated}
            </span>
          </div>
          {topSells.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Không có mã khuyến nghị bán.
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
                      {formatVnd(r.currentPrice)}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-trend-down-text">
                      Cắt lỗ: {formatVnd(r.stopLossPrice)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-1.5 bg-foreground" />
          <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
            Danh Sách Khuyến Nghị Giao Dịch Hằng Ngày
          </h2>
        </div>

        <StockTable
          stocks={recommendations}
          onSelectStock={(st) => onSelectStock(st.symbol)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}
