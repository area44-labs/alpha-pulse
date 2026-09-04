"""Update Stocks Bridge (Delegates to generate_report.py --update)."""

import os
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from scripts.generate_report import main as generate_report_main

def main():
    # Pass --update to generate_report
    sys.argv = [sys.argv[0], "--update"]
    generate_report_main()

if __name__ == "__main__":
    main()
