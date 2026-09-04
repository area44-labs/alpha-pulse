"""Unit tests for T+2.5 Risk Model."""

import unittest
import numpy as np
import pandas as pd

from engine.strategy.risk import calculate_t25_risk_metrics, normalize_universe_liquidity_scores


class TestRiskModel(unittest.TestCase):
    def setUp(self):
        dates = pd.date_range("2026-01-01", periods=60, freq="B")
        np.random.seed(42)
        close = 20.0 + np.cumsum(np.random.normal(0.0, 0.4, 60))

        self.df_stock = pd.DataFrame(
            {
                "time": dates,
                "open": close,
                "high": close + 0.3,
                "low": close - 0.3,
                "close": close,
                "volume": 1000000,
            }
        )

    def test_t25_risk_metrics(self):
        metrics = calculate_t25_risk_metrics(self.df_stock, exchange="HOSE")
        self.assertIsNotNone(metrics["var_t25"])
        self.assertIsNotNone(metrics["volatility_60d"])
        self.assertIsNotNone(metrics["max_drawdown"])

    def test_universe_liquidity_normalization(self):
        scanned = [
            {"symbol": "A", "risk_metrics": {"avg_value_20d": 10.0}},
            {"symbol": "B", "risk_metrics": {"avg_value_20d": 50.0}},
            {"symbol": "C", "risk_metrics": {"avg_value_20d": 100.0}},
        ]
        norm = normalize_universe_liquidity_scores(scanned)
        self.assertEqual(norm[2]["risk_metrics"]["liquidity_score"], 100.0)


if __name__ == "__main__":
    unittest.main()
