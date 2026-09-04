"""Backtest tests for preventing look-ahead bias."""

import unittest

from engine.market.vietnam import calculate_settlement_schedule


class TestNoLookahead(unittest.TestCase):
    def test_signal_to_execution_sequence(self):
        sched = calculate_settlement_schedule("2026-09-04")
        # Execution date MUST be strictly after signal date
        self.assertGreater(sched["execution_date"], sched["signal_date"])
        # Settlement date MUST be strictly after execution date
        self.assertGreater(sched["settlement_date"], sched["execution_date"])


if __name__ == "__main__":
    unittest.main()
