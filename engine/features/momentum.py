"""Momentum & Relative Strength Features."""

import pandas as pd


def calculate_relative_strength(
    df_stock: pd.DataFrame, df_benchmark: pd.DataFrame, window: int = 20
) -> float:
    """Calculate Relative Strength performance difference vs benchmark over window sessions."""
    if (
        df_stock is None
        or df_benchmark is None
        or len(df_stock) < window
        or len(df_benchmark) < window
    ):
        return 0.0

    stock_ret = (df_stock["close"].iloc[-1] - df_stock["close"].iloc[-window]) / df_stock[
        "close"
    ].iloc[-window]
    bench_ret = (df_benchmark["close"].iloc[-1] - df_benchmark["close"].iloc[-window]) / df_benchmark[
        "close"
    ].iloc[-window]

    return round(float(stock_ret - bench_ret), 4)
