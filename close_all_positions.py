#!/usr/bin/env python3
import requests
import time
import hmac
import hashlib
import json

# Bybit Demo API credentials
API_KEY = "lCMnwPKIzXASNWn6UE"
API_SECRET = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr"
BASE_URL = "https://api-demo.bybit.com"

def generate_signature(timestamp, params_str):
    """Generate signature for Bybit API"""
    string_to_sign = f"{timestamp}{API_KEY}5000{params_str}"
    return hmac.new(
        API_SECRET.encode('utf-8'),
        string_to_sign.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def get_positions():
    """Get all positions from Bybit"""
    endpoint = "/v5/position/list"
    timestamp = str(int(time.time() * 1000))
    
    params = "category=linear&settleCoin=USDT"
    signature = generate_signature(timestamp, params)
    
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": "5000",
        "X-BAPI-SIGN": signature
    }
    
    url = f"{BASE_URL}{endpoint}?{params}"
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if data.get("retCode") == 0:
            positions = data.get("result", {}).get("list", [])
            return [pos for pos in positions if float(pos.get("size", "0")) > 0]
        else:
            print(f"❌ Error getting positions: {data.get('retMsg', 'Unknown error')}")
            return []
            
    except Exception as e:
        print(f"❌ Exception getting positions: {e}")
        return []

def close_position(symbol, side, size):
    """Close a position by placing opposite order"""
    endpoint = "/v5/order/create"
    timestamp = str(int(time.time() * 1000))
    
    # Determine opposite side
    close_side = "Sell" if side == "Buy" else "Buy"
    
    # Create order data
    order_data = {
        "category": "linear",
        "symbol": symbol,
        "side": close_side,
        "orderType": "Market",
        "qty": str(size),
        "timeInForce": "GTC",
        "positionIdx": 0
    }
    
    json_string = json.dumps(order_data, separators=(',', ':'))
    signature = generate_signature(timestamp, json_string)
    
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": "5000",
        "X-BAPI-SIGN": signature,
        "Content-Type": "application/json"
    }
    
    url = f"{BASE_URL}{endpoint}"
    
    try:
        response = requests.post(url, headers=headers, data=json_string)
        data = response.json()
        
        if data.get("retCode") == 0:
            order_id = data.get("result", {}).get("orderId", "")
            print(f"✅ Closed {symbol} position: Order ID {order_id}")
            return True
        else:
            print(f"❌ Failed to close {symbol}: {data.get('retMsg', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Exception closing {symbol}: {e}")
        return False

def main():
    print("🔄 Getting all positions...")
    positions = get_positions()
    
    if not positions:
        print("✅ No positions to close!")
        return
    
    print(f"📊 Found {len(positions)} positions to close:")
    
    for pos in positions:
        symbol = pos.get("symbol", "")
        side = pos.get("side", "")
        size = float(pos.get("size", "0"))
        notional = size * float(pos.get("markPrice", "0"))
        
        print(f"   {symbol}: {side} {size} (${notional:,.2f})")
    
    print("\n🚨 WARNING: This will close ALL positions!")
    confirm = input("Type 'YES' to confirm: ")
    
    if confirm != "YES":
        print("❌ Cancelled")
        return
    
    print("\n🔄 Closing all positions...")
    
    success_count = 0
    for pos in positions:
        symbol = pos.get("symbol", "")
        side = pos.get("side", "")
        size = float(pos.get("size", "0"))
        
        if close_position(symbol, side, size):
            success_count += 1
        
        time.sleep(0.1)  # Rate limiting
    
    print(f"\n✅ Successfully closed {success_count}/{len(positions)} positions")
    print("🎯 All positions closed! You can now restart the trading system with clean slate.")

if __name__ == "__main__":
    main()
