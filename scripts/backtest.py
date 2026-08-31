"""Vietnam T+2.5 Portfolio Backtest Engine for Alpha Pulse v2.

Simulates true portfolio equity curve with Vietnam T+2.5 settlement rules:
1. Signal Generation (T Close): Strategy evaluates data up to T.
2. Order Execution (T+1 Open): Buys executed at T+1 Open. Fails if price hits exchange ceiling limit.
3. Settlement Horizon (T+1 to T+2): Cash debited, shares locked in T+2.5 settlement pipeline.
4. Liquidity & Trade Exit (T+3 onwards): Shares unlocked. Exits evaluated at Open/Close with floor limit check.
5. True Portfolio Accounting: Tracks cash balance, active positions, daily mark-to-market equity curve,
   true CAGR, true Peak-to-Trough Max Drawdown, and daily portfolio Sharpe/Sortino ratios.

FAILS with INSUFFICIENT_HISTORICAL_DATA if real historical data is unavailable.
"""

import logging
import os
import sys

import numpy as np
import pandas as pd

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from scripts.lib.recommendation import generate_recommendation
from scripts.lib.regime import detect_market_regime
from scripts.lib.vietnam_market import (
    CANDIDATE_STOCKS,
    get_exchange_price_limits,
    get_historical_data,
)

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)


class VietnamPortfolioBacktester:
    def __init__(
        self,
        initial_capital: float = 100_000_000.0,
        brokerage_fee_pct: float = 0.15,
        sell_tax_pct: float = 0.10,
        slippage_pct: float = 0.10,
        max_position_pct: float = 0.15,
        max_open_positions: int = 5,
    ):
        self.initial_capital = initial_capital
        self.brokerage_fee = brokerage_fee_pct / 100.0
        self.sell_tax = sell_tax_pct / 100.0
        self.slippage = slippage_pct / 100.0
        self.max_position_pct = max_position_pct
        self.max_open_positions = max_open_positions

    def run(self, allow_synthetic: bool = False) -> dict:
        logger.info("Initializing Vietnam T+2.5 Portfolio Backtest Engine...")

        df_vn, tag_vn, _ = get_historical_data(
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

        # Pre-fetch candidate stocks
        sample_symbols = CANDIDATE_STOCKS[:15]
        stock_data = {}

        for item in sample_symbols:
            sym = item["symbol"]
            df_stock, _tag_stock, _ = get_historical_data(
                sym, use_cache_only=False, allow_synthetic=allow_synthetic
            )
            if not df_stock.empty and len(df_stock) >= 50:
                df_stock = df_stock.copy()
                for col in ["open", "high", "low", "close", "volume"]:
                    if col in df_stock.columns:
                        df_stock[col] = pd.to_numeric(df_stock[col], errors="coerce")

                df_stock["time_str"] = df_stock["time"].astype(str)
                stock_data[sym] = {
                    "df": df_stock,
                    "info": item,
                    "dates": set(df_stock["time_str"]),
                }

        if not stock_data:
            return {
                "status": "INSUFFICIENT_HISTORICAL_DATA",
                "reason": "No valid candidate stock historical data loaded.",
                "total_trades": 0,
                "cagr_percent": 0.0,
                "win_rate_percent": 0.0,
                "profit_factor": 0.0,
                "net_return_percent": 0.0,
            }

        dates = list(df_vn["time"].astype(str))
        start_idx = 40
        eval_dates = dates[start_idx:]

        cash = self.initial_capital
        open_positions = {}
        completed_trades = []
        equity_curve = []
        buy_signal_returns = {"5d": [], "10d": [], "20d": []}

        for t_idx, current_date in enumerate(eval_dates, start=start_idx):
            df_vn_sub = df_vn.iloc[: t_idx + 1]
            regime_info = detect_market_regime(df_vnindex=df_vn_sub)

            # 1. Update settlement progress
            for sym, pos in list(open_positions.items()):
                pos["settlement_days"] += 1

            # 2. Process exits for TRADABLE positions (settlement_days >= 3 -> T+2.5 reached)
            for sym, pos in list(open_positions.items()):
                if pos["settlement_days"] < 3:
                    continue  # Shares strictly locked in T+2.5 pipeline

                df_st = stock_data[sym]["df"]
                st_sub = df_st[df_st["time_str"] == current_date]
                if st_sub.empty:
                    continue

                row = st_sub.iloc[0]
                curr_open = float(row["open"])
                curr_close = float(row["close"])
                curr_low = float(row["low"])
                curr_high = float(row["high"])

                exchange = stock_data[sym]["info"].get("exchange", "HOSE")
                prev_sub = df_st[df_st["time_str"] < current_date]
                prev_close = (
                    float(prev_sub["close"].iloc[-1])
                    if not prev_sub.empty
                    else curr_open
                )
                _, _, floor_p = get_exchange_price_limits(prev_close, exchange)

                exit_triggered = False
                exit_price = curr_close

                if curr_low <= pos["stop_loss"]:
                    exit_triggered = True
                    exit_price = min(curr_open, pos["stop_loss"])
                elif curr_high >= pos["take_profit"]:
                    exit_triggered = True
                    exit_price = max(curr_open, pos["take_profit"])
                elif pos["settlement_days"] >= 10:
                    exit_triggered = True
                    exit_price = curr_close

                if exit_triggered:
                    if curr_low <= floor_p or exit_price <= floor_p:
                        logger.warning(
                            "Sell exit for %s blocked on %s: Hit floor price limit (%s)",
                            sym,
                            current_date,
                            floor_p,
                        )
                        continue

                    effective_exit_p = exit_price * (1.0 - self.slippage)
                    gross_proceeds = pos["shares"] * effective_exit_p
                    exit_cost = gross_proceeds * (self.brokerage_fee + self.sell_tax)
                    net_proceeds = gross_proceeds - exit_cost

                    cash += net_proceeds

                    gross_ret = (exit_price - pos["entry_price"]) / pos["entry_price"]
                    net_ret = (net_proceeds - (pos["shares"] * pos["entry_price"])) / (
                        pos["shares"] * pos["entry_price"]
                    )

                    completed_trades.append(
                        {
                            "symbol": sym,
                            "entry_date": pos["entry_date"],
                            "exit_date": current_date,
                            "entry_price": round(pos["entry_price"], 2),
                            "exit_price": round(exit_price, 2),
                            "shares": pos["shares"],
                            "holding_sessions": pos["settlement_days"],
                            "gross_return_percent": round(gross_ret * 100.0, 2),
                            "net_return_percent": round(net_ret * 100.0, 2),
                        }
                    )
                    del open_positions[sym]

            # 3. Evaluate new BUY signals & Execution at T+1 Open
            if len(open_positions) < self.max_open_positions:
                for sym, st_dict in stock_data.items():
                    if sym in open_positions:
                        continue
                    if len(open_positions) >= self.max_open_positions:
                        break

                    df_st = st_dict["df"]
                    st_sub = df_st[df_st["time_str"] <= current_date]
                    if len(st_sub) < 40:
                        continue

                    rec = generate_recommendation(
                        symbol=sym,
                        company_name=st_dict["info"]["companyName"],
                        sector=st_dict["info"]["sector"],
                        exchange=st_dict["info"].get("exchange", "HOSE"),
                        df_stock=st_sub,
                        market_regime_info=regime_info,
                        df_vnindex=df_vn_sub,
                    )

                    if rec["action"] == "BUY":
                        next_sub = df_st[df_st["time_str"] > current_date]
                        if next_sub.empty:
                            continue

                        t1_row = next_sub.iloc[0]
                        t1_date = str(t1_row["time_str"])
                        t1_open = float(t1_row["open"])
                        t1_high = float(t1_row["high"])

                        curr_close = float(st_sub["close"].iloc[-1])
                        exchange = st_dict["info"].get("exchange", "HOSE")
                        _, ceil_p, _ = get_exchange_price_limits(curr_close, exchange)

                        if t1_open >= ceil_p or t1_high >= ceil_p:
                            logger.info(
                                "Buy order for %s rejected on %s: Hit ceiling price (%s)",
                                sym,
                                t1_date,
                                ceil_p,
                            )
                            continue

                        pos_budget = min(
                            cash * self.max_position_pct,
                            self.initial_capital * self.max_position_pct,
                        )
                        if pos_budget < 5_000_000.0:
                            continue

                        effective_entry_p = t1_open * (1.0 + self.slippage)
                        entry_cost_per_share = effective_entry_p * (
                            1.0 + self.brokerage_fee
                        )

                        shares = (int(pos_budget / entry_cost_per_share) // 100) * 100
                        if shares <= 0:
                            continue

                        total_cost = shares * entry_cost_per_share
                        if cash < total_cost:
                            continue

                        cash -= total_cost

                        tp = (
                            rec["trade_plan"]["tp1"]
                            if rec["trade_plan"].get("tp1")
                            else t1_open * 1.08
                        )
                        sl = (
                            rec["trade_plan"]["stop_loss"]
                            if rec["trade_plan"].get("stop_loss")
                            else t1_open * 0.93
                        )

                        open_positions[sym] = {
                            "shares": shares,
                            "entry_price": round(t1_open, 2),
                            "entry_date": t1_date,
                            "settlement_days": 1,
                            "stop_loss": sl,
                            "take_profit": tp,
                        }

                        if len(next_sub) >= 5:
                            buy_signal_returns["5d"].append(
                                (float(next_sub["close"].iloc[4]) - t1_open) / t1_open
                            )
                        if len(next_sub) >= 10:
                            buy_signal_returns["10d"].append(
                                (float(next_sub["close"].iloc[9]) - t1_open) / t1_open
                            )
                        if len(next_sub) >= 20:
                            buy_signal_returns["20d"].append(
                                (float(next_sub["close"].iloc[19]) - t1_open) / t1_open
                            )

            # 4. Mark-to-Market Portfolio Equity Calculation
            portfolio_val = cash
            for sym, pos in open_positions.items():
                df_st = stock_data[sym]["df"]
                st_sub = df_st[df_st["time_str"] == current_date]
                m2m_p = (
                    float(st_sub["close"].iloc[0])
                    if not st_sub.empty
                    else pos["entry_price"]
                )
                portfolio_val += pos["shares"] * m2m_p

            equity_curve.append(portfolio_val)

        # 5. Compute Portfolio Performance Metrics
        eq_series = pd.Series(equity_curve)
        total_sessions = len(eq_series)
        final_equity = (
            eq_series.iloc[-1] if not eq_series.empty else self.initial_capital
        )

        cagr = (
            ((final_equity / self.initial_capital) ** (252.0 / max(total_sessions, 1)))
            - 1.0
        ) * 100.0

        cummax = eq_series.cummax()
        drawdown = (eq_series - cummax) / cummax
        max_dd = abs(drawdown.min()) * 100.0 if not drawdown.empty else 0.0

        daily_returns = eq_series.pct_change().dropna()
        mean_ret = daily_returns.mean()
        std_ret = daily_returns.std()

        sharpe = (
            (mean_ret / std_ret) * np.sqrt(252)
            if std_ret > 0 and not np.isnan(std_ret)
            else 0.0
        )

        downside_returns = daily_returns[daily_returns < 0]
        downside_std = downside_returns.std()
        sortino = (
            (mean_ret / downside_std) * np.sqrt(252)
            if downside_std > 0 and not np.isnan(downside_std)
            else 0.0
        )

        n_trades = len(completed_trades)
        if n_trades > 0:
            net_rets = [t["net_return_percent"] for t in completed_trades]
            winning = [r for r in net_rets if r > 0]
            losing = [r for r in net_rets if r <= 0]
            win_rate = (len(winning) / n_trades) * 100.0
            gross_profit = sum(winning) if winning else 0.0
            gross_loss = abs(sum(losing)) if losing else 1e-6
            profit_factor = gross_profit / gross_loss
            avg_holding = np.mean([t["holding_sessions"] for t in completed_trades])
        else:
            win_rate, profit_factor, avg_holding = 0.0, 0.0, 0.0

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

        return {
            "status": "SUCCESS",
            "data_source": tag_vn,
            "initial_capital": self.initial_capital,
            "final_equity": round(final_equity, 2),
            "cagr_percent": round(cagr, 2),
            "win_rate_percent": round(win_rate, 2),
            "profit_factor": round(profit_factor, 2),
            "max_drawdown_percent": round(max_dd, 2),
            "sharpe_ratio": round(sharpe, 2),
            "sortino_ratio": round(sortino, 2),
            "avg_holding_period_days": round(avg_holding, 1),
            "total_trades": n_trades,
            "transaction_costs_roundtrip_percent": round(
                (self.brokerage_fee * 2 + self.sell_tax + self.slippage * 2) * 100, 2
            ),
            "buy_signal_returns": {
                "avg_return_5d_percent": round(avg_5d, 2),
                "avg_return_10d_percent": round(avg_10d, 2),
                "avg_return_20d_percent": round(avg_20d, 2),
            },
            "sample_trades": completed_trades[:5],
        }


def run_backtest(
    initial_capital: float = 100_000_000.0,
    brokerage_fee_pct: float = 0.15,
    sell_tax_pct: float = 0.10,
    slippage_pct: float = 0.10,
    allow_synthetic: bool = False,
) -> dict:
    tester = VietnamPortfolioBacktester(
        initial_capital=initial_capital,
        brokerage_fee_pct=brokerage_fee_pct,
        sell_tax_pct=sell_tax_pct,
        slippage_pct=slippage_pct,
    )
    return tester.run(allow_synthetic=allow_synthetic)


def main():
    report = run_backtest(allow_synthetic=False)
    print("\n=====================================================================")
    print("KẾT QUẢ PORTFOLIO BACKTEST ALPHA PULSE V2 (T+2.5 CONSTRAINTS)")
    print("=====================================================================")
    print(f"Status:                  {report.get('status')}")
    if report.get("status") == "INSUFFICIENT_HISTORICAL_DATA":
        print(f"Reason:                  {report.get('reason')}")
    else:
        print(f"Data Source:             {report.get('data_source')}")
        print(f"Vốn ban đầu:             {report.get('initial_capital'):,.0f} VNĐ")
        print(f"Giá trị cuối:            {report.get('final_equity'):,.0f} VNĐ")
        print(f"CAGR (Net):              {report['cagr_percent']}%")
        print(f"Win Rate:                {report['win_rate_percent']}%")
        print(f"Profit Factor:           {report['profit_factor']}")
        print(f"Max Drawdown:            {report['max_drawdown_percent']}%")
        print(f"Sharpe Ratio:            {report['sharpe_ratio']}")
        print(f"Sortino Ratio:           {report['sortino_ratio']}")
        print(f"Avg Holding Period:      {report['avg_holding_period_days']} phiên")
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
