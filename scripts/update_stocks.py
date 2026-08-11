import os
import json
import time
from datetime import datetime, timedelta
import requests

# Try to import vnstock as the fallback provider
try:
    from vnstock.api.quote import Quote
    VNSTOCK_AVAILABLE = True
except ImportError:
    VNSTOCK_AVAILABLE = False
    print("Warning: vnstock library is not available.")

STOCKS_JSON_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "src", "data", "stocks.json"
)

def get_ssi_data(symbol, from_ts, to_ts):
    url = f"https://iboard.ssi.com.vn/dchart/api/history?resolution=D&symbol={symbol}&from={from_ts}&to={to_ts}"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
        'Referer': 'https://iboard.ssi.com.vn/dchart/',
        'Origin': 'https://iboard.ssi.com.vn'
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            data = response.json()
            if data.get("s") == "ok" and "c" in data and len(data["c"]) > 0:
                return data
        else:
            print(f"SSI API returned status {response.status_code} for {symbol}")
    except Exception as e:
        print(f"Error fetching SSI data for {symbol}: {e}")
    return None

def get_kbs_data_fallback(symbol, start_date, end_date):
    if not VNSTOCK_AVAILABLE:
        return None
    try:
        q = Quote(symbol=symbol, source='KBS')
        df = q.history(start=start_date, end=end_date)
        if df is not None and not df.empty:
            return df
    except Exception as e:
        print(f"Error fetching KBS fallback data for {symbol}: {e}")
    return None

def main():
    print("Starting stock data update process...")

    # Load existing stocks data
    with open(STOCKS_JSON_PATH, "r", encoding="utf-8") as f:
        stocks_data = json.load(f)

    # Calculate timestamps
    now = datetime.now()
    to_ts = int(time.time())
    from_ts = to_ts - 10 * 24 * 60 * 60  # Get 10 days of history to be safe

    start_date = (now - timedelta(days=10)).strftime("%Y-%m-%d")
    end_date = now.strftime("%Y-%m-%d")

    print(f"Date range: {start_date} to {end_date} (timestamps: {from_ts} to {to_ts})")

    # 1. Update Recommendations (Stocks)
    print("\nUpdating recommendations...")
    for stock in stocks_data.get("recommendations", []):
        symbol = stock.get("symbol")
        if not symbol:
            continue

        print(f"Fetching price for {symbol}...")
        price = None

        # Try SSI first
        ssi_data = get_ssi_data(symbol, from_ts, to_ts)
        if ssi_data:
            price = ssi_data["c"][-1]
            print(f"  -> Found via SSI: {price}")
        else:
            print(f"  -> SSI failed or blocked. Trying KBS fallback...")
            # Fallback to KBS via vnstock
            kbs_df = get_kbs_data_fallback(symbol, start_date, end_date)
            if kbs_df is not None and "close" in kbs_df.columns:
                price = float(kbs_df["close"].iloc[-1])
                print(f"  -> Found via KBS: {price}")

        if price is not None:
            stock["currentPrice"] = round(price, 2)
        else:
            print(f"  -> WARNING: Could not update price for {symbol}. Keeping original price: {stock.get('currentPrice')}")

    # 2. Update Market Summary (Indices)
    print("\nUpdating market summary indices...")
    index_symbol_mapping = {
        "vnIndex": "VNINDEX",
        "hoseIndex": "VN30",
        "hnxIndex": "HNXINDEX",
        "upcomIndex": "UPCOMINDEX"
    }

    market_summary = stocks_data.get("marketSummary", {})
    for index_key, ssi_symbol in index_symbol_mapping.items():
        if index_key not in market_summary:
            continue

        print(f"Fetching index for {market_summary[index_key]['name']} ({ssi_symbol})...")
        updated = False

        # Try SSI first
        ssi_data = get_ssi_data(ssi_symbol, from_ts, to_ts)
        if ssi_data and len(ssi_data["c"]) >= 2:
            latest_val = ssi_data["c"][-1]
            prev_val = ssi_data["c"][-2]
            change = latest_val - prev_val
            change_percent = (change / prev_val) * 100

            market_summary[index_key]["value"] = round(latest_val, 2)
            market_summary[index_key]["change"] = round(change, 2)
            market_summary[index_key]["changePercent"] = round(change_percent, 2)
            print(f"  -> Updated via SSI: Value={latest_val}, Change={change:.2f} ({change_percent:.2f}%)")
            updated = True
        else:
            print(f"  -> SSI failed or blocked. Trying KBS fallback...")
            # Fallback to KBS
            kbs_df = get_kbs_data_fallback(ssi_symbol, start_date, end_date)
            if kbs_df is not None and len(kbs_df) >= 2 and "close" in kbs_df.columns:
                latest_val = float(kbs_df["close"].iloc[-1])
                prev_val = float(kbs_df["close"].iloc[-2])
                change = latest_val - prev_val
                change_percent = (change / prev_val) * 100

                market_summary[index_key]["value"] = round(latest_val, 2)
                market_summary[index_key]["change"] = round(change, 2)
                market_summary[index_key]["changePercent"] = round(change_percent, 2)
                print(f"  -> Updated via KBS: Value={latest_val}, Change={change:.2f} ({change_percent:.2f}%)")
                updated = True

        if not updated:
            print(f"  -> WARNING: Could not update index {market_summary[index_key]['name']}. Keeping original values.")

    # 3. Update lastUpdated field
    local_now = datetime.now()
    formatted_date = local_now.strftime("%d/%m/%Y")
    stocks_data["lastUpdated"] = formatted_date
    print(f"\nUpdated lastUpdated date to {formatted_date}")

    # Write back the JSON file
    with open(STOCKS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(stocks_data, f, ensure_ascii=False, indent=2)
    print("Successfully wrote updated data to stocks.json!")

if __name__ == "__main__":
    main()
