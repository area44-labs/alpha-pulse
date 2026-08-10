import { Search, X, RotateCcw } from "lucide-react";

import { Select } from "./ui/select";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  selectedRisk: string;
  setSelectedRisk: (risk: string) => void;
  sectors: string[];
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedSector,
  setSelectedSector,
  selectedRisk,
  setSelectedRisk,
  sectors,
}: FilterBarProps) {
  const handleReset = () => {
    setSearchQuery("");
    setSelectedSector("");
    setSelectedRisk("");
  };

  const isFiltered = searchQuery !== "" || selectedSector !== "" || selectedRisk !== "";

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition-all duration-300 dark:border-gray-800 dark:bg-gray-900/60">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        {/* Search Input */}
        <div className="relative flex-1">
          <label
            htmlFor="stock-search-input"
            className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400"
          >
            Tìm kiếm cổ phiếu
          </label>
          <div className="relative">
            <input
              id="stock-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập mã CP (SSI, HPG...) hoặc tên công ty..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-8 pl-9 text-sm transition-colors duration-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
              <Search className="h-4 w-4" />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Sector Filter */}
        <div className="w-full md:w-56">
          <Select
            label="LỌC THEO NGÀNH NGHỀ"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
          >
            <option value="">Tất cả ngành nghề</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </Select>
        </div>

        {/* Risk Level Filter */}
        <div className="w-full md:w-48">
          <Select
            label="MỨC ĐỘ RỦI RO"
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
          >
            <option value="">Tất cả rủi ro</option>
            <option value="LOW">Thấp (LOW)</option>
            <option value="MEDIUM">Trung bình (MEDIUM)</option>
            <option value="HIGH">Cao (HIGH)</option>
          </Select>
        </div>

        {/* Reset Filters button */}
        {isFiltered && (
          <button
            onClick={handleReset}
            className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-4 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none md:w-auto dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    </section>
  );
}
