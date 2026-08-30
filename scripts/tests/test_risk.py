"""Unit tests for T+2.5 Risk Model in scripts/lib/risk.py."""

import unittest
import numpy as np
import pandas as pd
from scripts.lib.risk import calculate_t25_risk_metrics


class TestRiskModel(unittest.TestCase):
    def test_risk_metrics_sufficient_data(self):
        np.random.seed(42)
        n = 60
        dates = pd.date_range("2026-01-01", periods=n, freq="D")
        close_prices = 50.0 + np.cumsum(np.random.normal(0, 0.5, n))
        close_prices = np.clip(close_prices, 10.0, 100.0)
        volumes = np.random.randint(100000, 500000, n)

        df = pd.DataFrame(
            {
                "time": dates,
                "open": close_prices - 0.1,
                "high": close_prices + 0.5,
                "low": close_prices - 0.5,
                "close": close_prices,
                "volume": volumes,
            }
        )

        metrics = calculate_t25_risk_metrics(df, exchange="HOSE")

        self.assertIsNotNone(metrics["var_t25"])
        self.assertIsNotNone(metrics["es_t25"])
        self.assertIsNotNone(metrics["volatility_60d"])
        self.assertIsNotNone(metrics["max_drawdown"])
        self.assertIsNotNone(metrics["liquidity_score"])

        self.assertLessEqual(metrics["es_t25"], metrics["var_t25"])
        self.assertLessEqual(metrics["max_drawdown"], 0.0)

    def test_risk_metrics_missing_data(self):
        df_empty = pd.DataFrame()
        metrics = calculate_t25_risk_metrics(df_empty)

        self.assertIsNone(metrics["var_t25"])
        self.assertIsNone(metrics["es_t25"])
        self.assertIsNone(metrics["volatility_60d"])
        self.assertIsNone(metrics["max_drawdown"])
        self.assertIsNone(metrics["liquidity_score"])

    def test_risk_metrics_short_data(self):
        dates = pd.date_range("2026-01-01", periods=5, freq="D")
        df_short = pd.DataFrame(
            {
                "time": dates,
                "close": [10.0, 10.5, 10.2, 10.8, 11.0],
                "volume": [1000, 1000, 1000, 1000, 1000],
            }
        )
        metrics = calculate_t25_risk_metrics(df_short)

        self.assertIsNone(metrics["var_t25"])
        self.assertIsNone(metrics["es_t25"])

    def test_zero_volatility_and_liquidity(self):
        n = 30
        dates = pd.date_range("2026-01-01", periods=n, freq="D")
        df_flat = pd.DataFrame(
            {
                "time": dates,
                "close": [20.0] * n,
                "volume": [0] * n,
            }
        )
        metrics = calculate_t25_risk_metrics(df_flat)

        self.assertEqual(metrics["var_t25"], 0.0)
        self.assertEqual(metrics["es_t25"], 0.0)
        self.assertEqual(metrics["volatility_60d"], 0.0)
        self.assertEqual(metrics["max_drawdown"], 0.0)
        self.assertEqual(metrics["liquidity_score"], 0.0)


if __name__ == "__main__":
    unittest.main()
