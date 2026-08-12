import { ArrowUpRight, ArrowDownRight, Eye, HelpCircle, FileText, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";

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
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-gray-200 bg-gray-50/20 p-12 text-center dark:border-gray-800 dark:bg-gray-950/20">
          <FileText className="mb-3 h-8 w-8 text-gray-400 dark:text-gray-500" />
          <p className="text-xs font-bold text-gray-900 dark:text-gray-200">
            Không tìm thấy mã khuyến nghị nào
          </p>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Vui lòng thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.
          </p>
        </div>
      );
    }

    return (
      <div className="border-gray-150 overflow-x-auto rounded-sm border bg-white transition-colors dark:border-gray-900 dark:bg-black">
        <Table className="w-full border-collapse text-left">
          <TableHeader>
            <TableRow className="border-gray-150 border-b bg-gray-50/50 font-mono text-[10px] tracking-wider text-gray-500 uppercase hover:bg-transparent dark:border-gray-900 dark:bg-gray-950/40 dark:text-gray-400">
              <TableHead className="h-auto px-4 py-3 font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  Mã CP & Ngành
                  <Tooltip content="Mã giao dịch chứng khoán HOSE/HNX/UPCOM & phân loại nhóm ngành">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-right font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-end gap-1">
                  Giá hiện tại
                  <Tooltip content="Giá giao dịch khớp lệnh thực tế gần nhất (VND)">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-1">
                  Vùng giá hành động
                  <Tooltip content="Khoảng giá khuyến nghị giải ngân (BUY) hoặc dừng giao dịch (SELL)">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  Giá Mục Tiêu & Cắt Lỗ
                  <Tooltip content="Mục tiêu chốt lời (TP) và ngưỡng cắt lỗ bắt buộc (SL) kèm biên độ tăng giảm dự kiến">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-1">
                  Tỷ lệ R:R
                  <Tooltip content="Risk/Reward Ratio: Tỷ suất Lợi nhuận trên Rủi ro tương ứng (Khuyến nghị tối thiểu 1:2)">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-1">
                  Mức rủi ro
                  <Tooltip content="Xếp hạng rủi ro dựa trên biến động giá beta và thanh khoản cổ phiếu">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-right font-bold text-gray-500 dark:text-gray-400">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 text-xs text-gray-700 dark:divide-gray-900 dark:text-gray-300">
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
                <TableRow
                  key={stock.symbol}
                  className="border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50/30 dark:border-gray-900 dark:hover:bg-gray-950/20"
                >
                  {/* Symbol & Company & Sector */}
                  <TableCell className="px-4 py-3" aria-label={`Cổ phiếu ${stock.symbol}`}>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-950 dark:text-white">
                          {stock.symbol}
                        </span>
                        <Badge variant="secondary" className="font-mono text-[9px]">
                          {stock.sector}
                        </Badge>
                      </div>
                      <span className="mt-0.5 max-w-[180px] truncate text-[11px] text-gray-500 sm:max-w-[240px] dark:text-gray-400">
                        {stock.companyName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Current Price */}
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    <span className="text-xs font-bold text-gray-950 dark:text-white">
                      {(stock.currentPrice * 1000).toLocaleString("vi-VN")}
                    </span>
                    <span className="text-gray-450 ml-0.5 text-[10px] dark:text-gray-500">đ</span>
                  </TableCell>

                  {/* Buy/Sell Zone */}
                  <TableCell className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                        isBuy
                          ? "border border-emerald-100/50 bg-emerald-50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "border border-rose-100/50 bg-rose-50 text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400"
                      }`}
                    >
                      {isBuy ? stock.targetBuyPrice : "Không khuyến nghị"}
                    </span>
                  </TableCell>

                  {/* Targets & Stop Loss */}
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      {/* TP */}
                      <div className="flex items-center text-[11px] tabular-nums">
                        <span className="w-12 font-medium text-gray-400 dark:text-gray-500">
                          Mục tiêu:
                        </span>
                        <span className="mr-1 font-bold text-emerald-600 dark:text-emerald-400">
                          {(stock.targetSellPrice * 1000).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <ArrowUpRight className="mr-0.5 h-3 w-3" />+{returnPct.toFixed(1)}%
                        </span>
                      </div>
                      {/* SL */}
                      <div className="flex items-center text-[11px] tabular-nums">
                        <span className="w-12 font-medium text-gray-400 dark:text-gray-500">
                          Cắt lỗ:
                        </span>
                        <span className="mr-1 font-bold text-rose-600 dark:text-rose-400">
                          {(stock.stopLossPrice * 1000).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          <ArrowDownRight className="mr-0.5 h-3 w-3" />
                          {lossPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Risk/Reward Ratio */}
                  <TableCell className="px-4 py-3 text-center font-mono text-[11px] tabular-nums">
                    <span className="rounded-sm bg-gray-100 px-2 py-0.5 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                      {stock.riskRewardRatio}
                    </span>
                  </TableCell>

                  {/* Risk Level */}
                  <TableCell className="px-4 py-3 text-center">
                    {getRiskBadge(stock.riskLevel)}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectStock(stock)}
                      className="dark:text-gray-350 inline-flex cursor-pointer items-center gap-1 rounded-sm border border-gray-200 bg-white px-2 py-1 text-[11px] font-semibold text-gray-800 transition-colors hover:bg-gray-50 focus:outline-none dark:border-gray-800 dark:bg-black dark:hover:bg-gray-900"
                    >
                      <Eye className="h-3 w-3" />
                      Xem phân tích
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-900">
          <TabsList>
            <TabsTrigger value="BUY" className="flex cursor-pointer items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Mã khuyến nghị mua ({buyStocks.length})
            </TabsTrigger>
            <TabsTrigger value="SELL" className="flex cursor-pointer items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
              Mã khuyến nghị bán ({sellStocks.length})
            </TabsTrigger>
          </TabsList>

          <div className="hidden font-mono text-[11px] tracking-tight text-gray-400 uppercase sm:block dark:text-gray-500">
            Nhấp "Xem phân tích" để xem chi tiết
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
