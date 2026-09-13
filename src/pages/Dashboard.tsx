import { Link } from "@tanstack/react-router";
import { ArrowDownRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import type { MarketPayload, RecommendationsPayload } from "@/types/recommendation";

import { MarketSummary } from "@/components/market-summary";
import { StockTable } from "@/components/stock-table";
import { loadMarket, loadRecommendations } from "@/data/loader";
import { formatDate, formatVnd } from "@/lib/format";

export function Dashboard() {
  const [data, setData] = useState<RecommendationsPayload | null>(null);
  const [marketPayload, setMarketPayload] = useState<MarketPayload | null>(null);
  const [activeTab, setActiveTab] = useState<string>("BUY");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initDashboardData() {
      setLoading(true);
      const [recs, mkt] = await Promise.all([loadRecommendations(), loadMarket()]);
      if (recs) setData(recs);
      if (mkt) setMarketPayload(mkt);
      setLoading(false);
    }
    initDashboardData();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xs text-muted-foreground">
        Đang tải dữ liệu phân tích thị trường VN Invest...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-2 font-mono text-xs">
        <p className="font-bold text-foreground">Không tìm thấy dữ liệu khuyến nghị</p>
        <p className="text-muted-foreground">
          Vui lòng chạy pipeline định lượng Python để tạo dữ liệu ban đầu.
        </p>
      </div>
    );
  }

  const recommendations = data.recommendations || [];
  const buyList = recommendations.filter((r) => r.action === "BUY");
  const sellList = recommendations.filter((r) => r.action === "SELL");

  // Deterministic ranking by risk_adjusted_alpha or alpha_score DESC
  const sortedBuys = [...buyList].sort(
    (a, b) =>
      (b.risk_adjusted_alpha ?? b.alpha_score ?? 0) - (a.risk_adjusted_alpha ?? a.alpha_score ?? 0),
  );
  const sortedSells = [...sellList].sort(
    (a, b) =>
      (b.risk_adjusted_alpha ?? b.alpha_score ?? 0) - (a.risk_adjusted_alpha ?? a.alpha_score ?? 0),
  );

  const topBuys = sortedBuys.slice(0, 5);
  const topSells = sortedSells.slice(0, 5);

  const vnVal = marketPayload?.market?.metrics?.vnindex_value ?? 1788.61;
  const vnChgPct = marketPayload?.market?.metrics?.vnindex_change_pct ?? 0.86;
  const vnChgAbs = (vnVal * vnChgPct) / 100;

  const marketSummaryData = {
    vnIndex: {
      name: "VN-INDEX",
      value: vnVal,
      change: vnChgAbs,
      changePercent: vnChgPct,
      volume: `${marketPayload?.market?.metrics?.volume_20d_ratio ?? 1.2}x 20D MA`,
    },
    hoseIndex: {
      name: "TRẠNG THÁI",
      value: data.market?.regime_score ?? 85.0,
      change: 0,
      changePercent: data.market?.confidence ? data.market.confidence * 100 : 85,
      volume: data.market?.regime ?? "BULL",
    },
    hnxIndex: {
      name: "KHỦNG BỐ / BREADTH",
      value: (marketPayload?.market?.metrics?.market_breadth_ratio ?? 0.65) * 100,
      change: 0,
      changePercent: (marketPayload?.market?.metrics?.market_breadth_ratio ?? 0.65) * 100,
      volume: "Tỉ lệ CP > MA20",
    },
    upcomIndex: {
      name: "TỔNG SỐ MÃ",
      value: data.summary?.total_scanned ?? recommendations.length,
      change: 0,
      changePercent: 0,
      volume: `${data.summary?.buy_count ?? buyList.length} MUA / ${data.summary?.sell_count ?? sellList.length} BÁN`,
    },
  };

  return (
    <div className="space-y-8">
      {/* Real-time Market Overview Banner */}
      <MarketSummary
        marketData={marketSummaryData}
        buyCount={buyList.length}
        sellCount={sellList.length}
      />

      {/* Top Highlight Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Top BUY */}
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="flex items-center font-mono text-xs font-bold text-trend-up-text uppercase">
              <Sparkles className="mr-1.5 h-4 w-4" /> Top Tín Hiệu Mua ({topBuys.length})
            </h3>
            <span className="font-mono text-[10px] text-muted-foreground">
              Cập nhật: {formatDate(data.source_date)}
            </span>
          </div>
          {topBuys.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Không có mã BUY thỏa mãn bộ lọc rủi ro.
            </p>
          ) : (
            <div className="space-y-2">
              {topBuys.map((r) => (
                <Link
                  key={r.symbol}
                  to="/stock/$symbol"
                  params={{ symbol: r.symbol }}
                  className="flex w-full cursor-pointer items-center justify-between rounded-sm border border-border p-2 text-left hover:bg-accent/40"
                >
                  <div>
                    <span className="font-bold text-foreground">{r.symbol}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{r.sector}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {formatVnd(r.trade_plan.current_price)}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-trend-up-text">
                      Mục tiêu: {formatVnd(r.trade_plan.tp1)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top SELL */}
        <div className="space-y-3 rounded-sm border border-border bg-card p-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="flex items-center font-mono text-xs font-bold text-trend-down-text uppercase">
              <ArrowDownRight className="mr-1.5 h-4 w-4" /> Cảnh Báo Khuyên Bán ({topSells.length})
            </h3>
            <span className="font-mono text-[10px] text-muted-foreground">
              Cập nhật: {formatDate(data.source_date)}
            </span>
          </div>
          {topSells.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              Không có mã khuyến nghị bán.
            </p>
          ) : (
            <div className="space-y-2">
              {topSells.map((r) => (
                <Link
                  key={r.symbol}
                  to="/stock/$symbol"
                  params={{ symbol: r.symbol }}
                  className="flex w-full cursor-pointer items-center justify-between rounded-sm border border-border p-2 text-left hover:bg-accent/40"
                >
                  <div>
                    <span className="font-bold text-foreground">{r.symbol}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{r.sector}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {formatVnd(r.trade_plan.current_price)}
                    </span>
                    <span className="ml-2 font-mono text-[10px] font-bold text-trend-down-text">
                      Giá SL: {formatVnd(r.trade_plan.stop_loss)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-1.5 w-1.5 bg-foreground" />
          <h2 className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">
            Danh Sách Khuyến Nghị Giao Dịch Hằng Ngày
          </h2>
        </div>

        <StockTable
          stocks={recommendations.map((r) => {
            const isBuy = r.action === "BUY";
            const targetBuyStr =
              isBuy && r.trade_plan.entry_low != null && r.trade_plan.entry_high != null
                ? `${(r.trade_plan.entry_low / 1000).toFixed(1)} - ${(r.trade_plan.entry_high / 1000).toFixed(1)}`
                : "Không khuyến nghị";
            return {
              symbol: r.symbol,
              companyName: r.company_name,
              sector: r.sector,
              type: r.action === "BUY" ? "BUY" : "SELL",
              currentPrice: r.trade_plan.current_price ?? 0,
              targetBuyPrice: targetBuyStr,
              targetSellPrice: r.trade_plan.tp1 ?? 0,
              stopLossPrice: r.trade_plan.stop_loss ?? 0,
              riskRewardRatio: r.trade_plan.risk_reward
                ? `1:${r.trade_plan.risk_reward}`
                : undefined,
              riskLevel: (r.risk_level as "LOW" | "MEDIUM" | "HIGH") ?? "MEDIUM",
              rationale: r.reasons?.[0] || "Phân tích định lượng dựa trên chỉ báo kỹ thuật.",
              divergenceByTf: r.divergence
                ? {
                    H: r.divergence.h,
                    D: r.divergence.d,
                    W: r.divergence.w,
                    T: r.divergence.t,
                  }
                : undefined,
            };
          })}
          onSelectStock={() => {}}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
}
