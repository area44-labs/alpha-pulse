import { ArrowUpRight, HelpCircle, FileText } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";

interface SecuritiesRec {
  symbol: string;
  companyName: string;
  securitiesFirm: string;
  sector: string;
  recommendation: "MUA" | "BÁN" | "THEO DÕI";
  currentPrice: number;
  targetBuyPrice: string; // e.g., "31.5 - 32.3" or "Không khuyến nghị"
  targetSellPrice: number; // target price in thousands
  updatedDate: string;
}

const SECURITIES_DATA: SecuritiesRec[] = [
  // Ngân hàng
  {
    symbol: "TCB",
    companyName: "Ngân hàng TMCP Kỹ thương Việt Nam",
    securitiesFirm: "Chứng khoán SSI",
    sector: "Ngân hàng",
    recommendation: "MUA",
    currentPrice: 31.5,
    targetBuyPrice: "31.5 - 32.3",
    targetSellPrice: 35.9,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "ACB",
    companyName: "Ngân hàng TMCP Á Châu",
    securitiesFirm: "Chứng khoán Vietcap",
    sector: "Ngân hàng",
    recommendation: "MUA",
    currentPrice: 22.75,
    targetBuyPrice: "22.8 - 23.3",
    targetSellPrice: 25.8,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "STB",
    companyName: "Ngân hàng TMCP Sài Gòn Thương Tín",
    securitiesFirm: "Chứng khoán VNDIRECT",
    sector: "Ngân hàng",
    recommendation: "MUA",
    currentPrice: 74.1,
    targetBuyPrice: "74.1 - 76.0",
    targetSellPrice: 84.5,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "MBB",
    companyName: "Ngân hàng TMCP Quân Đội",
    securitiesFirm: "Chứng khoán HSC",
    sector: "Ngân hàng",
    recommendation: "BÁN",
    currentPrice: 20.45,
    targetBuyPrice: "Không khuyến nghị",
    targetSellPrice: 23.3,
    updatedDate: "12/08/2026",
  },
  // Dịch vụ tài chính
  {
    symbol: "SSI",
    companyName: "Công ty Cổ phần Chứng khoán SSI",
    securitiesFirm: "Chứng khoán HSC",
    sector: "Dịch vụ tài chính",
    recommendation: "MUA",
    currentPrice: 25.3,
    targetBuyPrice: "25.3 - 25.9",
    targetSellPrice: 28.9,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "HCM",
    companyName: "Công ty Cổ phần Chứng khoán TP.Hồ Chí Minh",
    securitiesFirm: "Chứng khoán Vietcap",
    sector: "Dịch vụ tài chính",
    recommendation: "MUA",
    currentPrice: 26.15,
    targetBuyPrice: "26.1 - 26.8",
    targetSellPrice: 29.8,
    updatedDate: "12/08/2026",
  },
  // Thép
  {
    symbol: "HPG",
    companyName: "Công ty Cổ phần Tập đoàn Hòa Phát",
    securitiesFirm: "Chứng khoán SSI",
    sector: "Thép",
    recommendation: "MUA",
    currentPrice: 26.5,
    targetBuyPrice: "26.5 - 27.2",
    targetSellPrice: 31.0,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "HSG",
    companyName: "Công ty Cổ phần Tập đoàn Hoa Sen",
    securitiesFirm: "Chứng khoán MBS",
    sector: "Thép",
    recommendation: "MUA",
    currentPrice: 19.5,
    targetBuyPrice: "19.5 - 20.1",
    targetSellPrice: 23.0,
    updatedDate: "12/08/2026",
  },
  // Bất động sản
  {
    symbol: "VIC",
    companyName: "Tập đoàn Vingroup - CTCP",
    securitiesFirm: "Chứng khoán VNDIRECT",
    sector: "Bất động sản",
    recommendation: "MUA",
    currentPrice: 215.5,
    targetBuyPrice: "215.5 - 220.9",
    targetSellPrice: 245.7,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "VHM",
    companyName: "Công ty Cổ phần Vinhomes",
    securitiesFirm: "Chứng khoán Vietcap",
    sector: "Bất động sản",
    recommendation: "MUA",
    currentPrice: 38.5,
    targetBuyPrice: "38.5 - 39.5",
    targetSellPrice: 45.0,
    updatedDate: "12/08/2026",
  },
  // Bán lẻ
  {
    symbol: "FRT",
    companyName: "Công ty Cổ phần Bán lẻ Kỹ thuật số FPT",
    securitiesFirm: "Chứng khoán VNDIRECT",
    sector: "Bán lẻ",
    recommendation: "BÁN",
    currentPrice: 148.0,
    targetBuyPrice: "Không khuyến nghị",
    targetSellPrice: 171.0,
    updatedDate: "12/08/2026",
  },
  {
    symbol: "MWG",
    companyName: "Công ty Cổ phần Đầu tư Thế giới Di Động",
    securitiesFirm: "Chứng khoán HSC",
    sector: "Bán lẻ",
    recommendation: "MUA",
    currentPrice: 55.0,
    targetBuyPrice: "55.0 - 56.5",
    targetSellPrice: 64.0,
    updatedDate: "12/08/2026",
  },
  // Thủy sản
  {
    symbol: "VHC",
    companyName: "Công ty Cổ phần Vĩnh Hoàn",
    securitiesFirm: "Chứng khoán SSI",
    sector: "Thủy sản",
    recommendation: "BÁN",
    currentPrice: 53.1,
    targetBuyPrice: "Không khuyến nghị",
    targetSellPrice: 60.5,
    updatedDate: "12/08/2026",
  },
];

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

  const getRecommendationBadge = (rec: "MUA" | "BÁN" | "THEO DÕI") => {
    switch (rec) {
      case "MUA":
        return <Badge variant="success">MUA</Badge>;
      case "BÁN":
        return <Badge variant="destructive">BÁN</Badge>;
      case "THEO DÕI":
        return <Badge variant="warning">THEO DÕI</Badge>;
    }
  };

  const renderTableContent = () => {
    if (filteredData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-gray-200 bg-gray-50/20 p-12 text-center dark:border-gray-800 dark:bg-gray-950/20">
          <FileText className="mb-3 h-8 w-8 text-gray-400 dark:text-gray-500" />
          <p className="text-xs font-bold text-gray-900 dark:text-gray-200">
            Không tìm thấy mã khuyến nghị nào
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
                  <Tooltip content="Mã giao dịch chứng khoán & Phân loại nhóm ngành">
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
                  <Tooltip content="Khoảng giá khuyến nghị giải ngân (BUY) hoặc dừng giao dịch (SELL) từ công ty chứng khoán">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  Giá Mục Tiêu & CTCK
                  <Tooltip content="Giá mục tiêu chốt lời, biên độ tăng dự kiến và Tên công ty chứng khoán đề xuất">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-1">
                  Khuyến nghị
                  <Tooltip content="Đồng thuận khuyến nghị hành động từ tổ chức phân tích">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
              <TableHead className="h-auto px-4 py-3 text-center font-bold text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center gap-1">
                  Cập nhật
                  <Tooltip content="Ngày công bố báo cáo phân tích gần nhất">
                    <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 text-xs text-gray-700 dark:divide-gray-900 dark:text-gray-300">
            {filteredData.map((stock) => {
              const isBuy = stock.recommendation === "MUA";

              // Tỷ suất sinh lời kỳ vọng dựa trên giá hiện tại
              const returnPct =
                ((stock.targetSellPrice - stock.currentPrice) / stock.currentPrice) * 100;

              return (
                <TableRow
                  key={`${stock.symbol}-${stock.securitiesFirm}`}
                  className="border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50/30 dark:border-gray-900 dark:hover:bg-gray-950/20"
                >
                  {/* Mã CP & Ngành */}
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col text-left">
                      <span className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-950 dark:text-white">
                          {stock.symbol}
                        </span>
                        <Badge variant="secondary" className="font-mono text-[9px]">
                          {stock.sector}
                        </Badge>
                      </span>
                      <span className="mt-0.5 max-w-[200px] truncate text-[11px] text-gray-500 dark:text-gray-400">
                        {stock.companyName}
                      </span>
                    </div>
                  </TableCell>

                  {/* Giá hiện tại */}
                  <TableCell className="px-4 py-3 text-right tabular-nums">
                    <span className="text-xs font-bold text-gray-950 dark:text-white">
                      {(stock.currentPrice * 1000).toLocaleString("vi-VN")}
                    </span>
                    <span className="ml-0.5 text-[10px] text-gray-400 dark:text-gray-500">đ</span>
                  </TableCell>

                  {/* Vùng giá hành động */}
                  <TableCell className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                        isBuy
                          ? "border border-emerald-100/50 bg-emerald-50 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "border border-rose-100/50 bg-rose-50 text-rose-800 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400"
                      }`}
                    >
                      {isBuy ? `${stock.targetBuyPrice}đ` : stock.targetBuyPrice}
                    </span>
                  </TableCell>

                  {/* Giá Mục Tiêu & CTCK */}
                  <TableCell className="px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-[11px] tabular-nums">
                        <span className="mr-1 font-bold text-emerald-600 dark:text-emerald-400">
                          {(stock.targetSellPrice * 1000).toLocaleString("vi-VN")}đ
                        </span>
                        {returnPct > 0 && (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            <ArrowUpRight className="mr-0.5 h-3 w-3" />+{returnPct.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {stock.securitiesFirm}
                      </div>
                    </div>
                  </TableCell>

                  {/* Khuyến nghị badge */}
                  <TableCell className="px-4 py-3 text-center">
                    {getRecommendationBadge(stock.recommendation)}
                  </TableCell>

                  {/* Ngày cập nhật */}
                  <TableCell className="px-4 py-3 text-center font-mono text-[11px] text-gray-500 dark:text-gray-400">
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
        <div className="w-full sm:w-64">
          <Select
            label="LỌC THEO NGÀNH NGHỀ"
            value={selectedSector}
            onChange={(e) => onSectorChange(e.target.value)}
          >
            <option value="">Tất cả ngành nghề</option>
            {SECTORS.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Render Table */}
      {renderTableContent()}
    </div>
  );
}
