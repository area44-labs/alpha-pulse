"""Vietnam Market Data Module for Alpha Pulse v2.

Handles symbol normalization, candidate stock universes (HOSE, HNX, UPCOM),
price tick size limits, exchange mappings, and market data fetching.
"""

import logging
import re
import time
from datetime import datetime, timedelta, timezone

import pandas as pd

logger = logging.getLogger(__name__)

try:
    from vnstock.api.quote import Quote as VnQuote

    VNSTOCK_AVAILABLE = True
except ImportError:
    VNSTOCK_AVAILABLE = False

# Default Candidate Universe for Vietnam Market (42 symbols)
CANDIDATE_STOCKS = [
    # HOSE VN30
    {
        "symbol": "ACB",
        "companyName": "Ngân hàng TMCP Á Châu",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "BCM",
        "companyName": "Tổng Công ty Đầu tư và Phát triển Công nghiệp",
        "sector": "Bất động sản KCN",
        "exchange": "HOSE",
    },
    {
        "symbol": "BID",
        "companyName": "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "BVH",
        "companyName": "Tập đoàn Bảo Việt",
        "sector": "Bảo hiểm",
        "exchange": "HOSE",
    },
    {
        "symbol": "CTG",
        "companyName": "Ngân hàng TMCP Công Thương Việt Nam",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "FPT",
        "companyName": "Công ty Cổ phần FPT",
        "sector": "Công nghệ",
        "exchange": "HOSE",
    },
    {
        "symbol": "GAS",
        "companyName": "Tổng Công ty Khí Việt Nam - CTCP",
        "sector": "Dầu khí",
        "exchange": "HOSE",
    },
    {
        "symbol": "GVR",
        "companyName": "Tập đoàn Công nghiệp Cao su Việt Nam - CTCP",
        "sector": "Cao su & BĐS KCN",
        "exchange": "HOSE",
    },
    {
        "symbol": "HDB",
        "companyName": "Ngân hàng TMCP Phát triển TP. Hồ Chí Minh",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "HPG",
        "companyName": "Công ty Cổ phần Tập đoàn Hòa Phát",
        "sector": "Thép",
        "exchange": "HOSE",
    },
    {
        "symbol": "MBB",
        "companyName": "Ngân hàng TMCP Quân Đội",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "MSN",
        "companyName": "Công ty Cổ phần Tập đoàn Masan",
        "sector": "Tiêu dùng",
        "exchange": "HOSE",
    },
    {
        "symbol": "MWG",
        "companyName": "Công ty Cổ phần Đầu tư Thế giới Di Động",
        "sector": "Bán lẻ",
        "exchange": "HOSE",
    },
    {
        "symbol": "PLX",
        "companyName": "Tập đoàn Xăng dầu Việt Nam",
        "sector": "Năng lượng",
        "exchange": "HOSE",
    },
    {
        "symbol": "POW",
        "companyName": "Tổng Công ty Điện lực Dầu khí Việt Nam - CTCP",
        "sector": "Điện lực",
        "exchange": "HOSE",
    },
    {
        "symbol": "SAB",
        "companyName": "Tổng Công ty Cổ phần Bia - Rượu - Nước giải khát Sài Gòn",
        "sector": "Đồ uống",
        "exchange": "HOSE",
    },
    {
        "symbol": "SSB",
        "companyName": "Ngân hàng TMCP Đông Nam Á",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "SSI",
        "companyName": "Công ty Cổ phần Chứng khoán SSI",
        "sector": "Chứng khoán",
        "exchange": "HOSE",
    },
    {
        "symbol": "STB",
        "companyName": "Ngân hàng TMCP Sài Gòn Thương Tín",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "TCB",
        "companyName": "Ngân hàng TMCP Kỹ thương Việt Nam",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "TPB",
        "companyName": "Ngân hàng TMCP Tiên Phong",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "VCB",
        "companyName": "Ngân hàng TMCP Ngoại Thương Việt Nam",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "VHM",
        "companyName": "Công ty Cổ phần Vinhomes",
        "sector": "Bất động sản",
        "exchange": "HOSE",
    },
    {
        "symbol": "VIB",
        "companyName": "Ngân hàng TMCP Quốc tế Việt Nam",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "VIC",
        "companyName": "Tập đoàn Vingroup - CTCP",
        "sector": "Bất động sản",
        "exchange": "HOSE",
    },
    {
        "symbol": "VJC",
        "companyName": "Công ty Cổ phần Hàng không Vietjet",
        "sector": "Hàng không",
        "exchange": "HOSE",
    },
    {
        "symbol": "VNM",
        "companyName": "Công ty Cổ phần Sữa Việt Nam",
        "sector": "Thực phẩm",
        "exchange": "HOSE",
    },
    {
        "symbol": "VPB",
        "companyName": "Ngân hàng TMCP Việt Nam Thịnh Vượng",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    {
        "symbol": "VRE",
        "companyName": "Công ty Cổ phần Vincom Retail",
        "sector": "Bất động sản",
        "exchange": "HOSE",
    },
    {
        "symbol": "SHB",
        "companyName": "Ngân hàng TMCP Sài Gòn - Hà Nội",
        "sector": "Ngân hàng",
        "exchange": "HOSE",
    },
    # Midcaps / HNX / UPCOM Leaders
    {
        "symbol": "DGC",
        "companyName": "CTCP Tập đoàn Hóa chất Đức Giang",
        "sector": "Hóa chất",
        "exchange": "HOSE",
    },
    {
        "symbol": "FRT",
        "companyName": "CTCP Bán lẻ Kỹ thuật số FPT",
        "sector": "Bán lẻ",
        "exchange": "HOSE",
    },
    {
        "symbol": "PVD",
        "companyName": "Tổng CTCP Khoan và Dịch vụ Khoan Dầu khí",
        "sector": "Dầu khí",
        "exchange": "HOSE",
    },
    {
        "symbol": "VCI",
        "companyName": "CTCP Chứng khoán Vietcap",
        "sector": "Chứng khoán",
        "exchange": "HOSE",
    },
    {
        "symbol": "HCM",
        "companyName": "CTCP Chứng khoán TP.Hồ Chí Minh",
        "sector": "Chứng khoán",
        "exchange": "HOSE",
    },
    {
        "symbol": "VND",
        "companyName": "CTCP Chứng khoán VNDIRECT",
        "sector": "Chứng khoán",
        "exchange": "HOSE",
    },
    {
        "symbol": "HSG",
        "companyName": "CTCP Tập đoàn Hoa Sen",
        "sector": "Thép",
        "exchange": "HOSE",
    },
    {
        "symbol": "NKG",
        "companyName": "CTCP Thép Nam Kim",
        "sector": "Thép",
        "exchange": "HOSE",
    },
    {
        "symbol": "DXG",
        "companyName": "CTCP Tập đoàn Đất Xanh",
        "sector": "Bất động sản",
        "exchange": "HOSE",
    },
    {
        "symbol": "DIG",
        "companyName": "Tổng CTCP Đầu tư Phát triển Xây dựng",
        "sector": "Bất động sản",
        "exchange": "HOSE",
    },
    {
        "symbol": "PDR",
        "companyName": "CTCP Phát triển Bất động sản Phát Đạt",
        "sector": "Bất động sản",
        "exchange": "HOSE",
    },
    {
        "symbol": "GMD",
        "companyName": "CTCP Gemadept",
        "sector": "Logistics",
        "exchange": "HOSE",
    },
]


def normalize_symbol(symbol: str) -> str:
    """Normalize Vietnam stock symbol format (e.g. 'fpt' -> 'FPT')."""
    if not symbol:
        return ""
    return str(symbol).strip().upper()


def parse_wait_seconds(err_str: str) -> int:
    """Extract wait seconds from vnstock rate limit notice."""
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


def round_tick_size(price: float, exchange: str = "HOSE") -> float:
    """Round price according to Vietnam exchange tick size rules."""
    if price <= 0:
        return 0.0
    exchange_upper = exchange.upper()
    if exchange_upper == "HOSE":
        if price < 10.0:
            step = 0.01
        elif price <= 50.0:
            step = 0.05
        else:
            step = 0.1
    else:  # HNX / UPCOM
        step = 0.1
    return round(round(price / step) * step, 2)


def clamp_price_limits(price: float, ref_price: float, exchange: str = "HOSE") -> float:
    """Enforce exchange daily price floor and ceiling bounds."""
    if ref_price <= 0:
        return price
    ex_upper = exchange.upper()
    pct = 0.07 if ex_upper == "HOSE" else (0.10 if ex_upper == "HNX" else 0.15)
    floor_p = round_tick_size(ref_price * (1 - pct), ex_upper)
    ceiling_p = round_tick_size(ref_price * (1 + pct), ex_upper)
    return round_tick_size(max(floor_p, min(ceiling_p, price)), ex_upper)


def get_historical_data(
    symbol: str,
    start_date: str | None = None,
    end_date: str | None = None,
    max_retries: int = 1,
):
    """Fetch historical EOD OHLCV data for a given symbol."""
    sym = normalize_symbol(symbol)
    if not start_date or not end_date:
        now_dt = datetime.now(timezone.utc)
        end_date = now_dt.strftime("%Y-%m-%d")
        start_date = (now_dt - timedelta(days=365)).strftime("%Y-%m-%d")

    if not VNSTOCK_AVAILABLE:
        return None, "mock"

    sources = ["msn", "kbs"]
    for attempt in range(max_retries):
        for source in sources:
            try:
                q = VnQuote(symbol=sym, source=source)
                df = q.history(start=start_date, end=end_date)
                if df is not None and not df.empty and "close" in df.columns:
                    df.columns = [c.lower() for c in df.columns]
                    for col in ["open", "high", "low", "close", "volume"]:
                        if col in df.columns:
                            df[col] = pd.to_numeric(df[col], errors="coerce")
                    if df["close"].iloc[-1] < 1.0:
                        continue
                    return df, source
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
                    time.sleep(0.2)
        if attempt < max_retries - 1:
            time.sleep(0.5)

    return None, None
