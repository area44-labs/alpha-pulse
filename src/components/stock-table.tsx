import { ArrowUpRight, ArrowDownRight, HelpCircle, FileText, Sparkles } from "lucide-react";

import type { Recommendation } from "@/lib/data";

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

interface StockTableProps {
  stocks: Recommendation[];
  onSelectStock: (stock: Recommendation) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function StockTable({ stocks, onSelectStock, activeTab, setActiveTab }: StockTableProps) {
  const buyStocks = stocks.filter((s) => s.signal === "BUY");
  const sellStocks = stocks.filter((s) => s.signal === "SELL" || s.signal === "AVOID");

  const getRiskBadge = (risk: "LOW" | "MEDIUM" | "HIGH" | null) => {
    switch (risk) {
      case "LOW":
        return <Badge variant="success">Thấp</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Trung bình</Badge>;
      case "HIGH":
        return <Badge variant="destructive">Cao</Badge>;
      default:
        return <Badge variant="outline">—</Badge>;
    }
  };

  const parseDivergenceBadges = (stock: Recommendation) => {
    if (!stock.divergence) {
      return (
        <Badge variant="outline" className="font-mono text-[9px]">
          Đồng thuận
        </Badge>
      );
    }

    const badges: { code: string; label: string; type: "BULLISH" | "BEARISH" }[] = [];
    Object.entries(stock.divergence).forEach(([tf, status]) => {
      if (status === "BULLISH") {
        badges.push({ code: tf, label: `${tf} Dương`, type: "BULLISH" });
      } else if (status === "BEARISH") {
        badges.push({ code: tf, label: `${tf} Âm`, type: "BEARISH" });
      }
    });

    if (badges.length === 0) {
      return (
        <Badge variant="outline" className="font-mono text-[9px]">
          Đồng thuận
        </Badge>
      );
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-1">
        {badges.map((b) => (
          <span
            key={b.code}
            className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-bold ${
              b.type === "BULLISH"
                ? "border border-trend-up-border bg-trend-up-bg text-trend-up-text"
                : "border border-trend-down-border bg-trend-down-bg text-trend-down-text"
            }`}
          >
            {b.type === "BULLISH" ? `📈 ${b.label}` : `📉 ${b.label}`}
          </span>
        ))}
      </div>
    );
  };

  const renderTable = (data: Recommendation[]) => {
    if (data.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-border bg-muted/20 p-12 text-center">
          <FileText className="mb-3 h-8 w-8 text-subtle-foreground" />
          <p className="text-xs font-bold text-foreground">Không tìm thấy mã khuyến nghị nào</p>
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
                  Alpha Score
                  <Tooltip content="Điểm số đánh giá định lượng Alpha Pulse (0 - 100)">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-right font-bold text-muted-foreground">
                <div className="flex items-center justify-end gap-1">
                  Giá hiện tại
                  <Tooltip content="Giá giao dịch khớp lệnh thực tế (VND)">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  Phân Kỳ
                  <Tooltip content="Trạng thái Phân kỳ trên từng khung thời gian">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  Vùng giá hành động
                  <Tooltip content="Khoảng giá khuyến nghị MUA / BÁN">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-bold text-muted-foreground">
                <div className="flex items-center gap-1">
                  Giá Mục Tiêu & Cắt Lỗ
                  <Tooltip content="Mục tiêu chốt lời (TP) và cắt lỗ (SL)">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  Mức rủi ro
                  <Tooltip content="Đánh giá rủi ro từ biến động và VaR T+2.5">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border text-xs text-foreground/85">
            {data.map((stock) => {
              const isBuy = stock.signal === "BUY";
              const currentPriceVnd = stock.trade_plan.current_price ?? 0;
              const tp1Vnd = stock.trade_plan.tp1 ?? 0;
              const slVnd = stock.trade_plan.stop_loss ?? 0;

              const entryLowVnd = stock.trade_plan.entry_low ?? 0;
              const entryHighVnd = stock.trade_plan.entry_high ?? 0;

              const returnPct =
                currentPriceVnd > 0 ? ((tp1Vnd - currentPriceVnd) / currentPriceVnd) * 100 : 0;
              const lossPct =
                currentPriceVnd > 0 ? ((slVnd - currentPriceVnd) / currentPriceVnd) * 100 : 0;

              return (
                <TableRow
                  key={stock.symbol}
                  className="border-b border-border transition-colors duration-150 hover:bg-muted/30"
                >
                  {/* Symbol */}
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
                        {stock.company_name}
                      </span>
                    </button>
                  </TableCell>

                  {/* Score */}
                  <TableCell className="px-4 py-3 text-right font-mono font-bold text-foreground">
                    {stock.score ?? "—"}
                  </TableCell>

                  {/* Current Price */}
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    <span className="text-xs font-bold text-foreground">
                      {currentPriceVnd.toLocaleString("vi-VN")}
                    </span>
                    <span className="ml-0.5 text-[10px] text-subtle-foreground">đ</span>
                  </TableCell>

                  {/* Divergence */}
                  <TableCell className="px-4 py-3 text-center">
                    {parseDivergenceBadges(stock)}
                  </TableCell>

                  {/* Entry Zone */}
                  <TableCell className="px-4 py-3 text-center font-mono">
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                        isBuy
                          ? "border border-trend-up-border bg-trend-up-bg text-trend-up-text"
                          : "border border-trend-down-border bg-trend-down-bg text-trend-down-text"
                      }`}
                    >
                      {isBuy
                        ? `${entryLowVnd.toLocaleString("vi-VN")} - ${entryHighVnd.toLocaleString("vi-VN")}đ`
                        : "Khuyên Bán / Tránh"}
                    </span>
                  </TableCell>

                  {/* Targets */}
                  <TableCell className="px-4 py-3 font-mono">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-[11px] tabular-nums">
                        <span className="w-12 font-medium text-subtle-foreground">Mục tiêu:</span>
                        <span className="mr-1 font-bold text-trend-up-text">
                          {tp1Vnd.toLocaleString("vi-VN")}đ
                        </span>
                        <span className="inline-flex items-center text-[10px] font-bold text-trend-up-text">
                          <ArrowUpRight className="mr-0.5 h-3 w-3" />+{returnPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center text-[11px] tabular-nums">
                        <span className="w-12 font-medium text-subtle-foreground">Cắt lỗ:</span>
                        <span className="mr-1 font-bold text-trend-down-text">
                          {slVnd.toLocaleString("vi-VN")}đ
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
                    {getRiskBadge(stock.risk.risk_level)}
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
              <Sparkles className="h-3.5 w-3.5 text-trend-up-text" />
              Tín hiệu Mua ({buyStocks.length})
            </TabsTrigger>
            <TabsTrigger value="SELL" className="flex cursor-pointer items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5 text-trend-down-text" />
              Cảnh báo Bán ({sellStocks.length})
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
