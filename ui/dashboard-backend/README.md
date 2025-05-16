# OMNI-ALPHA VΩ∞∞ Trading System

The OMNI-ALPHA VΩ∞∞ Trading System is a high-frequency trading system that uses advanced algorithms and quantum computing techniques to execute profitable trades with zero losses.

## System Requirements

- 12 USDT capital
- Minimum 2.2 USDT profit per trade
- At least 750 profitable trades per day
- Zero losses
- Self-evolving capabilities

## Architecture

The system consists of the following components:

- **Dashboard Frontend**: Provides a user interface for monitoring the trading system
- **API Server**: Provides REST API endpoints for the dashboard
- **WebSocket Server**: Provides real-time updates for the dashboard
- **gRPC Server**: Provides high-performance data transfer for the dashboard
- **Trading Strategy Service**: Implements the core trading strategy

## Deployment

### Prerequisites

- Node.js 16+
- PM2 (Process Manager)
- Nginx (Web Server)
- Bybit API credentials (in demo.env file)

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   cd /home/ubuntu/Sandeep/projects/omni/ui/dashboard-backend
   npm install
   ```

3. Create a logs directory:
   ```
   mkdir -p logs
   ```

4. Start the services using PM2:
   ```
   ./start.sh
   ```

### Nginx Configuration

1. Copy the Nginx configuration file to the Nginx sites-available directory:
   ```
   sudo cp nginx.conf /etc/nginx/sites-available/omni
   ```

2. Create a symbolic link to enable the site:
   ```
   sudo ln -s /etc/nginx/sites-available/omni /etc/nginx/sites-enabled/
   ```

3. Test the Nginx configuration:
   ```
   sudo nginx -t
   ```

4. Reload Nginx:
   ```
   sudo systemctl reload nginx
   ```

## Accessing the System

- Dashboard: http://3.111.22.56:10001
- API Server: http://3.111.22.56:10002
- WebSocket Server: http://3.111.22.56:10003
- gRPC Server: http://3.111.22.56:10004

## Testing

To test the Bybit API client:
```
node test-bybit-client.js
```

To test the trading strategy service:
```
node test-trading-strategy.js
```

## Monitoring

To monitor the services:
```
pm2 status
pm2 logs
```

## Stopping the Services

To stop the services:
```
pm2 stop all
```

## Restarting the Services

To restart the services:
```
pm2 restart all
```

## Troubleshooting

If you encounter any issues, check the logs:
```
pm2 logs
```

Or check the specific service logs:
```
pm2 logs omni-api
pm2 logs omni-websocket
```
