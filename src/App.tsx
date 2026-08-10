import { Info, TrendingUp, Star } from "lucide-react";
import { useState, useMemo } from "react";

import { FilterBar } from "./components/FilterBar";
import { Header } from "./components/Header";
import { MarketSummary } from "./components/MarketSummary";
import { StockDetailModal } from "./components/StockDetailModal";
import { StockTable } from "./components/StockTable";
import stocksData from "./data/stocks.json";

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

function App() {
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
  }, []);

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
  }, [searchQuery, selectedSector, selectedRisk]);

  // Thống kê số lượng tổng (không bị ảnh hưởng bởi bộ lọc)
  const totalBuyCount = useMemo(() => {
    return stocksData.recommendations.filter((s) => s.type === "BUY").length;
  }, []);

  const totalSellCount = useMemo(() => {
    return stocksData.recommendations.filter((s) => s.type === "SELL").length;
  }, []);

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50 text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-gray-100">
      {/* Header component */}
      <Header lastUpdated={stocksData.lastUpdated} />

      {/* Main dashboard content */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Section */}
        <section className="relative overflow-hidden rounded-2xl border border-gray-200/60 bg-gradient-to-r from-indigo-50 via-white to-indigo-50/20 p-6 shadow-sm transition-all duration-300 sm:p-8 dark:border-gray-800 dark:from-indigo-950/20 dark:via-gray-950 dark:to-indigo-950/5">
          {/* Decorative blur elements */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/5" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-400/5" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Star className="h-3 w-3 fill-indigo-600 dark:fill-indigo-400" />
                <span>Cập Nhật Hằng Ngày: 100% Tự Động Từ JSON</span>
              </div>
              <h2 className="text-2xl leading-tight font-extrabold tracking-tight text-gray-950 sm:text-3xl dark:text-white">
                Hệ Thống Phân Tích & Khuyến Nghị Giao Dịch
              </h2>
              <p className="text-sm leading-relaxed font-medium text-gray-500 dark:text-gray-400">
                Chào mừng bạn đến với{" "}
                <strong className="font-bold text-gray-900 dark:text-gray-100">
                  Alpha Pulse VM
                </strong>
                , nền tảng tổng hợp tín hiệu giao dịch cổ phiếu hàng đầu Việt Nam. Chúng tôi cung
                cấp các điểm mua bán tối ưu dựa trên mô hình định lượng kết hợp hành vi dòng tiền
                lớn, chỉ báo kỹ thuật RSI, MACD, và cấu trúc đám mây Ichimoku.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row md:items-center">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-2xs dark:border-gray-800 dark:bg-gray-900/40">
                <div className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Tín Hiệu Mua
                </div>
                <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  +{totalBuyCount} Mã
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center shadow-2xs dark:border-gray-800 dark:bg-gray-900/40">
                <div className="text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-gray-400">
                  Tín Hiệu Bán
                </div>
                <div className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
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
            <div className="h-1.5 w-4 rounded-full bg-indigo-600 dark:bg-indigo-500" />
            <h2 className="text-sm font-bold tracking-wider text-gray-900 uppercase dark:text-gray-200">
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

        {/* Admin configuration guide section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs transition-all duration-300 dark:border-gray-800 dark:bg-gray-900/60">
          <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
            <Info className="h-4.5 w-4.5 text-indigo-500" />
            <span>Hướng dẫn Cập nhật Khuyến nghị Hằng ngày</span>
          </h3>
          <p className="mt-1.5 text-xs leading-relaxed font-medium text-gray-500 dark:text-gray-400">
            Ứng dụng web được xây dựng dưới dạng ứng dụng tĩnh (Static Web App). Để cập nhật danh
            sách khuyến nghị và chỉ số thị trường hằng ngày, bạn chỉ cần mở rộng, chỉnh sửa hoặc
            thay thế dữ liệu bên trong tệp nguồn
            <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 font-semibold text-indigo-600 dark:bg-gray-800 dark:text-indigo-400">
              src/data/stocks.json
            </code>
            mà không cần phải can thiệp trực tiếp vào mã nguồn React/TypeScript của ứng dụng.
          </p>
        </section>
      </main>

      {/* Footer & Disclaimer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-8 transition-colors duration-300 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl space-y-4 px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-xs font-bold text-white">
              <TrendingUp className="h-3 w-3" />
            </div>
            <span className="text-sm font-bold text-gray-950 dark:text-white">
              Alpha Pulse VM Trading Platform
            </span>
          </div>

          <div className="mx-auto flex max-w-3xl flex-col items-center gap-2.5">
            <p className="max-w-2xl text-[11px] leading-relaxed font-medium text-gray-500 dark:text-gray-400">
              <strong>Tuyên bố Miễn trừ Trách nhiệm:</strong> Thị trường chứng khoán Việt Nam tiềm
              ẩn nhiều rủi ro biến động. Mọi nhận định, phân tích kỹ thuật và khuyến nghị giao dịch
              tại Alpha Pulse VM đều mang tính chất tham khảo, không được xem là lời khuyên đầu tư
              tài chính chính thức. Nhà đầu tư cần cân nhắc kỹ lưu ý và tự chịu trách nhiệm hoàn
              toàn với mọi quyết định phân bổ nguồn vốn và quản trị rủi ro cá nhân.
            </p>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
              © {new Date().getFullYear()} Alpha Pulse VM. Thiết kế và tối ưu bởi Fullstack
              Developer Việt Nam.
            </p>
          </div>
        </div>
      </footer>

      {/* Stock Detail Modal Popover */}
      <StockDetailModal stock={selectedStock} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}

export default App;
