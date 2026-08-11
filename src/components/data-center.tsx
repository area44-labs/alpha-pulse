import {
  Database,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Play,
  Square,
  Plus,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";

import type { Stock, StocksData, DataSourceType } from "../hooks/use-stocks-data";

import { useStocksData } from "../hooks/use-stocks-data";

interface DataCenterProps {
  dataManager: ReturnType<typeof useStocksData>;
}

export function DataCenter({ dataManager }: DataCenterProps) {
  const {
    loading,
    error,
    source,
    isDev,
    isSimulatorActive,
    toggleSimulator,
    addMockStock,
    saveUserUploadedData,
    saveCustomApiUrl,
    clearPreferences,
  } = dataManager;

  // Tabs or view state
  const [apiUrlInput, setApiUrlInput] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // New stock form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [newSector, setNewSector] = useState("Ngân hàng");
  const [newType, setNewType] = useState<"BUY" | "SELL">("BUY");
  const [newPrice, setNewPrice] = useState("32.5");
  const [newRisk, setNewRisk] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");

  // Handle JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLocalError(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as StocksData;

        // Validation helper
        if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
          throw new Error("Tệp JSON phải chứa mảng 'recommendations'.");
        }
        if (!parsed.marketSummary) {
          throw new Error("Tệp JSON phải chứa đối tượng 'marketSummary'.");
        }

        saveUserUploadedData(parsed);
        setSuccessMessage("Đã tải lên và áp dụng dữ liệu người dùng thành công!");
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Định dạng JSON không hợp lệ.");
      }
    };
    reader.readAsText(file);
  };

  // Handle Custom API fetch
  const handleApiFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrlInput.trim()) return;

    setLocalError(null);
    setSuccessMessage(null);

    const success = await saveCustomApiUrl(apiUrlInput.trim());
    if (success) {
      setSuccessMessage("Đã kết nối và lấy dữ liệu từ API tùy chỉnh thành công!");
    } else {
      setLocalError("Không thể tải dữ liệu từ API. Vui lòng kiểm tra lại URL hoặc CORS.");
    }
  };

  // Handle adding mock stock
  const handleAddMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !newCompany) {
      setLocalError("Vui lòng điền ký hiệu và tên công ty!");
      return;
    }

    const mockStock: Stock = {
      symbol: newSymbol.toUpperCase(),
      companyName: newCompany,
      sector: newSector,
      type: newType,
      currentPrice: parseFloat(newPrice) || 30.0,
      targetBuyPrice:
        newType === "BUY"
          ? `${(parseFloat(newPrice) * 0.95).toFixed(1)} - ${(parseFloat(newPrice) * 0.99).toFixed(1)}`
          : "Không khuyến nghị",
      targetSellPrice: parseFloat((parseFloat(newPrice) * 1.25).toFixed(1)),
      stopLossPrice: parseFloat((parseFloat(newPrice) * 0.9).toFixed(1)),
      riskRewardRatio: "1:2.5",
      riskLevel: newRisk,
      rationale: `[MOCK DATA] Đây là một mã cổ phiếu giả lập được tạo ở chế độ phát triển để kiểm tra chức năng lọc, hiển thị danh mục và xem chi tiết của ứng dụng.`,
    };

    addMockStock(mockStock);
    setSuccessMessage(`Đã thêm mã giả lập ${newSymbol.toUpperCase()} thành công!`);

    // Reset form
    setNewSymbol("");
    setNewCompany("");
    setShowAddForm(false);
  };

  const getSourceBadge = (src: DataSourceType) => {
    switch (src) {
      case "dev-mock":
        return {
          label: "Chế Độ Development (Dữ Liệu Tạm)",
          className:
            "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50",
        };
      case "user-uploaded":
        return {
          label: "Dữ Liệu Tải Lên Bởi Bạn (Ưu Tiên)",
          className:
            "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50",
        };
      case "custom-api":
        return {
          label: "Dữ Liệu Từ API Tùy Chỉnh (Ưu Tiên)",
          className:
            "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50",
        };
      case "prod-server":
        return {
          label: "Dữ Liệu Thực Tế Từ Server",
          className:
            "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50",
        };
      default:
        return {
          label: "Dữ Liệu Dự Phòng (Resilient Fallback)",
          className:
            "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50",
        };
    }
  };

  const badge = getSourceBadge(source);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs transition-all duration-300 dark:border-gray-800 dark:bg-gray-900/40">
      {/* Title & Badge */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-950 dark:text-white">
              Trung tâm Quản lý & Kết nối Dữ liệu
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Kiểm soát nguồn dữ liệu khuyến nghị và cấu hình trải nghiệm
            </p>
          </div>
        </div>

        <div
          className={`inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
        >
          <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          {badge.label}
        </div>
      </div>

      {/* Messages */}
      {(successMessage || error || localError) && (
        <div className="mt-4 space-y-2">
          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}
          {(error || localError) && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}
        </div>
      )}

      {/* Grid containing Actions */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {/* Box 1: Development / Simulation controls (Visible always, emphasized in DEV) */}
        <div
          className={`rounded-xl border p-5 transition-all ${isDev ? "border-amber-300/80 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/5" : "border-gray-200 dark:border-gray-800"}`}
        >
          <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-amber-700 uppercase dark:text-amber-400">
            <span>Bảng Điều khiển Giả lập</span>
            {isDev && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] dark:bg-amber-900/50">
                Active
              </span>
            )}
          </h4>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Ở chế độ <strong>development (pnpm dev)</strong>, bạn có thể kích hoạt bộ giả lập dòng
            tiền biến động thời gian thực hoặc thêm mã giả lập để kiểm tra UI và bộ lọc.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {/* Auto simulation toggle */}
            <button
              onClick={() => toggleSimulator(!isSimulatorActive)}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-2xs transition-all ${
                isSimulatorActive
                  ? "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-700 dark:hover:bg-rose-800"
                  : "bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700"
              }`}
            >
              {isSimulatorActive ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  <span>Dừng Giả Lập</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Bật Tự Động Giả Lập (5s)</span>
                </>
              )}
            </button>

            {/* Show Add Form button */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300 dark:hover:bg-gray-900"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{showAddForm ? "Hủy Thêm Mã" : "Thêm Mã Giả Lập"}</span>
            </button>
          </div>

          {/* Form to add mock stock */}
          {showAddForm && (
            <form
              onSubmit={handleAddMock}
              className="mt-4 border-t border-dashed border-gray-200 pt-4 dark:border-gray-800"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="new-symbol-input"
                    className="block text-[11px] font-bold text-gray-500 uppercase dark:text-gray-400"
                  >
                    Mã CP (Symbol)
                  </label>
                  <input
                    id="new-symbol-input"
                    type="text"
                    required
                    maxLength={5}
                    placeholder="E.g., AAA"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-company-input"
                    className="block text-[11px] font-bold text-gray-500 uppercase dark:text-gray-400"
                  >
                    Tên Doanh Nghiệp
                  </label>
                  <input
                    id="new-company-input"
                    type="text"
                    required
                    placeholder="E.g., Phát triển AAA"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-sector-select"
                    className="block text-[11px] font-bold text-gray-500 uppercase dark:text-gray-400"
                  >
                    Lĩnh Vực / Ngành
                  </label>
                  <select
                    id="new-sector-select"
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-800 dark:bg-gray-950"
                  >
                    <option value="Ngân hàng">Ngân hàng</option>
                    <option value="Dịch vụ tài chính">Dịch vụ tài chính</option>
                    <option value="Thép">Thép</option>
                    <option value="Công nghệ">Công nghệ</option>
                    <option value="Bất động sản">Bất động sản</option>
                    <option value="Bán lẻ">Bán lẻ</option>
                    <option value="Hóa chất">Hóa chất</option>
                    <option value="Dầu khí">Dầu khí</option>
                    <option value="Thực phẩm & Đồ uống">Thực phẩm & Đồ uống</option>
                  </select>
                </div>
                <div>
                  <span className="block text-[11px] font-bold text-gray-500 uppercase dark:text-gray-400">
                    Loại Khuyến Nghị
                  </span>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewType("BUY")}
                      className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all ${newType === "BUY" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType("SELL")}
                      className={`flex-1 rounded-lg py-1 text-xs font-bold transition-all ${newType === "SELL" ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
                    >
                      SELL
                    </button>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="new-price-input"
                    className="block text-[11px] font-bold text-gray-500 uppercase dark:text-gray-400"
                  >
                    Giá Hiện Tại (nghìn VNĐ)
                  </label>
                  <input
                    id="new-price-input"
                    type="number"
                    step="0.1"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-800 dark:bg-gray-950"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-risk-select"
                    className="block text-[11px] font-bold text-gray-500 uppercase dark:text-gray-400"
                  >
                    Mức Độ Rủi Ro
                  </label>
                  <select
                    id="new-risk-select"
                    value={newRisk}
                    onChange={(e) => setNewRisk(e.target.value as any)}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-800 dark:bg-gray-950"
                  >
                    <option value="LOW">Thấp (LOW)</option>
                    <option value="MEDIUM">Trung bình (MEDIUM)</option>
                    <option value="HIGH">Cao (HIGH)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="mt-3.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus className="h-4 w-4" />
                <span>Xác nhận Thêm Mã</span>
              </button>
            </form>
          )}
        </div>

        {/* Box 2: Production Data Import (Prioritized in Production) */}
        <div
          className={`rounded-xl border p-5 transition-all ${!isDev ? "border-indigo-300/80 bg-indigo-50/20 dark:border-indigo-900/40 dark:bg-indigo-950/5" : "border-gray-200 dark:border-gray-800"}`}
        >
          <h4 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-400">
            <span>Cập nhật & Ưu tiên Dữ liệu Người dùng</span>
            {!isDev && (
              <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] dark:bg-indigo-900/50">
                Active
              </span>
            )}
          </h4>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Khi chạy <strong>production build (pnpm build)</strong>, ứng dụng tự động lấy dữ liệu từ
            server thực, đồng thời cho phép bạn tải lên tệp JSON tùy chỉnh hoặc kết nối API riêng
            của bạn (được ưu tiên hàng đầu).
          </p>

          <div className="mt-4 space-y-4">
            {/* Method A: File Upload */}
            <div className="space-y-1.5">
              <label
                htmlFor="user-json-file"
                className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase dark:text-gray-400"
              >
                <Upload className="h-3.5 w-3.5 text-indigo-500" />
                <span>Cách 1: Tải lên tệp JSON của bạn</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="user-json-file"
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="dark:file:bg-gray-850 block w-full cursor-pointer rounded-lg border border-gray-200 bg-white text-xs file:mr-3 file:cursor-pointer file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-gray-700 hover:file:bg-gray-200 dark:border-gray-800 dark:bg-gray-950 dark:file:text-gray-300 dark:hover:file:bg-gray-800"
                />
              </div>
            </div>

            {/* Method B: Fetch API */}
            <form onSubmit={handleApiFetch} className="space-y-1.5">
              <label
                htmlFor="user-api-url"
                className="flex items-center gap-1 text-[11px] font-bold text-gray-500 uppercase dark:text-gray-400"
              >
                <LinkIcon className="h-3.5 w-3.5 text-indigo-500" />
                <span>Cách 2: Đồng bộ từ API URL của bạn</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="user-api-url"
                  type="url"
                  required
                  placeholder="https://api.example.com/stocks"
                  value={apiUrlInput}
                  onChange={(e) => setApiUrlInput(e.target.value)}
                  className="block flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-800 dark:bg-gray-950"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex cursor-pointer items-center justify-center rounded-lg bg-indigo-600 px-3.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {loading ? "Đang tải..." : "Kết nối"}
                </button>
              </div>
            </form>

            {/* Reset to defaults */}
            {(source === "user-uploaded" ||
              source === "custom-api" ||
              isSimulatorActive ||
              source === "fallback") && (
              <div className="border-gray-150 dark:border-gray-850 border-t pt-3">
                <button
                  onClick={() => {
                    clearPreferences();
                    setSuccessMessage("Đã khôi phục dữ liệu gốc từ hệ thống thành công!");
                    setApiUrlInput("");
                    setLocalError(null);
                  }}
                  className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Xóa tùy chọn - Khôi phục Dữ liệu Gốc</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schema / Format guide helper */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-gray-50 p-4 text-xs dark:bg-gray-900/20">
        <HelpCircle className="h-4.5 w-4.5 shrink-0 text-gray-400 dark:text-gray-500" />
        <div className="space-y-1">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            Cấu trúc JSON hợp lệ cho tệp dữ liệu thực & tự tải lên:
          </p>
          <p className="leading-relaxed text-gray-500 dark:text-gray-400">
            Tệp JSON của bạn cần tuân thủ cấu trúc giống với tệp mặc định{" "}
            <code className="bg-gray-150 rounded px-1 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-gray-800 dark:text-indigo-400">
              stocks.json
            </code>
            , bao gồm trường <code className="font-bold">"lastUpdated"</code> (chuỗi ngày),{" "}
            <code className="font-bold">"marketSummary"</code> (gồm vnIndex, hoseIndex, hnxIndex,
            upcomIndex) và mảng <code className="font-bold">"recommendations"</code> (danh sách các
            đối tượng cổ phiếu với đầy đủ symbol, companyName, sector, type, currentPrice, v.v.).
          </p>
        </div>
      </div>
    </section>
  );
}
