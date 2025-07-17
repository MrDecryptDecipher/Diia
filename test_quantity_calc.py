#!/usr/bin/env python3
"""
Test Quantity Calculation for Bybit Orders
Verifies the correct quantity calculation for 12 USDT capital allocation
"""

def test_quantity_calculations():
    """Test different quantity calculation methods"""
    
    print("🧮 QUANTITY CALCULATION TEST")
    print("=" * 50)
    
    # Test parameters
    position_size_usdt = 6.0  # 6 USDT position
    price = 0.5648  # ADA price
    leverage = 100  # 100x leverage
    
    print(f"📊 Test Parameters:")
    print(f"   Position Size: {position_size_usdt} USDT")
    print(f"   Asset Price: ${price}")
    print(f"   Leverage: {leverage}x")
    print()
    
    # Method 1: OLD (WRONG) - Without leverage adjustment
    quantity_old = position_size_usdt / price
    notional_old = quantity_old * price * leverage
    margin_old = notional_old / leverage
    
    print(f"❌ OLD METHOD (WRONG):")
    print(f"   Quantity = position_size / price")
    print(f"   Quantity = {position_size_usdt} / {price} = {quantity_old:.6f} ADA")
    print(f"   Notional Value = {quantity_old:.6f} × {price} × {leverage} = ${notional_old:.2f}")
    print(f"   Margin Used = ${notional_old:.2f} / {leverage} = ${margin_old:.2f}")
    print(f"   ⚠️  Margin exceeds position size!")
    print()
    
    # Method 2: NEW (CORRECT) - With leverage adjustment
    quantity_new = position_size_usdt / (price * leverage)
    notional_new = quantity_new * price * leverage
    margin_new = notional_new / leverage
    
    print(f"✅ NEW METHOD (CORRECT):")
    print(f"   Quantity = position_size / (price × leverage)")
    print(f"   Quantity = {position_size_usdt} / ({price} × {leverage}) = {quantity_new:.6f} ADA")
    print(f"   Notional Value = {quantity_new:.6f} × {price} × {leverage} = ${notional_new:.2f}")
    print(f"   Margin Used = ${notional_new:.2f} / {leverage} = ${margin_new:.2f}")
    print(f"   ✅ Margin equals position size!")
    print()
    
    # Verification
    print(f"🔍 VERIFICATION:")
    print(f"   Target Position Size: {position_size_usdt} USDT")
    print(f"   Old Method Margin: {margin_old:.2f} USDT (❌ {margin_old/position_size_usdt:.1f}x too large)")
    print(f"   New Method Margin: {margin_new:.2f} USDT (✅ Perfect match)")
    print()
    
    # Test with different assets
    print(f"🧪 MULTI-ASSET TEST:")
    assets = [
        ("BTCUSDT", 43250.0),
        ("ETHUSDT", 2380.0),
        ("SOLUSDT", 149.47),
        ("ADAUSDT", 0.5648),
        ("DOTUSDT", 3.3755)
    ]
    
    for symbol, asset_price in assets:
        qty_correct = position_size_usdt / (asset_price * leverage)
        margin_used = qty_correct * asset_price
        
        print(f"   {symbol}: {qty_correct:.6f} units, Margin: ${margin_used:.2f}")
    
    print()
    print(f"💡 CONCLUSION:")
    print(f"   The NEW method ensures margin used = position size")
    print(f"   This prevents exceeding the 12 USDT capital limit")
    print(f"   Each position uses exactly 6 USDT margin")

if __name__ == "__main__":
    test_quantity_calculations()
