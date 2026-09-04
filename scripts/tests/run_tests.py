"""Test Runner for Alpha Pulse Unit, Backtest, and Integration Tests."""

import os
import sys
import unittest

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

if __name__ == "__main__":
    loader = unittest.TestLoader()
    tests_dir = os.path.join(ROOT_DIR, "tests")
    suite = loader.discover(start_dir=tests_dir, pattern="test_*.py")

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)
