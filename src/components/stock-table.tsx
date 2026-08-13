import { ArrowUpRight, ArrowDownRight, HelpCircle, FileText, Sparkles } from "lucide-react";

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
  riskRewardRatio?: string;
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
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-12 text-center">
          <FileText className="mb-3 h-8 w-8 text-subtle-foreground" />
          <p className="text-xs font-bold text-foreground">Không tìm thấy mã khuyến nghị nào</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Vui lòng thay đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-sm border border-border bg-background transition-colors">
        <Table className="w-full border-collapse text-left">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/50 font-mono text-[10px] tracking-wider text-muted-foreground uppercase hover:bg-transparent">
              <TableHead className="h-auto px-4 py-3 font-bold text-muted-foreground">
                <div className="flex items-center gap-1">
                  Mã CP & Ngành
                  <Tooltip content="Mã giao dịch chứng khoán phân loại nhóm ngành">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-right font-bold text-muted-foreground">
                <div className="flex items-center justify-end gap-1">
                  Giá hiện tại
                  <Tooltip content="Giá giao dịch khớp lệnh thực tế gần nhất (VND)">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  Vùng giá hành động
                  <Tooltip content="Khoảng giá khuyến nghị giải ngân (BUY) hoặc dừng giao dịch (SELL)">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-bold text-muted-foreground">
                <div className="flex items-center gap-1">
                  Giá Mục Tiêu & Cắt Lỗ
                  <Tooltip content="Mục tiêu chốt lời (TP) và ngưỡng cắt lỗ bắt buộc (SL) kèm biên độ tăng giảm dự kiến">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  Mức rủi ro
                  <Tooltip content="Xếp hạng rủi ro dựa trên biến động giá beta và thanh khoản cổ phiếu">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border text-xs text-foreground/85">
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
                  className="border-b border-border transition-colors duration-150 hover:bg-muted/30"
                >
                  {/* Symbol & Company & Sector */}
                  <TableCell className="px-4 py-3">
                    <button
                      onClick={() => onSelectStock(stock)}
                      className="group flex w-full cursor-pointer flex-col text-left select-none focus:outline-none"
                      aria-label={`Xem phân tích cổ phiếu ${stock.symbol}`}
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-foreground decoration-muted-foreground group-hover:underline">
                          {stock.symbol}
                        </span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[9px] group-hover:bg-accent"
                        >
                          {stock.sector}
                        </Badge>
                      </span>
                      <span className="mt-0.5 max-w-[180px] truncate text-[11px] text-muted-foreground sm:max-w-[240px]">
                        {stock.companyName}
                      </span>
                    </button>
                  </TableCell>

                  {/* Current Price */}
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    <span className="text-xs font-bold text-foreground">
                      {(stock.currentPrice * 1000).toLocaleString("vi-VN")}
                    </span>
                    <span className="ml-0.5 text-[10px] text-subtle-foreground">đ</span>
                  </TableCell>

                  {/* Buy/Sell Zone */}
                  <TableCell className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                        isBuy
                          ? "border border-trend-up-border bg-trend-up-bg text-trend-up-text"
                          : "border border-trend-down-border bg-trend-down-bg text-trend-down-text"
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
                        <span className="w-12 font-medium text-subtle-foreground">Mục tiêu:</span>
                        <span className="mr-1 font-bold text-trend-up-text">
                          {(stock.targetSellPrice * 1000).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold text-trend-up-text">
                          <ArrowUpRight className="mr-0.5 h-3 w-3" />+{returnPct.toFixed(1)}%
                        </span>
                      </div>
                      {/* SL */}
                      <div className="flex items-center text-[11px] tabular-nums">
                        <span className="w-12 font-medium text-subtle-foreground">Cắt lỗ:</span>
                        <span className="mr-1 font-bold text-trend-down-text">
                          {(stock.stopLossPrice * 1000).toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold text-trend-down-text">
                          <ArrowDownRight className="mr-0.5 h-3 w-3" />
                          {lossPct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Risk Level */}
                  <TableCell className="px-4 py-3 text-center">
                    {getRiskBadge(stock.riskLevel)}
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
        <div className="flex items-center justify-between border-b border-border pb-2">
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

          <div className="hidden font-mono text-[11px] tracking-tight text-subtle-foreground uppercase sm:block">
            Nhấp vào mã CP để xem chi tiết
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
