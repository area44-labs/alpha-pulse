import { Star } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

import { FilterBar } from "./components/filter-bar";
import { Header } from "./components/header";
import { MarketSummary } from "./components/market-summary";
import { StockDetailModal } from "./components/stock-detail-modal";
import { StockTable } from "./components/stock-table";
import mockStocksData from "./data/mock-stocks.json";
import realStocksData from "./data/stocks.json";

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

const isDev = import.meta.env.DEV;

// Khởi tạo dữ liệu ban đầu dựa trên môi trường chạy
const getInitialData = (): StocksDataset => {
  if (isDev) {
    return mockStocksData as StocksDataset;
  }

  // Chế độ Production: Ưu tiên dữ liệu tùy chỉnh của người dùng trong localStorage nếu có
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
    // Chỉ lấy dữ liệu thực tế từ API/Server khi chạy ở chế độ Production
    if (isDev) return;

    const fetchRealData = async () => {
      const baseUrl = import.meta.env.BASE_URL || "/";
      const paths = [
        `${baseUrl}data/stocks.json`,
        `${baseUrl}stocks.json`,
        `/data/stocks.json`,
        `/stocks.json`,
      ];

      for (const path of paths) {
        try {
          const res = await fetch(path);
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

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");

  // Selected stock for modal detail
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active tab state ("BUY" or "SELL")
  const [activeTab, setActiveTab] = useState("BUY");

  // Dynamically extract sectors from recommendations data for filtering options
  const sectors = useMemo(() => {
    const allSectors = stocksData.recommendations.map((stock) => stock.sector);
    return Array.from(new Set(allSectors)).sort();
  }, [stocksData]);

  // Filter recommendations based on search queries and selection states
  const filteredStocks = useMemo(() => {
    return (stocksData.recommendations as Stock[]).filter((stock) => {
      const matchesSearch =
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.companyName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSector = selectedSector === "" || stock.sector === selectedSector;
      const matchesRisk = selectedRisk === "" || stock.riskLevel === selectedRisk;

      return matchesSearch && matchesSector && matchesRisk;
    });
  }, [searchQuery, selectedSector, selectedRisk, stocksData]);

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
    <div className="flex min-h-screen flex-col bg-white text-gray-900 transition-colors duration-300 dark:bg-black dark:text-gray-100">
      {/* Header component */}
      <Header lastUpdated={stocksData.lastUpdated} />

      {/* Main dashboard content */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Section */}
        <section className="relative overflow-hidden rounded-md border border-gray-100 bg-white p-6 sm:p-8 dark:border-gray-900 dark:bg-black">
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-sm border border-gray-100 bg-gray-50 px-2 py-0.5 font-mono text-[10px] tracking-wider text-gray-600 uppercase dark:border-gray-900 dark:bg-gray-950 dark:text-gray-400">
                <Star className="h-3 w-3 fill-gray-900 text-gray-900 dark:fill-gray-100 dark:text-gray-100" />
                <span>Cập nhật hằng ngày · Tự động</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-white">
                Hệ Thống Phân Tích & Khuyến Nghị Giao Dịch
              </h2>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Chào mừng bạn đến với{" "}
                <strong className="font-bold text-gray-900 dark:text-gray-100">Alpha Pulse</strong>,
                nền tảng tổng hợp tín hiệu giao dịch cổ phiếu hàng đầu Việt Nam. Chúng tôi cung cấp
                các điểm mua bán tối ưu dựa trên mô hình định lượng kết hợp hành vi dòng tiền lớn,
                chỉ báo kỹ thuật RSI, MACD, và cấu trúc đám mây Ichimoku.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row md:items-center">
              <div className="rounded-md border border-gray-100 bg-gray-50/50 px-4 py-3 text-center dark:border-gray-900 dark:bg-gray-950/40">
                <div className="font-mono text-[10px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Tín Hiệu Mua
                </div>
                <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  +{totalBuyCount} Mã
                </div>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50/50 px-4 py-3 text-center dark:border-gray-900 dark:bg-gray-950/40">
                <div className="font-mono text-[10px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Tín Hiệu Bán
                </div>
                <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  -{totalSellCount} Mã
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Market Summary Section */}
        <MarketSummary
          marketData={stocksData.marketSummary}
          buyCount={totalBuyCount}
          sellCount={totalSellCount}
        />

        {/* Filter and Search Bar */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedSector={selectedSector}
          setSelectedSector={setSelectedSector}
          selectedRisk={selectedRisk}
          setSelectedRisk={setSelectedRisk}
          sectors={sectors}
        />

        {/* Core Stock Recommendation Table Card */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-1.5 w-1.5 bg-gray-900 dark:bg-gray-100" />
            <h2 className="font-mono text-[11px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Danh Sách Khuyến Nghị Giao Dịch
            </h2>
          </div>
          <StockTable
            stocks={filteredStocks}
            onSelectStock={handleSelectStock}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-100 bg-white py-6 dark:border-gray-900 dark:bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center font-mono text-[11px] tracking-tight text-gray-400 dark:text-gray-500">
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
