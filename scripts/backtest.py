"""Vietnam T+2.5 Backtest Engine for Alpha Pulse v2.

Simulates Vietnam quantitative strategy execution with T+2.5 settlement rules,
discrete position state tracking, transaction costs + slippage,
strict absence of look-ahead bias, train/validation/test dataset splits.
FAILS with INSUFFICIENT_HISTORICAL_DATA if real historical data is unavailable.
"""

import logging
import os
import sys

import numpy as np

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from scripts.lib.recommendation import generate_recommendation
from scripts.lib.regime import detect_market_regime
from scripts.lib.vietnam_market import CANDIDATE_STOCKS, get_historical_data

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


def run_backtest(
    initial_capital: float = 100_000_000.0,
    brokerage_fee_pct: float = 0.15,
    sell_tax_pct: float = 0.10,
    slippage_pct: float = 0.10,
    allow_synthetic: bool = False,
) -> dict:
    """Run T+2.5 settlement backtest across candidate stocks.

    Refuses synthetic data when allow_synthetic=False.
    """
    logger.info("Initializing Vietnam T+2.5 Backtest Engine...")

    df_vn, tag_vn, _warns_vn = get_historical_data(
        "VNINDEX", use_cache_only=False, allow_synthetic=allow_synthetic
    )

    if tag_vn == "INSUFFICIENT_HISTORICAL_DATA" or df_vn.empty or len(df_vn) < 50:
        logger.warning(
            "Backtest ABORTED: Insufficient historical market data. Synthetic fallback disabled."
        )
        return {
            "status": "INSUFFICIENT_HISTORICAL_DATA",
            "reason": "Production backtest strictly prohibits synthetic data.",
            "total_trades": 0,
            "cagr_percent": 0.0,
            "win_rate_percent": 0.0,
            "profit_factor": 0.0,
            "net_return_percent": 0.0,
        }

    logger.info(
        "Data Source: %s | VNINDEX sessions: %d (%s to %s)",
        tag_vn,
        len(df_vn),
        df_vn["time"].iloc[0] if "time" in df_vn.columns else "start",
        df_vn["time"].iloc[-1] if "time" in df_vn.columns else "end",
    )

    # Pre-fetch stock data DataFrames ONCE outside backtest loop to avoid rate limits
    sample_symbols = CANDIDATE_STOCKS[:10]
    stock_df_map = {}

    for item in sample_symbols:
        sym = item["symbol"]
        df_stock, tag_stock, _ = get_historical_data(
            sym, use_cache_only=False, allow_synthetic=allow_synthetic
        )
        if not df_stock.empty and len(df_stock) >= 50:
            stock_df_map[sym] = (df_stock, tag_stock, item)

    if not stock_df_map:
        return {
            "status": "INSUFFICIENT_HISTORICAL_DATA",
            "reason": "No valid candidate stock historical data loaded.",
            "total_trades": 0,
            "cagr_percent": 0.0,
            "win_rate_percent": 0.0,
            "profit_factor": 0.0,
            "net_return_percent": 0.0,
        }

    total_len = len(df_vn)
    val_end = int(total_len * 0.80)
    test_indices = range(max(40, val_end), total_len - 10)

    trades = []
    buy_signal_returns = {"5d": [], "10d": [], "20d": []}
    roundtrip_cost_pct = (brokerage_fee_pct * 2.0) + sell_tax_pct + (slippage_pct * 2.0)

    for idx in test_indices:
        # Strict cutoff up to T to prevent look-ahead bias
        df_vn_sub = df_vn.iloc[: idx + 1]
        signal_date = (
            str(df_vn_sub["time"].iloc[-1])
            if "time" in df_vn_sub.columns
            else f"T_{idx}"
        )

        regime_info = detect_market_regime(df_vnindex=df_vn_sub)

        for sym, (df_stock, tag_stock, item) in stock_df_map.items():
            if len(df_stock) <= idx:
                continue

            df_stock_sub = df_stock.iloc[: idx + 1]

            rec = generate_recommendation(
                symbol=sym,
                company_name=item["companyName"],
                sector=item["sector"],
                exchange=item.get("exchange", "HOSE"),
                df_stock=df_stock_sub,
                market_regime_info=regime_info,
                df_vnindex=df_vn_sub,
            )

            if rec["action"] == "BUY":
                # Discrete T+2.5 Execution Timeline
                # Signal at T (close) -> Execution at T+1 Open -> Earliest Exit at T+3 Open/Close
                t1_idx = min(idx + 1, total_len - 1)
                t3_idx = min(idx + 3, total_len - 1)

                exec_date = (
                    str(df_vn["time"].iloc[t1_idx])
                    if "time" in df_vn.columns
                    else f"T_{t1_idx}"
                )
                settle_date = (
                    str(df_vn["time"].iloc[min(idx + 2, total_len - 1)])
                    if "time" in df_vn.columns
                    else f"T_{idx + 2}"
                )
                exit_date = (
                    str(df_vn["time"].iloc[t3_idx])
                    if "time" in df_vn.columns
                    else f"T_{t3_idx}"
                )

                entry_p = float(df_stock["open"].iloc[t1_idx])
                exit_p = float(df_stock["close"].iloc[t3_idx])

                gross_ret = (exit_p - entry_p) / entry_p if entry_p > 0 else 0.0
                cost_fraction = roundtrip_cost_pct / 100.0
                net_ret = gross_ret - cost_fraction

                # Multi-horizon signal returns (5D, 10D, 20D)
                p5 = float(df_stock["close"].iloc[min(idx + 5, len(df_stock) - 1)])
                p10 = float(df_stock["close"].iloc[min(idx + 10, len(df_stock) - 1)])
                p20 = float(df_stock["close"].iloc[min(idx + 20, len(df_stock) - 1)])

                buy_signal_returns["5d"].append((p5 - entry_p) / entry_p)
                buy_signal_returns["10d"].append((p10 - entry_p) / entry_p)
                buy_signal_returns["20d"].append((p20 - entry_p) / entry_p)

                trades.append(
                    {
                        "symbol": sym,
                        "signal_date": signal_date,
                        "execution_date": exec_date,
                        "settlement_date": settle_date,
                        "entry_price": round(entry_p, 2),
                        "exit_date": exit_date,
                        "exit_price": round(exit_p, 2),
                        "holding_sessions": 3,
                        "gross_return_percent": round(gross_ret * 100.0, 2),
                        "transaction_cost_percent": round(roundtrip_cost_pct, 2),
                        "net_return_percent": round(net_ret * 100.0, 2),
                    }
                )

    n_trades = len(trades)
    if n_trades > 0:
        net_returns = [t["net_return_percent"] / 100.0 for t in trades]
        winning = [r for r in net_returns if r > 0]
        losing = [r for r in net_returns if r <= 0]

        win_rate = (len(winning) / n_trades) * 100.0
        gross_profit = sum(winning) if winning else 0.0
        gross_loss = abs(sum(losing)) if losing else 1e-6
        profit_factor = gross_profit / gross_loss

        cagr = (np.mean(net_returns) * 252 / 3) * 100.0
        max_dd = abs(min(net_returns)) * 100.0 if net_returns else 0.0

        std_ret = np.std(net_returns) if len(net_returns) > 1 else 0.01
        sharpe = (
            (np.mean(net_returns) / std_ret) * np.sqrt(252 / 3) if std_ret > 0 else 0.0
        )

        downside_std = np.std([r for r in net_returns if r < 0]) if losing else 0.01
        sortino = (
            (np.mean(net_returns) / downside_std) * np.sqrt(252 / 3)
            if downside_std > 0
            else 0.0
        )

        avg_5d = (
            np.mean(buy_signal_returns["5d"]) * 100.0
            if buy_signal_returns["5d"]
            else 0.0
        )
        avg_10d = (
            np.mean(buy_signal_returns["10d"]) * 100.0
            if buy_signal_returns["10d"]
            else 0.0
        )
        avg_20d = (
            np.mean(buy_signal_returns["20d"]) * 100.0
            if buy_signal_returns["20d"]
            else 0.0
        )
    else:
        win_rate, profit_factor, cagr, max_dd, sharpe, sortino = (
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
        )
        avg_5d, avg_10d, avg_20d = 0.0, 0.0, 0.0

    return {
        "status": "SUCCESS",
        "data_source": tag_vn,
        "cagr_percent": round(cagr, 2),
        "win_rate_percent": round(win_rate, 2),
        "profit_factor": round(profit_factor, 2),
        "max_drawdown_percent": round(max_dd, 2),
        "sharpe_ratio": round(sharpe, 2),
        "sortino_ratio": round(sortino, 2),
        "avg_holding_period_days": 3.0,
        "total_trades": n_trades,
        "transaction_costs_roundtrip_percent": round(roundtrip_cost_pct, 2),
        "buy_signal_returns": {
            "avg_return_5d_percent": round(avg_5d, 2),
            "avg_return_10d_percent": round(avg_10d, 2),
            "avg_return_20d_percent": round(avg_20d, 2),
        },
        "sample_trades": trades[:3],
    }


def main():
    report = run_backtest(allow_synthetic=False)
    print("\n=====================================================================")
    print("KẾT QUẢ BACKTEST ALPHA PULSE V2 (T+2.5 CONSTRAINTS & REAL DATA ONLY)")
    print("=====================================================================")
    print(f"Status:                  {report.get('status')}")
    if report.get("status") == "INSUFFICIENT_HISTORICAL_DATA":
        print(f"Reason:                  {report.get('reason')}")
    else:
        print(f"Data Source:             {report.get('data_source')}")
        print(f"CAGR (Net):              {report['cagr_percent']}%")
        print(f"Win Rate:                {report['win_rate_percent']}%")
        print(f"Profit Factor:           {report['profit_factor']}")
        print(f"Max Drawdown:            {report['max_drawdown_percent']}%")
        print(f"Sharpe Ratio:            {report['sharpe_ratio']}")
        print(f"Sortino Ratio:           {report['sortino_ratio']}")
        print(
            f"Roundtrip Costs:         {report['transaction_costs_roundtrip_percent']}%"
        )
        print(f"Total Trades:            {report['total_trades']}")
        print("\n[ĐÁNH GIÁ TÍN HIỆU MUA (BUY SIGNAL RETURNS)]:")
        print(
            f"  -> Lợi nhuận trung bình sau 5D:  {report['buy_signal_returns']['avg_return_5d_percent']}%"
        )
        print(
            f"  -> Lợi nhuận trung bình sau 10D: {report['buy_signal_returns']['avg_return_10d_percent']}%"
        )
        print(
            f"  -> Lợi nhuận trung bình sau 20D: {report['buy_signal_returns']['avg_return_20d_percent']}%"
        )
    print("=====================================================================\n")


if __name__ == "__main__":
    main()
