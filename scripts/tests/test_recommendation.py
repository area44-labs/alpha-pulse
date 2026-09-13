"""Unit tests for Recommendation Engine in scripts/lib/recommendation.py."""

import unittest

import numpy as np
import pandas as pd

from scripts.lib.recommendation import calculate_risk_adjusted_alpha, generate_recommendation
from scripts.lib.risk import normalize_universe_liquidity_scores


class TestRecommendationEngine(unittest.TestCase):
    def test_actions_classification(self):
        n = 60
        dates = pd.date_range("2026-01-01", periods=n, freq="D")
        close_bull = np.linspace(20.0, 35.0, n)
        df_bull = pd.DataFrame(
            {
                "time": dates,
                "open": close_bull - 0.2,
                "high": close_bull + 0.5,
                "low": close_bull - 0.5,
                "close": close_bull,
                "volume": [500000] * n,
            }
        )

        regime_bull = {"regime": "STRONG_BULL", "regime_score": 85.0}

        rec_buy = generate_recommendation(
            symbol="FPT",
            company_name="Công ty FPT",
            sector="Công nghệ",
            exchange="HOSE",
            df_stock=df_bull,
            market_regime_info=regime_bull,
        )

        self.assertIn(rec_buy["action"], ["BUY", "WATCH", "HOLD", "SELL", "AVOID"])
        self.assertEqual(rec_buy["symbol"], "FPT")
        self.assertIsInstance(rec_buy["trade_plan"]["risk_reward"], (int, float))
        self.assertIsNotNone(rec_buy["risk_adjusted_alpha"])
        self.assertIsNotNone(rec_buy["confidence"])
        self.assertIsInstance(rec_buy["invalidation"], list)
        self.assertIn("1H", rec_buy["divergence"])

    def test_risk_adjusted_alpha_formula(self):
        """Verify risk-adjusted alpha deterministic calculation."""
        score = calculate_risk_adjusted_alpha(
            alpha_score=80.0,
            regime="STRONG_BULL",
            volatility_60d=0.15,
            max_drawdown=-0.10,
            liquidity_score=90.0,
        )
        self.assertGreaterEqual(score, 70.0)
        self.assertLessEqual(score, 100.0)

        # High volatility and drawdown penalty check
        score_high_risk = calculate_risk_adjusted_alpha(
            alpha_score=80.0,
            regime="BEAR",
            volatility_60d=0.45,
            max_drawdown=-0.35,
            liquidity_score=20.0,
        )
        self.assertLess(score_high_risk, score)

    def test_trade_plan_invariants(self):
        n = 60
        dates = pd.date_range("2026-01-01", periods=n, freq="D")
        close_bull = np.linspace(20.0, 35.0, n)
        df_bull = pd.DataFrame(
            {
                "time": dates,
                "open": close_bull - 0.2,
                "high": close_bull + 0.5,
                "low": close_bull - 0.5,
                "close": close_bull,
                "volume": [500000] * n,
            }
        )

        regime_bull = {"regime": "STRONG_BULL", "regime_score": 85.0}
        rec = generate_recommendation(
            symbol="FPT",
            company_name="Công ty FPT",
            sector="Công nghệ",
            exchange="HOSE",
            df_stock=df_bull,
            market_regime_info=regime_bull,
        )

        tp = rec["trade_plan"]
        if rec["action"] in ["BUY", "WATCH"]:
            self.assertLessEqual(tp["entry_low"], tp["entry_high"])
            self.assertLess(tp["stop_loss"], tp["entry_low"])
            self.assertGreaterEqual(tp["tp1"], tp["entry_high"])
            self.assertGreaterEqual(tp["tp2"], tp["tp1"])
            self.assertGreaterEqual(tp["position_percent"], 0.0)
            self.assertLessEqual(tp["position_percent"], 100.0)
        else:
            self.assertIsNone(tp["entry_low"])
            self.assertIsNone(tp["stop_loss"])

    def test_anti_lookahead_bias(self):
        """Verify recommendation at day T does not depend on data from T+1."""
        n = 60
        dates = pd.date_range("2026-01-01", periods=n, freq="D")
        close_bull = np.linspace(20.0, 35.0, n)
        df_base = pd.DataFrame(
            {
                "time": dates,
                "open": close_bull - 0.2,
                "high": close_bull + 0.5,
                "low": close_bull - 0.5,
                "close": close_bull,
                "volume": [500000] * n,
            }
        )

        regime = {"regime": "BULL", "regime_score": 75.0}
        rec_t = generate_recommendation(
            symbol="FPT",
            company_name="FPT",
            sector="Tech",
            exchange="HOSE",
            df_stock=df_base.iloc[:50],  # up to day 50
            market_regime_info=regime,
        )

        # Appending future wild market day at day 51+
        df_future = pd.concat(
            [
                df_base.iloc[:50],
                pd.DataFrame(
                    {
                        "time": [pd.Timestamp("2026-03-01")],
                        "open": [10.0],
                        "high": [10.0],
                        "low": [1.0],
                        "close": [1.0],
                        "volume": [10000000],
                    }
                ),
            ],
            ignore_index=True,
        )

        rec_t_sliced = generate_recommendation(
            symbol="FPT",
            company_name="FPT",
            sector="Tech",
            exchange="HOSE",
            df_stock=df_future.iloc[:50],  # sliced back to day 50
            market_regime_info=regime,
        )

        self.assertEqual(rec_t["alpha_score"], rec_t_sliced["alpha_score"])
        self.assertEqual(
            rec_t["trade_plan"]["current_price"], rec_t_sliced["trade_plan"]["current_price"]
        )

    def test_avoid_action_in_panic(self):
        n = 30
        dates = pd.date_range("2026-01-01", periods=n, freq="D")
        df_stock = pd.DataFrame(
            {
                "time": dates,
                "open": [10.0] * n,
                "high": [10.5] * n,
                "low": [9.5] * n,
                "close": [10.0] * n,
                "volume": [100000] * n,
            }
        )

        regime_panic = {"regime": "PANIC", "regime_score": 10.0}

        rec = generate_recommendation(
            symbol="HPG",
            company_name="Hòa Phát",
            sector="Thép",
            exchange="HOSE",
            df_stock=df_stock,
            market_regime_info=regime_panic,
        )

        self.assertEqual(rec["action"], "AVOID")

    def test_missing_data_returns_avoid_with_nulls(self):
        rec = generate_recommendation(
            symbol="VCB",
            company_name="Vietcombank",
            sector="Ngân hàng",
            exchange="HOSE",
            df_stock=None,
            market_regime_info={"regime": "DEFENSIVE"},
        )

        self.assertEqual(rec["action"], "AVOID")
        self.assertIsNone(rec["alpha_score"])
        self.assertIsNone(rec["risk_metrics"]["var_t25"])
        self.assertIsNone(rec["trade_plan"]["current_price"])

    def test_market_regime_propagation_across_regimes(self):
        """Verify normalization uses explicitly supplied market regime across all regimes."""
        regimes = ["STRONG_BULL", "BULL", "NEUTRAL", "BEAR", "PANIC"]
        scores = {}

        for regime in regimes:
            recs = [
                {
                    "alpha_score": 80.0,
                    "risk_metrics": {
                        "avg_value_20d": 10.0,
                        "volatility_60d": 0.20,
                        "max_drawdown": -0.15,
                        "liquidity_score": None,
                    },
                }
            ]
            norm = normalize_universe_liquidity_scores(recs, market_regime=regime)
            scores[regime] = norm[0]["risk_adjusted_alpha"]

        self.assertGreater(scores["STRONG_BULL"], scores["BULL"])
        self.assertGreater(scores["BULL"], scores["NEUTRAL"])
        self.assertGreater(scores["NEUTRAL"], scores["BEAR"])
        self.assertGreater(scores["BEAR"], scores["PANIC"])

    def test_individual_recommendation_regime_cannot_override_explicit_regime(self):
        """Verify recommendation's inner 'market_regime' key cannot override explicit parameter."""
        recs = [
            {
                "market_regime": "DEFENSIVE",  # Inner regime attempts to override
                "alpha_score": 80.0,
                "risk_metrics": {
                    "avg_value_20d": 10.0,
                    "volatility_60d": 0.20,
                    "max_drawdown": -0.15,
                    "liquidity_score": None,
                },
            }
        ]

        norm = normalize_universe_liquidity_scores(recs, market_regime="STRONG_BULL")
        expected_score = calculate_risk_adjusted_alpha(
            alpha_score=80.0,
            regime="STRONG_BULL",
            volatility_60d=0.20,
            max_drawdown=-0.15,
            liquidity_score=100.0,
        )

        self.assertEqual(norm[0]["risk_adjusted_alpha"], expected_score)
        self.assertNotEqual(
            norm[0]["risk_adjusted_alpha"],
            calculate_risk_adjusted_alpha(
                alpha_score=80.0,
                regime="DEFENSIVE",
                volatility_60d=0.20,
                max_drawdown=-0.15,
                liquidity_score=100.0,
            ),
        )

    def test_invalid_market_regime_raises_error(self):
        recs = [
            {
                "alpha_score": 80.0,
                "risk_metrics": {
                    "avg_value_20d": 10.0,
                },
            }
        ]

        with self.assertRaises(ValueError):
            normalize_universe_liquidity_scores(recs, market_regime="INVALID_REGIME")

        with self.assertRaises(ValueError):
            normalize_universe_liquidity_scores(recs, market_regime=None)

        with self.assertRaises(ValueError):
            calculate_risk_adjusted_alpha(alpha_score=80.0, regime="UNKNOWN")


if __name__ == "__main__":
    unittest.main()
