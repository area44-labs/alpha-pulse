"""Generate Report Script for Alpha Pulse.

Command line usage:
    python scripts/generate_report.py
    python scripts/generate_report.py --update

Outputs ONLY to:
    generated/recommendations.json
    generated/market.json
    generated/history/index.json
    generated/history/YYYY-MM-DD.json
"""

import argparse
import json
import logging
import os
import subprocess
import sys

# Add repository root to path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from engine.data.provider import build_data_quality_info, get_historical_data
from engine.data.universe import UniverseProvider
from engine.data.validator import validate_report
from engine.features.breadth import calculate_market_breadth
from engine.market.vietnam import (
    calculate_settlement_schedule,
    get_generated_at_utc,
    get_market_date,
)
from engine.strategy.recommendation import generate_recommendation
from engine.strategy.regime import detect_market_regime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

GENERATED_DIR = os.path.join(ROOT_DIR, "generated")


def save_json(relative_path: str, data: dict):
    """Save JSON data strictly to generated/ directory."""
    path = os.path.join(GENERATED_DIR, relative_path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def format_generated_json():
    """Format generated JSON files using oxfmt to comply with CI formatting standards."""
    try:
        subprocess.run(["npx", "oxfmt", GENERATED_DIR], capture_output=True, check=False)
    except Exception as err:  # noqa: BLE001
        logger.debug("JSON formatting skipped: %s", err)


def load_market_data(
    update_data: bool = False,
) -> tuple[dict, list[tuple[str, dict, str, list[str]]]]:
    """Load benchmark and universe stock market data."""
    use_cache = not update_data
    provider = UniverseProvider()
    candidate_stocks = provider.stocks

    logger.info("Step 1: Fetching VN-Index & stock universe EOD market data...")
    df_vnindex, vn_tag, _ = get_historical_data(
        "VNINDEX", max_retries=2 if update_data else 1, use_cache_only=use_cache
    )
    df_vn30, _, _ = get_historical_data(
        "VN30", max_retries=2 if update_data else 1, use_cache_only=use_cache
    )

    stock_data = []
    for item in candidate_stocks:
        sym = item["symbol"]
        df_stock, tag, warns = get_historical_data(sym, max_retries=1, use_cache_only=use_cache)
        stock_data.append((sym, item, df_stock, tag, warns))

    market_data = {
        "df_vnindex": df_vnindex,
        "df_vn30": df_vn30,
        "vn_tag": vn_tag,
        "universe_info": provider.get_info(),
        "candidate_stocks": candidate_stocks,
    }
    return market_data, stock_data


def calculate_features(
    market_data: dict, stock_data: list[tuple[str, dict, str, list[str]]]
) -> dict:
    """Calculate market features including market breadth."""
    logger.info("Step 2: Calculating Market Features & Breadth...")
    stocks_dfs = [(s[0], s[2]) for s in stock_data]
    breadth_ratio = calculate_market_breadth(stocks_dfs)
    return {
        "breadth_ratio": breadth_ratio,
        "stock_data": stock_data,
    }


def detect_regime(market_data: dict, features: dict) -> dict:
    """Detect Market Regime."""
    logger.info("Step 3: Detecting Market Regime...")
    regime = detect_market_regime(
        df_vnindex=market_data["df_vnindex"],
        df_vn30=market_data["df_vn30"],
        breadth_ratio=features["breadth_ratio"],
    )
    return regime


def generate_recommendations(
    market_data: dict, stock_data: list[tuple[str, dict, str, list[str]]], regime: dict
) -> list[dict]:
    """Generate recommendations for all candidate stocks compliant with Schema v3.0."""
    logger.info("Step 4: Generating Stock Recommendations...")
    m_date = get_market_date()
    settle_sched = calculate_settlement_schedule(m_date)

    recs = []
    for sym, item, df_stock, tag, _warns in stock_data:
        comp = item["company_name"]
        sec = item["sector"]
        ex = item.get("exchange", "HOSE")

        rec_raw = generate_recommendation(
            symbol=sym,
            company_name=comp,
            sector=sec,
            exchange=ex,
            df_stock=df_stock,
            market_regime_info=regime,
            df_vnindex=market_data["df_vnindex"],
        )

        dq = build_data_quality_info(tag, df_stock)

        # Map to Schema v3.0 contract
        trade_plan = rec_raw["trade_plan"]
        trade_plan["signal_date"] = settle_sched["signal_date"]
        trade_plan["execution_date"] = settle_sched["execution_date"]
        trade_plan["settlement_date"] = settle_sched["settlement_date"]
        trade_plan["settlement_model"] = "T+2.5"

        rec_v3 = {
            "symbol": sym,
            "company_name": comp,
            "exchange": ex,
            "sector": sec,
            "signal": rec_raw["action"],
            "score": rec_raw["alpha_score"],
            "confidence": regime.get("confidence", 0.80),
            "market_regime": regime.get("regime", "DEFENSIVE"),
            "risk": {
                "risk_level": rec_raw["risk_level"],
                "var_t25": rec_raw["risk_metrics"]["var_t25"],
                "es_t25": rec_raw["risk_metrics"]["es_t25"],
                "volatility_60d": rec_raw["risk_metrics"]["volatility_60d"],
                "max_drawdown": rec_raw["risk_metrics"]["max_drawdown"],
                "liquidity_score": rec_raw["risk_metrics"]["liquidity_score"],
                "avg_value_20d": rec_raw["risk_metrics"].get("avg_value_20d"),
            },
            "trade_plan": trade_plan,
            "data_quality": dq,
            "reasons": rec_raw["reasons"],
            "warnings": rec_raw["warnings"],
            "divergence": rec_raw.get("divergence"),
        }
        recs.append(rec_v3)

    logger.info("Step 5: Normalizing Liquidity Scores...")
    liquidity_vals = [
        r["risk"].get("avg_value_20d") for r in recs if r["risk"].get("avg_value_20d") is not None
    ]
    if liquidity_vals:
        import pandas as pd

        s_vals = pd.Series(liquidity_vals)
        ranks = (s_vals.rank(pct=True) * 100.0).round(1)
        idx = 0
        for r in recs:
            if r["risk"].get("avg_value_20d") is not None:
                r["risk"]["liquidity_score"] = float(ranks.iloc[idx])
                idx += 1

    return recs


def build_report(market_data: dict, regime: dict, recommendations: list[dict]) -> tuple[dict, dict]:
    """Assemble final recommendations and market summary payloads."""
    m_date = get_market_date()
    gen_at = get_generated_at_utc()

    buy_cnt = sum(1 for r in recommendations if r["signal"] == "BUY")
    watch_cnt = sum(1 for r in recommendations if r["signal"] == "WATCH")
    hold_cnt = sum(1 for r in recommendations if r["signal"] == "HOLD")
    sell_cnt = sum(1 for r in recommendations if r["signal"] == "SELL")
    avoid_cnt = sum(1 for r in recommendations if r["signal"] == "AVOID")

    summary = {
        "total_scanned": len(recommendations),
        "buy_count": buy_cnt,
        "watch_count": watch_cnt,
        "hold_count": hold_cnt,
        "sell_count": sell_cnt,
        "avoid_count": avoid_cnt,
    }

    dq_overall = build_data_quality_info(market_data["vn_tag"], market_data["df_vnindex"])

    recs_payload = {
        "schema_version": "3.0",
        "market": "VN",
        "market_date": m_date,
        "generated_at": gen_at,
        "data_quality": dq_overall,
        "universe_info": market_data["universe_info"],
        "market_context": regime,
        "summary": summary,
        "recommendations": recommendations,
    }

    market_payload = {
        "market": "VN",
        "market_date": m_date,
        "generated_at": gen_at,
        "data_quality": dq_overall,
        "universe_info": market_data["universe_info"],
        "market_context": regime,
        "summary": summary,
    }

    return recs_payload, market_payload


def update_history_index(market_date: str):
    """Maintain history/index.json with list of available historical dates."""
    index_path = os.path.join(GENERATED_DIR, "history", "index.json")
    history_dates = []

    if os.path.exists(index_path):
        try:
            with open(index_path, "r", encoding="utf-8") as f:
                index_data = json.load(f)
                history_dates = index_data.get("dates", [])
        except Exception:  # noqa: BLE001
            history_dates = []

    if market_date not in history_dates:
        history_dates.append(market_date)
        history_dates.sort(reverse=True)

    index_payload = {
        "last_updated": get_generated_at_utc(),
        "total_reports": len(history_dates),
        "dates": history_dates,
    }

    save_json(os.path.join("history", "index.json"), index_payload)


def main(args: list[str] | None = None):
    parser = argparse.ArgumentParser(description="Alpha Pulse Report Generator v3")
    parser.add_argument(
        "--update",
        action="store_true",
        help="Run live data fetch before report generation",
    )
    parsed_args = parser.parse_args(args)

    logger.info("Starting Alpha Pulse Report Generator v3 (update=%s)...", parsed_args.update)

    market_data, stock_data = load_market_data(update_data=parsed_args.update)
    features = calculate_features(market_data, stock_data)
    regime = detect_regime(market_data, features)
    recommendations = generate_recommendations(market_data, stock_data, regime)

    recs_payload, market_payload = build_report(market_data, regime, recommendations)

    # Validate against Schema v3.0
    logger.info("Validating recommendations payload against Schema v3.0 Draft 2020-12...")
    is_valid, err_msg = validate_report(recs_payload)
    if not is_valid:
        logger.error("JSON Schema Validation Failed: %s", err_msg)
        sys.exit(1)
    logger.info("JSON Schema Validation passed successfully!")

    market_date = recs_payload["market_date"]

    # Save outputs exclusively under generated/
    save_json("recommendations.json", recs_payload)
    save_json("market.json", market_payload)
    save_json(os.path.join("history", f"{market_date}.json"), recs_payload)
    update_history_index(market_date)

    format_generated_json()

    logger.info("Report generation complete!")
    logger.info("Outputs written to generated/:")
    logger.info("  - generated/recommendations.json (%d items)", len(recommendations))
    logger.info("  - generated/market.json (Regime: %s)", regime["regime"])
    logger.info("  - generated/history/%s.json", market_date)
    logger.info("  - generated/history/index.json")


if __name__ == "__main__":
    main()
