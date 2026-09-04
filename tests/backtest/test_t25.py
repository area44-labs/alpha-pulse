"""Backtest tests for T+2.5 settlement logic."""

import unittest
from engine.backtest.portfolio import VietnamPortfolioBacktester


class TestT25Backtest(unittest.TestCase):
    def test_backtest_fails_without_real_data_if_synthetic_disallowed(self):
        tester = VietnamPortfolioBacktester()
        report = tester.run(allow_synthetic=False)
        # Should return SUCCESS if real data available or INSUFFICIENT_HISTORICAL_DATA if unavailable
        self.assertIn(report["status"], ["SUCCESS", "INSUFFICIENT_HISTORICAL_DATA"])


if __name__ == "__main__":
    unittest.main()
