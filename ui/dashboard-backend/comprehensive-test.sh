#!/bin/bash
echo "🧪 COMPREHENSIVE SYSTEM TEST AFTER NUCLEAR RESET"

# Wait for system to start
sleep 15

echo "📊 Testing basic endpoints..."
curl -s http://localhost:10002/api/trades/system-status | jq .
echo ""

echo "🔍 Testing comprehensive analysis..."
curl -s http://localhost:10002/api/trades/comprehensive-analysis/BTCUSDT | jq '.success, .tradingSignal'
echo ""

echo "💰 Testing position sizing..."
curl -s -X POST http://localhost:10002/api/trades/test-position-size \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","positionSize":1.0,"capital":12}' | jq .
echo ""

echo "⚡ Testing leverage..."
curl -s -X POST http://localhost:10002/api/trades/test-leverage \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BTCUSDT","leverage":10,"positionSize":1.0}' | jq .
echo ""

echo "📈 Testing capital allocation..."
curl -s -X POST http://localhost:10002/api/trades/test-capital-allocation \
  -H "Content-Type: application/json" \
  -d '{"totalCapital":12,"allocation":6,"maxPositions":2,"riskPerTrade":0.02}' | jq .
echo ""

echo "✅ COMPREHENSIVE SYSTEM TEST COMPLETED"
