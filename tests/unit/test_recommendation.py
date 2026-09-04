"""Unit tests for Recommendation Engine."""

import unittest

import numpy as np
import pandas as pd

from engine.strategy.recommendation import generate_recommendation


class TestRecommendationEngine(unittest.TestCase):
    def setUp(self):
        dates = pd.date_range("2026-01-01", periods=60, freq="B")
        np.random.seed(42)
        close = 25.0 + np.cumsum(np.random.normal(0.1, 0.2, 60))
        high = close + 0.5
        low = close - 0.5

        self.df_stock = pd.DataFrame(
            {
                "time": dates,
                "open": close,
                "high": high,
                "low": low,
                "close": close,
                "volume": 500000,
            }
        )
        self.regime_bull = {"regime": "BULL", "regime_score": 75.0, "confidence": 0.85}

    def test_missing_data_returns_avoid(self):
        rec = generate_recommendation(
            "FPT", "FPT Corp", "Technology", "HOSE", None, self.regime_bull
        )
        self.assertEqual(rec["action"], "AVOID")
        self.assertIsNone(rec["trade_plan"]["current_price"])

    def test_valid_recommendation_generation(self):
        rec = generate_recommendation(
            "FPT", "FPT Corp", "Technology", "HOSE", self.df_stock, self.regime_bull
        )
        self.assertIn(rec["action"], ["BUY", "WATCH", "HOLD", "SELL", "AVOID"])
        self.assertIsNotNone(rec["trade_plan"]["current_price"])


if __name__ == "__main__":
    unittest.main()
