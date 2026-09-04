"""Features Module Bridge (Backward Compatibility)."""

from engine.features.technical import (
    calculate_atr,
    calculate_multi_timeframe_features,
    calculate_single_tf_indicators,
    detect_divergence,
)

__all__ = [
    "calculate_atr",
    "calculate_multi_timeframe_features",
    "calculate_single_tf_indicators",
    "detect_divergence",
]
