"""Vietnam Market Module Bridge (Backward Compatibility)."""

from engine.data.provider import (
    REALISTIC_BASELINE_PRICES,
    generate_baseline_series,
    get_historical_data,
    load_backup_stock_price,
    parse_wait_seconds,
    validate_ohlcv_data,
)
from engine.data.universe import UniverseProvider
from engine.market.vietnam import (
    calculate_price_limits as get_exchange_price_limits,
    clamp_price_limits,
    round_tick_size,
)

CANDIDATE_STOCKS = UniverseProvider().stocks


def normalize_symbol(symbol: str) -> str:
    if not symbol:
        return ""
    return str(symbol).strip().upper()


__all__ = [
    "CANDIDATE_STOCKS",
    "REALISTIC_BASELINE_PRICES",
    "UniverseProvider",
    "clamp_price_limits",
    "generate_baseline_series",
    "get_exchange_price_limits",
    "get_historical_data",
    "load_backup_stock_price",
    "normalize_symbol",
    "parse_wait_seconds",
    "round_tick_size",
    "validate_ohlcv_data",
]
