import { ArrowUpRight, ArrowDownRight, Eye, HelpCircle, FileText, Sparkles } from "lucide-react";

import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Tooltip } from "./ui/tooltip";

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

interface StockTableProps {
  stocks: Stock[];
  onSelectStock: (stock: Stock) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function StockTable({ stocks, onSelectStock, activeTab, setActiveTab }: StockTableProps) {
  // Separate stocks into BUY and SELL
  const buyStocks = stocks.filter((s) => s.type === "BUY");
  const sellStocks = stocks.filter((s) => s.type === "SELL");

  const getRiskBadge = (risk: "LOW" | "MEDIUM" | "HIGH") => {
    switch (risk) {
      case "LOW":
        return <Badge variant="success">Thấp</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Trung bình</Badge>;
      case "HIGH":
        return <Badge variant="destructive">Cao</Badge>;
    }
  };

  const renderTable = (data: Stock[]) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center dark:border-gray-800 dark:bg-gray-900/10">
          <FileText className="mb-3 h-10 w-10 text-gray-400 dark:text-gray-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">
            Không tìm thấy mã khuyến nghị nào
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Vui lòng thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-950">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
              <th scope="col" className="px-4 py-3.5 font-bold">
                <div className="flex items-center gap-1">
                  Mã CP & Ngành
                  <Tooltip content="Mã giao dịch chứng khoán HOSE/HNX/UPCOM & phân loại nhóm ngành">
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </th>
              <th scope="col" className="px-4 py-3.5 text-right font-bold">
                <div className="flex items-center justify-end gap-1">
                  Giá hiện tại
                  <Tooltip content="Giá giao dịch khớp lệnh thực tế gần nhất (VND)">
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </th>
              <th scope="col" className="px-4 py-3.5 text-center font-bold">
                <div className="flex items-center justify-center gap-1">
                  Vùng giá hành động
                  <Tooltip content="Khoảng giá khuyến nghị giải ngân (BUY) hoặc dừng giao dịch (SELL)">
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </th>
              <th scope="col" className="px-4 py-3.5 font-bold">
                <div className="flex items-center gap-1">
                  Giá Mục Tiêu & Cắt Lỗ
                  <Tooltip content="Mục tiêu chốt lời (TP) và ngưỡng cắt lỗ bắt buộc (SL) kèm biên độ tăng giảm dự kiến">
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </th>
              <th scope="col" className="px-4 py-3.5 text-center font-bold">
                <div className="flex items-center justify-center gap-1">
                  Tỷ lệ R:R
                  <Tooltip content="Risk/Reward Ratio: Tỷ suất Lợi nhuận trên Rủi ro tương ứng (Khuyến nghị tối thiểu 1:2)">
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </th>
              <th scope="col" className="px-4 py-3.5 text-center font-bold">
                <div className="flex items-center justify-center gap-1">
                  Mức rủi ro
                  <Tooltip content="Xếp hạng rủi ro dựa trên biến động giá beta và thanh khoản cổ phiếu">
                    <HelpCircle className="h-3.5 w-3.5 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </th>
              <th scope="col" className="px-4 py-3.5 text-right font-bold">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-gray-150 divide-y text-sm text-gray-700 dark:divide-gray-800 dark:text-gray-300">
            {data.map((stock) => {
              const isBuy = stock.type === "BUY";

              // Compute target return and loss risk
              const returnPct = isBuy
                ? ((stock.targetSellPrice - stock.currentPrice) / stock.currentPrice) * 100
                : ((stock.currentPrice - stock.targetSellPrice) / stock.currentPrice) * 100;

              const lossPct = isBuy
                ? ((stock.stopLossPrice - stock.currentPrice) / stock.currentPrice) * 100
                : ((stock.currentPrice - stock.stopLossPrice) / stock.currentPrice) * 100;

              return (
                <tr
                  key={stock.symbol}
                  className="transition-colors duration-200 hover:bg-gray-50/50 dark:hover:bg-gray-900/30"
                >
                  {/* Symbol & Company & Sector */}
                  <td className="px-4 py-4" aria-label={`Cổ phiếu ${stock.symbol}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-extrabold text-gray-900 dark:text-white">
                          {stock.symbol}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          {stock.sector}
                        </Badge>
                      </div>
                      <span className="mt-0.5 max-w-[180px] truncate text-xs text-gray-500 sm:max-w-[240px] dark:text-gray-400">
                        {stock.companyName}
                      </span>
                    </div>
                  </td>

                  {/* Current Price */}
                  <td className="px-4 py-4 text-right">
                    <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                      {(stock.currentPrice * 1000).toLocaleString("vi-VN")}
                    </span>
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500">đ</span>
                  </td>

                  {/* Buy/Sell Zone */}
                  <td className="px-4 py-4 text-center">
                    <span
                      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
                        isBuy
                          ? "border border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-900/20 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "border border-rose-100 bg-rose-50 text-rose-800 dark:border-rose-900/20 dark:bg-rose-950/20 dark:text-rose-400"
                      }`}
                    >
                      {isBuy ? stock.targetBuyPrice : "Không khuyến nghị"}
                    </span>
                  </td>

                  {/* Targets & Stop Loss */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col space-y-1">
                      {/* TP */}
                      <div className="flex items-center text-xs">
                        <span className="w-12 font-semibold text-gray-400 uppercase dark:text-gray-500">
                          Mục tiêu:
                        </span>
                        <span className="mr-1.5 font-extrabold text-emerald-600 dark:text-emerald-400">
                          {(stock.targetSellPrice * 1000).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <ArrowUpRight className="mr-0.5 h-3 w-3" />+{returnPct.toFixed(1)}%
                        </span>
                      </div>
                      {/* SL */}
                      <div className="flex items-center text-xs">
                        <span className="w-12 font-semibold text-gray-400 uppercase dark:text-gray-500">
                          Cắt lỗ:
                        </span>
                        <span className="mr-1.5 font-extrabold text-rose-600 dark:text-rose-400">
                          {(stock.stopLossPrice * 1000).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          <ArrowDownRight className="mr-0.5 h-3 w-3" />
                          {lossPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Risk/Reward Ratio */}
                  <td className="px-4 py-4 text-center">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-extrabold text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      {stock.riskRewardRatio}
                    </span>
                  </td>

                  {/* Risk Level */}
                  <td className="px-4 py-4 text-center">{getRiskBadge(stock.riskLevel)}</td>

                  {/* Action */}
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => onSelectStock(stock)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-colors hover:bg-indigo-100 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:bg-indigo-950/40 dark:text-indigo-400 dark:hover:bg-indigo-950/80"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Xem phân tích
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-800">
          <TabsList>
            <TabsTrigger
              value="BUY"
              className="flex cursor-pointer items-center gap-1.5 px-4 py-2 text-xs font-bold transition-transform active:scale-95 sm:text-sm"
            >
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Mã Khuyến Nghị Mua ({buyStocks.length})
            </TabsTrigger>
            <TabsTrigger
              value="SELL"
              className="flex cursor-pointer items-center gap-1.5 px-4 py-2 text-xs font-bold transition-transform active:scale-95 sm:text-sm"
            >
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
              Mã Khuyến Nghị Bán ({sellStocks.length})
            </TabsTrigger>
          </TabsList>

          <div className="hidden text-xs font-medium text-gray-500 sm:block dark:text-gray-400">
            Nhấp "Xem phân tích" để lập kế hoạch cắt lỗ/chốt lời tương ứng
          </div>
        </div>

        <TabsContent value="BUY">
          <div className="mt-2">{renderTable(buyStocks)}</div>
        </TabsContent>

        <TabsContent value="SELL">
          <div className="mt-2">{renderTable(sellStocks)}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
