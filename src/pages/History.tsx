import { Calendar, History as HistoryIcon } from "lucide-react";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import {
  getHistoryIndex,
  getHistoryReport,
  type HistoryIndex,
  type RecommendationsReport,
} from "@/lib/data";

interface HistoryProps {
  onSelectStock: (symbol: string) => void;
}

export function History({ onSelectStock }: HistoryProps) {
  const [indexData, setIndexData] = useState<HistoryIndex | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [reportData, setReportData] = useState<RecommendationsReport | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    async function loadHistoryIndex() {
      const data = await getHistoryIndex();
      if (data && data.dates && data.dates.length > 0) {
        setIndexData(data);
        setSelectedDate(data.dates[0]);
      }
      setLoadingIndex(false);
    }

    loadHistoryIndex();
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    async function loadDateReport() {
      setLoadingReport(true);
      const json = await getHistoryReport(selectedDate);
      if (json) {
        setReportData(json);
      }
      setLoadingReport(false);
    }

    loadDateReport();
  }, [selectedDate]);

  if (loadingIndex) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-muted-foreground">
        Đang tải chỉ mục lịch sử báo cáo...
      </div>
    );
  }

  if (!indexData || indexData.dates.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-2 text-center font-mono">
        <p className="text-sm font-bold text-foreground">Không tìm thấy báo cáo lịch sử</p>
        <p className="text-xs text-muted-foreground">
          Vui lòng tạo báo cáo bằng command generate_report.py.
        </p>
      </div>
    );
  }

  const formatVnd = (val: number | null | undefined) => {
    if (val == null) return "—";
    return `${val.toLocaleString("vi-VN")} VNĐ`;
  };

  return (
    <div className="space-y-6">
      {/* Date Picker Header */}
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center text-xl font-bold tracking-tight text-foreground">
            <HistoryIcon className="mr-2 h-5 w-5" /> Lịch Sử Báo Cáo Alpha Pulse
          </h1>
          <p className="text-xs text-muted-foreground">
            Chọn ngày giao dịch để xem lại dữ liệu khuyến nghị và trạng thái thị trường quá khứ.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="cursor-pointer rounded-sm border border-border bg-card px-3 py-1.5 font-mono text-xs text-foreground focus:outline-none"
          >
            {indexData.dates.map((d) => (
              <option key={d} value={d}>
                Phiên ngày {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Report Content */}
      {loadingReport ? (
        <div className="flex h-48 items-center justify-center font-mono text-xs text-muted-foreground">
          Đang tải báo cáo ngày {selectedDate}...
        </div>
      ) : !reportData ? (
        <div className="p-8 text-center font-mono text-xs text-muted-foreground">
          Không tìm thấy file báo cáo ngày {selectedDate}.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-border bg-card p-4">
            <div>
              <span className="block font-mono text-[10px] text-muted-foreground uppercase">
                Báo cáo ngày {reportData.market_date}
              </span>
              <span className="text-sm font-bold text-foreground">
                Thị trường: {reportData.market_context.regime} (Điểm:{" "}
                {reportData.market_context.regime_score ?? "—"})
              </span>
            </div>
            <div className="flex items-center space-x-3 font-mono text-xs">
              <span className="text-trend-up-text">MUA: {reportData.summary.buy_count}</span>
              <span className="text-warning-text">Theo dõi: {reportData.summary.watch_count}</span>
              <span className="text-trend-down-text">BÁN: {reportData.summary.sell_count}</span>
            </div>
          </div>

          {/* Recommendations Table */}
          <div className="overflow-x-auto rounded-sm border border-border bg-card">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-mono text-[10px] text-muted-foreground uppercase">
                  <th className="p-3">Mã CP</th>
                  <th className="p-3 text-center">Hành động</th>
                  <th className="p-3 text-right">Alpha Score</th>
                  <th className="p-3 text-right">Giá hiện tại</th>
                  <th className="p-3 text-center">Vùng mua / SL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {reportData.recommendations.map((rec) => (
                  <tr
                    key={rec.symbol}
                    onClick={() => onSelectStock(rec.symbol)}
                    className="cursor-pointer transition-colors hover:bg-muted/30"
                  >
                    <td className="p-3 font-bold text-foreground">
                      {rec.symbol}{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        ({rec.sector})
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        variant={
                          rec.signal === "BUY"
                            ? "success"
                            : rec.signal === "WATCH"
                              ? "warning"
                              : "destructive"
                        }
                      >
                        {rec.signal}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">{rec.score ?? "—"}</td>
                    <td className="p-3 text-right font-bold">
                      {formatVnd(rec.trade_plan.current_price)}
                    </td>
                    <td className="p-3 text-center font-mono text-[11px]">
                      {rec.trade_plan.entry_low != null
                        ? `${rec.trade_plan.entry_low.toLocaleString("vi-VN")} - ${rec.trade_plan.entry_high?.toLocaleString("vi-VN")} VNĐ`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
