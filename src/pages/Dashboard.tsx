import { Sparkles, ArrowDownRight } from "lucide-react";
import { useState, useEffect } from "react";

import { MarketSummary } from "@/components/market-summary";
import { StockTable } from "@/components/stock-table";
import { getRecommendations, type RecommendationsReport, type Recommendation } from "@/lib/data";

interface DashboardProps {
  onSelectStock: (symbol: string) => void;
}

export function Dashboard({ onSelectStock }: DashboardProps) {
  const [report, setReport] = useState<RecommendationsReport | null>(null);
  const [activeTab, setActiveTab] = useState<string>("BUY");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getRecommendations();
      if (data) {
        setReport(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-muted-foreground">
        Đang tải báo cáo Alpha Pulse...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-2 text-center font-mono">
        <p className="text-sm font-bold text-foreground">Không tìm thấy báo cáo phân tích</p>
        <p className="text-xs text-muted-foreground">
          Vui lòng chạy command generate_report.py để tạo dữ liệu.
        </p>
      </div>
    );
  }

  const { market_context, recommendations, market_date } = report;

  const buyList = recommendations.filter((r) => r.signal === "BUY");
  const sellList = recommendations.filter((r) => r.signal === "SELL" || r.signal === "AVOID");

  const topBuys = buyList.slice(0, 5);
  const topSells = sellList.slice(0, 5);

  const formatVnd = (val: number | null) => {
    if (val == null) return "—";
    return `${val.toLocaleString("vi-VN")}đ`;
  };

  return (
    <div className="space-y-8">
      {/* Real-time Market Overview Banner */}
      <MarketSummary
        marketContext={market_context}
        marketDate={market_date}
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
            <span className="font-mono text-[10px] text-muted-foreground">Ngày: {market_date}</span>
          </div>
          {topBuys.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Không có mã MUA thỏa mãn bộ lọc rủi ro.
            </p>
          ) : (
            <div className="space-y-2">
              {topBuys.map((r: Recommendation) => (
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
                      {formatVnd(r.trade_plan.current_price)}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-trend-up-text">
                      Mục tiêu: {formatVnd(r.trade_plan.tp1)}
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
            <span className="font-mono text-[10px] text-muted-foreground">Ngày: {market_date}</span>
          </div>
          {topSells.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Không có mã khuyến nghị bán.
            </p>
          ) : (
            <div className="space-y-2">
              {topSells.map((r: Recommendation) => (
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
                      {formatVnd(r.trade_plan.current_price)}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-trend-down-text">
                      Cắt lỗ: {formatVnd(r.trade_plan.stop_loss)}
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
