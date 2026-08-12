import os
import json
import time
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import requests

try:
    import vnstock
    from vnstock import Reference, Listing, Trading
    from vnstock.api.quote import Quote as VnQuote
    VNSTOCK_AVAILABLE = True
except ImportError:
    VNSTOCK_AVAILABLE = False

STOCKS_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src", "data", "stocks.json"
)

AGENT_SIGNALS_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src", "data", "agent_signals.json"
)

# Baseline high-liquidity stocks (used as portfolio for Exit Scanner & default backups)
CANDIDATE_STOCKS = [
    {"symbol": "TCB", "companyName": "Ngân hàng TMCP Kỹ thương Việt Nam", "sector": "Ngân hàng", "riskLevel": "MEDIUM"},
    {"symbol": "STB", "companyName": "Ngân hàng TMCP Sài Gòn Thương Tín", "sector": "Ngân hàng", "riskLevel": "MEDIUM"},
    {"symbol": "SSI", "companyName": "Công ty Cổ phần Chứng khoán SSI", "sector": "Dịch vụ tài chính", "riskLevel": "MEDIUM"},
    {"symbol": "HPG", "companyName": "Công ty Cổ phần Tập đoàn Hòa Phát", "sector": "Thép", "riskLevel": "MEDIUM"},
    {"symbol": "FPT", "companyName": "Công ty Cổ phần FPT", "sector": "Công nghệ", "riskLevel": "LOW"},
    {"symbol": "VHM", "companyName": "Công ty Cổ phần Vinhomes", "sector": "Bất động sản", "riskLevel": "HIGH"},
    {"symbol": "VIC", "companyName": "Tập đoàn Vingroup - CTCP", "sector": "Bất động sản", "riskLevel": "HIGH"},
    {"symbol": "MWG", "companyName": "Công ty Cổ phần Đầu tư Thế giới Di Động", "sector": "Bán lẻ", "riskLevel": "MEDIUM"},
    {"symbol": "FRT", "companyName": "Công ty Cổ phần Bán lẻ Kỹ thuật số FPT", "sector": "Bán lẻ", "riskLevel": "HIGH"},
    {"symbol": "VNM", "companyName": "Công ty Cổ phần Sữa Việt Nam", "sector": "Thực phẩm & Đồ uống", "riskLevel": "LOW"},
    {"symbol": "DGC", "companyName": "Công ty Cổ phần Tập đoàn Hóa chất Đức Giang", "sector": "Hóa chất", "riskLevel": "HIGH"},
    {"symbol": "PVD", "companyName": "Tổng Công ty Cổ phần Khoan và Dịch vụ Khoan Dầu khí", "sector": "Dầu khí", "riskLevel": "HIGH"},
    {"symbol": "VHC", "companyName": "Công ty Cổ phần Vĩnh Hoàn", "sector": "Thủy sản", "riskLevel": "MEDIUM"},
    {"symbol": "DBC", "companyName": "Công ty Cổ phần Tập đoàn Dabaco Việt Nam", "sector": "Nông nghiệp", "riskLevel": "HIGH"},
]

def round_tick_size(price, exchange="HOSE"):
    """
    Rounds a stock price (in thousands of VND, e.g. 25.25 for 25,250 VND)
    according to HOSE/HNX tick size regulations:
    - Under 10k: tick size is 10 VND (0.01 in thousands)
    - 10k-50k: tick size is 50 VND (0.05 in thousands)
    - Above 50k: tick size is 100 VND (0.10 in thousands)
    For HNX/UPCOM, tick size is typically 100 VND (0.10) for all ranges.
    """
    if exchange == "HOSE":
        if price < 10.0:
            step = 0.01
        elif price <= 50.0:
            step = 0.05
        else:
            step = 0.1
    else:
        # HNX or UPCOM
        step = 0.1

    return round(round(price / step) * step, 2)

def calculate_atr(df, period=14):
    """Computes Average True Range (ATR)."""
    high = df['high']
    low = df['low']
    close = df['close']
    close_prev = close.shift(1)

    tr1 = high - low
    tr2 = (high - close_prev).abs()
    tr3 = (low - close_prev).abs()

    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(window=period, min_periods=1).mean()
    return atr

def calculate_technical_indicators(df):
    """
    Computes technical indicators: MA20, MA50, RSI (14), MACD (12, 26, 9) and Volume MA20.
    Expects df to have columns 'close' and 'volume'.
    """
    # Simple Moving Averages
    df['ma20'] = df['close'].rolling(window=20, min_periods=1).mean()
    df['ma50'] = df['close'].rolling(window=50, min_periods=1).mean()
    df['vol_ma20'] = df['volume'].rolling(window=20, min_periods=1).mean()
    df['turnover_ma20'] = (df['close'] * df['volume'] * 1000).rolling(window=20, min_periods=1).mean()

    # Relative Strength Index (RSI-14)
    delta = df['close'].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=14, min_periods=1).mean()
    avg_loss = loss.rolling(window=14, min_periods=1).mean()

    # Avoid division by zero
    avg_loss = avg_loss.replace(0, 0.00001)
    rs = avg_gain / avg_loss
    df['rsi'] = 100 - (100 / (1 + rs))
    df['rsi'] = df['rsi'].fillna(50)

    # MACD (12, 26, 9)
    df['ema12'] = df['close'].ewm(span=12, adjust=False, min_periods=1).mean()
    df['ema26'] = df['close'].ewm(span=26, adjust=False, min_periods=1).mean()
    df['macd'] = df['ema12'] - df['ema26']
    df['signal'] = df['macd'].ewm(span=9, adjust=False, min_periods=1).mean()
    df['hist'] = df['macd'] - df['signal']

    # ATR(14)
    df['atr'] = calculate_atr(df, 14)

    return df

def get_exchange_mapping():
    """Maps symbols to their respective exchange & name."""
    mapping = {}
    if not VNSTOCK_AVAILABLE:
        return mapping
    try:
        for ex in ["HOSE", "HNX", "UPCOM"]:
            df = Listing().symbols_by_exchange(ex)
            if df is not None and not df.empty:
                # Filter for stock type only (exclude warrants, funds, etfs, bonds)
                stocks_df = df[df['type'] == 'stock']
                for _, row in stocks_df.iterrows():
                    mapping[row['symbol']] = {
                        "exchange": ex,
                        "organ_name": row.get("organ_name", "")
                    }
    except Exception as e:
        print(f"Warning: Failed to retrieve symbols by exchange: {e}")
    return mapping

def send_notification(title, message):
    """Sends notification alerts to Telegram or Discord if configured."""
    telegram_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    telegram_chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    discord_webhook = os.environ.get("DISCORD_WEBHOOK_URL")

    if telegram_token and telegram_chat_id:
        try:
            url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
            payload = {
                "chat_id": telegram_chat_id,
                "text": f"⚠️ *{title}*\n\n{message}",
                "parse_mode": "Markdown"
            }
            requests.post(url, json=payload, timeout=5)
            print("Telegram notification sent successfully.")
        except Exception as e:
            print(f"Failed to send Telegram notification: {e}")

    if discord_webhook:
        try:
            payload = {
                "content": f"⚠️ **{title}**\n\n{message}"
            }
            requests.post(discord_webhook, json=payload, timeout=5)
            print("Discord notification sent successfully.")
        except Exception as e:
            print(f"Failed to send Discord notification: {e}")

def get_historical_data_api(symbol, start_date, end_date):
    """Wrapper to safely fetch historical data from vnstock API."""
    if not VNSTOCK_AVAILABLE:
        return None, None
    for source in ['KBS', 'MSN', 'VCI']:
        try:
            q = VnQuote(symbol=symbol, source=source)
            df = q.history(start=start_date, end=end_date)
            if df is not None and not df.empty and "close" in df.columns:
                df.columns = [c.lower() for c in df.columns]
                for col in ['open', 'high', 'low', 'close', 'volume']:
                    if col in df.columns:
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                return df, source
        except Exception:
            pass
    return None, None

def main():
    print("=====================================================================")
    print("STARTING OPTIMIZED QUANTITATIVE STOCK DATA PIPELINE (ALPHA PULSE)")
    print("=====================================================================")

    # Load backup/original data if existing
    backup_data = {}
    try:
        if os.path.exists(STOCKS_JSON_PATH):
            with open(STOCKS_JSON_PATH, "r", encoding="utf-8") as f:
                backup_data = json.load(f)
            print("Successfully loaded original stocks.json as backup.")
    except Exception as e:
        print(f"Warning: Failed to load stocks.json: {e}")

    # Set historical date ranges (60 days is ideal for SMA50 and indicators)
    end_date_dt = datetime.now()
    start_date_dt = end_date_dt - timedelta(days=90)
    start_date = start_date_dt.strftime("%Y-%m-%d")
    end_date = end_date_dt.strftime("%Y-%m-%d")

    print(f"Analyzing historical range from {start_date} to {end_date}...")

    # Step 1: Market Regime Filter (Check VN-Index)
    print("\n[Step 1] Fetching VN-Index for Market Regime Filter...")
    vnindex_status = "UPTREND"
    market_risk_level = "LOW"
    vnindex_val = 1788.61 # Fallback to backup or last known good
    vnindex_change = 15.2
    vnindex_pct = 0.86

    try:
        df_vn, vn_source = get_historical_data_api("VNINDEX", start_date, end_date)
        if df_vn is not None and len(df_vn) >= 20:
            for col in ['open', 'high', 'low', 'close']:
                if col in df_vn.columns and df_vn[col].iloc[-1] > 10000:
                    df_vn[col] = df_vn[col] / 1000.0

            df_vn = calculate_technical_indicators(df_vn)
            vnindex_val = float(df_vn['close'].iloc[-1])
            prev_vnindex = float(df_vn['close'].iloc[-2]) if len(df_vn) >= 2 else vnindex_val
            vnindex_change = vnindex_val - prev_vnindex
            vnindex_pct = (vnindex_change / prev_vnindex) * 100

            ma20_vn = float(df_vn['ma20'].iloc[-1])
            ma50_vn = float(df_vn['ma50'].iloc[-1])

            if vnindex_val > ma20_vn and vnindex_val > ma50_vn:
                vnindex_status = "UPTREND"
                market_risk_level = "LOW"
            else:
                vnindex_status = "DOWNTREND"
                market_risk_level = "HIGH"

            print(f"  -> VN-Index: {vnindex_val:.2f} ({vnindex_pct:+.2f}%) | MA20: {ma20_vn:.2f}, MA50: {ma50_vn:.2f}")
            print(f"  -> Market Regime: Status={vnindex_status}, Risk Level={market_risk_level}")
        else:
            print("  -> WARNING: Failed to fetch VNINDEX. Falling back to default backup context.")
    except Exception as e:
        print(f"  -> Error fetching VNINDEX: {e}")

    # Step 2: Build Exchange Mapping and Fetch Price Board
    print("\n[Step 2] Building exchange mapping and fetching today's price board...")
    exchange_map = get_exchange_mapping()
    if not exchange_map:
        exchange_map = {item["symbol"]: {"exchange": "HOSE", "organ_name": item["companyName"]} for item in CANDIDATE_STOCKS}

    all_symbols = list(exchange_map.keys())
    print(f"  -> Total market symbols mapped: {len(all_symbols)}")

    # Fetch daily price boards
    price_board_df = pd.DataFrame()
    try:
        # Fetch for a smaller subset to avoid rate limits
        price_board_df = Trading().price_board(all_symbols[:200])
    except Exception as e:
        print(f"  -> Price board fetch warning: {e}")

    # Step 3: Run Sanity Filter (Liquidity & Quality Filters)
    print("\n[Step 3] Running Sanity Liquidity & Quality Filter on all market symbols...")
    candidate_symbols = []

    if not price_board_df.empty:
        pre_filtered = price_board_df[
            (price_board_df['volume_accumulated'] > 150000) &
            (price_board_df['total_value'] > 3000000000)
        ]
        # To strictly avoid the 20 requests/minute Guest limit, we select the top 4 most active symbols
        top_active = pre_filtered.sort_values(by='total_value', ascending=False).head(4)
        candidate_symbols = top_active['symbol'].tolist()
        print(f"  -> Selected top active from market: {candidate_symbols}")

    # Fill up with baseline stocks to ensure we always have 10-12 great liquid leaders to present
    for leader in CANDIDATE_STOCKS:
        if leader["symbol"] not in candidate_symbols:
            candidate_symbols.append(leader["symbol"])
        if len(candidate_symbols) >= 6: # Deep-scan pool strictly limited to 6 symbols
            break

    print(f"  -> Final deep-scan pool size (limited to stay under Guest rate limits): {len(candidate_symbols)}")

    # Step 4: Core Technical Screening & Quant Momentum Calculation
    print("\n[Step 4] Querying 60-day price history and calculating technical indicators...")
    scanned_results = []
    exit_scanner_alerts = []

    for idx, symbol in enumerate(candidate_symbols):
        print(f"  [{idx+1}/{len(candidate_symbols)}] Analyzing symbol: {symbol}...")

        df, source = get_historical_data_api(symbol, start_date, end_date)
        if df is not None and len(df) >= 20:
            try:
                for col in ['open', 'high', 'low', 'close']:
                    if col in df.columns:
                        last_valid = df[col].dropna()
                        if not last_valid.empty and last_valid.iloc[-1] > 1000:
                            df[col] = df[col] / 1000.0

                df = calculate_technical_indicators(df)

                vol_ma20 = float(df['vol_ma20'].iloc[-1])
                turnover_ma20 = float(df['turnover_ma20'].iloc[-1])

                # Retrieve exchange meta
                meta = exchange_map.get(symbol, {"exchange": "HOSE", "organ_name": symbol})
                ex = meta["exchange"]
                company_name = meta["organ_name"] or symbol

                close = float(df['close'].iloc[-1])
                prev_close = float(df['close'].iloc[-2]) if len(df) >= 2 else close
                rsi = float(df['rsi'].iloc[-1])
                prev_rsi = float(df['rsi'].iloc[-2]) if len(df) >= 2 else rsi
                macd_hist = float(df['hist'].iloc[-1])
                prev_macd_hist = float(df['hist'].iloc[-2]) if len(df) >= 2 else 0.0
                macd_line = float(df['macd'].iloc[-1])
                signal_line = float(df['signal'].iloc[-1])
                ma20 = float(df['ma20'].iloc[-1])
                ma50 = float(df['ma50'].iloc[-1])
                atr = float(df['atr'].iloc[-1])
                volume = float(df['volume'].iloc[-1])
                volume_ratio = volume / vol_ma20 if vol_ma20 > 0 else 1.0

                # Quantitative Confidence Scoring System (max 100)
                score = 50
                if close > ma20: score += 10
                if close > ma50: score += 10
                if macd_hist > 0 and macd_hist > prev_macd_hist: score += 10
                if macd_line > signal_line: score += 5
                if volume_ratio > 2.0: score += 15
                elif volume_ratio > 1.2: score += 10
                if 50 <= rsi <= 70: score += 10
                elif 30 < rsi < 50: score += 5
                elif rsi > 70: score -= 10
                if market_risk_level == "LOW": score += 20
                else: score -= 10

                score = max(0, min(100, score))

                # Identify sector default
                sector = "Danh mục"
                for s in CANDIDATE_STOCKS:
                    if s["symbol"] == symbol:
                        sector = s["sector"]
                        break

                is_buy = (close > ma20) and (rsi < 75) and (score >= 60)
                action = "BUY" if is_buy else "SELL"

                buy_zone_min = round_tick_size(close, ex)
                buy_zone_max = round_tick_size(close * 1.025, ex)

                sl_raw = min(close - 2.0 * atr, close * 0.93)
                stop_loss = round_tick_size(sl_raw, ex)

                risk = close - stop_loss
                if risk <= 0:
                    risk = close * 0.07

                target_1 = round_tick_size(close + 2.0 * risk, ex)
                target_2 = round_tick_size(close + 3.0 * risk, ex)

                rr_ratio = f"1:{(target_1 - close) / risk:.1f}"

                exec_notes = f"Bỏ qua lệnh nếu mở phiên T+1 hở Gap UP vượt mức {buy_zone_max * 1000:,.0f}đ."

                rationale_points = [
                    f"Giá đóng cửa {close * 1000:,.0f}đ vượt đường trung bình động MA20 ({ma20 * 1000:,.0f}đ), củng cố xu hướng tăng." if close > ma20 else f"Giá đóng cửa dưới đường xu hướng ngắn hạn MA20 ({ma20 * 1000:,.0f}đ).",
                    f"Thanh khoản bùng nổ đạt {volume_ratio:.1f}x so với trung bình 20 phiên, dòng tiền mua chủ động." if volume_ratio > 1.2 else "Thanh khoản duy trì ở mức bình ổn.",
                    f"Chỉ báo RSI đạt {rsi:.1f} điểm, duy trì động lượng phục hồi tốt." if rsi > 50 else f"RSI ở mức {rsi:.1f} điểm, thể hiện áp lực cung lấn át.",
                    f"MACD phân kỳ dương ({macd_hist:.3f}) tạo tín hiệu tiếp diễn tăng giá mạnh mẽ." if macd_hist > 0 else "MACD phân kỳ âm, đà giảm tiếp tục kéo dài."
                ]

                full_rationale = " ".join(rationale_points) + " Khuyến nghị phù hợp với phân tích kỹ thuật và dòng tiền chung của thị trường."

                if score >= 80:
                    grade = "Grade A"
                elif score >= 60:
                    grade = "Grade B"
                else:
                    grade = "Grade C"

                res_item = {
                    "symbol": symbol,
                    "companyName": company_name,
                    "sector": sector,
                    "exchange": ex,
                    "action": action,
                    "score": score,
                    "grade": grade,
                    "currentPrice": round(close, 2),
                    "buy_zone": {"min": int(buy_zone_min * 1000), "max": int(buy_zone_max * 1000)},
                    "stop_loss": int(stop_loss * 1000),
                    "target_1": int(target_1 * 1000),
                    "target_2": int(target_2 * 1000),
                    "risk_reward_ratio": rr_ratio,
                    "rationale": full_rationale,
                    "rationale_points": rationale_points,
                    "exec_notes": exec_notes,
                    "has_event": False
                }
                scanned_results.append(res_item)

                # Exit Scanner
                is_held = any(s["symbol"] == symbol for s in CANDIDATE_STOCKS)
                if is_held:
                    exit_reasons = []
                    if close < ma20:
                        exit_reasons.append("Giá đóng cửa gãy đường xu hướng MA20")
                    if close <= stop_loss:
                        exit_reasons.append("Giá đóng cửa vi phạm ngưỡng dừng lỗ Stop Loss")
                    if prev_rsi > 70 and rsi < prev_rsi:
                        exit_reasons.append(f"Chỉ báo RSI quá mua quay đầu giảm (từ {prev_rsi:.1f} về {rsi:.1f})")

                    if exit_reasons:
                        exit_scanner_alerts.append({
                            "symbol": symbol,
                            "close": close,
                            "reasons": exit_reasons
                        })

                print(f"    -> Action={action}, Grade={grade}, Score={score}")
            except Exception as e:
                print(f"    -> Error analyzing symbol {symbol}: {e}")
        else:
            print(f"    -> Fallback for {symbol}. Fetching from previous backup database recommendations...")
            old_rec = None
            for r in backup_data.get("recommendations", []):
                if r["symbol"] == symbol:
                    old_rec = r
                    break
            if old_rec:
                buy_min = int(float(old_rec["targetBuyPrice"].split(" - ")[0])*1000) if " - " in old_rec["targetBuyPrice"] else int(old_rec["currentPrice"]*1000)
                buy_max = int(float(old_rec["targetBuyPrice"].split(" - ")[1])*1000) if " - " in old_rec["targetBuyPrice"] else int(old_rec["currentPrice"]*1.025*1000)
                scanned_results.append({
                    "symbol": symbol,
                    "companyName": old_rec["companyName"],
                    "sector": old_rec["sector"],
                    "exchange": "HOSE",
                    "action": old_rec["type"],
                    "score": 75,
                    "grade": "Grade B",
                    "currentPrice": old_rec["currentPrice"],
                    "buy_zone": {"min": buy_min, "max": buy_max},
                    "stop_loss": int(old_rec["stopLossPrice"]*1000),
                    "target_1": int(old_rec["targetSellPrice"]*1000),
                    "target_2": int(old_rec["targetSellPrice"]*1.1*1000),
                    "risk_reward_ratio": "1:2.0",
                    "rationale": old_rec["rationale"],
                    "rationale_points": [old_rec["rationale"]],
                    "exec_notes": "Retained from previous backup record.",
                    "has_event": False
                })
                print(f"    -> Retained successfully from backup for {symbol}.")

        # Safe sleep to avoid rate limits
        time.sleep(4.5)

    # Ensure all remaining candidate stocks are present in the final selections by pulling them from backup!
    scanned_symbols = [s["symbol"] for s in scanned_results]
    for leader in CANDIDATE_STOCKS:
        symbol = leader["symbol"]
        if symbol not in scanned_symbols:
            old_rec = None
            for r in backup_data.get("recommendations", []):
                if r["symbol"] == symbol:
                    old_rec = r
                    break
            if old_rec:
                buy_min = int(float(old_rec["targetBuyPrice"].split(" - ")[0])*1000) if " - " in old_rec["targetBuyPrice"] else int(old_rec["currentPrice"]*1000)
                buy_max = int(float(old_rec["targetBuyPrice"].split(" - ")[1])*1000) if " - " in old_rec["targetBuyPrice"] else int(old_rec["currentPrice"]*1.025*1000)
                scanned_results.append({
                    "symbol": symbol,
                    "companyName": old_rec["companyName"],
                    "sector": old_rec["sector"],
                    "exchange": "HOSE",
                    "action": old_rec["type"],
                    "score": 75,
                    "grade": "Grade B",
                    "currentPrice": old_rec["currentPrice"],
                    "buy_zone": {"min": buy_min, "max": buy_max},
                    "stop_loss": int(old_rec["stopLossPrice"]*1000),
                    "target_1": int(old_rec["targetSellPrice"]*1000),
                    "target_2": int(old_rec["targetSellPrice"]*1.1*1000),
                    "risk_reward_ratio": "1:2.0",
                    "rationale": old_rec["rationale"],
                    "rationale_points": [old_rec["rationale"]],
                    "exec_notes": "Retained from previous backup record.",
                    "has_event": False
                })

    # Prepare final selections
    all_buys = [s for s in scanned_results if s["action"] == "BUY"]
    all_sells = [s for s in scanned_results if s["action"] == "SELL"]

    all_buys.sort(key=lambda x: x["score"], reverse=True)
    all_sells.sort(key=lambda x: x["score"], reverse=True)

    selected_buys = all_buys[:8]
    selected_sells = all_sells[:4]
    final_selections = selected_buys + selected_sells

    # Generate Agent Readiness JSON format (Giai đoạn 3)
    agent_signals = {
        "scan_date": datetime.now().strftime("%Y-%m-%d"),
        "market_context": {
            "vnindex_status": vnindex_status,
            "market_risk_level": market_risk_level,
            "vnindex_value": round(vnindex_val, 2),
            "vnindex_change_percent": round(vnindex_pct, 2)
        },
        "signals": []
    }

    for item in final_selections:
        agent_signals["signals"].append({
            "ticker": item["symbol"],
            "exchange": item["exchange"],
            "action": item["action"],
            "confidence_score": item["score"],
            "grade": item["grade"],
            "price_data": {
                "buy_zone": item["buy_zone"],
                "stop_loss": item["stop_loss"],
                "target_1": item["target_1"],
                "target_2": item["target_2"],
                "risk_reward_ratio": item["risk_reward_ratio"]
            },
            "technical_rationale": item["rationale_points"],
            "execution_notes": item["exec_notes"]
        })

    # Save Agent Signals JSON
    with open(AGENT_SIGNALS_PATH, "w", encoding="utf-8") as f:
        json.dump(agent_signals, f, ensure_ascii=False, indent=2)
    print(f"\n[Agent Signal] Standard Agent Readiness output written to: {AGENT_SIGNALS_PATH}")

    # Generate UI-compatible stocks.json format (Original Schema)
    ui_recommendations = []
    for item in final_selections:
        buy_range_str = f"{item['buy_zone']['min']/1000:.1f} - {item['buy_zone']['max']/1000:.1f}" if item["action"] == "BUY" else "Không khuyến nghị"
        ui_recommendations.append({
            "symbol": item["symbol"],
            "companyName": item["companyName"],
            "sector": item["sector"],
            "type": item["action"],
            "currentPrice": round(item["currentPrice"], 2),
            "targetBuyPrice": buy_range_str,
            "targetSellPrice": round(item["target_1"]/1000, 2),
            "stopLossPrice": round(item["stop_loss"]/1000, 2),
            "riskLevel": "HIGH" if item["symbol"] in ["VIC", "VHM", "FRT", "DGC", "PVD", "DBC"] else ("LOW" if item["symbol"] in ["FPT", "VNM"] else "MEDIUM"),
            "rationale": item["rationale"],
            "riskRewardRatio": item["risk_reward_ratio"]
        })

    # Step 5: Update Market Summary (Indices)
    print("\n[Step 5] Fetching fresh stock market summaries...")
    index_symbol_mapping = {
        "vnIndex": "VNINDEX",
        "hoseIndex": "VN30",
        "hnxIndex": "HNXINDEX",
        "upcomIndex": "UPCOMINDEX"
    }

    market_summary = backup_data.get("marketSummary", {
        "vnIndex": {"name": "VN-Index", "value": 1788.61, "change": 15.2, "changePercent": 0.86, "volume": "18.500 tỷ VNĐ"},
        "hoseIndex": {"name": "HOSE", "value": 1934.83, "change": 12.3, "changePercent": 0.64, "volume": "15.200 tỷ VNĐ"},
        "hnxIndex": {"name": "HNX-Index", "value": 287.99, "change": -2.92, "changePercent": -1.0, "volume": "1.800 tỷ VNĐ"},
        "upcomIndex": {"name": "Upcom-Index", "value": 127.88, "change": 0.7, "changePercent": 0.55, "volume": "1.500 tỷ VNĐ"}
    })

    # Fetch and update indices values
    for index_key, ssi_symbol in index_symbol_mapping.items():
        print(f"  Fetching index value for {market_summary[index_key]['name']} ({ssi_symbol})...")
        updated = False

        try:
            df_idx, idx_source = get_historical_data_api(ssi_symbol, start_date, end_date)
            if df_idx is not None and len(df_idx) >= 2:
                for col in ['open', 'high', 'low', 'close']:
                    if col in df_idx.columns and df_idx[col].iloc[-1] > 10000:
                        df_idx[col] = df_idx[col] / 1000.0

                latest_val = float(df_idx["close"].iloc[-1])
                prev_val = float(df_idx["close"].iloc[-2])
                change = latest_val - prev_val
                change_percent = (change / prev_val) * 100

                vol_str = market_summary[index_key].get("volume", "15.000 tỷ VNĐ")

                market_summary[index_key]["value"] = round(latest_val, 2)
                market_summary[index_key]["change"] = round(change, 2)
                market_summary[index_key]["changePercent"] = round(change_percent, 2)
                market_summary[index_key]["volume"] = vol_str
                print(f"    -> Updated: Value={latest_val:.2f}, Change={change:+.2f} ({change_percent:+.2f}%)")
                updated = True
        except Exception as e:
            print(f"    -> Error updating index {ssi_symbol}: {e}")

        time.sleep(4.5)

    # Save stocks.json
    local_now = datetime.now()
    formatted_date = local_now.strftime("%d/%m/%Y")

    output_json = {
        "lastUpdated": formatted_date,
        "marketSummary": market_summary,
        "recommendations": ui_recommendations
    }

    os.makedirs(os.path.dirname(STOCKS_JSON_PATH), exist_ok=True)
    with open(STOCKS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(output_json, f, ensure_ascii=False, indent=2)
    print(f"\n[UI Output] Standard UI-compatible output updated in: {STOCKS_JSON_PATH}")

    # Trigger Webhook
    print("\n[Step 6] Triggering portfolio alerts & webhook notifications...")
    alert_lines = []
    if exit_scanner_alerts:
        alert_lines.append("🔴 **[CẢNH BÁO BÁN - PORTFOLIO EXIT ALERTS]**")
        for alert in exit_scanner_alerts:
            reasons_str = "; ".join(alert["reasons"])
            alert_lines.append(f"• **{alert['symbol']}**: Giá {alert['close'] * 1000:,.0f}đ - {reasons_str}")
        alert_lines.append("")

    grade_a_buys = [s for s in agent_signals["signals"] if s["action"] == "BUY" and s["grade"] == "Grade A"]
    if grade_a_buys:
        alert_lines.append("💚 **[CƠ HỘI MUA TỐT - GRADE A SIGNAL DETECTED]**")
        for signal in grade_a_buys:
            bz = signal["price_data"]["buy_zone"]
            tp = signal["price_data"]["target_1"]
            sl = signal["price_data"]["stop_loss"]
            alert_lines.append(
                f"• **{signal['ticker']}** ({signal['exchange']}): Vùng mua: {bz['min']:,.0f}đ - {bz['max']:,.0f}đ | "
                f"Mục tiêu: {tp:,.0f}đ | Cắt lỗ: {sl:,.0f}đ (RR {signal['price_data']['risk_reward_ratio']})"
            )
    else:
        alert_lines.append("ℹ️ Không tìm thấy tín hiệu Mua Grade A (Thị trường rủi ro cao hoặc không có mã bứt phá).")

    notification_title = f"Alpha Pulse Stock Signal Alert - {formatted_date}"
    notification_msg = "\n".join(alert_lines)
    send_notification(notification_title, notification_msg)

    print("\n=====================================================================")
    print("DAILY STOCK PIPELINE PIPELINE SUCCESSFULLY EXECUTED!")
    print("=====================================================================")

if __name__ == "__main__":
    main()
