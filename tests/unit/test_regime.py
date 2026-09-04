"""Unit tests for Market Regime Detection."""

import unittest

import numpy as np
import pandas as pd

from engine.strategy.regime import detect_market_regime


class TestMarketRegime(unittest.TestCase):
    def setUp(self):
        dates = pd.date_range("2026-01-01", periods=60, freq="B")
        close_bull = 1200.0 + np.linspace(0, 100, 60)
        close_bear = 1300.0 - np.linspace(0, 150, 60)

        self.df_bull = pd.DataFrame(
            {
                "time": dates,
                "open": close_bull,
                "high": close_bull + 5,
                "low": close_bull - 5,
                "close": close_bull,
                "volume": 1000000,
            }
        )
        self.df_bear = pd.DataFrame(
            {
                "time": dates,
                "open": close_bear,
                "high": close_bear + 5,
                "low": close_bear - 5,
                "close": close_bear,
                "volume": 1000000,
            }
        )

    def test_strong_bull_regime(self):
        regime = detect_market_regime(df_vnindex=self.df_bull, breadth_ratio=0.80)
        self.assertIn(regime["regime"], ["STRONG_BULL", "BULL"])
        self.assertGreaterEqual(regime["regime_score"], 60.0)

    def test_panic_or_bear_regime(self):
        regime = detect_market_regime(df_vnindex=self.df_bear, breadth_ratio=0.20)
        self.assertIn(regime["regime"], ["BEAR", "PANIC", "DEFENSIVE"])
        self.assertLessEqual(regime["regime_score"], 50.0)

    def test_insufficient_data_regime(self):
        regime = detect_market_regime(df_vnindex=pd.DataFrame())
        self.assertEqual(regime["regime"], "DEFENSIVE")
        self.assertEqual(regime["confidence"], 0.40)


if __name__ == "__main__":
    unittest.main()
