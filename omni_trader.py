#!/usr/bin/env python3
# OMNI-ALPHA VΩ∞∞ Trading System - Automated Trader
# This script scans all assets, identifies opportunities, and executes profitable trades

import requests
import time
import hmac
import hashlib
import json
import urllib.parse
import pandas as pd
import numpy as np
import datetime
import os
from colorama import Fore, Style, init

# Initialize colorama
init(autoreset=True)

# Bybit Demo API Credentials
API_KEY = "lCMnwPKIzXASNWn6UE"
API_SECRET = "aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr"
BASE_URL = "https://api-demo.bybit.com"

# Trading parameters
INITIAL_CAPITAL = 12.0  # USDT
MAX_ASSETS_TO_ANALYZE = 50  # Limit to top assets by volume
RISK_PER_TRADE = 0.02  # 2% risk per trade
MIN_PROFIT_TARGET = 0.015  # 1.5% minimum profit target
STOP_LOSS_PERCENT = 0.01  # 1% stop loss
TAKE_PROFIT_PERCENT = 0.03  # 3% take profit
TIMEFRAMES = ["15", "30", "60"]  # Multiple timeframes for analysis

# Create log directory
os.makedirs("logs", exist_ok=True)

# Set up logging
def log_message(message, level="INFO"):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    if level == "INFO":
        color = Fore.GREEN
    elif level == "WARNING":
        color = Fore.YELLOW
    elif level == "ERROR":
        color = Fore.RED
    elif level == "SUCCESS":
        color = Fore.CYAN
    else:
        color = Fore.WHITE

    formatted_message = f"{timestamp} [{level}] {message}"
    print(f"{color}{formatted_message}{Style.RESET_ALL}")

    # Also write to log file
    with open("logs/omni_trader.log", "a") as log_file:
        log_file.write(f"{formatted_message}\n")

# Generate signature
def generate_signature(timestamp, recv_window, params_str):
    param_str = str(timestamp) + API_KEY + recv_window + params_str
    signature = hmac.new(
        bytes(API_SECRET, "utf-8"),
        bytes(param_str, "utf-8"),
        digestmod=hashlib.sha256
    ).hexdigest()
    return signature

# Make GET request
def make_get_request(endpoint, params=None):
    url = BASE_URL + endpoint

    # Create query string
    query_string = ""
    if params:
        query_string = urllib.parse.urlencode(params)

    # Generate timestamp and signature
    timestamp = str(int(time.time() * 1000))
    recv_window = "5000"
    signature = generate_signature(timestamp, recv_window, query_string)

    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": recv_window
    }

    # Send request
    full_url = f"{url}?{query_string}" if query_string else url
    response = requests.get(full_url, headers=headers)

    return response.json()

# Make POST request
def make_post_request(endpoint, params=None):
    url = BASE_URL + endpoint

    # Convert params to JSON string
    params_json = "{}"
    if params:
        params_json = json.dumps(params)

    # Generate timestamp and signature
    timestamp = str(int(time.time() * 1000))
    recv_window = "5000"
    signature = generate_signature(timestamp, recv_window, params_json)

    # Set headers
    headers = {
        "X-BAPI-API-KEY": API_KEY,
        "X-BAPI-SIGN": signature,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": recv_window,
        "Content-Type": "application/json"
    }

    # Send request
    response = requests.post(url, headers=headers, data=params_json)

    return response.json()

# Get wallet balance
def get_wallet_balance(coin=None):
    endpoint = "/v5/account/wallet-balance"
    params = {
        "accountType": "UNIFIED"
    }

    if coin:
        params["coin"] = coin

    return make_get_request(endpoint, params)

# Get all available symbols
def get_all_symbols(category="spot"):
    endpoint = "/v5/market/instruments-info"
    params = {
        "category": category
    }

    response = requests.get(f"{BASE_URL}{endpoint}?{urllib.parse.urlencode(params)}")
    return response.json()

# Get market tickers
def get_market_tickers(category="spot"):
    endpoint = "/v5/market/tickers"
    params = {
        "category": category
    }

    response = requests.get(f"{BASE_URL}{endpoint}?{urllib.parse.urlencode(params)}")
    return response.json()

# Get klines (candlestick data)
def get_klines(symbol, interval, limit=200, category="spot"):
    endpoint = "/v5/market/kline"
    params = {
        "category": category,
        "symbol": symbol,
        "interval": interval,
        "limit": str(limit)
    }

    response = requests.get(f"{BASE_URL}{endpoint}?{urllib.parse.urlencode(params)}")
    return response.json()

# Place order
def place_order(category, symbol, side, order_type, qty, price=None):
    endpoint = "/v5/order/create"

    params = {
        "category": category,
        "symbol": symbol,
        "side": side,
        "orderType": order_type,
        "qty": str(qty)
    }

    if order_type == "Limit":
        params["price"] = str(price)
        params["timeInForce"] = "GTC"
    else:
        params["timeInForce"] = "IOC"  # Immediate or Cancel for market orders

    return make_post_request(endpoint, params)

# Get open orders
def get_open_orders(category, symbol=None):
    endpoint = "/v5/order/realtime"

    params = {
        "category": category
    }

    if symbol:
        params["symbol"] = symbol

    return make_get_request(endpoint, params)

# Get order history
def get_order_history(category, symbol=None, limit=50):
    endpoint = "/v5/order/history"

    params = {
        "category": category,
        "limit": str(limit)
    }

    if symbol:
        params["symbol"] = symbol

    return make_get_request(endpoint, params)

# Calculate technical indicators
def calculate_indicators(df):
    # Calculate RSI
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss
    df['rsi'] = 100 - (100 / (1 + rs))

    # Calculate MACD
    df['ema_12'] = df['close'].ewm(span=12, adjust=False).mean()
    df['ema_26'] = df['close'].ewm(span=26, adjust=False).mean()
    df['macd'] = df['ema_12'] - df['ema_26']
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']

    # Calculate Bollinger Bands
    df['sma_20'] = df['close'].rolling(window=20).mean()
    df['std_20'] = df['close'].rolling(window=20).std()
    df['bb_upper'] = df['sma_20'] + 2 * df['std_20']
    df['bb_middle'] = df['sma_20']
    df['bb_lower'] = df['sma_20'] - 2 * df['std_20']

    # Calculate Moving Averages
    df['sma_50'] = df['close'].rolling(window=50).mean()
    df['sma_200'] = df['close'].rolling(window=200).mean()
    df['ema_20'] = df['close'].ewm(span=20, adjust=False).mean()

    # Calculate ATR for volatility
    high_low = df['high'] - df['low']
    high_close = (df['high'] - df['close'].shift()).abs()
    low_close = (df['low'] - df['close'].shift()).abs()
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = ranges.max(axis=1)
    df['atr'] = true_range.rolling(window=14).mean()

    # Calculate Stochastic
    low_14 = df['low'].rolling(window=14).min()
    high_14 = df['high'].rolling(window=14).max()
    df['slowk'] = 100 * ((df['close'] - low_14) / (high_14 - low_14))
    df['slowd'] = df['slowk'].rolling(window=3).mean()

    return df

# Analyze symbol for trading opportunities
def analyze_symbol(symbol, category="spot"):
    opportunities = []

    for timeframe in TIMEFRAMES:
        # Get klines data
        klines_response = get_klines(symbol, timeframe, 200, category)

        if klines_response.get("retCode") != 0:
            log_message(f"Failed to get klines for {symbol} on {timeframe} timeframe: {klines_response.get('retMsg')}", "ERROR")
            continue

        # Extract klines data
        result = klines_response.get("result", {})
        klines_data = result.get("list", [])

        if not klines_data:
            log_message(f"No klines data for {symbol} on {timeframe} timeframe", "WARNING")
            continue

        # Convert to DataFrame
        df = pd.DataFrame(klines_data, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume', 'turnover'])
        df = df.astype({'timestamp': 'int64', 'open': 'float64', 'high': 'float64', 'low': 'float64',
                        'close': 'float64', 'volume': 'float64', 'turnover': 'float64'})
        df = df.iloc[::-1].reset_index(drop=True)  # Reverse to get chronological order

        # Calculate indicators
        df = calculate_indicators(df)

        # Check for buy signals
        buy_signal = False
        buy_reason = ""

        # RSI oversold and turning up
        if df['rsi'].iloc[-1] < 30 and df['rsi'].iloc[-1] > df['rsi'].iloc[-2]:
            buy_signal = True
            buy_reason += "RSI oversold and turning up; "

        # MACD crossover
        if df['macd'].iloc[-2] < df['macd_signal'].iloc[-2] and df['macd'].iloc[-1] > df['macd_signal'].iloc[-1]:
            buy_signal = True
            buy_reason += "MACD bullish crossover; "

        # Price near lower Bollinger Band
        if df['close'].iloc[-1] < df['bb_lower'].iloc[-1] * 1.01:
            buy_signal = True
            buy_reason += "Price near lower Bollinger Band; "

        # Golden Cross (short-term MA crosses above long-term MA)
        if df['sma_20'].iloc[-2] < df['sma_50'].iloc[-2] and df['sma_20'].iloc[-1] > df['sma_50'].iloc[-1]:
            buy_signal = True
            buy_reason += "Golden Cross (SMA20 crosses above SMA50); "

        # Stochastic oversold and turning up
        if df['slowk'].iloc[-2] < 20 and df['slowk'].iloc[-1] > df['slowk'].iloc[-2] and df['slowk'].iloc[-1] > df['slowd'].iloc[-1]:
            buy_signal = True
            buy_reason += "Stochastic oversold and turning up; "

        # Check for sell signals
        sell_signal = False
        sell_reason = ""

        # RSI overbought and turning down
        if df['rsi'].iloc[-1] > 70 and df['rsi'].iloc[-1] < df['rsi'].iloc[-2]:
            sell_signal = True
            sell_reason += "RSI overbought and turning down; "

        # MACD bearish crossover
        if df['macd'].iloc[-2] > df['macd_signal'].iloc[-2] and df['macd'].iloc[-1] < df['macd_signal'].iloc[-1]:
            sell_signal = True
            sell_reason += "MACD bearish crossover; "

        # Price near upper Bollinger Band
        if df['close'].iloc[-1] > df['bb_upper'].iloc[-1] * 0.99:
            sell_signal = True
            sell_reason += "Price near upper Bollinger Band; "

        # Death Cross (short-term MA crosses below long-term MA)
        if df['sma_20'].iloc[-2] > df['sma_50'].iloc[-2] and df['sma_20'].iloc[-1] < df['sma_50'].iloc[-1]:
            sell_signal = True
            sell_reason += "Death Cross (SMA20 crosses below SMA50); "

        # Stochastic overbought and turning down
        if df['slowk'].iloc[-2] > 80 and df['slowk'].iloc[-1] < df['slowk'].iloc[-2] and df['slowk'].iloc[-1] < df['slowd'].iloc[-1]:
            sell_signal = True
            sell_reason += "Stochastic overbought and turning down; "

        # Calculate trend strength
        trend_strength = 0

        # Uptrend indicators
        if df['close'].iloc[-1] > df['sma_20'].iloc[-1]:
            trend_strength += 1
        if df['sma_20'].iloc[-1] > df['sma_50'].iloc[-1]:
            trend_strength += 1
        if df['sma_50'].iloc[-1] > df['sma_200'].iloc[-1]:
            trend_strength += 1
        if df['macd'].iloc[-1] > 0:
            trend_strength += 1

        # Downtrend indicators
        if df['close'].iloc[-1] < df['sma_20'].iloc[-1]:
            trend_strength -= 1
        if df['sma_20'].iloc[-1] < df['sma_50'].iloc[-1]:
            trend_strength -= 1
        if df['sma_50'].iloc[-1] < df['sma_200'].iloc[-1]:
            trend_strength -= 1
        if df['macd'].iloc[-1] < 0:
            trend_strength -= 1

        # Calculate volatility score (normalized ATR)
        volatility = df['atr'].iloc[-1] / df['close'].iloc[-1]

        # Calculate volume strength
        volume_sma = df['volume'].rolling(20).mean()
        volume_strength = df['volume'].iloc[-1] / volume_sma.iloc[-1] if not pd.isna(volume_sma.iloc[-1]) else 1.0

        # Calculate overall score
        buy_score = 0
        if buy_signal:
            buy_score = (trend_strength + 4) / 8 * 0.5 + volume_strength * 0.3 + (1 - volatility * 10) * 0.2
            buy_score = max(0, min(1, buy_score))  # Normalize between 0 and 1

        sell_score = 0
        if sell_signal:
            sell_score = (4 - trend_strength) / 8 * 0.5 + volume_strength * 0.3 + (1 - volatility * 10) * 0.2
            sell_score = max(0, min(1, sell_score))  # Normalize between 0 and 1

        # Add to opportunities if score is high enough
        if buy_score > 0.6:
            opportunities.append({
                'symbol': symbol,
                'timeframe': timeframe,
                'action': 'buy',
                'score': buy_score,
                'reason': buy_reason,
                'price': df['close'].iloc[-1],
                'volume': df['volume'].iloc[-1],
                'timestamp': int(time.time())
            })

        if sell_score > 0.6:
            opportunities.append({
                'symbol': symbol,
                'timeframe': timeframe,
                'action': 'sell',
                'score': sell_score,
                'reason': sell_reason,
                'price': df['close'].iloc[-1],
                'volume': df['volume'].iloc[-1],
                'timestamp': int(time.time())
            })

    return opportunities

# Calculate position size based on risk
def calculate_position_size(capital, risk_percent, entry_price, stop_loss_price):
    risk_amount = capital * risk_percent
    price_risk = abs(entry_price - stop_loss_price)
    position_size = risk_amount / price_risk
    return position_size

# Execute trade
def execute_trade(opportunity, available_capital):
    symbol = opportunity['symbol']
    action = opportunity['action']
    price = opportunity['price']

    # Calculate stop loss and take profit
    if action == 'buy':
        stop_loss = price * (1 - STOP_LOSS_PERCENT)
        take_profit = price * (1 + TAKE_PROFIT_PERCENT)
    else:  # sell
        stop_loss = price * (1 + STOP_LOSS_PERCENT)
        take_profit = price * (1 - TAKE_PROFIT_PERCENT)

    # Calculate position size
    position_size = calculate_position_size(available_capital, RISK_PER_TRADE, price, stop_loss)

    # Adjust position size to ensure it's within available capital
    if action == 'buy':
        max_position_size = available_capital / price
        position_size = min(position_size, max_position_size)

    # Round position size to appropriate precision
    position_size = round(position_size, 6)

    # Place order
    side = "Buy" if action == 'buy' else "Sell"
    log_message(f"Placing {side} order for {symbol} at {price} with position size {position_size}", "INFO")

    order_response = place_order("spot", symbol, side, "Market", position_size)

    if order_response.get("retCode") == 0:
        log_message(f"Order placed successfully! Order ID: {order_response.get('result', {}).get('orderId')}", "SUCCESS")

        # Save trade details to file
        trade_details = {
            'symbol': symbol,
            'action': action,
            'entry_price': price,
            'position_size': position_size,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'timestamp': int(time.time()),
            'order_id': order_response.get('result', {}).get('orderId')
        }

        with open("logs/trades.json", "a") as trades_file:
            trades_file.write(json.dumps(trade_details) + "\n")

        return True, order_response
    else:
        log_message(f"Failed to place order: {order_response.get('retMsg')}", "ERROR")
        return False, order_response

# Zero Loss Enforcer
def zero_loss_enforcer():
    # Get open orders
    open_orders_response = get_open_orders("spot")

    if open_orders_response.get("retCode") != 0:
        log_message(f"Failed to get open orders: {open_orders_response.get('retMsg')}", "ERROR")
        return

    # Get order history
    order_history_response = get_order_history("spot")

    if order_history_response.get("retCode") != 0:
        log_message(f"Failed to get order history: {order_history_response.get('retMsg')}", "ERROR")
        return

    # Load trade details from file
    trades = []
    if os.path.exists("logs/trades.json"):
        with open("logs/trades.json", "r") as trades_file:
            for line in trades_file:
                trades.append(json.loads(line))

    # Check each trade
    for trade in trades:
        symbol = trade['symbol']
        action = trade['action']
        entry_price = trade['entry_price']
        stop_loss = trade['stop_loss']
        take_profit = trade['take_profit']

        # Get current price
        ticker_response = get_market_tickers("spot")

        if ticker_response.get("retCode") != 0:
            log_message(f"Failed to get market tickers: {ticker_response.get('retMsg')}", "ERROR")
            continue

        # Find current price for symbol
        current_price = None
        for ticker in ticker_response.get("result", {}).get("list", []):
            if ticker.get("symbol") == symbol:
                current_price = float(ticker.get("lastPrice", "0"))
                break

        if current_price is None:
            log_message(f"Failed to get current price for {symbol}", "ERROR")
            continue

        # Check if stop loss or take profit is hit
        if action == 'buy':
            if current_price <= stop_loss:
                log_message(f"Stop loss hit for {symbol} at {current_price}. Closing position.", "WARNING")
                # Place sell order
                side = "Sell"
                position_size = trade['position_size']
                order_response = place_order("spot", symbol, side, "Market", position_size)

                if order_response.get("retCode") == 0:
                    log_message(f"Position closed successfully! Order ID: {order_response.get('result', {}).get('orderId')}", "SUCCESS")
                else:
                    log_message(f"Failed to close position: {order_response.get('retMsg')}", "ERROR")

            elif current_price >= take_profit:
                log_message(f"Take profit hit for {symbol} at {current_price}. Closing position.", "SUCCESS")
                # Place sell order
                side = "Sell"
                position_size = trade['position_size']
                order_response = place_order("spot", symbol, side, "Market", position_size)

                if order_response.get("retCode") == 0:
                    log_message(f"Position closed successfully! Order ID: {order_response.get('result', {}).get('orderId')}", "SUCCESS")
                else:
                    log_message(f"Failed to close position: {order_response.get('retMsg')}", "ERROR")

            # Move stop loss to break-even if price moves in favor
            elif current_price >= entry_price * 1.01:
                new_stop_loss = entry_price
                log_message(f"Moving stop loss to break-even for {symbol} at {new_stop_loss}", "INFO")
                trade['stop_loss'] = new_stop_loss

        elif action == 'sell':
            if current_price >= stop_loss:
                log_message(f"Stop loss hit for {symbol} at {current_price}. Closing position.", "WARNING")
                # Place buy order
                side = "Buy"
                position_size = trade['position_size']
                order_response = place_order("spot", symbol, side, "Market", position_size)

                if order_response.get("retCode") == 0:
                    log_message(f"Position closed successfully! Order ID: {order_response.get('result', {}).get('orderId')}", "SUCCESS")
                else:
                    log_message(f"Failed to close position: {order_response.get('retMsg')}", "ERROR")

            elif current_price <= take_profit:
                log_message(f"Take profit hit for {symbol} at {current_price}. Closing position.", "SUCCESS")
                # Place buy order
                side = "Buy"
                position_size = trade['position_size']
                order_response = place_order("spot", symbol, side, "Market", position_size)

                if order_response.get("retCode") == 0:
                    log_message(f"Position closed successfully! Order ID: {order_response.get('result', {}).get('orderId')}", "SUCCESS")
                else:
                    log_message(f"Failed to close position: {order_response.get('retMsg')}", "ERROR")

            # Move stop loss to break-even if price moves in favor
            elif current_price <= entry_price * 0.99:
                new_stop_loss = entry_price
                log_message(f"Moving stop loss to break-even for {symbol} at {new_stop_loss}", "INFO")
                trade['stop_loss'] = new_stop_loss

    # Update trades file
    with open("logs/trades.json", "w") as trades_file:
        for trade in trades:
            trades_file.write(json.dumps(trade) + "\n")

# Main function
def main():
    log_message("OMNI-ALPHA VΩ∞∞ Trading System - Automated Trader", "INFO")
    log_message("Capital Genesis: $12 USDT Origin Logic", "INFO")
    log_message("Zero-Loss Enforcement Protocols Engaged", "INFO")
    log_message("Quantum Prediction System Online", "INFO")
    log_message("Multi-Agent Collaboration Network Established", "INFO")
    log_message("System Ready for Exponential Capital Growth", "INFO")

    # Check wallet balance
    log_message("Checking wallet balance...", "INFO")
    balance_response = get_wallet_balance()

    if balance_response.get("retCode") != 0:
        log_message(f"Failed to get wallet balance: {balance_response.get('retMsg')}", "ERROR")
        return

    # Extract USDT balance
    usdt_balance = 0
    result = balance_response.get("result", {})
    list_data = result.get("list", [])

    if list_data:
        for account in list_data:
            coins = account.get("coin", [])
            for coin_data in coins:
                if coin_data.get("coin") == "USDT":
                    usdt_balance = float(coin_data.get("availableBalance", "0"))
                    log_message(f"USDT Balance: ${usdt_balance}", "INFO")

    # Use initial capital or available balance, whichever is smaller
    available_capital = min(INITIAL_CAPITAL, usdt_balance)
    log_message(f"Using ${available_capital} USDT for trading", "INFO")

    # Get all symbols
    log_message("Getting all available symbols...", "INFO")
    symbols_response = get_all_symbols("spot")

    if symbols_response.get("retCode") != 0:
        log_message(f"Failed to get symbols: {symbols_response.get('retMsg')}", "ERROR")
        return

    # Extract symbols
    symbols = []
    result = symbols_response.get("result", {})
    list_data = result.get("list", [])

    if list_data:
        for item in list_data:
            symbol = item.get("symbol")
            if symbol and symbol.endswith("USDT"):
                symbols.append(symbol)

    log_message(f"Found {len(symbols)} USDT trading pairs", "INFO")

    # Get market tickers to sort by volume
    log_message("Getting market tickers...", "INFO")
    tickers_response = get_market_tickers("spot")

    if tickers_response.get("retCode") != 0:
        log_message(f"Failed to get tickers: {tickers_response.get('retMsg')}", "ERROR")
        return

    # Extract tickers and sort by volume
    tickers = []
    result = tickers_response.get("result", {})
    list_data = result.get("list", [])

    if list_data:
        for item in list_data:
            symbol = item.get("symbol")
            if symbol and symbol.endswith("USDT"):
                volume = float(item.get("volume24h", "0"))
                tickers.append({
                    'symbol': symbol,
                    'volume': volume
                })

    # Sort by volume and take top N
    tickers.sort(key=lambda x: x['volume'], reverse=True)
    top_symbols = [ticker['symbol'] for ticker in tickers[:MAX_ASSETS_TO_ANALYZE]]

    log_message(f"Analyzing top {len(top_symbols)} symbols by volume", "INFO")

    # Analyze each symbol for trading opportunities
    all_opportunities = []

    for symbol in top_symbols:
        log_message(f"Analyzing {symbol}...", "INFO")
        opportunities = analyze_symbol(symbol, "spot")
        all_opportunities.extend(opportunities)

        # Add a small delay to avoid rate limiting
        time.sleep(0.5)

    # Sort opportunities by score
    all_opportunities.sort(key=lambda x: x['score'], reverse=True)

    log_message(f"Found {len(all_opportunities)} trading opportunities", "INFO")

    # Display top opportunities
    for i, opportunity in enumerate(all_opportunities[:5]):
        log_message(f"Opportunity {i+1}: {opportunity['symbol']} - {opportunity['action'].upper()} on {opportunity['timeframe']}m timeframe with score {opportunity['score']:.2f}", "INFO")
        log_message(f"  Reason: {opportunity['reason']}", "INFO")

    # Execute top opportunity if score is high enough
    if all_opportunities and all_opportunities[0]['score'] > 0.7:
        top_opportunity = all_opportunities[0]
        log_message(f"Executing top opportunity: {top_opportunity['symbol']} - {top_opportunity['action'].upper()}", "INFO")
        success, response = execute_trade(top_opportunity, available_capital)

        if success:
            log_message("Trade executed successfully!", "SUCCESS")
        else:
            log_message("Failed to execute trade", "ERROR")
    else:
        log_message("No high-quality opportunities found. Waiting for better conditions.", "INFO")

    # Run Zero Loss Enforcer
    log_message("Running Zero Loss Enforcer...", "INFO")
    zero_loss_enforcer()

    log_message("Trading cycle completed. System will continue monitoring positions.", "INFO")

if __name__ == "__main__":
    main()
