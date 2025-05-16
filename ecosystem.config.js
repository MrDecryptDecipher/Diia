/**
 * PM2 Ecosystem Configuration for OMNI-ALPHA VΩ∞∞ Trading System
 *
 * This file defines the PM2 process configuration for the OMNI-ALPHA system.
 * - Frontend: Port 10001
 * - API Server: Port 10002
 * - WebSocket Server: Port 10003
 * - gRPC Server: Port 10004
 */

module.exports = {
  apps: [
    {
      name: 'omni-api',
      script: 'ui/dashboard-backend/src/server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 10002,
        HOST: '0.0.0.0',
        CORS_ORIGIN: 'http://3.111.22.56:10001',
        BYBIT_DEMO_API_KEY: 'lCMnwPKIzXASNWn6UE',
        BYBIT_DEMO_API_SECRET: 'aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr',
        BYBIT_API_URL: 'https://api-demo.bybit.com',
        BYBIT_WS_URL: 'wss://stream-demo.bybit.com',
        INITIAL_CAPITAL: 12,
        MIN_PROFIT_PER_TRADE: 2.2,
        TARGET_TRADES_PER_DAY: 750
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
      merge_logs: true
    },
    {
      name: 'omni-websocket',
      script: 'ui/dashboard-backend/src/websocket-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: 10003,
        HOST: '0.0.0.0',
        CORS_ORIGIN: 'http://3.111.22.56:10001',
        BYBIT_DEMO_API_KEY: 'lCMnwPKIzXASNWn6UE',
        BYBIT_DEMO_API_SECRET: 'aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr',
        BYBIT_API_URL: 'https://api-demo.bybit.com',
        BYBIT_WS_URL: 'wss://stream-demo.bybit.com',
        INITIAL_CAPITAL: 12,
        MIN_PROFIT_PER_TRADE: 2.2,
        TARGET_TRADES_PER_DAY: 750
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/websocket-error.log',
      out_file: 'logs/websocket-out.log',
      merge_logs: true
    },
    {
      name: 'omni-grpc',
      script: 'ui/dashboard-backend/src/grpc-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        GRPC_PORT: 10004,
        HOST: '0.0.0.0',
        CORS_ORIGIN: 'http://3.111.22.56:10001',
        BYBIT_DEMO_API_KEY: 'lCMnwPKIzXASNWn6UE',
        BYBIT_DEMO_API_SECRET: 'aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr',
        BYBIT_API_URL: 'https://api-demo.bybit.com',
        BYBIT_WS_URL: 'wss://stream-demo.bybit.com',
        INITIAL_CAPITAL: 12,
        MIN_PROFIT_PER_TRADE: 2.2,
        TARGET_TRADES_PER_DAY: 750
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/grpc-error.log',
      out_file: 'logs/grpc-out.log',
      merge_logs: true
    },
    {
      name: 'omni-dashboard-frontend',
      script: 'npm',
      args: 'start',
      cwd: 'ui/dashboard',
      env: {
        PORT: 10001,
        NODE_ENV: 'production',
        REACT_APP_API_URL: 'http://3.111.22.56:10002',
        REACT_APP_WEBSOCKET_URL: 'http://3.111.22.56:10003',
        REACT_APP_GRPC_URL: 'http://3.111.22.56:10004',
        REACT_APP_PUBLIC_URL: 'http://3.111.22.56:10001',
        REACT_APP_BYBIT_DEMO_API_KEY: 'lCMnwPKIzXASNWn6UE',
        REACT_APP_BYBIT_DEMO_API_SECRET: 'aXjs1SF9tmW3riHMktmjtyOyAT85puvrVstr',
        REACT_APP_BYBIT_API_URL: 'https://api-demo.bybit.com',
        REACT_APP_BYBIT_WS_URL: 'wss://stream-demo.bybit.com',
        REACT_APP_INITIAL_CAPITAL: 12,
        REACT_APP_MIN_PROFIT_PER_TRADE: 2.2,
        REACT_APP_TARGET_TRADES_PER_DAY: 750
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/frontend-error.log',
      out_file: 'logs/frontend-out.log',
      merge_logs: true
    }
  ]
};
