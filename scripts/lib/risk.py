"""Risk Module Bridge (Backward Compatibility)."""

from engine.strategy.risk import (
    calculate_t25_risk_metrics,
    normalize_universe_liquidity_scores,
)

__all__ = ["calculate_t25_risk_metrics", "normalize_universe_liquidity_scores"]
