"""Market Data Provider & Validation Layer for Alpha Pulse.

Provides rate-limit compliant data fetching, EOD historical prices, and data quality metadata:
- REAL (Live API data from vnstock)
- CACHE (Cached historical data)
- SYNTHETIC (Deterministic baseline fallback data)
"""

import logging
import re
import time
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd

from engine.market.vietnam import get_market_date

logger = logging.getLogger(__name__)

try:
    from vnstock.api.quote import Quote as VnQuote

    VNSTOCK_AVAILABLE = True
except ImportError:
    VNSTOCK_AVAILABLE = False

REALISTIC_BASELINE_PRICES = {
    "ACB": 24.5,
    "BCM": 68.0,
    "BID": 48.5,
    "BVH": 42.0,
    "CTG": 35.0,
    "FPT": 132.0,
    "GAS": 78.0,
    "GVR": 34.0,
    "HDB": 26.0,
    "HPG": 28.0,
    "MBB": 24.0,
    "MSN": 75.0,
    "MWG": 65.0,
    "PLX": 38.0,
    "POW": 11.5,
    "SAB": 58.0,
    "SSB": 22.0,
    "SSI": 34.0,
    "STB": 30.0,
    "TCB": 23.0,
    "TPB": 18.0,
    "VCB": 92.0,
    "VHM": 42.0,
    "VIB": 21.0,
    "VIC": 44.5,
    "VJC": 102.0,
    "VNM": 66.0,
    "VPB": 19.0,
    "VRE": 22.5,
    "SHB": 11.5,
    "DGC": 115.0,
    "FRT": 175.0,
    "PVD": 28.0,
    "VCI": 48.0,
    "HCM": 28.0,
    "VND": 16.0,
    "HSG": 20.0,
    "NKG": 21.0,
    "DXG": 15.0,
    "DIG": 24.0,
    "PDR": 22.0,
    "GMD": 82.0,
}


def parse_wait_seconds(err_str: str) -> int:
    """Extract wait time from rate limit notices."""
    match = re.search(r"chờ\s+(\d+)\s+giây", err_str, re.IGNORECASE)
    if match:
        return int(match.group(1)) + 2
    match_sec = re.search(r"wait\s+(\d+)\s+sec", err_str, re.IGNORECASE)
    if match_sec:
        return int(match_sec.group(1)) + 2
    match_sec2 = re.search(r"(\d+)\s+second", err_str, re.IGNORECASE)
    if match_sec2:
        return int(match_sec2.group(1)) + 2
    return 15


def validate_ohlcv_data(df: pd.DataFrame, symbol: str) -> tuple[pd.DataFrame, list[str]]:
    """Validate data quality for OHLCV DataFrame."""
    warnings = []
    if df is None or df.empty:
        return pd.DataFrame(), [f"[{symbol}] Empty OHLCV DataFrame."]

    df_valid = df.copy()
    df_valid.columns = [c.lower() for c in df_valid.columns]

    required_cols = ["open", "high", "low", "close", "volume"]
    for col in required_cols:
        if col not in df_valid.columns:
            return pd.DataFrame(), [f"[{symbol}] Missing required column {col}."]
        df_valid[col] = pd.to_numeric(df_valid[col], errors="coerce")

    date_col = (
        "time" if "time" in df_valid.columns else ("date" if "date" in df_valid.columns else None)
    )
    if date_col:
        initial_count = len(df_valid)
        df_valid = df_valid.drop_duplicates(subset=[date_col], keep="last")
        if len(df_valid) < initial_count:
            warnings.append(
                f"[{symbol}] Removed {initial_count - len(df_valid)} duplicate date rows."
            )

    invalid_price = (df_valid["close"] <= 0) | (df_valid["volume"] < 0)
    if invalid_price.any():
        warnings.append(
            f"[{symbol}] Removed {invalid_price.sum()} rows with close <= 0 or volume < 0."
        )
        df_valid = df_valid[~invalid_price]

    max_oc = df_valid[["open", "close"]].max(axis=1)
    min_oc = df_valid[["open", "close"]].min(axis=1)
    ohlc_conflict = (df_valid["high"] < max_oc) | (df_valid["low"] > min_oc)
    if ohlc_conflict.any():
        warnings.append(
            f"[{symbol}] Adjusted {ohlc_conflict.sum()} rows violating High >= Max(O,C) or Low <= Min(O,C)."
        )
        df_valid.loc[df_valid["high"] < max_oc, "high"] = max_oc
        df_valid.loc[df_valid["low"] > min_oc, "low"] = min_oc

    return df_valid.reset_index(drop=True), warnings


def load_backup_stock_price(symbol: str) -> float:
    """Load baseline stock price from REALISTIC_BASELINE_PRICES dictionary."""
    sym = symbol.upper() if symbol else ""
    return REALISTIC_BASELINE_PRICES.get(sym, 25.0)


def generate_baseline_series(symbol: str, base_price: float = 25.0, days: int = 120) -> pd.DataFrame:
    """Generate deterministic baseline series tagged explicitly as SYNTHETIC data."""
    np.random.seed((hash(symbol) % 10000) + 123)
    dates = pd.date_range(end=datetime.now(timezone.utc), periods=days, freq="B")

    drift = np.sin(np.linspace(0, 6, days)) * (base_price * 0.1)
    noise = np.cumsum(np.random.normal(0.05, base_price * 0.012, days))
    close_prices = base_price + drift + noise
    close_prices = np.clip(close_prices, base_price * 0.5, base_price * 2.0)

    df = pd.DataFrame(
        {
            "time": dates,
            "open": close_prices * 0.995,
            "high": close_prices * 1.015,
            "low": close_prices * 0.985,
            "close": close_prices,
            "volume": np.random.randint(200000, 2500000, days),
        }
    )
    return df


def get_historical_data(
    symbol: str,
    start_date: str | None = None,
    end_date: str | None = None,
    max_retries: int = 1,
    use_cache_only: bool = False,
    allow_synthetic: bool = True,
) -> tuple[pd.DataFrame, str, list[str]]:
    """Fetch historical EOD OHLCV data for a given symbol."""
    sym = str(symbol).strip().upper()
    if not start_date or not end_date:
        now_dt = datetime.now(timezone.utc)
        end_date = now_dt.strftime("%Y-%m-%d")
        start_date = (now_dt - timedelta(days=365)).strftime("%Y-%m-%d")

    INDEX_SYMBOLS = {"VNINDEX", "VN30", "HNXINDEX", "UPCOMINDEX", "VN30INDEX"}

    if not use_cache_only and VNSTOCK_AVAILABLE:
        sources = ["kbs", "msn"]
        for attempt in range(max_retries):
            for source in sources:
                try:
                    q = VnQuote(symbol=sym, source=source)
                    df = q.history(start=start_date, end=end_date)
                    if df is not None and not df.empty and "close" in df.columns:
                        df_val, warnings = validate_ohlcv_data(df, sym)
                        if not df_val.empty and len(df_val) >= 15:
                            if sym not in INDEX_SYMBOLS and df_val["close"].iloc[-1] > 1000.0:
                                for col in ["open", "high", "low", "close"]:
                                    if col in df_val.columns:
                                        df_val[col] = df_val[col] / 1000.0
                            return df_val, "REAL_DATA", warnings
                except (Exception, SystemExit, BaseException) as e:  # noqa: BLE001
                    err_str = str(e).lower()
                    if any(
                        x in err_str
                        for x in [
                            "rate limit",
                            "giới hạn",
                            "wait",
                            "systemexit",
                            "quota",
                            "429",
                        ]
                    ):
                        wait_sec = parse_wait_seconds(str(e))
                        time.sleep(wait_sec)
                    else:
                        time.sleep(0.1)
            if attempt < max_retries - 1:
                time.sleep(0.2)

    base_p = (
        1262.62
        if sym == "VNINDEX"
        else (
            1300.0
            if sym == "VN30"
            else (
                235.0
                if sym == "HNXINDEX"
                else (95.0 if sym == "UPCOMINDEX" else load_backup_stock_price(sym))
            )
        )
    )
    df_fallback = generate_baseline_series(sym, base_price=base_p)
    df_val, warnings = validate_ohlcv_data(df_fallback, sym)

    data_tag = "SYNTHETIC_DATA"

    if not allow_synthetic:
        return (
            pd.DataFrame(),
            "INSUFFICIENT_HISTORICAL_DATA",
            ["Data source is synthetic."],
        )

    return df_val, data_tag, warnings


def build_data_quality_info(data_tag: str, df: pd.DataFrame | None = None) -> dict:
    """Build standardized data quality metadata dict."""
    status_map = {
        "REAL_DATA": "REAL",
        "CACHE_DATA": "CACHE",
        "SYNTHETIC_DATA": "SYNTHETIC",
    }
    status = status_map.get(data_tag, "SYNTHETIC")
    m_date = get_market_date()
    is_stale = False

    if df is not None and not df.empty:
        date_col = "time" if "time" in df.columns else ("date" if "date" in df.columns else None)
        if date_col:
            last_date = pd.to_datetime(df[date_col].iloc[-1]).strftime("%Y-%m-%d")
            # Stale if last date is more than 5 days ago
            last_dt = datetime.strptime(last_date, "%Y-%m-%d")
            now_dt = datetime.strptime(m_date, "%Y-%m-%d")
            if (now_dt - last_dt).days > 5:
                is_stale = True

    return {
        "status": status,
        "source": "vnstock" if status == "REAL" else "fallback",
        "market_date": m_date,
        "is_stale": is_stale,
    }
