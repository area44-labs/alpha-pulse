"""Recommendation Engine Module for Alpha Pulse v2.

Generates stock recommendations based on composite technical alpha score,
market regime, T+2.5 risk horizon, market structure entry/stop/target bounds,
and risk-based position sizing.
Allowed actions: BUY, WATCH, HOLD, SELL, AVOID.
Strictly avoids unverified heuristics for expected returns.
"""

from scripts.lib.features import calculate_multi_timeframe_features
from scripts.lib.risk import calculate_t25_risk_metrics
from scripts.lib.vietnam_market import clamp_price_limits, round_tick_size


def generate_recommendation(
    symbol: str,
    company_name: str,
    sector: str,
    exchange: str,
    df_stock,
    market_regime_info: dict,
    df_vnindex=None,
    foreign_net_buy_bn: float = 0.0,
    prop_net_buy_bn: float = 0.0,
) -> dict:
    """Generate a single stock recommendation object for Alpha Pulse v2."""
    ex = exchange.upper() if exchange else "HOSE"

    if df_stock is None or df_stock.empty or len(df_stock) < 20:
        return {
            "symbol": symbol,
            "company_name": company_name,
            "exchange": ex,
            "sector": sector,
            "action": "AVOID",
            "alpha_score": None,
            "risk_adjusted_alpha": None,
            "risk_level": None,
            "expected_return": {
                "expected_return_5d": None,
                "expected_return_10d": None,
                "expected_return_20d": None,
            },
            "risk_metrics": {
                "var_t25": None,
                "es_t25": None,
                "volatility_60d": None,
                "max_drawdown": None,
                "liquidity_score": None,
            },
            "trade_plan": {
                "current_price": None,
                "entry_low": None,
                "entry_high": None,
                "stop_loss": None,
                "tp1": None,
                "tp2": None,
                "risk_reward": None,
                "position_percent": None,
            },
            "reasons": ["Dữ liệu lịch sử không đủ 20 phiên giao dịch."],
            "warnings": ["Không có dữ liệu giao dịch để phân tích."],
            "divergence": None,
        }

    df_d, tf_summary = calculate_multi_timeframe_features(df_stock)
    risk_metrics = calculate_t25_risk_metrics(df_d, exchange=ex)

    close = float(df_d["close"].iloc[-1])
    ma20 = float(df_d["ma20"].iloc[-1])
    ma50 = float(df_d["ma50"].iloc[-1])
    rsi = float(df_d["rsi"].iloc[-1])
    macd_hist = float(df_d["hist"].iloc[-1])
    prev_macd_hist = float(df_d["hist"].iloc[-2]) if len(df_d) >= 2 else 0.0
    atr = float(df_d["atr"].iloc[-1])

    vol_20d_avg = float(df_d["vol_ma20"].iloc[-1])
    vol_ratio = float(df_d["volume"].iloc[-1]) / vol_20d_avg if vol_20d_avg > 0 else 1.0

    # Composite Technical Alpha Score (0 to 100)
    score = 50.0
    reasons = []
    warnings = []

    if close > ma20:
        score += 10.0
        reasons.append(
            f"Giá đóng cửa ({close:.2f}) nằm trên đường xu hướng MA20 ({ma20:.2f})."
        )
    else:
        score -= 10.0
        warnings.append(
            f"Giá đóng cửa ({close:.2f}) nằm dưới đường xu hướng MA20 ({ma20:.2f})."
        )

    if close > ma50:
        score += 10.0
        reasons.append(f"Giá đóng cửa nằm trên hỗ trợ trung hạn MA50 ({ma50:.2f}).")

    if macd_hist > 0 and macd_hist > prev_macd_hist:
        score += 10.0
        reasons.append("MACD Histogram dương và đang tăng trưởng, củng cố đà tăng.")
    elif macd_hist < 0:
        score -= 10.0
        warnings.append("MACD Histogram âm, báo hiệu áp lực điều chỉnh.")

    if vol_ratio > 1.2:
        score += 10.0
        reasons.append(
            f"Khối lượng bùng nổ {vol_ratio:.1f}x so với bình quân 20 phiên."
        )

    if 45.0 <= rsi <= 68.0:
        score += 10.0
        reasons.append(f"Chỉ báo RSI ({rsi:.1f}) nằm trong vùng an toàn (45 - 68).")
    elif rsi > 78.0:
        score -= 15.0
        warnings.append(
            f"RSI ({rsi:.1f}) rơi vào vùng quá mua nặng (> 78), rủi ro đảo chiều cao."
        )
    elif rsi > 70.0:
        score -= 10.0
        warnings.append(f"RSI ({rsi:.1f}) thuộc vùng quá mua (> 70).")
    elif rsi < 35.0:
        score -= 10.0
        warnings.append(f"RSI ({rsi:.1f}) quá bán nặng (< 35).")

    # Relative strength vs VN-Index
    if df_vnindex is not None and len(df_vnindex) >= 20 and len(df_d) >= 20:
        stock_ret_20 = (df_d["close"].iloc[-1] - df_d["close"].iloc[-20]) / df_d[
            "close"
        ].iloc[-20]
        vn_ret_20 = (
            df_vnindex["close"].iloc[-1] - df_vnindex["close"].iloc[-20]
        ) / df_vnindex["close"].iloc[-20]
        rs_diff = stock_ret_20 - vn_ret_20
        if rs_diff > 0.05:
            score += 5.0
            reasons.append(
                f"Sức mạnh tương quan (RS) vượt trội so với VN-Index (+{rs_diff * 100:.1f}%)."
            )
        elif rs_diff < -0.05:
            score -= 5.0
            warnings.append(
                f"Sức mạnh tương quan (RS) yếu hơn VN-Index ({rs_diff * 100:.1f}%)."
            )

    # Divergence multi-timeframe check
    has_major_bearish_div = False
    for tf_key, tf_label in [("1d", "1D"), ("1w", "1W"), ("1m", "1M")]:
        div = tf_summary[tf_key]["divergence"]
        if div["rsi_bullish"] or div["macd_bullish"]:
            score += 5.0
            reasons.append(f"Xuất hiện tín hiệu Phân Kỳ Dương trên khung {tf_label}.")
        if div["rsi_bearish"] or div["macd_bearish"]:
            score -= 10.0
            warnings.append(f"Cảnh báo Phân Kỳ Âm trên khung {tf_label}.")
            if tf_key in ["1d", "1w"]:
                has_major_bearish_div = True

    if has_major_bearish_div:
        score = min(score, 60.0)

    score = max(0.0, min(100.0, round(score, 1)))

    regime = market_regime_info.get("regime", "DEFENSIVE")

    # Action classification
    if regime == "PANIC" or score < 35.0:
        action = "AVOID" if regime == "PANIC" else "SELL"
    elif (score >= 75.0 and close > ma20 and regime in ["STRONG_BULL", "BULL"]) or (
        score >= 65.0 and close > ma20 and regime == "DEFENSIVE"
    ):
        action = "BUY"
    elif score >= 55.0:
        action = "WATCH"
    elif score >= 45.0:
        action = "HOLD"
    else:
        action = "SELL"

    # Risk level classification
    vol60 = risk_metrics.get("volatility_60d")
    mdd = risk_metrics.get("max_drawdown")
    if vol60 is not None and mdd is not None:
        if vol60 > 0.35 or abs(mdd) > 0.25:
            risk_level = "HIGH"
        elif vol60 < 0.22 and abs(mdd) < 0.12:
            risk_level = "LOW"
        else:
            risk_level = "MEDIUM"
    else:
        risk_level = None

    # Market Structure Trade Plan
    lowest_5d = float(df_d["low"].tail(5).min())
    sl_raw = max(close - 1.8 * atr, lowest_5d, ma20 * 0.98, close * 0.93)
    sl = clamp_price_limits(sl_raw, close, ex)
    risk_amt = max(close - sl, close * 0.03)

    entry_low = round_tick_size(close, ex)
    entry_high = clamp_price_limits(close * 1.02, close, ex)
    tp1 = clamp_price_limits(close + 2.0 * risk_amt, close, ex)
    tp2 = clamp_price_limits(close + 3.0 * risk_amt, close, ex)

    rr_num = round((tp1 - close) / risk_amt, 2) if risk_amt > 0 else 1.0

    # Risk-based Position Sizing
    stop_distance_pct = (
        abs(close - sl) / close if close > 0 and abs(close - sl) > 1e-4 else 0.05
    )
    portfolio_risk_budget_pct = 1.0
    calc_position_pct = round(portfolio_risk_budget_pct / stop_distance_pct, 1)

    max_position_cap = 20.0 if action == "BUY" else (10.0 if action == "WATCH" else 0.0)
    final_position_pct = (
        min(calc_position_pct, max_position_cap) if max_position_cap > 0 else 0.0
    )

    trade_plan = {
        "current_price": round(close, 2),
        "entry_low": round(entry_low, 2),
        "entry_high": round(entry_high, 2),
        "stop_loss": round(sl, 2),
        "tp1": round(tp1, 2),
        "tp2": round(tp2, 2),
        "risk_reward": rr_num,
        "position_percent": final_position_pct,
    }

    expected_return = {
        "expected_return_5d": None,
        "expected_return_10d": None,
        "expected_return_20d": None,
    }

    risk_adjusted_alpha = None

    # Format divergence mapping
    div_mapping = {}
    tf_k_map = [("1d", "1D"), ("1w", "1W"), ("1m", "1M")]
    for tf_key, tf_lbl in tf_k_map:
        d_info = tf_summary[tf_key]["divergence"]
        if d_info["rsi_bullish"] or d_info["macd_bullish"]:
            div_mapping[tf_lbl] = "BULLISH"
        elif d_info["rsi_bearish"] or d_info["macd_bearish"]:
            div_mapping[tf_lbl] = "BEARISH"
        else:
            div_mapping[tf_lbl] = "NONE"

    return {
        "symbol": symbol,
        "company_name": company_name,
        "exchange": ex,
        "sector": sector,
        "action": action,
        "alpha_score": score,
        "risk_adjusted_alpha": risk_adjusted_alpha,
        "risk_level": risk_level,
        "expected_return": expected_return,
        "risk_metrics": risk_metrics,
        "trade_plan": trade_plan,
        "reasons": reasons,
        "warnings": warnings,
        "divergence": div_mapping,
    }
