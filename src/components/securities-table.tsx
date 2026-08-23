import { ArrowUpRight, HelpCircle, FileText } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import securitiesDataRaw from "@/data/securities-recommendations.json";

interface SecuritiesRec {
  symbol: string;
  companyName: string;
  securitiesFirm: string;
  sector: string;
  recommendation: "MUA" | "BÁN" | "THEO DÕI";
  currentPrice: number;
  targetBuyPrice: string;
  targetSellPrice: number;
  updatedDate: string;
}

const SECURITIES_DATA = securitiesDataRaw as SecuritiesRec[];

const SECTORS = Array.from(new Set(SECURITIES_DATA.map((item) => item.sector))).sort();

interface SecuritiesTableProps {
  selectedSector: string;
  onSectorChange: (sector: string) => void;
}

export function SecuritiesTable({ selectedSector, onSectorChange }: SecuritiesTableProps) {
  // Lọc dữ liệu dựa theo ngành nghề đã chọn
  const filteredData = React.useMemo(() => {
    if (selectedSector === "") {
      return SECURITIES_DATA;
    }
    return SECURITIES_DATA.filter((item) => item.sector === selectedSector);
  }, [selectedSector]);

  const renderTableContent = () => {
    if (filteredData.length === 0) {
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
                  Mã CP & NGÀNH
                  <Tooltip content="Mã giao dịch chứng khoán & phân loại nhóm ngành">
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
                  <Tooltip content="Khoảng giá khuyến nghị giải ngân (BUY) hoặc dừng giao dịch (SELL) từ công ty chứng khoán">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-bold text-muted-foreground">
                <div className="flex items-center gap-1">
                  Giá Mục Tiêu & CTCK
                  <Tooltip content="Giá mục tiêu chốt lời, biên độ tăng dự kiến và Tên công ty chứng khoán đề xuất">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  Cập nhật
                  <Tooltip content="Ngày công bố báo cáo phân tích gần nhất">
                    <HelpCircle className="h-3 w-3 cursor-help text-muted-foreground" />
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border text-xs text-foreground/85">
            {filteredData.map((stock) => {
              const isBuy = stock.recommendation === "MUA";

              // Tỷ suất sinh lời kỳ vọng dựa trên giá hiện tại
              const returnPct =
                ((stock.targetSellPrice - stock.currentPrice) / stock.currentPrice) * 100;

              return (
                <TableRow
                  key={`${stock.symbol}-${stock.securitiesFirm}`}
                  className="border-b border-border transition-colors duration-150 hover:bg-muted/30"
                >
                  {/* Mã CP & Ngành */}
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col text-left">
                      <span className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-foreground">{stock.symbol}</span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[9px] tracking-wider uppercase"
                        >
                          {stock.sector}
                        </Badge>
                      </span>
                      <span className="mt-0.5 max-w-[200px] truncate text-[11px] text-muted-foreground">
                        {stock.companyName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Giá hiện tại */}
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    <span className="text-xs font-bold text-foreground">
                      {(stock.currentPrice * 1000).toLocaleString("vi-VN")}
                    </span>
                    <span className="ml-0.5 text-[10px] text-subtle-foreground">đ</span>
                  </TableCell>

                  {/* Vùng giá hành động */}
                  <TableCell className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                        isBuy
                          ? "border border-trend-up-border bg-trend-up-bg text-trend-up-text"
                          : "border border-trend-down-border bg-trend-down-bg text-trend-down-text"
                      }`}
                    >
                      {isBuy ? `${stock.targetBuyPrice}đ` : stock.targetBuyPrice}
                    </span>
                  </TableCell>

                  {/* Giá Mục Tiêu & CTCK */}
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-[11px] tabular-nums">
                        <span className="mr-1 font-bold text-trend-up-text">
                          {(stock.targetSellPrice * 1000).toLocaleString("vi-VN")}đ
                        </span>
                        {returnPct > 0 && (
                          <span className="inline-flex items-center text-[10px] font-bold text-trend-up-text">
                            <ArrowUpRight className="mr-0.5 h-3 w-3" />+{returnPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {stock.securitiesFirm}
                      </div>
                    </div>
                  </TableCell>

                  {/* Ngày cập nhật */}
                  <TableCell className="px-4 py-3 text-center font-mono text-[11px] text-muted-foreground">
                    {stock.updatedDate}
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
      {/* Sector filter select */}
      <div className="flex justify-start">
        <div className="w-full space-y-1.5 sm:w-64">
          <span className="block font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
            LỌC THEO NGÀNH NGHỀ
          </span>
          <Select
            value={selectedSector || "ALL"}
            onValueChange={(val) => onSectorChange(val === "ALL" ? "" : (val ?? ""))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tất cả ngành nghề" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ALL">Tất cả ngành nghề</SelectItem>
                {SECTORS.map((sec) => (
                  <SelectItem key={sec} value={sec}>
                    {sec}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Render Table */}
      {renderTableContent()}
    </div>
  );
}
