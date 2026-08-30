"""T+2.5 Risk Model Module for Alpha Pulse v2.

Implements Vietnam-specific T+2.5 settlement horizon risk calculations:
- T+2.5 Historical VaR 95%
- T+2.5 Expected Shortfall (ES 95%)
- 60-day Annualized Volatility
- Max Drawdown
- Liquidity Score
Returns null values if data is insufficient.
"""

import numpy as np
import pandas as pd


def calculate_t25_risk_metrics(
    df: pd.DataFrame,
    exchange: str = "HOSE",
    is_margin_eligible: bool = True,
) -> dict:
    """Calculate T+2.5 risk metrics for a given stock.

    Returns dict with keys: var_t25, es_t25, volatility_60d, max_drawdown, liquidity_score.
    If data < 20 sessions, returns nulls.
    """
    default_nulls = {
        "var_t25": None,
        "es_t25": None,
        "volatility_60d": None,
        "max_drawdown": None,
        "liquidity_score": None,
    }

    if df is None or df.empty or len(df) < 20:
        return default_nulls

    price_col = "close"
    if exchange.upper() == "UPCOM" and "vwap" in df.columns:
        price_col = "vwap"

    df_calc = df.copy()

    # T+2.5 horizon corresponds to 3-session rolling return in daily EOD data
    returns_3d = df_calc[price_col].pct_change(periods=3).dropna()

    if len(returns_3d) < 10:
        return default_nulls

    # Historical VaR 95% T+2.5
    var_95_t25 = float(np.percentile(returns_3d, 5))

    # Expected Shortfall (ES T+2.5): average return below 5th percentile
    tail_losses = returns_3d[returns_3d <= var_95_t25]
    if not tail_losses.empty:
        es_95_t25 = float(tail_losses.mean())
    else:
        es_95_t25 = var_95_t25

    # 60d Annualized Volatility
    returns_1d = df_calc[price_col].pct_change().dropna().tail(60)
    if len(returns_1d) >= 10:
        std_1d = float(returns_1d.std())
        volatility_60d = float(std_1d * np.sqrt(252))
    else:
        volatility_60d = None

    # Max Drawdown
    cummax = df_calc[price_col].cummax()
    dd = (df_calc[price_col] - cummax) / cummax
    max_dd = float(dd.min()) if not dd.empty else None

    # Liquidity Score (0.0 to 100.0 based on 20-session average trading value)
    if "volume" in df_calc.columns:
        df_calc["trading_value"] = df_calc[price_col] * df_calc["volume"]
        avg_val_20d = float(df_calc["trading_value"].tail(20).mean())
        if avg_val_20d > 0:
            val_in_billion = (
                avg_val_20d / 1e9 if avg_val_20d > 1e6 else avg_val_20d * 1000 / 1e9
            )
            liquidity_score = float(min(100.0, round(val_in_billion * 10.0, 1)))
        else:
            liquidity_score = 0.0
    else:
        liquidity_score = None

    return {
        "var_t25": round(var_95_t25, 4) if var_95_t25 is not None else None,
        "es_t25": round(es_95_t25, 4) if es_95_t25 is not None else None,
        "volatility_60d": round(volatility_60d, 4)
        if volatility_60d is not None
        else None,
        "max_drawdown": round(max_dd, 4) if max_dd is not None else None,
        "liquidity_score": liquidity_score,
    }
