"""Backtest tests for ceiling/floor execution rejections."""

import unittest

from engine.market.vietnam import is_tradeable_price


class TestExecutionRejections(unittest.TestCase):
    def test_ceiling_rejection(self):
        tradeable, reason = is_tradeable_price(107.0, 100.0, "HOSE")
        self.assertFalse(tradeable)
        self.assertIn("ceiling", reason)

    def test_floor_rejection(self):
        tradeable, reason = is_tradeable_price(93.0, 100.0, "HOSE")
        self.assertFalse(tradeable)
        self.assertIn("floor", reason)


if __name__ == "__main__":
    unittest.main()
