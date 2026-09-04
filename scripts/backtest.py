"""Backtest Script Bridge (Delegates to engine.backtest.portfolio)."""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from engine.backtest.portfolio import VietnamPortfolioBacktester, run_backtest


def main():
    tester = VietnamPortfolioBacktester()
    report = tester.run(allow_synthetic=False)
    print("Backtest status:", report.get("status"))


if __name__ == "__main__":
    main()
