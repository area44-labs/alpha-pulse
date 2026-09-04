"""Integration test for generate_report.py and Schema v3.0 validation."""

import json
import os
import unittest

from engine.data.validator import validate_report
from scripts.generate_report import main as generate_report_main

GENERATED_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "generated",
)


class TestGenerateReportIntegration(unittest.TestCase):
    def test_report_generation_and_schema_validation(self):
        generate_report_main(args=[])

        recs_path = os.path.join(GENERATED_DIR, "recommendations.json")
        self.assertTrue(os.path.exists(recs_path))

        with open(recs_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.assertEqual(data["schema_version"], "3.0")
        is_valid, err_msg = validate_report(data)
        self.assertTrue(is_valid, f"Schema validation failed: {err_msg}")


if __name__ == "__main__":
    unittest.main()
