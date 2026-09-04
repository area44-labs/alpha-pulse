"""Unit tests for Vietnam Market Rules."""

import unittest

from engine.market.vietnam import (
    calculate_price_limits,
    calculate_settlement_schedule,
    clamp_price_limits,
    get_generated_at_utc,
    get_market_date,
    is_tradeable_price,
    round_tick_size,
)


class TestVietnamMarketRules(unittest.TestCase):
    def test_tick_size_rounding(self):
        # HOSE < 10: step 0.01
        self.assertEqual(round_tick_size(8.334, "HOSE"), 8.33)
        # HOSE 10-50: step 0.05
        self.assertEqual(round_tick_size(24.32, "HOSE"), 24.30)
        self.assertEqual(round_tick_size(24.34, "HOSE"), 24.35)
        # HOSE > 50: step 0.1
        self.assertEqual(round_tick_size(78.36, "HOSE"), 78.4)
        # HNX / UPCOM: step 0.1
        self.assertEqual(round_tick_size(15.24, "HNX"), 15.2)

    def test_price_band_limits(self):
        # HOSE: 7%
        floor, ceil = calculate_price_limits(100.0, "HOSE")
        self.assertEqual(floor, 93.0)
        self.assertEqual(ceil, 107.0)

        # HNX: 10%
        floor, ceil = calculate_price_limits(100.0, "HNX")
        self.assertEqual(floor, 90.0)
        self.assertEqual(ceil, 110.0)

        # UPCOM: 15%
        floor, ceil = calculate_price_limits(100.0, "UPCOM")
        self.assertEqual(floor, 85.0)
        self.assertEqual(ceil, 115.0)

    def test_clamp_price_limits(self):
        # Price exceeding ceiling should be clamped to ceiling
        clamped = clamp_price_limits(120.0, 100.0, "HOSE")
        self.assertEqual(clamped, 107.0)

        # Price below floor should be clamped to floor
        clamped = clamp_price_limits(80.0, 100.0, "HOSE")
        self.assertEqual(clamped, 93.0)

    def test_is_tradeable_price(self):
        tradeable, _ = is_tradeable_price(100.0, 100.0, "HOSE")
        self.assertTrue(tradeable)

        # Hit ceiling
        tradeable, reason = is_tradeable_price(107.0, 100.0, "HOSE")
        self.assertFalse(tradeable)
        self.assertIn("ceiling", reason)

        # Hit floor
        tradeable, reason = is_tradeable_price(93.0, 100.0, "HOSE")
        self.assertFalse(tradeable)
        self.assertIn("floor", reason)

    def test_timezones(self):
        # generated_at should end with ISO string / timezone
        gen_at = get_generated_at_utc()
        self.assertTrue("T" in gen_at or "-" in gen_at)

        # market_date should be YYYY-MM-DD
        m_date = get_market_date()
        self.assertEqual(len(m_date), 10)

    def test_settlement_schedule_t25(self):
        # Friday signal date -> Monday execution -> Wednesday settlement
        sched = calculate_settlement_schedule("2026-09-04")  # 2026-09-04 is Friday
        self.assertEqual(sched["signal_date"], "2026-09-04")
        self.assertEqual(sched["execution_date"], "2026-09-07")  # Monday
        self.assertEqual(sched["settlement_date"], "2026-09-09 11:30")  # Wednesday afternoon
        self.assertEqual(sched["available_to_sell_date"], "2026-09-10")  # Thursday morning


if __name__ == "__main__":
    unittest.main()
