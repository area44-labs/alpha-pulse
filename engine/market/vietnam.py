"""Vietnam Market Rules Engine (Single Source of Truth).

Covers:
- Exchange rules (HOSE, HNX, UPCOM)
- Tick size rounding
- Price ceiling and price floor limits
- Timezone handling: market_date (Asia/Ho_Chi_Minh) vs generated_at (UTC ISO)
- Domain settlement rules for Vietnam T+2.5 market cycle
"""

from datetime import date, datetime, timedelta
from typing import TypedDict
import zoneinfo

VIETNAM_TZ = zoneinfo.ZoneInfo("Asia/Ho_Chi_Minh")

# Exchange price band percentages
EXCHANGE_LIMITS = {
    "HOSE": 0.07,
    "HNX": 0.10,
    "UPCOM": 0.15,
}


class SettlementSchedule(TypedDict):
    signal_date: str
    execution_date: str
    settlement_date: str
    available_to_sell_date: str


def get_market_date(dt: datetime | None = None) -> str:
    """Return current market date string (YYYY-MM-DD) in Asia/Ho_Chi_Minh timezone."""
    if dt is None:
        dt = datetime.now(VIETNAM_TZ)
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=zoneinfo.ZoneInfo("UTC")).astimezone(VIETNAM_TZ)
    else:
        dt = dt.astimezone(VIETNAM_TZ)
    return dt.strftime("%Y-%m-%d")


def get_generated_at_utc(dt: datetime | None = None) -> str:
    """Return UTC ISO 8601 string for generated_at timestamp."""
    if dt is None:
        dt = datetime.now(zoneinfo.ZoneInfo("UTC"))
    elif dt.tzinfo is None:
        dt = dt.replace(tzinfo=zoneinfo.ZoneInfo("UTC"))
    else:
        dt = dt.astimezone(zoneinfo.ZoneInfo("UTC"))
    return dt.isoformat()


def round_tick_size(price: float, exchange: str = "HOSE") -> float:
    """Round price according to Vietnam exchange tick size rules."""
    ex = exchange.upper()
    if ex == "HOSE":
        if price < 10.0:
            step = 0.01
        elif price <= 50.0:
            step = 0.05
        else:
            step = 0.1
    else:
        step = 0.1
    return round(round(price / step) * step, 2)


def calculate_price_limits(ref_price: float, exchange: str = "HOSE") -> tuple[float, float]:
    """Calculate (floor_price, ceiling_price) given reference price and exchange."""
    ex = exchange.upper()
    pct = EXCHANGE_LIMITS.get(ex, 0.07)
    floor_p = round_tick_size(ref_price * (1 - pct), ex)
    ceiling_p = round_tick_size(ref_price * (1 + pct), ex)
    return floor_p, ceiling_p


def clamp_price_limits(price: float, ref_price: float, exchange: str = "HOSE") -> float:
    """Clamp calculated target or stop price within next session ceiling and floor limits."""
    floor_p, ceiling_p = calculate_price_limits(ref_price, exchange)
    return round_tick_size(max(floor_p, min(ceiling_p, price)), exchange)


def is_tradeable_price(price: float, ref_price: float, exchange: str = "HOSE") -> tuple[bool, str]:
    """Verify if a price is executable without hitting strict ceiling or floor boundaries."""
    floor_p, ceiling_p = calculate_price_limits(ref_price, exchange)
    if price >= ceiling_p:
        return False, f"Hit ceiling price ({ceiling_p})"
    if price <= floor_p:
        return False, f"Hit floor price limit ({floor_p})"
    return True, "OK"


def is_business_day(d: date) -> bool:
    """Check if date is a weekday (Monday-Friday)."""
    return d.weekday() < 5


def add_business_days(start_d: date, days: int) -> date:
    """Add a given number of business days to a date."""
    cur = start_d
    added = 0
    while added < days:
        cur += timedelta(days=1)
        if is_business_day(cur):
            added += 1
    return cur


def calculate_settlement_schedule(signal_date_str: str) -> SettlementSchedule:
    """Calculate T+2.5 settlement dates given a signal date (YYYY-MM-DD).

    Vietnam Market T+2.5 Rules:
    - Signal Date (T): EOD signal generation.
    - Execution Date (T+1): Order executed on morning session of next business day.
    - Settlement Date (T+2.5): Shares/cash settle in afternoon of second business day after trade.
    - Available to Sell Date (T+3): Shares available for trade starting T+3 morning session.
    """
    sig_d = datetime.strptime(signal_date_str, "%Y-%m-%d").date()
    exec_d = add_business_days(sig_d, 1)
    settle_d = add_business_days(exec_d, 2)
    avail_d = add_business_days(exec_d, 3)

    return {
        "signal_date": sig_d.strftime("%Y-%m-%d"),
        "execution_date": exec_d.strftime("%Y-%m-%d"),
        "settlement_date": f"{settle_d.strftime('%Y-%m-%d')} 11:30",
        "available_to_sell_date": avail_d.strftime("%Y-%m-%d"),
    }
