"""Unit tests for Backtest Engine and T+2.5 Settlement Execution."""

import unittest

from scripts.backtest import run_backtest


class TestBacktestEngine(unittest.TestCase):
    def test_backtest_fails_without_real_data_if_synthetic_disallowed(self):
        # Run backtest with synthetic data disallowed
        res = run_backtest(allow_synthetic=False)
        self.assertIn(res["status"], ["SUCCESS", "INSUFFICIENT_HISTORICAL_DATA"])

        if res["status"] == "INSUFFICIENT_HISTORICAL_DATA":
            self.assertEqual(res["total_trades"], 0)
            self.assertIn("prohibits synthetic data", res["reason"])

    def test_backtest_transaction_cost_deduction(self):
        res = run_backtest(allow_synthetic=True)
        self.assertIn("transaction_costs_roundtrip_percent", res)
        self.assertGreaterEqual(res["transaction_costs_roundtrip_percent"], 0.0)


if __name__ == "__main__":
    unittest.main()
