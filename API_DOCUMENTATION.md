# 📡 **OMNI API Documentation**

## 🌐 **Base URL**
- **Production**: `http://3.111.22.56:10002/api`
- **Local Development**: `http://localhost:10002/api`

## 🔐 **Authentication**
All API endpoints use API key authentication. Include your API key in the request headers:
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

## 📊 **System Endpoints**

### `GET /api/system/status`
Get comprehensive system status and health information.

**Response:**
```json
{
  "status": "online",
  "uptime": 1234567,
  "services": {
    "api": "online",
    "websocket": "online",
    "grpc": "online",
    "trading_engine": "online"
  },
  "performance": {
    "cpu_usage": 15.2,
    "memory_usage": 581.4,
    "response_time": 450
  },
  "trading": {
    "active_trades": 5,
    "total_capital": 12.6,
    "daily_trades": 127,
    "success_rate": 98.5
  }
}
```

### `GET /health`
Simple health check endpoint for load balancers.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

## 💹 **Trading Endpoints**

### `GET /api/trades/active`
Get all currently active trading positions.

**Response:**
```json
{
  "trades": [
    {
      "id": "trade_123",
      "symbol": "BTCUSDT",
      "side": "Buy",
      "size": 0.001,
      "entry_price": 45000.0,
      "current_price": 45150.0,
      "pnl": 0.15,
      "pnl_percentage": 0.33,
      "timestamp": "2025-01-17T10:25:00Z",
      "agent": "High Frequency Trader"
    }
  ],
  "summary": {
    "total_trades": 5,
    "total_pnl": 2.45,
    "unrealized_pnl": 1.23
  }
}
```

### `POST /api/trades/execute`
Execute a new trade order.

**Request Body:**
```json
{
  "symbol": "BTCUSDT",
  "side": "Buy",
  "size": 0.001,
  "order_type": "Market",
  "agent": "High Frequency Trader"
}
```

**Response:**
```json
{
  "success": true,
  "trade_id": "trade_124",
  "order_id": "order_456",
  "execution_price": 45200.0,
  "timestamp": "2025-01-17T10:30:00Z"
}
```

## 🤖 **AI Agent Endpoints**

### `GET /api/agents/status`
Get status and performance of all AI agents.

**Response:**
```json
{
  "agents": [
    {
      "name": "Zero Loss Enforcer",
      "status": "active",
      "performance": {
        "success_rate": 100.0,
        "trades_executed": 45,
        "profit_generated": 5.67
      },
      "last_action": "2025-01-17T10:29:00Z"
    },
    {
      "name": "Quantum Predictor",
      "status": "active",
      "performance": {
        "prediction_accuracy": 94.5,
        "predictions_made": 234,
        "confidence_score": 87.3
      },
      "last_prediction": "2025-01-17T10:28:30Z"
    }
  ],
  "network_status": {
    "total_agents": 18,
    "active_agents": 18,
    "coordination_efficiency": 98.7
  }
}
```

### `POST /api/agents/configure`
Configure specific agent parameters.

**Request Body:**
```json
{
  "agent_name": "Risk Manager",
  "parameters": {
    "max_risk_per_trade": 0.02,
    "stop_loss_percentage": 0.05,
    "take_profit_percentage": 0.10
  }
}
```

## 💰 **Asset Endpoints**

### `GET /api/assets/info`
Get comprehensive asset information and analysis.

**Query Parameters:**
- `symbols`: Comma-separated list of symbols (optional)
- `limit`: Number of assets to return (default: 50)

**Response:**
```json
{
  "assets": [
    {
      "symbol": "BTCUSDT",
      "current_price": 45200.0,
      "price_change_24h": 2.5,
      "volume_24h": 1234567890,
      "opportunity_score": 87.5,
      "technical_indicators": {
        "rsi": 65.2,
        "macd": 0.15,
        "bollinger_position": "middle"
      },
      "ai_analysis": {
        "sentiment": "bullish",
        "confidence": 82.3,
        "recommendation": "buy"
      }
    }
  ],
  "market_summary": {
    "total_market_cap": 2.1e12,
    "market_sentiment": "neutral",
    "volatility_index": 45.2
  }
}
```

## 📱 **Social Media & Sentiment Endpoints**

### `POST /api/sentiment/search`
Analyze sentiment for specific keywords or assets.

**Request Body:**
```json
{
  "keywords": ["Bitcoin", "BTC", "cryptocurrency"],
  "sources": ["twitter", "reddit", "news"],
  "timeframe": "24h"
}
```

**Response:**
```json
{
  "sentiment_analysis": {
    "overall_sentiment": "positive",
    "sentiment_score": 0.65,
    "confidence": 87.2,
    "sources": {
      "twitter": {
        "sentiment": "positive",
        "score": 0.72,
        "mentions": 15420
      },
      "reddit": {
        "sentiment": "neutral",
        "score": 0.58,
        "mentions": 3456
      },
      "news": {
        "sentiment": "positive",
        "score": 0.68,
        "articles": 234
      }
    }
  },
  "trending_topics": [
    "Bitcoin ETF",
    "Institutional adoption",
    "Price prediction"
  ]
}
```

## 🧠 **Gemini AI Endpoints**

### `POST /api/gemini/comprehensive-analysis`
Get comprehensive AI market analysis from Gemini.

**Request Body:**
```json
{
  "symbol": "BTCUSDT",
  "analysis_types": [
    "technical_analysis",
    "price_prediction",
    "market_sentiment",
    "risk_assessment"
  ],
  "timeframes": ["1h", "4h", "1d"]
}
```

**Response:**
```json
{
  "analysis": {
    "technical_analysis": {
      "trend": "bullish",
      "support_levels": [44000, 43500, 43000],
      "resistance_levels": [46000, 46500, 47000],
      "indicators": {
        "rsi": "neutral",
        "macd": "bullish",
        "moving_averages": "bullish"
      }
    },
    "price_prediction": {
      "1h": {
        "predicted_price": 45350.0,
        "confidence": 78.5,
        "direction": "up"
      },
      "4h": {
        "predicted_price": 45800.0,
        "confidence": 72.1,
        "direction": "up"
      },
      "1d": {
        "predicted_price": 46500.0,
        "confidence": 65.8,
        "direction": "up"
      }
    },
    "risk_assessment": {
      "risk_level": "medium",
      "volatility": 0.045,
      "max_drawdown_risk": 0.08
    }
  },
  "trading_signals": [
    {
      "action": "buy",
      "strength": "strong",
      "confidence": 85.2,
      "reasoning": "Technical indicators show bullish momentum with strong support levels"
    }
  ]
}
```

## 📊 **Performance & Metrics Endpoints**

### `GET /api/metrics/performance`
Get comprehensive system and trading performance metrics.

**Response:**
```json
{
  "trading_performance": {
    "total_trades": 1247,
    "winning_trades": 1198,
    "losing_trades": 49,
    "win_rate": 96.07,
    "total_profit": 45.67,
    "profit_factor": 12.34,
    "sharpe_ratio": 2.45,
    "max_drawdown": 0.023
  },
  "system_performance": {
    "api_response_time": 450,
    "websocket_latency": 85,
    "grpc_response_time": 15,
    "uptime_percentage": 99.97
  },
  "agent_performance": {
    "most_profitable_agent": "Quantum Predictor",
    "most_active_agent": "High Frequency Trader",
    "coordination_efficiency": 98.7
  }
}
```

## ⚛️ **Quantum Computing Endpoints**

### `GET /api/quantum/predictions`
Get quantum-enhanced market predictions.

**Response:**
```json
{
  "quantum_predictions": [
    {
      "symbol": "BTCUSDT",
      "quantum_state": "superposition",
      "entanglement_score": 0.87,
      "prediction_confidence": 92.3,
      "predicted_movement": "bullish",
      "quantum_interference_pattern": "constructive"
    }
  ],
  "quantum_system_status": {
    "quantum_processors": 4,
    "entanglement_stability": 98.5,
    "coherence_time": 1.23
  }
}
```

## 🌌 **Hyperdimensional Analytics Endpoints**

### `GET /api/hyperdimensional/patterns`
Get hyperdimensional pattern recognition results.

**Response:**
```json
{
  "patterns": [
    {
      "pattern_id": "hd_pattern_001",
      "dimensions": 11,
      "pattern_strength": 0.89,
      "market_correlation": 0.76,
      "predicted_outcome": "price_increase",
      "confidence": 84.2
    }
  ],
  "dimensional_analysis": {
    "active_dimensions": 11,
    "pattern_complexity": "high",
    "computational_load": 67.3
  }
}
```

## 🔄 **WebSocket Events**

### Connection
```javascript
const socket = io('http://3.111.22.56:10003');
```

### Available Events
- `system:status` - Real-time system status updates
- `trades:active` - Live trading position updates
- `metrics:update` - Performance metrics streaming
- `agents:status` - AI agent status broadcasting
- `market:data` - Real-time market data feeds
- `sentiment:update` - Social sentiment updates
- `gemini:analysis` - AI analysis results
- `quantum:predictions` - Quantum prediction updates

### Example Event Subscription
```javascript
socket.on('trades:active', (data) => {
  console.log('New trade update:', data);
});

socket.on('agents:status', (data) => {
  console.log('Agent status update:', data);
});
```

## ⚡ **gRPC Services**

### Service Definitions
- **TradingService**: High-speed trade execution
- **AnalyticsService**: Performance analytics
- **AgentService**: AI agent coordination

### Example gRPC Call
```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('trading.proto');
const trading = grpc.loadPackageDefinition(packageDefinition).trading;

const client = new trading.TradingService('localhost:10004', grpc.credentials.createInsecure());

client.ExecuteTrade({
  symbol: 'BTCUSDT',
  side: 'Buy',
  size: 0.001
}, (error, response) => {
  console.log('Trade executed:', response);
});
```

## 🚨 **Error Handling**

### Standard Error Response
```json
{
  "error": true,
  "code": "INVALID_SYMBOL",
  "message": "The provided symbol is not supported",
  "details": {
    "provided_symbol": "INVALID",
    "supported_symbols": ["BTCUSDT", "ETHUSDT", "ADAUSDT"]
  },
  "timestamp": "2025-01-17T10:30:00Z"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## 📈 **Rate Limits**
- **General API**: 1000 requests per minute
- **Trading Endpoints**: 100 requests per minute
- **WebSocket Connections**: 10 concurrent connections per IP
- **gRPC Calls**: 10,000 requests per minute

## 🔧 **SDK Examples**

### JavaScript/Node.js
```javascript
const OmniAPI = require('omni-trading-sdk');

const client = new OmniAPI({
  baseURL: 'http://3.111.22.56/api',
  apiKey: 'your-api-key'
});

// Get system status
const status = await client.system.getStatus();

// Execute trade
const trade = await client.trades.execute({
  symbol: 'BTCUSDT',
  side: 'Buy',
  size: 0.001
});
```

### Python
```python
from omni_trading import OmniClient

client = OmniClient(
    base_url='http://3.111.22.56/api',
    api_key='your-api-key'
)

# Get agent status
agents = client.agents.get_status()

# Get market analysis
analysis = client.gemini.comprehensive_analysis(
    symbol='BTCUSDT',
    analysis_types=['technical_analysis', 'price_prediction']
)
```

This API documentation provides comprehensive coverage of all OMNI system endpoints, enabling developers to integrate with the super intelligent trading system effectively.
