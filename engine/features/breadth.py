"""Market Breadth Features."""

import pandas as pd


def calculate_market_breadth(candidate_stocks_data: list[tuple[str, pd.DataFrame]]) -> float:
    """Calculate percentage of stocks closing above their MA20."""
    if not candidate_stocks_data:
        return 0.50

    bullish_count = 0
    total_valid = 0

    for _sym, df in candidate_stocks_data:
        if df is not None and not df.empty and len(df) >= 20:
            total_valid += 1
            c = float(df["close"].iloc[-1])
            ma20 = float(df["close"].tail(20).mean())
            if c > ma20:
                bullish_count += 1

    if total_valid == 0:
        return 0.50

    return round(bullish_count / total_valid, 2)
