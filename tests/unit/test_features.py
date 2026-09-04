"""Unit tests for Technical and Momentum Features."""

import unittest
import numpy as np
import pandas as pd

from engine.features.technical import (
    calculate_multi_timeframe_features,
    calculate_single_tf_indicators,
    detect_divergence,
)
from engine.features.momentum import calculate_relative_strength
from engine.features.volume import calculate_volume_ratio


class TestFeatures(unittest.TestCase):
    def setUp(self):
        dates = pd.date_range("2026-01-01", periods=60, freq="B")
        np.random.seed(42)
        close = 20.0 + np.cumsum(np.random.normal(0.05, 0.3, 60))
        high = close + np.random.uniform(0.1, 0.5, 60)
        low = close - np.random.uniform(0.1, 0.5, 60)
        open_p = close + np.random.uniform(-0.2, 0.2, 60)
        volume = np.random.randint(100000, 500000, 60)

        self.df_sample = pd.DataFrame(
            {
                "time": dates,
                "open": open_p,
                "high": high,
                "low": low,
                "close": close,
                "volume": volume,
            }
        )

    def test_single_tf_indicators(self):
        df_calc = calculate_single_tf_indicators(self.df_sample)
        self.assertIn("ma20", df_calc.columns)
        self.assertIn("ma50", df_calc.columns)
        self.assertIn("rsi", df_calc.columns)
        self.assertIn("macd", df_calc.columns)
        self.assertIn("atr", df_calc.columns)

        # Check RSI is bounded [0, 100]
        self.assertTrue((df_calc["rsi"] >= 0).all() and (df_calc["rsi"] <= 100).all())

    def test_divergence_detection(self):
        df_calc = calculate_single_tf_indicators(self.df_sample)
        div = detect_divergence(df_calc)
        self.assertIn("rsi_bullish", div)
        self.assertIn("rsi_bearish", div)
        self.assertIn("macd_bullish", div)
        self.assertIn("macd_bearish", div)

    def test_multi_timeframe_features(self):
        df_d, tf_summary = calculate_multi_timeframe_features(self.df_sample)
        self.assertIn("1d", tf_summary)
        self.assertIn("1w", tf_summary)
        self.assertIn("1m", tf_summary)
        self.assertTrue(tf_summary["1d"]["available"])

    def test_relative_strength(self):
        df_bench = self.df_sample.copy()
        df_bench["close"] = df_bench["close"] * 0.9  # Slower growth
        rs = calculate_relative_strength(self.df_sample, df_bench, window=20)
        self.assertIsInstance(rs, float)

    def test_volume_ratio(self):
        vr = calculate_volume_ratio(self.df_sample, window=20)
        self.assertGreater(vr, 0)


if __name__ == "__main__":
    unittest.main()
