/**
 * Logger utility for OMNI-ALPHA VΩ∞∞ Trading System
 * 
 * This module provides a centralized logging system for the OMNI-ALPHA VΩ∞∞ Trading System.
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'omni-alpha-system' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'trading.log'),
      level: 'info'
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});

module.exports = logger;
