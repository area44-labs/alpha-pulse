"""Universe Data Loader."""

import json
import os
from typing import TypedDict


class StockCandidate(TypedDict):
    symbol: str
    company_name: str
    sector: str
    exchange: str
    enabled: bool


DEFAULT_UNIVERSE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "data",
    "universe.json",
)


class UniverseProvider:
    """Loads and provides the candidate stocks universe from data/universe.json."""

    def __init__(self, json_path: str = DEFAULT_UNIVERSE_PATH):
        self.json_path = json_path
        self.market = "VN"
        self.version = 1
        self.stocks: list[StockCandidate] = []
        self.load_universe()

    def load_universe(self):
        if not os.path.exists(self.json_path):
            raise FileNotFoundError(f"Universe JSON not found at {self.json_path}")

        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.market = data.get("market", "VN")
        self.version = data.get("version", 1)

        raw_stocks = data.get("stocks", [])
        self.stocks = [
            {
                "symbol": str(s["symbol"]).upper(),
                "company_name": s.get("company_name") or s.get("companyName", ""),
                "sector": s.get("sector", "Khác"),
                "exchange": s.get("exchange", "HOSE").upper(),
                "enabled": s.get("enabled", True),
            }
            for s in raw_stocks
            if s.get("enabled", True)
        ]

    @property
    def candidate_symbols(self) -> list[str]:
        return [s["symbol"] for s in self.stocks]

    def get_info(self) -> dict:
        return {
            "universe_type": "VN30_AND_MIDCAP_LEADERS",
            "universe_size": len(self.stocks),
            "version": self.version,
        }
