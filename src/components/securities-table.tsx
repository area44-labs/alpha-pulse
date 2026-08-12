import { HelpCircle } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
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
  targetBuyPrice: string; // "31.5 - 32.3" or "Không khuyến nghị"
  targetSellPrice: number | string; // e.g. 35.9 or "Chưa định giá"
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
    targetBuyPrice: "Không khuyến nghị",
    targetSellPrice: 60.5,
    updatedDate: "12/08/2026",
  },
];

export function SecuritiesTable() {
  // Nhóm dữ liệu theo ngành nghề
  const groupedData = SECURITIES_DATA.reduce<Record<string, SecuritiesRec[]>>((acc, item) => {
    if (!acc[item.sector]) {
      acc[item.sector] = [];
    }
    acc[item.sector].push(item);
    return acc;
  }, {});

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

  return (
    <div className="border-gray-150 overflow-x-auto rounded-sm border bg-white transition-colors dark:border-gray-900 dark:bg-black">
      <Table className="w-full border-collapse text-left">
        <TableHeader>
          <TableRow className="border-gray-150 border-b bg-gray-50/50 font-mono text-[10px] tracking-wider text-gray-500 uppercase hover:bg-transparent dark:border-gray-900 dark:bg-gray-950/40 dark:text-gray-400">
            <TableHead className="h-auto px-4 py-3 font-bold text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                Mã CP & Doanh Nghiệp
                <Tooltip content="Mã giao dịch & Tên đầy đủ của doanh nghiệp">
                  <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="h-auto px-4 py-3 font-bold text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                Công Ty Chứng Khoán
                <Tooltip content="Tổ chức tài chính phát hành báo cáo phân tích & định giá">
                  <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-center font-bold text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-1">
                Khuyến Nghị
                <Tooltip content="Đồng thuận khuyến nghị hành động của công ty chứng khoán">
                  <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-center font-bold text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-1">
                Giá Nên Mua
                <Tooltip content="Vùng giá giải ngân an toàn được đề xuất">
                  <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-right font-bold text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-end gap-1">
                Giá Nên Bán (Mục tiêu)
                <Tooltip content="Ngưỡng giá kỳ vọng chốt lời (VND)">
                  <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-center font-bold text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-center gap-1">
                Cập Nhật
                <Tooltip content="Ngày công bố báo cáo phân tích gần nhất">
                  <HelpCircle className="h-3 w-3 cursor-help text-gray-400" />
                </Tooltip>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100 text-xs text-gray-700 dark:divide-gray-900 dark:text-gray-300">
          {Object.entries(groupedData).map(([sector, items]) => (
            <React.Fragment key={sector}>
              {/* Row tiêu đề nhóm ngành */}
              <TableRow className="border-gray-150 border-b bg-gray-50/20 font-bold dark:border-gray-900 dark:bg-gray-950/20">
                <TableCell
                  colSpan={6}
                  className="px-4 py-2 font-mono text-[10px] tracking-wider text-gray-800 uppercase dark:text-gray-200"
                >
                  📁 Nhóm ngành: {sector} ({items.length} mã)
                </TableCell>
              </TableRow>
              {/* Danh sách mã thuộc nhóm ngành */}
              {items.map((stock) => {
                const isBuy = stock.recommendation === "MUA";
                return (
                  <TableRow
                    key={`${stock.symbol}-${stock.securitiesFirm}`}
                    className="border-b border-gray-100 transition-colors duration-150 hover:bg-gray-50/30 dark:border-gray-900 dark:hover:bg-gray-950/20"
                  >
                    {/* Ticker & Company Name */}
                    <TableCell className="px-4 py-3 font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-950 dark:text-white">
                          {stock.symbol}
                        </span>
                        <span className="mt-0.5 max-w-[200px] truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {stock.companyName}
                        </span>
                      </div>
                    </TableCell>

                    {/* Securities Firm */}
                    <TableCell className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">
                      {stock.securitiesFirm}
                    </TableCell>

                    {/* Recommendation Badge */}
                    <TableCell className="px-4 py-3 text-center">
                      {getRecommendationBadge(stock.recommendation)}
                    </TableCell>

                    {/* Target Buy Price */}
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

                    {/* Target Sell Price (numeric) */}
                    <TableCell className="px-4 py-3 text-right tabular-nums">
                      {typeof stock.targetSellPrice === "number" ? (
                        <>
                          <span className="text-xs font-bold text-gray-950 dark:text-white">
                            {(stock.targetSellPrice * 1000).toLocaleString("vi-VN")}
                          </span>
                          <span className="ml-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                            đ
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          {stock.targetSellPrice}
                        </span>
                      )}
                    </TableCell>

                    {/* Updated Date */}
                    <TableCell className="px-4 py-3 text-center font-mono text-[11px] text-gray-500 dark:text-gray-400">
                      {stock.updatedDate}
                    </TableCell>
                  </TableRow>
                );
              })}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
