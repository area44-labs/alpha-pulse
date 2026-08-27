import { useState, useMemo, useEffect } from "react";

import { DivergenceSummaryTable } from "@/components/divergence-summary-table";
import { Header } from "@/components/header";
import { MarketSummary } from "@/components/market-summary";
import { SecuritiesTable } from "@/components/securities-table";
import { StockDetailModal } from "@/components/stock-detail-modal";
import { StockTable } from "@/components/stock-table";
import realStocksData from "@/data/stocks.json";

interface Stock {
  symbol: string;
  companyName: string;
  sector: string;
  type: "BUY" | "SELL";
  currentPrice: number;
  targetBuyPrice: string;
  targetSellPrice: number;
  stopLossPrice: number;
  riskRewardRatio: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  rationale: string;
}

interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  volume: string;
}

interface MarketSummaryData {
  vnIndex: MarketIndex;
  hoseIndex: MarketIndex;
  hnxIndex: MarketIndex;
  upcomIndex: MarketIndex;
}

interface StocksDataset {
  lastUpdated: string;
  marketSummary: MarketSummaryData;
  recommendations: Stock[];
}

// Khởi tạo dữ liệu ban đầu
const getInitialData = (): StocksDataset => {
  // Ưu tiên dữ liệu tùy chỉnh của người dùng trong localStorage nếu có
  try {
    const saved = localStorage.getItem("alpha-pulse-user-stocks-data");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.recommendations && parsed.marketSummary) {
        return parsed as StocksDataset;
      }
    }
  } catch {
    // Không log chi tiết để giữ console sạch sẽ
  }

  return realStocksData as StocksDataset;
};

function App() {
  const [stocksData, setStocksData] = useState<StocksDataset>(getInitialData);

  useEffect(() => {
    const fetchRealData = async () => {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const timestamp = Date.now();
      const paths = [
        `${baseUrl}data/stocks.json?t=${timestamp}`,
        `${baseUrl}stocks.json?t=${timestamp}`,
        `/data/stocks.json?t=${timestamp}`,
        `/stocks.json?t=${timestamp}`,
      ];

      for (const path of paths) {
        try {
          const res = await fetch(path, { cache: "no-store" });
          if (res.ok) {
            const freshData = await res.json();
            if (freshData && freshData.recommendations && freshData.marketSummary) {
              setStocksData(freshData as StocksDataset);
              break; // Đã tải thành công dữ liệu thực tế mới nhất từ server
            }
          }
        } catch {
          // Thử đường dẫn tiếp theo
        }
      }
    };

    fetchRealData();
  }, []);

  // Securities sector filter state
  const [selectedSecuritiesSector, setSelectedSecuritiesSector] = useState("");

  // Selected stock for modal detail
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active tab state ("BUY" or "SELL")
  const [activeTab, setActiveTab] = useState("BUY");

  // Thống kê số lượng tổng (không bị ảnh hưởng bởi bộ lọc)
  const totalBuyCount = useMemo(() => {
    return stocksData.recommendations.filter((s) => s.type === "BUY").length;
  }, [stocksData]);

  const totalSellCount = useMemo(() => {
    return stocksData.recommendations.filter((s) => s.type === "SELL").length;
  }, [stocksData]);

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header component */}
      <Header lastUpdated={stocksData.lastUpdated} />

      {/* Main dashboard content */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Section */}
        <section className="relative overflow-hidden px-0 py-0">
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-3">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Phân Tích & Khuyến Nghị Giao Dịch
              </h2>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Chào mừng bạn đến với nền tảng tổng hợp tín hiệu giao dịch cổ phiếu Việt Nam.
              </p>
            </div>
          </div>
        </section>

        {/* Market Summary Section */}
        <MarketSummary
          marketData={stocksData.marketSummary}
          buyCount={totalBuyCount}
          sellCount={totalSellCount}
        />

        {/* Core Stock Recommendation Table Card */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 bg-foreground" />
            <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              Danh Sách Khuyến Nghị Giao Dịch Hằng Ngày
            </h2>
          </div>
          <StockTable
            stocks={stocksData.recommendations}
            onSelectStock={handleSelectStock}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>

        {/* Multi-timeframe Divergence Summary Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 bg-foreground" />
            <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
              Bảng Trạng Thái Phân Kỳ Đa Khung Thời Gian (1H / 1D / 1W)
            </h2>
          </div>
          <DivergenceSummaryTable
            stocks={stocksData.recommendations}
            onSelectStock={handleSelectStock}
          />
        </div>

        {/* Securities Consensus Table Card */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-foreground" />
              <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
                Danh Sách Khuyến Nghị Từ Các Công Ty Chứng Khoán
              </h2>
            </div>
          </div>
          <SecuritiesTable
            selectedSector={selectedSecuritiesSector}
            onSectorChange={setSelectedSecuritiesSector}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-background py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center font-mono text-[11px] tracking-tight text-subtle-foreground">
            © {new Date().getFullYear()} AREA44. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Stock Detail Modal Popover */}
      <StockDetailModal stock={selectedStock} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}

export default App;
