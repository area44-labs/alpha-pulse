"""Volume & Smart Money Features."""

import pandas as pd


def calculate_volume_ratio(df_stock: pd.DataFrame, window: int = 20) -> float:
    """Calculate ratio of latest session volume vs MA(window) volume."""
    if df_stock is None or len(df_stock) < window:
        return 1.0

    v_latest = float(df_stock["volume"].iloc[-1])
    v_ma = float(df_stock["volume"].tail(window).mean())

    if v_ma <= 0:
        return 1.0

    return round(v_latest / v_ma, 2)
