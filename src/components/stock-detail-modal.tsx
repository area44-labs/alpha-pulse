import { ShieldAlert, Target, Info, Percent, Sparkles, Scale } from "lucide-react";

import { Badge } from "./ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";

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

interface StockDetailModalProps {
  stock: Stock | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockDetailModal({ stock, isOpen, onOpenChange }: StockDetailModalProps) {
  if (!stock) return null;

  const isBuy = stock.type === "BUY";

  // Calculate percentages
  const targetProfitPercent = isBuy
    ? ((stock.targetSellPrice - stock.currentPrice) / stock.currentPrice) * 100
    : ((stock.currentPrice - stock.targetSellPrice) / stock.currentPrice) * 100;

  const stopLossPercent = isBuy
    ? ((stock.stopLossPrice - stock.currentPrice) / stock.currentPrice) * 100
    : ((stock.currentPrice - stock.stopLossPrice) / stock.currentPrice) * 100;

  const getRiskLevelBadge = (level: "LOW" | "MEDIUM" | "HIGH") => {
    switch (level) {
      case "LOW":
        return <Badge variant="success">Rủi ro Thấp (LOW)</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Rủi ro Trung bình (MEDIUM)</Badge>;
      case "HIGH":
        return <Badge variant="destructive">Rủi ro Cao (HIGH)</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogHeader>
        <div className="flex items-center space-x-2">
          <Badge
            variant={isBuy ? "success" : "destructive"}
            className="px-2 py-0.5 font-mono text-[10px] tracking-wider"
          >
            {isBuy ? "BUY" : "SELL"}
          </Badge>
          <span className="font-mono text-[10px] tracking-wider text-gray-400 uppercase dark:text-gray-500">
            Alpha Pulse Premium
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <DialogTitle className="flex items-baseline gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <span className="text-xl font-extrabold">{stock.symbol}</span>
              <span className="dark:text-gray-450 text-xs font-normal text-gray-500">
                {stock.companyName}
              </span>
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-mono text-[10px] tracking-wider text-gray-500 uppercase dark:text-gray-400">
              Ngành: {stock.sector}
            </DialogDescription>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-wider text-gray-400 uppercase dark:text-gray-500">
              Giá hiện tại
            </div>
            <div className="text-base font-bold text-gray-950 tabular-nums dark:text-gray-50">
              {(stock.currentPrice * 1000).toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>
      </DialogHeader>

      {/* Body container */}
      <div className="text-gray-750 mt-4 space-y-5 text-xs dark:text-gray-300">
        {/* Trading Plan section */}
        <div className="border-gray-150 rounded-sm border bg-gray-50/30 p-4 dark:border-gray-900 dark:bg-gray-950/20">
          <h4 className="dark:text-gray-450 mb-3 flex items-center font-mono text-[10px] tracking-wider text-gray-500 uppercase">
            <Target className="mr-2 h-4 w-4 text-gray-400" />
            Chi tiết kế hoạch giao dịch
          </h4>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Entry point */}
            <div className="border-gray-150 rounded-sm border bg-white p-3 dark:border-gray-900 dark:bg-black">
              <span className="block font-mono text-[9px] tracking-wider text-gray-400 uppercase dark:text-gray-500">
                Vùng mua an toàn
              </span>
              <span className="mt-1 block text-sm font-bold text-gray-900 dark:text-gray-50">
                {isBuy ? `${stock.targetBuyPrice} nghìnđ` : "Bán ngay"}
              </span>
              <span className="mt-0.5 block font-mono text-[9px] text-gray-400 dark:text-gray-500">
                {isBuy ? "Khớp lệnh trực tiếp" : "Giá hiện tại"}
              </span>
            </div>

            {/* Target price */}
            <div className="border-gray-150 rounded-sm border bg-white p-3 dark:border-gray-900 dark:bg-black">
              <span className="block font-mono text-[9px] tracking-wider text-gray-400 uppercase dark:text-gray-500">
                Mục tiêu kỳ vọng (TP)
              </span>
              <span className="mt-1 block text-sm font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                {(stock.targetSellPrice * 1000).toLocaleString("vi-VN")}đ
              </span>
              <span className="mt-0.5 flex items-center text-[9px] font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                <Percent className="mr-0.5 h-3 w-3" />
                Kỳ vọng: +{targetProfitPercent.toFixed(1)}%
              </span>
            </div>

            {/* Stop loss price */}
            <div className="border-gray-150 rounded-sm border bg-white p-3 dark:border-gray-900 dark:bg-black">
              <span className="block font-mono text-[9px] tracking-wider text-gray-400 uppercase dark:text-gray-500">
                Ngưỡng cắt lỗ (SL)
              </span>
              <span className="mt-1 block text-sm font-bold text-rose-600 tabular-nums dark:text-rose-400">
                {(stock.stopLossPrice * 1000).toLocaleString("vi-VN")}đ
              </span>
              <span className="mt-0.5 flex items-center text-[9px] font-bold text-rose-600 tabular-nums dark:text-rose-400">
                <Percent className="mr-0.5 h-3 w-3" />
                Rủi ro: {stopLossPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-gray-900">
            <span className="flex items-center font-mono text-[10px] tracking-wider text-gray-400 uppercase dark:text-gray-500">
              <Scale className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
              Tỷ lệ Lợi nhuận/Rủi ro (R:R Ratio)
            </span>
            <span className="rounded-sm bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-800 tabular-nums dark:bg-gray-900 dark:text-gray-200">
              {stock.riskRewardRatio}
            </span>
          </div>
        </div>

        {/* Technical rationale */}
        <div className="space-y-2">
          <h4 className="dark:text-gray-450 flex items-center font-mono text-[10px] tracking-wider text-gray-500 uppercase">
            <Sparkles className="mr-2 h-3.5 w-3.5 text-gray-400" />
            Lý do khuyến nghị chi tiết
          </h4>
          <p className="border-gray-150 text-gray-750 rounded-sm border bg-white p-4 text-[11px] leading-relaxed dark:border-gray-900 dark:bg-black dark:text-gray-300">
            {stock.rationale}
          </p>
        </div>

        {/* Risk & Safety warning */}
        <div className="rounded-sm border border-amber-100/50 bg-amber-50/10 p-4 dark:border-amber-950/20 dark:bg-amber-950/5">
          <h4 className="mb-2 flex items-center font-mono text-[10px] tracking-wider text-amber-800 uppercase dark:text-amber-400">
            <ShieldAlert className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-500" />
            Cảnh báo rủi ro & Khuyến cáo
          </h4>
          <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-amber-800/80 dark:text-amber-400/80">
            <li>
              Mức độ rủi ro của mã này ở mức{" "}
              <strong className="font-bold uppercase">{stock.riskLevel}</strong>. Quyết định mua bán
              cần tuân thủ đúng điểm kích hoạt dừng lỗ và không giải ngân vượt quá 20% NAV cho một
              mã cổ phiếu đơn lẻ.
            </li>
            <li>
              Khuyến nghị chỉ có giá trị tham khảo ngắn hạn dựa trên phân tích kỹ thuật và dòng tiền
              thực tế tại thời điểm cập nhật. Nhà đầu tư tự chịu trách nhiệm trước quyết định giao
              dịch của mình.
            </li>
          </ul>
        </div>
      </div>

      <DialogFooter>
        <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-900">
          <div className="dark:text-gray-550 flex items-center space-x-1.5 font-mono text-[10px] text-gray-400 uppercase">
            <Info className="h-3.5 w-3.5 text-gray-400" />
            <span>Mức rủi ro định sẵn:</span>
            {getRiskLevelBadge(stock.riskLevel)}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-sm border border-gray-950 bg-gray-950 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-gray-900 focus:outline-none dark:border-gray-50 dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-100"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
