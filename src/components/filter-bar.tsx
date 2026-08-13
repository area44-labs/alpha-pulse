import { RotateCcw } from "lucide-react";

import { Select } from "@/components/ui/select";

interface FilterBarProps {
  selectedSector: string;
  setSelectedSector: (sector: string) => void;
  selectedRisk: string;
  setSelectedRisk: (risk: string) => void;
  sectors: string[];
}

export function FilterBar({
  selectedSector,
  setSelectedSector,
  selectedRisk,
  setSelectedRisk,
  sectors,
}: FilterBarProps) {
  const handleReset = () => {
    setSelectedSector("");
    setSelectedRisk("");
  };

  const isFiltered = selectedSector !== "" || selectedRisk !== "";

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-xs transition-all duration-300">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-start">
        {/* Sector Filter */}
        <div className="w-full md:w-64">
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
        <div className="w-full md:w-56">
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
            className="flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/50 px-4 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none md:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại bộ lọc
          </button>
        )}
      </div>
    </section>
  );
}
