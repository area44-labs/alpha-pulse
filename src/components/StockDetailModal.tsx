import { ShieldAlert, Target, Info, Percent, Sparkles, Scale } from "lucide-react";

import { Badge } from "./ui/Badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/Dialog";

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
            className="px-3 py-1 text-xs font-bold uppercase"
          >
            {isBuy ? "Nên Mua (BUY)" : "Nên Bán (SELL)"}
          </Badge>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Alpha Pulse VM Premium
          </span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <DialogTitle className="flex items-center gap-2 text-2xl font-extrabold text-gray-900 dark:text-white">
              <span>{stock.symbol}</span>
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                - {stock.companyName}
              </span>
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
              Ngành: {stock.sector}
            </DialogDescription>
          </div>
          <div className="text-right">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Giá hiện tại</div>
            <div className="text-xl font-extrabold text-gray-950 dark:text-gray-50">
              {(stock.currentPrice * 1000).toLocaleString("vi-VN")}đ
            </div>
          </div>
        </div>
      </DialogHeader>

      {/* Body container */}
      <div className="mt-5 space-y-6 text-sm text-gray-700 dark:text-gray-300">
        {/* Trading Plan section */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/40">
          <h4 className="mb-3.5 flex items-center text-xs font-bold tracking-wider text-gray-900 uppercase dark:text-gray-200">
            <Target className="mr-2 h-4 w-4 text-indigo-500" />
            Chi tiết kế hoạch giao dịch
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Entry point */}
            <div className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
              <span className="block text-[11px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                Vùng mua an toàn
              </span>
              <span className="mt-1 block text-base font-extrabold text-gray-950 dark:text-gray-50">
                {isBuy ? `${stock.targetBuyPrice} nghìnđ` : "Bán ngay"}
              </span>
              <span className="mt-0.5 block text-[10px] font-medium text-gray-500">
                {isBuy ? "Khớp lệnh trực tiếp" : "Giá hiện tại"}
              </span>
            </div>

            {/* Target price */}
            <div className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
              <span className="block text-[11px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                Mục tiêu kỳ vọng (TP)
              </span>
              <span className="mt-1 block text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {(stock.targetSellPrice * 1000).toLocaleString("vi-VN")}đ
              </span>
              <span className="mt-0.5 flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <Percent className="mr-0.5 h-3 w-3" />
                Kỳ vọng: +{targetProfitPercent.toFixed(1)}%
              </span>
            </div>

            {/* Stop loss price */}
            <div className="rounded-lg border border-gray-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-950">
              <span className="block text-[11px] font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                Ngưỡng cắt lỗ (SL)
              </span>
              <span className="mt-1 block text-base font-extrabold text-rose-600 dark:text-rose-400">
                {(stock.stopLossPrice * 1000).toLocaleString("vi-VN")}đ
              </span>
              <span className="mt-0.5 flex items-center text-[10px] font-bold text-rose-600 dark:text-rose-400">
                <Percent className="mr-0.5 h-3 w-3" />
                Rủi ro: {stopLossPercent.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs dark:border-gray-800">
            <span className="flex items-center font-medium text-gray-500">
              <Scale className="mr-1.5 h-4 w-4 text-gray-400" />
              Tỷ lệ Lợi nhuận/Rủi ro (R:R Ratio)
            </span>
            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-bold text-gray-900 dark:bg-indigo-950/40 dark:text-white">
              {stock.riskRewardRatio}
            </span>
          </div>
        </div>

        {/* Technical rationale */}
        <div className="space-y-2.5">
          <h4 className="flex items-center text-xs font-bold tracking-wider text-gray-900 uppercase dark:text-gray-200">
            <Sparkles className="mr-2 h-4 w-4 animate-pulse text-indigo-500" />
            Lý do khuyến nghị chi tiết
          </h4>
          <p className="dark:border-gray-850 rounded-xl border border-gray-100 bg-white p-4 leading-relaxed text-gray-700 shadow-2xs dark:bg-gray-900/20 dark:text-gray-300">
            {stock.rationale}
          </p>
        </div>

        {/* Risk & Safety warning */}
        <div className="rounded-xl border border-amber-200/50 bg-amber-50/25 p-4 dark:border-amber-950/20 dark:bg-amber-950/5">
          <h4 className="mb-2 flex items-center text-xs font-bold tracking-wider text-amber-800 uppercase dark:text-amber-400">
            <ShieldAlert className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-500" />
            Cảnh báo rủi ro hệ thống & Khuyến cáo
          </h4>
          <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed font-medium text-amber-700/90 dark:text-amber-400/85">
            <li>
              Mức độ rủi ro của mã này ở mức{" "}
              <strong className="uppercase underline">{stock.riskLevel}</strong>. Quyết định mua bán
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
        <div className="border-gray-150 flex w-full flex-wrap items-center justify-between gap-2 border-t pt-2 dark:border-gray-800">
          <div className="flex items-center space-x-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Info className="h-3.5 w-3.5 text-gray-400" />
            <span>Mức rủi ro định sẵn:</span>
            {getRiskLevelBadge(stock.riskLevel)}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-gray-800 focus:outline-none dark:bg-gray-50 dark:text-gray-950 dark:hover:bg-gray-100"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
