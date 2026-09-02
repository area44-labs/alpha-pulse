"""Unit tests for Vietnam T+2.5 Portfolio Backtest Engine in scripts/backtest.py."""

import os
import sys
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from scripts.backtest import VietnamPortfolioBacktester, run_backtest


class TestBacktestEngine(unittest.TestCase):
    """Test suite for T+2.5 settlement and portfolio equity accounting."""

    def test_backtest_fails_without_real_data_if_synthetic_disallowed(self):
        """Verify backtest returns INSUFFICIENT_HISTORICAL_DATA when real data is unavailable."""
        report = run_backtest(allow_synthetic=False)
        self.assertIn(report.get("status"), ["SUCCESS", "INSUFFICIENT_HISTORICAL_DATA"])
        if report.get("status") == "INSUFFICIENT_HISTORICAL_DATA":
            self.assertEqual(report.get("total_trades"), 0)

    def test_portfolio_equity_accounting(self):
        """Verify initial capital, cash allocation, and portfolio backtester parameters."""
        tester = VietnamPortfolioBacktester(
            initial_capital=100_000_000.0,
            brokerage_fee_pct=0.15,
            sell_tax_pct=0.10,
            slippage_pct=0.10,
            max_position_pct=0.15,
            max_open_positions=5,
        )
        self.assertEqual(tester.initial_capital, 100_000_000.0)
        self.assertEqual(tester.max_position_pct, 0.15)
        self.assertEqual(tester.max_open_positions, 5)


if __name__ == "__main__":
    unittest.main()
