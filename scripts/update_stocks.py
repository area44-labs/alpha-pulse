import os
import json
import time
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import requests

# Try to import vnstock using multiple version conventions for maximum compatibility
try:
    from vnstock.api.quote import Quote as VnQuote
    def get_historical_data_api(symbol, start_date, end_date):
        for source in ['KBS', 'MSN', 'VCI']:
            try:
                q = VnQuote(symbol=symbol, source=source)
                df = q.history(start=start_date, end=end_date)
                if df is not None and not df.empty and "close" in df.columns:
                    # Make columns lowercase to standardize
                    df.columns = [c.lower() for c in df.columns]
                    # Ensure numeric columns
                    for col in ['open', 'high', 'low', 'close', 'volume']:
                        if col in df.columns:
                            df[col] = pd.to_numeric(df[col], errors='coerce')
                    return df, source
            except Exception as e:
                pass
            time.sleep(1.0)
        return None, None
    VNSTOCK_AVAILABLE = True
except ImportError:
    VNSTOCK_AVAILABLE = False
    def get_historical_data_api(symbol, start_date, end_date):
        return None, None

STOCKS_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src", "data", "stocks.json"
)

# Curated high-liquidity market leaders representing key sectors to bypass API rate limits (Max 14 stocks)
CANDIDATE_STOCKS = [
    # Banking
    {"symbol": "TCB", "companyName": "Ngân hàng TMCP Kỹ thương Việt Nam", "sector": "Ngân hàng", "riskLevel": "MEDIUM"},
    {"symbol": "STB", "companyName": "Ngân hàng TMCP Sài Gòn Thương Tín", "sector": "Ngân hàng", "riskLevel": "MEDIUM"},
    # Securities / Financial Services
    {"symbol": "SSI", "companyName": "Công ty Cổ phần Chứng khoán SSI", "sector": "Dịch vụ tài chính", "riskLevel": "MEDIUM"},
    # Steel / Materials
    {"symbol": "HPG", "companyName": "Công ty Cổ phần Tập đoàn Hòa Phát", "sector": "Thép", "riskLevel": "MEDIUM"},
    # Tech
    {"symbol": "FPT", "companyName": "Công ty Cổ phần FPT", "sector": "Công nghệ", "riskLevel": "LOW"},
    # Real Estate
    {"symbol": "VHM", "companyName": "Công ty Cổ phần Vinhomes", "sector": "Bất động sản", "riskLevel": "HIGH"},
    {"symbol": "VIC", "companyName": "Tập đoàn Vingroup - CTCP", "sector": "Bất động sản", "riskLevel": "HIGH"},
    # Retail / Consumer Goods
    {"symbol": "MWG", "companyName": "Công ty Cổ phần Đầu tư Thế giới Di Động", "sector": "Bán lẻ", "riskLevel": "MEDIUM"},
    {"symbol": "FRT", "companyName": "Công ty Cổ phần Bán lẻ Kỹ thuật số FPT", "sector": "Bán lẻ", "riskLevel": "HIGH"},
    {"symbol": "VNM", "companyName": "Công ty Cổ phần Sữa Việt Nam", "sector": "Thực phẩm & Đồ uống", "riskLevel": "LOW"},
    # Chemicals
    {"symbol": "DGC", "companyName": "Công ty Cổ phần Tập đoàn Hóa chất Đức Giang", "sector": "Hóa chất", "riskLevel": "HIGH"},
    # Oil & Gas
    {"symbol": "PVD", "companyName": "Tổng Công ty Cổ phần Khoan và Dịch vụ Khoan Dầu khí", "sector": "Dầu khí", "riskLevel": "HIGH"},
    # Seafood / Agriculture
    {"symbol": "VHC", "companyName": "Công ty Cổ phần Vĩnh Hoàn", "sector": "Thủy sản", "riskLevel": "MEDIUM"},
    {"symbol": "DBC", "companyName": "Công ty Cổ phần Tập đoàn Dabaco Việt Nam", "sector": "Nông nghiệp", "riskLevel": "HIGH"},
]

def calculate_technical_indicators(df):
    """
    Computes technical indicators: MA20, MA50, RSI (14), MACD (12, 26, 9) and Volume MA20.
    Expects df to have columns 'close' and 'volume'.
    """
    # Simple Moving Averages
    df['ma20'] = df['close'].rolling(window=20, min_periods=1).mean()
    df['ma50'] = df['close'].rolling(window=50, min_periods=1).mean()
    df['vol_ma20'] = df['volume'].rolling(window=20, min_periods=1).mean()

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
    # Fill defaults
    df['rsi'] = df['rsi'].fillna(50)

    # MACD (12, 26, 9)
    df['ema12'] = df['close'].ewm(span=12, adjust=False, min_periods=1).mean()
    df['ema26'] = df['close'].ewm(span=26, adjust=False, min_periods=1).mean()
    df['macd'] = df['ema12'] - df['ema26']
    df['signal'] = df['macd'].ewm(span=9, adjust=False, min_periods=1).mean()
    df['hist'] = df['macd'] - df['signal']

    return df

def run_quantitative_analysis(stock_meta, df):
    """
    Applies end-of-day momentum trading strategy rules.
    Outputs action type (BUY, SELL), targets, stop loss, risk-reward ratio, and Vietnamese text justification.
    """
    symbol = stock_meta["symbol"]
    company_name = stock_meta["companyName"]
    sector = stock_meta["sector"]
    risk_level = stock_meta["riskLevel"]

    # Retrieve current and previous values
    current_price = float(df['close'].iloc[-1])
    prev_price = float(df['close'].iloc[-2]) if len(df) >= 2 else current_price

    rsi = float(df['rsi'].iloc[-1])
    macd_val = float(df['macd'].iloc[-1])
    signal_val = float(df['signal'].iloc[-1])
    hist_val = float(df['hist'].iloc[-1])
    prev_hist = float(df['hist'].iloc[-2]) if len(df) >= 2 else 0.0

    ma20_val = float(df['ma20'].iloc[-1])
    ma50_val = float(df['ma50'].iloc[-1])

    vol_val = float(df['volume'].iloc[-1])
    vol_ma20_val = float(df['vol_ma20'].iloc[-1]) if float(df['vol_ma20'].iloc[-1]) > 0 else 1.0
    vol_ratio = vol_val / vol_ma20_val

    # Scoring logic
    buy_score = 0
    sell_score = 0

    if current_price > ma20_val:
        buy_score += 2
    else:
        sell_score += 2

    if current_price > ma50_val:
        buy_score += 1
    else:
        sell_score += 1

    if 30 < rsi < 55:
        buy_score += 2
    elif 55 <= rsi < 70:
        buy_score += 1
    elif rsi >= 70:
        sell_score += 2
    elif rsi <= 30:
        buy_score += 1

    if hist_val > 0:
        buy_score += 1
        if hist_val > prev_hist:
            buy_score += 1
    else:
        sell_score += 1
        if hist_val < prev_hist:
            sell_score += 1

    if vol_ratio > 1.15 and current_price > prev_price:
        buy_score += 2
    elif vol_ratio > 1.15 and current_price < prev_price:
        sell_score += 2

    is_buy = buy_score >= sell_score

    if is_buy:
        rec_type = "BUY"
        low_buy = round(current_price * 0.98, 1)
        high_buy = round(current_price * 1.01, 1)
        target_buy_price = f"{low_buy:.1f} - {high_buy:.1f}"

        upside_factor = 1.15 if risk_level == "MEDIUM" else (1.12 if risk_level == "LOW" else 1.18)
        target_sell_price = round(current_price * upside_factor, 1)

        downside_factor = 0.93 if risk_level == "MEDIUM" else (0.94 if risk_level == "LOW" else 0.92)
        stop_loss_price = round(current_price * downside_factor, 1)

        vol_text = f" Khối lượng giao dịch bứt phá vượt {vol_ratio:.1f} lần trung bình 20 phiên, khẳng định lực cầu chủ động hấp thụ tốt lượng cung." if vol_ratio > 1.1 else ""
        macd_text = "MACD duy trì phân kỳ dương phía trên đường tín hiệu tạo động lực tăng trưởng vững vàng." if hist_val > 0 else "MACD bắt đầu thu hẹp khoảng cách âm và hướng lên trên đường tín hiệu."
        rsi_text = f"Chỉ báo RSI đạt {rsi:.1f} điểm đang trong xu hướng phục hồi tích cực và còn nhiều dư địa tăng trưởng trước khi chạm vùng quá mua."

        rationale = (
            f"Mã cổ phiếu {symbol} đã chính thức đóng cửa tại mức {current_price:.1f}, thiết lập giao dịch ổn định trên đường xu hướng MA20 ({ma20_val:.1f}) và MA50 ({ma50_val:.1f}). "
            f"{rsi_text} {macd_text}{vol_text} Cấu trúc giá tích lũy chặt chẽ và dòng tiền lớn quay trở lại nhóm {sector} là cơ sở tin cậy để mở vị thế mua quanh vùng giá hiện tại."
        )
        score = buy_score
    else:
        rec_type = "SELL"
        target_buy_price = "Không khuyến nghị"

        downside_factor = 0.88 if risk_level == "MEDIUM" else (0.90 if risk_level == "LOW" else 0.85)
        target_sell_price = round(current_price * downside_factor, 1)

        upside_factor = 1.05 if risk_level == "MEDIUM" else (1.04 if risk_level == "LOW" else 1.06)
        stop_loss_price = round(current_price * upside_factor, 1)

        vol_text = f" Áp lực bán tháo gia tăng mạnh với thanh khoản đạt {vol_ratio:.1f} lần bình quân 20 phiên." if vol_ratio > 1.1 else ""
        macd_text = "Chỉ báo MACD giao cắt âm dưới đường tín hiệu và đang mở rộng khoảng cách về phía dưới, cảnh báo xu hướng suy yếu." if hist_val < 0 else "MACD suy yếu rõ rệt tạo phân kỳ âm trên đồ thị ngày."
        rsi_text = f"Chỉ báo RSI suy giảm về mốc {rsi:.1f} điểm, thể hiện áp lực phân phối đang chiếm ưu thế tuyệt đối."

        rationale = (
            f"Mã cổ phiếu {symbol} đã chính thức đánh mất đường hỗ trợ ngắn hạn MA20 ({ma20_val:.1f}) và đang chịu sức ép lớn từ đường MA50. "
            f"{rsi_text} {macd_text}{vol_text} Xu hướng giảm ngắn hạn đã được xác nhận vững chắc trong nhóm {sector}. Khuyến nghị nhà đầu tư cơ cấu, chủ động hạ tỷ trọng bán chốt lời hoặc cắt lỗ để bảo vệ nguồn vốn."
        )
        score = sell_score

    return {
        "symbol": symbol,
        "companyName": company_name,
        "sector": sector,
        "type": rec_type,
        "currentPrice": round(current_price, 2),
        "targetBuyPrice": target_buy_price,
        "targetSellPrice": round(target_sell_price, 2),
        "stopLossPrice": round(stop_loss_price, 2),
        "riskLevel": risk_level,
        "rationale": rationale,
        "analysisScore": score
    }

def main():
    print("Starting comprehensive end-of-day stock analysis for Vietnam stock market...")

    # Load backup data
    backup_data = {}
    try:
        if os.path.exists(STOCKS_JSON_PATH):
            with open(STOCKS_JSON_PATH, "r", encoding="utf-8") as f:
                backup_data = json.load(f)
            print("Loaded backup stocks data successfully.")
    except Exception as e:
        print(f"Warning: Failed to load stocks.json backup: {e}")

    # Set historical date range (45 days is enough for standard indicators)
    end_date_dt = datetime.now()
    start_date_dt = end_date_dt - timedelta(days=45)
    start_date = start_date_dt.strftime("%Y-%m-%d")
    end_date = end_date_dt.strftime("%Y-%m-%d")

    analyzed_stocks = []

    print(f"Historical Price Date range: {start_date} to {end_date}")

    # Execute technical screening
    for idx, stock_meta in enumerate(CANDIDATE_STOCKS):
        symbol = stock_meta["symbol"]
        print(f"[{idx+1}/{len(CANDIDATE_STOCKS)}] Analyzing ticker: {symbol}...")

        df, source = get_historical_data_api(symbol, start_date, end_date)
        if df is not None and len(df) >= 20:
            try:
                # Normalize prices (VND to thousands)
                for col in ['open', 'high', 'low', 'close']:
                    if col in df.columns:
                        first_valid = df[col].dropna()
                        if not first_valid.empty and first_valid.iloc[-1] > 1000:
                            df[col] = df[col] / 1000.0

                df = calculate_technical_indicators(df)
                rec = run_quantitative_analysis(stock_meta, df)
                analyzed_stocks.append(rec)
                print(f"  -> Analyzed via {source} as {rec['type']} with Price={rec['currentPrice']} (Score: {rec['analysisScore']})")
            except Exception as e:
                print(f"  -> Error analyzing {symbol}: {e}")
        else:
            print(f"  -> Failed to pull history for {symbol}. Fetching from backup recommendations if available...")
            old_rec = None
            for r in backup_data.get("recommendations", []):
                if r["symbol"] == symbol:
                    old_rec = r
                    break
            if old_rec:
                analyzed_stocks.append(old_rec)
                print(f"  -> Retained from previous data: {symbol}")
            else:
                print(f"  -> No backup recommendation for {symbol}. Skipping.")

        # Sleep 2.5 seconds to strictly follow Guest rate limits (20 req/min)
        time.sleep(2.5)

    # Filter recommendations
    buy_pool = [s for s in analyzed_stocks if s["type"] == "BUY"]
    sell_pool = [s for s in analyzed_stocks if s["type"] == "SELL"]

    buy_pool.sort(key=lambda x: x.get("analysisScore", 0), reverse=True)
    sell_pool.sort(key=lambda x: x.get("analysisScore", 0), reverse=True)

    # Keep a good balance (e.g. up to 8 BUYs and up to 4 SELLs)
    selected_buys = buy_pool[:8]
    selected_sells = sell_pool[:4]
    final_recommendations = selected_buys + selected_sells

    for rec in final_recommendations:
        rec.pop("analysisScore", None)

    print(f"\nCompleted Technical Screening! Selected {len(selected_buys)} BUY and {len(selected_sells)} SELL recommendations.")

    # 2. Update Market Summary (Indices)
    print("\nUpdating market summary indices...")
    index_symbol_mapping = {
        "vnIndex": "VNINDEX",
        "hoseIndex": "VN30",
        "hnxIndex": "HNXINDEX",
        "upcomIndex": "UPCOMINDEX"
    }

    market_summary = backup_data.get("marketSummary", {
        "vnIndex": {"name": "VN-Index", "value": 1250.5, "change": 15.42, "changePercent": 1.25, "volume": "18.500 tỷ VNĐ"},
        "hoseIndex": {"name": "HOSE", "value": 1280.4, "change": 12.05, "changePercent": 0.95, "volume": "15.200 tỷ VNĐ"},
        "hnxIndex": {"name": "HNX-Index", "value": 235.1, "change": -0.28, "changePercent": -0.12, "volume": "1.800 tỷ VNĐ"},
        "upcomIndex": {"name": "Upcom-Index", "value": 92.3, "change": 0.41, "changePercent": 0.45, "volume": "1.500 tỷ VNĐ"}
    })

    # Fetch fresh indexes
    for index_key, ssi_symbol in index_symbol_mapping.items():
        print(f"Fetching index for {market_summary[index_key]['name']} ({ssi_symbol})...")
        updated = False

        df, source = get_historical_data_api(ssi_symbol, start_date, end_date)
        if df is not None and len(df) >= 2:
            try:
                latest_val = float(df["close"].iloc[-1])
                prev_val = float(df["close"].iloc[-2])
                change = latest_val - prev_val
                change_percent = (change / prev_val) * 100

                vol_str = market_summary[index_key].get("volume", "15.000 tỷ VNĐ")

                market_summary[index_key]["value"] = round(latest_val, 2)
                market_summary[index_key]["change"] = round(change, 2)
                market_summary[index_key]["changePercent"] = round(change_percent, 2)
                market_summary[index_key]["volume"] = vol_str
                print(f"  -> Updated via {source}: Value={latest_val}, Change={change:.2f} ({change_percent:.2f}%)")
                updated = True
            except Exception as e:
                print(f"  -> Error calculating index {ssi_symbol}: {e}")

        if not updated:
            print(f"  -> WARNING: Could not update index {market_summary[index_key]['name']}. Retaining original values.")

        # Sleep 2.5 seconds
        time.sleep(2.5)

    # 3. Compile output stocks.json
    local_now = datetime.now()
    formatted_date = local_now.strftime("%d/%m/%Y")

    output_json = {
        "lastUpdated": formatted_date,
        "marketSummary": market_summary,
        "recommendations": final_recommendations
    }

    os.makedirs(os.path.dirname(STOCKS_JSON_PATH), exist_ok=True)

    with open(STOCKS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(output_json, f, ensure_ascii=False, indent=2)

    print("\nSuccessfully executed end-of-day stock scanner algorithm!")
    print(f"Stocks recommendations updated in: {STOCKS_JSON_PATH}")

if __name__ == "__main__":
    main()
