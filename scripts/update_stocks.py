import os
import json
import time
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import requests

try:
    import vnstock
    from vnstock import Reference, Listing, Trading, Company
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

# Danh sách 42 mã chọn lọc: Đầy đủ 30 mã VN30 + 12 mã Midcap dẫn dắt
CANDIDATE_STOCKS = [
    # --- NHÓM VN30 (30 MÃ) ---
    {"symbol": "ACB", "companyName": "Ngân hàng TMCP Á Châu", "sector": "Ngân hàng"},
    {"symbol": "BCM", "companyName": "Tổng Công ty Đầu tư và Phát triển Công nghiệp", "sector": "Bất động sản KCN"},
    {"symbol": "BID", "companyName": "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", "sector": "Ngân hàng"},
    {"symbol": "BVH", "companyName": "Tập đoàn Bảo Việt", "sector": "Bảo hiểm"},
    {"symbol": "CTG", "companyName": "Ngân hàng TMCP Công Thương Việt Nam", "sector": "Ngân hàng"},
    {"symbol": "FPT", "companyName": "Công ty Cổ phần FPT", "sector": "Công nghệ"},
    {"symbol": "GAS", "companyName": "Tổng Công ty Khí Việt Nam - CTCP", "sector": "Dầu khí"},
    {"symbol": "GVR", "companyName": "Tập đoàn Công nghiệp Cao su Việt Nam - CTCP", "sector": "Cao su & BĐS KCN"},
    {"symbol": "HDB", "companyName": "Ngân hàng TMCP Phát triển TP. Hồ Chí Minh", "sector": "Ngân hàng"},
    {"symbol": "HPG", "companyName": "Công ty Cổ phần Tập đoàn Hòa Phát", "sector": "Thép"},
    {"symbol": "MBB", "companyName": "Ngân hàng TMCP Quân Đội", "sector": "Ngân hàng"},
    {"symbol": "MSN", "companyName": "Công ty Cổ phần Tập đoàn Masan", "sector": "Tiêu dùng"},
    {"symbol": "MWG", "companyName": "Công ty Cổ phần Đầu tư Thế giới Di Động", "sector": "Bán lẻ"},
    {"symbol": "PLX", "companyName": "Tập đoàn Xăng dầu Việt Nam", "sector": "Năng lượng"},
    {"symbol": "POW", "companyName": "Tổng Công ty Điện lực Dầu khí Việt Nam - CTCP", "sector": "Điện lực"},
    {"symbol": "SAB", "companyName": "Tổng Công ty Cổ phần Bia - Rượu - Nước giải khát Sài Gòn", "sector": "Đồ uống"},
    {"symbol": "SSB", "companyName": "Ngân hàng TMCP Đông Nam Á", "sector": "Ngân hàng"},
    {"symbol": "SSI", "companyName": "Công ty Cổ phần Chứng khoán SSI", "sector": "Chứng khoán"},
    {"symbol": "STB", "companyName": "Ngân hàng TMCP Sài Gòn Thương Tín", "sector": "Ngân hàng"},
    {"symbol": "TCB", "companyName": "Ngân hàng TMCP Kỹ thương Việt Nam", "sector": "Ngân hàng"},
    {"symbol": "TPB", "companyName": "Ngân hàng TMCP Tiên Phong", "sector": "Ngân hàng"},
    {"symbol": "VCB", "companyName": "Ngân hàng TMCP Ngoại Thương Việt Nam", "sector": "Ngân hàng"},
    {"symbol": "VHM", "companyName": "Công ty Cổ phần Vinhomes", "sector": "Bất động sản"},
    {"symbol": "VIB", "companyName": "Ngân hàng TMCP Quốc tế Việt Nam", "sector": "Ngân hàng"},
    {"symbol": "VIC", "companyName": "Tập đoàn Vingroup - CTCP", "sector": "Bất động sản"},
    {"symbol": "VJC", "companyName": "Công ty Cổ phần Hàng không Vietjet", "sector": "Hàng không"},
    {"symbol": "VNM", "companyName": "Công ty Cổ phần Sữa Việt Nam", "sector": "Thực phẩm"},
    {"symbol": "VPB", "companyName": "Ngân hàng TMCP Việt Nam Thịnh Vượng", "sector": "Ngân hàng"},
    {"symbol": "VRE", "companyName": "Công ty Cổ phần Vincom Retail", "sector": "Bất động sản"},
    {"symbol": "SHB", "companyName": "Ngân hàng TMCP Sài Gòn - Hà Nội", "sector": "Ngân hàng"},

    # --- NHÓM MIDCAP TIỀM NĂNG DẪN DẮT (12 MÃ) ---
    {"symbol": "DGC", "companyName": "CTCP Tập đoàn Hóa chất Đức Giang", "sector": "Hóa chất"},
    {"symbol": "FRT", "companyName": "CTCP Bán lẻ Kỹ thuật số FPT", "sector": "Bán lẻ"},
    {"symbol": "PVD", "companyName": "Tổng CTCP Khoan và Dịch vụ Khoan Dầu khí", "sector": "Dầu khí"},
    {"symbol": "VCI", "companyName": "CTCP Chứng khoán Vietcap", "sector": "Chứng khoán"},
    {"symbol": "HCM", "companyName": "CTCP Chứng khoán TP.Hồ Chí Minh", "sector": "Chứng khoán"},
    {"symbol": "VND", "companyName": "CTCP Chứng khoán VNDIRECT", "sector": "Chứng khoán"},
    {"symbol": "HSG", "companyName": "CTCP Tập đoàn Hoa Sen", "sector": "Thép"},
    {"symbol": "NKG", "companyName": "CTCP Thép Nam Kim", "sector": "Thép"},
    {"symbol": "DXG", "companyName": "CTCP Tập đoàn Đất Xanh", "sector": "Bất động sản"},
    {"symbol": "DIG", "companyName": "Tổng CTCP Đầu tư Phát triển Xây dựng", "sector": "Bất động sản"},
    {"symbol": "PDR", "companyName": "CTCP Phát triển Bất động sản Phát Đạt", "sector": "Bất động sản"},
    {"symbol": "GMD", "companyName": "CTCP Gemadept", "sector": "Logistics"},
]

def round_tick_size(price, exchange="HOSE"):
    """Làm tròn giá theo quy định bước giá từng sàn."""
    if exchange == "HOSE":
        if price < 10.0:
            step = 0.01
        elif price <= 50.0:
            step = 0.05
        else:
            step = 0.1
    else:
        step = 0.1
    return round(round(price / step) * step, 2)

def clamp_price_limits(price, ref_price, exchange="HOSE"):
    """Bảo đảm giá không vượt quá biên độ Trần/Sàn của phiên kế tiếp."""
    pct = 0.07 if exchange == "HOSE" else (0.10 if exchange == "HNX" else 0.15)
    floor_p = round_tick_size(ref_price * (1 - pct), exchange)
    ceiling_p = round_tick_size(ref_price * (1 + pct), exchange)
    return round_tick_size(max(floor_p, min(ceiling_p, price)), exchange)

def calculate_atr(df, period=14):
    high, low, close = df['high'], df['low'], df['close']
    close_prev = close.shift(1)
    tr = pd.concat([high - low, (high - close_prev).abs(), (low - close_prev).abs()], axis=1).max(axis=1)
    return tr.rolling(window=period, min_periods=1).mean()

def calculate_technical_indicators(df):
    df['ma20'] = df['close'].rolling(window=20, min_periods=1).mean()
    df['ma50'] = df['close'].rolling(window=50, min_periods=1).mean()
    df['vol_ma20'] = df['volume'].rolling(window=20, min_periods=1).mean()

    delta = df['close'].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(window=14, min_periods=1).mean()
    avg_loss = loss.rolling(window=14, min_periods=1).mean().replace(0, 0.00001)
    df['rsi'] = (100 - (100 / (1 + (avg_gain / avg_loss)))).fillna(50)

    df['ema12'] = df['close'].ewm(span=12, adjust=False, min_periods=1).mean()
    df['ema26'] = df['close'].ewm(span=26, adjust=False, min_periods=1).mean()
    df['macd'] = df['ema12'] - df['ema26']
    df['signal'] = df['macd'].ewm(span=9, adjust=False, min_periods=1).mean()
    df['hist'] = df['macd'] - df['signal']
    df['atr'] = calculate_atr(df, 14)

    # Compute daily return for statistical calculations
    df['daily_return'] = df['close'].pct_change()
    return df

def calculate_advanced_vn_risk_metrics(df, exchange='HOSE', is_margin_eligible=True, df_vnindex=None):
    """
    Thuật toán Quản trị Rủi ro Định lượng Chuẩn hóa cho TTCK Việt Nam (Production-Ready)
    1. UPCoM dùng VWAP (hoặc avg_price), HOSE/HNX dùng Close
    2. Rolling 3-day Returns (T+2.5 execution cycle) & Historical VaR 95%
    3. Multi-day Floor Hit Risk (Tần suất chạm sàn 60 phiên)
    4. Penalty Rủi ro bị cắt Margin
    5. Volatility Niên hóa (60 phiên)
    6. Max Drawdown (MDD)
    """
    if df is None or len(df) < 20:
        return {
            "status": "REJECTED",
            "reason": "Dữ liệu không đủ 20 phiên",
            "annual_vol": 0.25,
            "historical_var_t25": -0.07,
            "mdd": -0.15,
            "floor_hits_60d": 0,
            "floor_risk_flag": False,
            "margin_penalty": 1.0 if is_margin_eligible else 1.5,
            "avg_value_20d_bn": 0.0
        }

    # 1. Chọn giá theo đặc thù từng sàn
    price_col = 'vwap' if (exchange.upper() == 'UPCOM' and 'vwap' in df.columns) else (
        'avg_price' if (exchange.upper() == 'UPCOM' and 'avg_price' in df.columns) else 'close'
    )

    # 2. Tính Lợi nhuận 1D và T+2.5 (Rolling 3-day Return)
    df['returns_1d'] = df[price_col].pct_change()
    df['returns_t25'] = df[price_col].pct_change(periods=3)

    # 3. Lọc Thanh khoản tối thiểu (20 phiên gần nhất)
    df['trading_value'] = df[price_col] * df['volume']
    avg_value_20d = float(df['trading_value'].tail(20).mean())

    # 4. Historical VaR 95% thực tế cho chu kỳ T+2.5
    returns_t25_clean = df['returns_t25'].dropna()
    var_95_t25 = float(np.percentile(returns_t25_clean, 5)) if len(returns_t25_clean) >= 5 else -0.07

    # 5. Tần suất chạm sàn trong 60 phiên (Floor Hit Risk)
    floor_limit = -0.068 if exchange.upper() == 'HOSE' else (-0.098 if exchange.upper() == 'HNX' else -0.148)
    tail_returns_1d = df['returns_1d'].tail(60)
    floor_hits = int((tail_returns_1d <= floor_limit).sum())
    floor_risk_flag = floor_hits >= 2

    # 6. Penalty Margin
    margin_penalty = 1.0 if is_margin_eligible else 1.5

    # 7. Volatility Niên hóa 60 phiên
    tail_std = float(df['returns_1d'].tail(60).std())
    annual_vol = tail_std * np.sqrt(252) if not np.isnan(tail_std) else 0.25

    # 8. Max Drawdown
    rolling_max = df[price_col].cummax()
    mdd_series = (df[price_col] - rolling_max) / rolling_max
    mdd = float(mdd_series.min()) if not mdd_series.empty else -0.15

    return {
        "status": "PASSED" if avg_value_20d >= 1_000_000_000 else "LOW_LIQUIDITY",
        "avg_value_20d_bn": round(avg_value_20d / 1e9, 2),
        "annual_vol": round(annual_vol, 4),
        "historical_var_t25": round(var_95_t25, 4),
        "mdd": round(mdd, 4),
        "floor_hits_60d": floor_hits,
        "floor_risk_flag": floor_risk_flag,
        "margin_penalty": margin_penalty
    }

def normalize_universe_risk(scanned_results, market_risk_level="LOW"):
    """
    Chuẩn hóa Điểm Rủi Ro (Z-Score) trên toàn bộ Universe thay vì tính điểm thô.
    Phân loại cổ phiếu thành LOW, MEDIUM, HIGH dựa trên Z-score tổng hợp trong Universe.
    """
    if not scanned_results:
        return scanned_results

    valid_items = [r for r in scanned_results if "risk_metrics" in r]
    if len(valid_items) < 3:
        for r in scanned_results:
            r["riskLevel"] = r.get("riskLevel", "MEDIUM")
        return scanned_results

    # Trích xuất chỉ số để tính Z-Score
    vols = np.array([r["risk_metrics"]["annual_vol"] for r in valid_items])
    vars_t25 = np.array([abs(r["risk_metrics"]["historical_var_t25"]) for r in valid_items])
    mdds = np.array([abs(r["risk_metrics"]["mdd"]) for r in valid_items])
    penalties = np.array([r["risk_metrics"]["margin_penalty"] for r in valid_items])
    floor_flags = np.array([1.5 if r["risk_metrics"]["floor_risk_flag"] else 1.0 for r in valid_items])

    vol_std = vols.std() if vols.std() > 0 else 1.0
    var_std = vars_t25.std() if vars_t25.std() > 0 else 1.0
    mdd_std = mdds.std() if mdds.std() > 0 else 1.0

    vol_z = (vols - vols.mean()) / vol_std
    var_z = (vars_t25 - vars_t25.mean()) / var_std
    mdd_z = (mdds - mdds.mean()) / mdd_std

    raw_final_scores = (vol_z * 0.4 + var_z * 0.4 + mdd_z * 0.2) * penalties * floor_flags

    if market_risk_level == "HIGH":
        raw_final_scores += 0.5

    # Phân loại dựa trên Bách phân vị (Percentiles)
    p33 = np.percentile(raw_final_scores, 33)
    p66 = np.percentile(raw_final_scores, 66)

    for idx, r in enumerate(valid_items):
        score = raw_final_scores[idx]
        r["composite_risk_score"] = round(float(score), 3)
        if score >= p66 or r["risk_metrics"]["floor_risk_flag"]:
            r["riskLevel"] = "HIGH"
        elif score <= p33 and not r["risk_metrics"]["floor_risk_flag"]:
            r["riskLevel"] = "LOW"
        else:
            r["riskLevel"] = "MEDIUM"

    return scanned_results

def fetch_batch_smart_money(symbols):
    """Lấy dữ liệu mua/bán ròng Khối ngoại & Tự doanh gộp chung 1 request cho tất cả các mã."""
    smart_money_map = {sym: {"foreign_net_val": 0.0, "prop_net_val": 0.0} for sym in symbols}
    if not VNSTOCK_AVAILABLE:
        return smart_money_map
    try:
        price_board = Trading().price_board(symbols)
        if price_board is not None and not price_board.empty:
            for _, row in price_board.iterrows():
                sym = row.get('symbol')
                if sym in smart_money_map:
                    f_buy = float(row.get('foreign_buy_volume', 0) or 0)
                    f_sell = float(row.get('foreign_sell_volume', 0) or 0)
                    close = float(row.get('close_price', 0) or row.get('reference_price', 0) or 0)
                    smart_money_map[sym]["foreign_net_val"] = (f_buy - f_sell) * close
                    smart_money_map[sym]["prop_net_val"] = float(row.get('prop_net_value', 0) or 0)
    except (Exception, SystemExit) as e:
        print(f"  -> Warning: Failed to fetch batch price board: {e}")
    return smart_money_map

def check_corporate_events(symbol):
    """Kiểm tra và loại bỏ các mã dính Lịch giao dịch không hưởng quyền (GDKHQ)."""
    if not VNSTOCK_AVAILABLE:
        return False, "Bình thường"
    try:
        company = Company(symbol=symbol, source='VCI')
        df_events = company.events()
        if df_events is not None and not df_events.empty:
            df_events['event_date'] = pd.to_datetime(df_events['public_date'], errors='coerce')
            now = pd.Timestamp.now()
            recent_events = df_events[
                (df_events['event_date'] >= now - pd.Timedelta(days=2)) &
                (df_events['event_date'] <= now + pd.Timedelta(days=3))
            ]
            if not recent_events.empty:
                event_name = recent_events.iloc[0].get('event_name', 'Sự kiện quyền')
                return True, f"Cảnh báo: [{event_name}] gần ngày GDKHQ"
    except (Exception, SystemExit):
        pass
    return False, "Bình thường"

def get_exchange_mapping():
    """Maps symbols to their respective exchange & name."""
    mapping = {}
    if not VNSTOCK_AVAILABLE:
        return mapping
    try:
        df = Listing().symbols_by_exchange('HOSE')
        if df is not None and not df.empty:
            stocks_df = df[df['type'] == 'stock']
            for _, row in stocks_df.iterrows():
                ex = row.get('exchange') or 'HOSE'
                mapping[row['symbol']] = {
                    "exchange": ex,
                    "organ_name": row.get("organ_name", "")
                }
    except (Exception, SystemExit) as e:
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
            payload = {"content": f"⚠️ **{title}**\n\n{message}"}
            requests.post(discord_webhook, json=payload, timeout=5)
            print("Discord notification sent successfully.")
        except Exception as e:
            print(f"Failed to send Discord notification: {e}")

def get_historical_data_api(symbol, start_date, end_date):
    if not VNSTOCK_AVAILABLE:
        return None, None
    sources = ['kbs', 'msn']
    for source in sources:
        try:
            q = VnQuote(symbol=symbol, source=source)
            df = q.history(start=start_date, end=end_date)
            if df is not None and not df.empty and "close" in df.columns:
                df.columns = [c.lower() for c in df.columns]
                for col in ['open', 'high', 'low', 'close', 'volume']:
                    if col in df.columns:
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                # Verify price scale
                if df['close'].iloc[-1] < 1.0:
                    continue
                return df, source
        except (Exception, SystemExit):
            pass
    return None, None

def main():
    print("=====================================================================")
    print("BẮT ĐẦU QUÉT HỆ THỐNG ALPHA PULSE (42 MÃ VN30 & MIDCAP HÀNG ĐẦU)")
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

    end_date_dt = datetime.now()
    start_date_dt = end_date_dt - timedelta(days=365)
    start_date, end_date = start_date_dt.strftime("%Y-%m-%d"), end_date_dt.strftime("%Y-%m-%d")

    # Step 1: Xác định Xu hướng VN-Index
    print("\n[Step 1] Fetching VN-Index for Market Regime Filter...")
    vnindex_status, market_risk_level = "UPTREND", "LOW"
    vnindex_val = 1740.0
    vnindex_change = 0.0
    vnindex_pct = 0.0
    df_vn = None

    try:
        df_vn, _ = get_historical_data_api("VNINDEX", start_date, end_date)
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
            if vnindex_val < ma20_vn:
                vnindex_status, market_risk_level = "DOWNTREND", "HIGH"
            print(f"  -> [VN-Index]: {vnindex_val:.2f} ({vnindex_pct:+.2f}%) | Trạng thái: {vnindex_status} | Rủi ro: {market_risk_level}")
        else:
            print("  -> WARNING: Failed to fetch VNINDEX. Falling back to backup context.")
    except (Exception, SystemExit) as e:
        print(f"  -> Lỗi lấy dữ liệu VN-Index: {e}")

    exchange_map = get_exchange_mapping()

    # Pre-fetch Batch Smart Money Signals for all 42 stocks in 1 request
    all_symbols = [item["symbol"] for item in CANDIDATE_STOCKS]
    smart_money_batch = fetch_batch_smart_money(all_symbols)

    # Step 2: Quét toàn bộ danh sách 42 Mã chọn lọc
    scanned_results = []
    exit_scanner_alerts = []
    print(f"\n[Step 2] Bắt đầu quét {len(CANDIDATE_STOCKS)} mã cổ phiếu...")

    for idx, item in enumerate(CANDIDATE_STOCKS):
        symbol = item["symbol"]
        meta = exchange_map.get(symbol, {"exchange": "HOSE", "organ_name": item["companyName"]})
        ex = meta["exchange"]
        comp_name = item["companyName"] or meta["organ_name"]

        print(f"[{idx+1}/{len(CANDIDATE_STOCKS)}] Đang phân tích: {symbol}...", end=" ")

        # 1. Bỏ qua nếu dính ngày GDKHQ
        has_event, event_msg = check_corporate_events(symbol)
        if has_event:
            print(f"-> [LOẠI]: {event_msg}")
            continue

        # 2. Lấy giá lịch sử
        df, _ = get_historical_data_api(symbol, start_date, end_date)

        if df is not None and len(df) >= 20:
            try:
                for col in ['open', 'high', 'low', 'close']:
                    if df[col].iloc[-1] > 1000:
                        df[col] = df[col] / 1000.0

                df = calculate_technical_indicators(df)
                close = float(df['close'].iloc[-1])
                prev_close = float(df['close'].iloc[-2]) if len(df) >= 2 else close
                rsi = float(df['rsi'].iloc[-1])
                prev_rsi = float(df['rsi'].iloc[-2]) if len(df) >= 2 else rsi
                macd_hist = float(df['hist'].iloc[-1])
                prev_macd_hist = float(df['hist'].iloc[-2]) if len(df) >= 2 else 0.0
                macd_line = float(df['macd'].iloc[-1])
                signal_line = float(df['signal'].iloc[-1])
                ma20, ma50 = float(df['ma20'].iloc[-1]), float(df['ma50'].iloc[-1])
                atr = float(df['atr'].iloc[-1])
                vol_ratio = float(df['volume'].iloc[-1]) / float(df['vol_ma20'].iloc[-1]) if df['vol_ma20'].iloc[-1] > 0 else 1.0

                # 3. Dòng tiền Khối ngoại & Tự doanh
                smart_money = smart_money_batch.get(symbol, {"foreign_net_val": 0.0, "prop_net_val": 0.0})
                f_val = smart_money["foreign_net_val"] / 1_000_000_000
                p_val = smart_money["prop_net_val"] / 1_000_000_000

                # 4. Tính Điểm tự tin (Quant Score 0-100)
                score = 50
                if close > ma20: score += 10
                if close > ma50: score += 10
                if macd_hist > 0 and macd_hist > prev_macd_hist: score += 10
                if vol_ratio > 1.2: score += 10
                if 50 <= rsi <= 70: score += 10
                if f_val > 5.0: score += 10
                elif f_val < -5.0: score -= 10
                if p_val > 2.0: score += 5
                elif p_val < -2.0: score -= 5
                if market_risk_level == "LOW": score += 5
                else: score -= 5

                score = max(0, min(100, score))

                # 5. Đánh giá Mức độ Rủi ro (Production-Ready Vietnam Quantitative Risk Model)
                risk_metrics = calculate_advanced_vn_risk_metrics(df, exchange=ex, is_margin_eligible=True, df_vnindex=df_vn)
                dynamic_risk_level = "MEDIUM" # Default before universe normalization

                # 6. Xác định điểm Quản trị vị thế (Thanh khoản T+2.5 & Biên độ sàn)
                buy_min = round_tick_size(close, ex)
                buy_max = clamp_price_limits(close * 1.02, close, ex)
                sl_raw = min(close - 2.0 * atr, close * 0.93)
                stop_loss = clamp_price_limits(sl_raw, close, ex)
                risk = max(close - stop_loss, close * 0.05)
                target1 = clamp_price_limits(close + 2.0 * risk, close, ex)
                target2 = clamp_price_limits(close + 3.0 * risk, close, ex)

                is_buy = (close > ma20 and score >= 65)
                is_sell = (close < ma20 or score <= 45 or macd_hist < 0 or rsi < 45 or close <= stop_loss)

                if is_buy:
                    action = "BUY"
                elif is_sell:
                    action = "SELL"
                else:
                    action = "HOLD/WATCH"

                if score >= 80:
                    grade = "Grade A"
                elif score >= 60:
                    grade = "Grade B"
                else:
                    grade = "Grade C"

                rr_ratio = f"1:{(target1 - close) / risk:.1f}" if action == "BUY" else "1:1.0"
                exec_notes = (
                    f"Bỏ qua lệnh nếu mở phiên T+1 hở Gap UP vượt mức {buy_max * 1000:,.0f}đ."
                    if action == "BUY" else
                    "Khuyến nghị hạ tỷ trọng/bán chốt lời hoặc cắt lỗ quản trị rủi ro ngay khi vi phạm mốc MA20."
                )

                rationale_points = [
                    f"Giá đóng cửa {close * 1000:,.0f}đ vượt đường trung bình động MA20 ({ma20 * 1000:,.0f}đ), củng cố xu hướng tăng." if close > ma20 else f"Giá đóng cửa {close * 1000:,.0f}đ gãy đường xu hướng ngắn hạn MA20 ({ma20 * 1000:,.0f}đ), suy yếu xu hướng.",
                    f"Thanh khoản bùng nổ đạt {vol_ratio:.1f}x so với trung bình 20 phiên, dòng tiền mua chủ động." if vol_ratio > 1.2 else "Thanh khoản duy trì ở mức bình ổn.",
                    f"Chỉ báo RSI đạt {rsi:.1f} điểm, duy trì động lượng phục hồi tốt." if rsi > 50 else f"RSI ở mức {rsi:.1f} điểm, thể hiện áp lực cung lấn át suy yếu đà tăng.",
                    f"MACD phân kỳ dương ({macd_hist:.3f}) tạo tín hiệu tiếp diễn tăng giá mạnh mẽ." if macd_hist > 0 else f"MACD phân kỳ âm ({macd_hist:.3f}), áp lực điều chỉnh gia tăng."
                ]
                full_rationale = " ".join(rationale_points) + (" Khuyến nghị Mua gia tăng vị thế theo xu hướng." if action == "BUY" else " Khuyến nghị Bán/Hạ tỷ trọng để quản trị rủi ro danh mục.")

                scanned_results.append({
                    "symbol": symbol,
                    "companyName": comp_name,
                    "sector": item["sector"],
                    "exchange": ex,
                    "action": action,
                    "score": score,
                    "grade": grade,
                    "closePrice": round(close * 1000, 0),
                    "currentPrice": round(close, 2),
                    "foreignNetBuyBillion": round(f_val, 2),
                    "propNetBuyBillion": round(p_val, 2),
                    "buy_zone": {"min": int(buy_min * 1000), "max": int(buy_max * 1000)},
                    "stop_loss": int(stop_loss * 1000),
                    "target_1": int(target1 * 1000),
                    "target_2": int(target2 * 1000),
                    "risk_reward_ratio": rr_ratio,
                    "rationale": full_rationale,
                    "rationale_points": rationale_points,
                    "exec_notes": exec_notes,
                    "risk_metrics": risk_metrics,
                    "riskLevel": dynamic_risk_level
                })
                print(f"-> [THÀNH CÔNG] Điểm: {score}/100 | Khuyến nghị: {action}")

                # Check Exit Alerts
                exit_reasons = []
                if close < ma20:
                    exit_reasons.append("Giá đóng cửa gãy đường xu hướng MA20")
                if close <= stop_loss:
                    exit_reasons.append("Giá đóng cửa vi phạm ngưỡng dừng lỗ Stop Loss")
                if prev_rsi > 70 and rsi < prev_rsi:
                    exit_reasons.append(f"RSI quá mua quay đầu giảm (từ {prev_rsi:.1f} về {rsi:.1f})")
                if exit_reasons:
                    exit_scanner_alerts.append({"symbol": symbol, "close": close, "reasons": exit_reasons})

            except (Exception, SystemExit) as e:
                print(f"-> [LỖI TÍNH TOÁN]: {e}")
        else:
            print("-> [KHÔNG DỮ LIỆU/DỰ PHÒNG] Khôi phục từ dữ liệu backup...")
            old_rec = None
            for r in backup_data.get("recommendations", []):
                if r["symbol"] == symbol:
                    old_rec = r
                    break
            if old_rec:
                scanned_results.append({
                    "symbol": symbol,
                    "companyName": item["companyName"],
                    "sector": item["sector"],
                    "exchange": ex,
                    "action": old_rec["type"],
                    "score": 65,
                    "grade": "Grade B",
                    "closePrice": round(old_rec["currentPrice"] * 1000, 0),
                    "currentPrice": old_rec["currentPrice"],
                    "foreignNetBuyBillion": 0.0,
                    "propNetBuyBillion": 0.0,
                    "buy_zone": {"min": int(old_rec["currentPrice"] * 1000), "max": int(old_rec["currentPrice"] * 1.02 * 1000)},
                    "stop_loss": int(old_rec["stopLossPrice"] * 1000),
                    "target_1": int(old_rec["targetSellPrice"] * 1000),
                    "target_2": int(old_rec["targetSellPrice"] * 1.1 * 1000),
                    "risk_reward_ratio": "1:2.0",
                    "rationale": old_rec["rationale"],
                    "rationale_points": [old_rec["rationale"]],
                    "exec_notes": "Retained from previous record.",
                    "riskLevel": old_rec.get("riskLevel", "MEDIUM")
                })
            else:
                # Default baseline fallback record
                scanned_results.append({
                    "symbol": symbol,
                    "companyName": item["companyName"],
                    "sector": item["sector"],
                    "exchange": ex,
                    "action": "HOLD/WATCH",
                    "score": 50,
                    "grade": "Grade C",
                    "closePrice": 25000,
                    "currentPrice": 25.0,
                    "foreignNetBuyBillion": 0.0,
                    "propNetBuyBillion": 0.0,
                    "buy_zone": {"min": 25000, "max": 25500},
                    "stop_loss": 23500,
                    "target_1": 28000,
                    "target_2": 30000,
                    "risk_reward_ratio": "1:2.0",
                    "rationale": "Cổ phiếu trong danh sách theo dõi xu hướng.",
                    "rationale_points": ["Cổ phiếu trong danh sách theo dõi xu hướng."],
                    "exec_notes": "Theo dõi sát tín hiệu dòng tiền.",
                    "riskLevel": "MEDIUM"
                })

        # Smart delay (0.4s) to safely process all 42 candidates
        time.sleep(0.4)

    # Step 2.5: Chuẩn hóa điểm rủi ro Z-Score toàn vũ trụ cổ phiếu (Universe Risk Normalization)
    scanned_results = normalize_universe_risk(scanned_results, market_risk_level=market_risk_level)

    # Step 3: Chọn lọc danh sách khuyến nghị & xuất file JSON
    print("\n[Step 3] Xuất dữ liệu cho AI Agent và Giao diện UI...")
    all_buys = [s for s in scanned_results if s["action"] == "BUY"]
    all_sells = [s for s in scanned_results if s["action"] == "SELL"]
    all_watch = [s for s in scanned_results if s["action"] == "HOLD/WATCH"]

    all_buys.sort(key=lambda x: x["score"], reverse=True)
    all_sells.sort(key=lambda x: x["score"]) # Lowest score / clearest sell signals first
    all_watch.sort(key=lambda x: x["score"], reverse=True)

    # Select top recommendations (8 buys + 4 sells)
    selected_buys = all_buys[:8]
    selected_sells = all_sells[:4]

    # Fill if not enough sells or buys
    if len(selected_sells) < 4:
        # Fill from watch list marked as SELL
        additional_sells = all_watch[:(4 - len(selected_sells))]
        for item in additional_sells:
            item["action"] = "SELL"
        selected_sells += additional_sells

    final_selections = selected_buys + selected_sells
    if len(final_selections) < 12:
        remaining = [s for s in scanned_results if s not in final_selections]
        remaining.sort(key=lambda x: x["score"], reverse=True)
        final_selections += remaining[:(12 - len(final_selections))]

    # Generate Agent Readiness JSON format
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
            "action": "BUY" if item["action"] == "BUY" else "SELL",
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

    os.makedirs(os.path.dirname(AGENT_SIGNALS_PATH), exist_ok=True)
    with open(AGENT_SIGNALS_PATH, "w", encoding="utf-8") as f:
        json.dump(agent_signals, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"  -> Agent Signals JSON written to: {AGENT_SIGNALS_PATH}")

    # Generate UI-compatible stocks.json format
    ui_recommendations = []
    for item in final_selections:
        rec_type = "BUY" if item["action"] == "BUY" else "SELL"
        buy_range_str = f"{item['buy_zone']['min']/1000:.1f} - {item['buy_zone']['max']/1000:.1f}" if rec_type == "BUY" else "Không khuyến nghị"
        ui_recommendations.append({
            "symbol": item["symbol"],
            "companyName": item["companyName"],
            "sector": item["sector"],
            "type": rec_type,
            "currentPrice": round(item["currentPrice"], 2),
            "targetBuyPrice": buy_range_str,
            "targetSellPrice": round(item["target_1"]/1000, 2),
            "stopLossPrice": round(item["stop_loss"]/1000, 2),
            "riskLevel": item["riskLevel"],
            "rationale": item["rationale"],
            "riskRewardRatio": item["risk_reward_ratio"]
        })

    # Step 4: Update Market Summary Indices
    print("\n[Step 4] Fetching fresh stock market summaries...")
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

    for index_key, ssi_symbol in index_symbol_mapping.items():
        try:
            df_idx, _ = get_historical_data_api(ssi_symbol, start_date, end_date)
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
        except (Exception, SystemExit) as e:
            print(f"  -> Error updating index {ssi_symbol}: {e}")

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
        f.write("\n")
    print(f"  -> UI Stocks JSON written to: {STOCKS_JSON_PATH}")

    # Output active DataFrame to terminal
    df_res = pd.DataFrame(scanned_results)
    print("\n=====================================================================")
    print("KẾT QUẢ QUÉT TÍCH CỰC (TOP CỔ PHIẾU ĐIỂM CAO NHẤT):")
    print("=====================================================================")
    if not df_res.empty:
        df_sorted = df_res.sort_values(by="score", ascending=False)
        cols_to_print = [c for c in ['symbol', 'sector', 'closePrice', 'score', 'foreignNetBuyBillion', 'action', 'buy_zone', 'stop_loss'] if c in df_sorted.columns]
        print(df_sorted[cols_to_print].to_string(index=False))

    # Trigger Notifications
    print("\n[Step 5] Triggering notifications...")
    alert_lines = []
    if exit_scanner_alerts:
        alert_lines.append("🔴 **[CẢNH BÁO BÁN - PORTFOLIO EXIT ALERTS]**")
        for alert in exit_scanner_alerts[:5]:
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
    print("HOÀN THÀNH CẬP NHẬT DỮ LIỆU ALPHA PULSE!")
    print("=====================================================================")

if __name__ == "__main__":
    main()
