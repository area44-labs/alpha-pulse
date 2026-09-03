import { ShieldAlert, Target, Info, Percent, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

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

interface StockDetailModalProps {
  stock: Stock | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockDetailModal({ stock, isOpen, onOpenChange }: StockDetailModalProps) {
  if (!stock) return null;

  const isBuy = stock.type === "BUY";
  const currentPriceVnd =
    stock.currentPrice < 1000 ? stock.currentPrice * 1000 : stock.currentPrice;
  const targetSellPriceVnd =
    stock.targetSellPrice < 1000 ? stock.targetSellPrice * 1000 : stock.targetSellPrice;
  const stopLossPriceVnd =
    stock.stopLossPrice < 1000 ? stock.stopLossPrice * 1000 : stock.stopLossPrice;

  // Tính toán tỷ lệ phần trăm lợi nhuận kỳ vọng và mức sụt giảm cắt lỗ
  const targetProfitPercent = isBuy
    ? ((targetSellPriceVnd - currentPriceVnd) / currentPriceVnd) * 100
    : ((currentPriceVnd - targetSellPriceVnd) / currentPriceVnd) * 100;

  const stopLossPercent = isBuy
    ? ((stopLossPriceVnd - currentPriceVnd) / currentPriceVnd) * 100
    : ((currentPriceVnd - stopLossPriceVnd) / currentPriceVnd) * 100;

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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Badge
              variant={isBuy ? "success" : "destructive"}
              className="px-2 py-0.5 font-mono text-[10px] tracking-wider"
            >
              {isBuy ? "BUY" : "SELL"}
            </Badge>
            <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              Phân Tích Chi Tiết
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <DialogTitle className="flex items-baseline gap-2 text-lg font-bold text-foreground">
                <span className="text-xl font-extrabold">{stock.symbol}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {stock.companyName}
                </span>
              </DialogTitle>
              <DialogDescription className="mt-0.5 font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                Ngành: {stock.sector}
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                Giá hiện tại
              </div>
              <div className="text-base font-bold text-foreground tabular-nums">
                {currentPriceVnd.toLocaleString("vi-VN")}đ
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Body container */}
        <div className="mt-4 space-y-5 text-xs text-foreground">
          {/* Trading Plan section */}
          <div className="rounded-sm border border-border bg-muted/30 p-4">
            <h4 className="mb-3 flex items-center font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              <Target className="mr-2 h-4 w-4 text-muted-foreground" />
              Chi tiết kế hoạch giao dịch
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Entry point */}
              <div className="rounded-sm border border-border bg-background p-3">
                <span className="block font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                  Vùng mua an toàn
                </span>
                <span className="mt-1 block text-sm font-bold text-foreground">
                  {isBuy ? `${stock.targetBuyPrice} nghìn VNĐ` : "Bán ngay"}
                </span>
                <span className="mt-0.5 block font-mono text-[9px] text-muted-foreground">
                  {isBuy ? "Khớp lệnh trực tiếp" : "Giá hiện tại"}
                </span>
              </div>

              {/* Target price */}
              <div className="rounded-sm border border-border bg-background p-3">
                <span className="block font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                  Mục tiêu kỳ vọng (TP)
                </span>
                <span className="mt-1 block text-sm font-bold text-trend-up-text tabular-nums">
                  {targetSellPriceVnd.toLocaleString("vi-VN")}đ
                </span>
                <span className="mt-0.5 flex items-center text-[9px] font-bold text-trend-up-text tabular-nums">
                  <Percent className="mr-0.5 h-3 w-3" />
                  Kỳ vọng: +{targetProfitPercent.toFixed(1)}%
                </span>
              </div>

              {/* Stop loss price */}
              <div className="rounded-sm border border-border bg-background p-3">
                <span className="block font-mono text-[9px] tracking-wider text-muted-foreground uppercase">
                  Ngưỡng cắt lỗ (SL)
                </span>
                <span className="mt-1 block text-sm font-bold text-trend-down-text tabular-nums">
                  {stopLossPriceVnd.toLocaleString("vi-VN")}đ
                </span>
                <span className="mt-0.5 flex items-center text-[9px] font-bold text-trend-down-text tabular-nums">
                  <Percent className="mr-0.5 h-3 w-3" />
                  Rủi ro: {stopLossPercent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Technical rationale */}
          <div className="space-y-2">
            <h4 className="flex items-center font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
              <Sparkles className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              Lý do khuyến nghị
            </h4>
            <div className="rounded-sm border border-border bg-background p-4 text-[11px] leading-relaxed text-foreground">
              <p className="font-medium text-foreground">{stock.rationale}</p>
            </div>
          </div>

          {/* Risk & Safety warning */}
          <div className="rounded-sm border border-warning-border bg-warning-bg p-4">
            <h4 className="mb-2 flex items-center font-mono text-[10px] tracking-wider text-warning-text uppercase">
              <ShieldAlert className="mr-2 h-4 w-4 text-warning-icon" />
              Cảnh báo rủi ro & Khuyến cáo
            </h4>
            <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-warning-text/80">
              <li>
                Mức độ rủi ro của mã này ở mức{" "}
                <strong className="font-bold uppercase">{stock.riskLevel}</strong> (xác định dựa
                trên dữ liệu thực tế: độ biến động ATR %, hệ số Beta so với VN-Index và mức sụt giảm
                Max Drawdown). Quyết định mua bán cần tuân thủ đúng điểm kích hoạt dừng lỗ và không
                giải ngân vượt quá 20% NAV cho một mã cổ phiếu đơn lẻ.
              </li>
              <li>
                Khuyến nghị chỉ có giá trị tham khảo ngắn hạn dựa trên phân tích kỹ thuật và dòng
                tiền thực tế tại thời điểm cập nhật. Nhà đầu tư tự chịu trách nhiệm trước quyết định
                giao dịch của mình.
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <div className="flex items-center space-x-1.5 font-mono text-[10px] text-muted-foreground uppercase">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Mức rủi ro định lượng:</span>
              {getRiskLevelBadge(stock.riskLevel)}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="cursor-pointer rounded-sm border border-button-outline-border bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/80 focus:outline-none"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
