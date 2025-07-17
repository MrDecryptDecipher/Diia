# OMNI Data Directory

This directory contains all data files, schemas, and storage configurations for the OMNI trading system.

## Directory Structure

```
data/
├── README.md                    # This file
├── market_data_schema.json      # Market data validation schema
├── backups/                     # System backups
├── cache/                       # Cached data and temporary files
├── logs/                        # System logs (if not using separate logs directory)
├── models/                      # ML model files and checkpoints
├── historical/                  # Historical market data
├── real_time/                   # Real-time data feeds
├── test/                        # Test data for development
└── exports/                     # Data exports and reports

```

## Data Types

### Market Data
- **OHLCV Data**: Open, High, Low, Close, Volume candlestick data
- **Order Book**: Real-time order book snapshots
- **Trade Data**: Individual trade executions
- **Technical Indicators**: Calculated technical analysis indicators

### Trading Data
- **Positions**: Current and historical position data
- **Orders**: Order history and status
- **Trades**: Executed trade records
- **P&L**: Profit and loss calculations

### Agent Data
- **Performance Metrics**: Agent performance tracking
- **Decision Logs**: Agent decision history
- **Model States**: ML model states and checkpoints
- **Configuration**: Agent-specific configurations

### System Data
- **Metrics**: System performance metrics
- **Logs**: Application logs and error tracking
- **Configurations**: System configuration backups
- **Health Checks**: System health monitoring data

## Data Formats

### JSON Schema Validation
All data follows the schema defined in `market_data_schema.json` for consistency and validation.

### File Formats
- **JSON**: Configuration files, schemas, and structured data
- **CSV**: Historical data exports and imports
- **Parquet**: High-performance columnar data storage
- **Binary**: Model checkpoints and serialized objects

## Data Retention

### Real-time Data
- **Retention**: 7 days
- **Compression**: Enabled after 24 hours
- **Archival**: Weekly to historical storage

### Historical Data
- **Retention**: 2 years
- **Compression**: GZIP compression
- **Backup**: Monthly full backups

### Logs
- **Retention**: 30 days
- **Rotation**: Daily rotation
- **Compression**: Enabled after 7 days

### Model Data
- **Retention**: 10 versions per model
- **Backup**: Weekly model checkpoints
- **Versioning**: Semantic versioning

## Security

### Data Encryption
- **At Rest**: AES-256 encryption for sensitive data
- **In Transit**: TLS 1.3 for data transmission
- **Keys**: Stored in secure key management system

### Access Control
- **Authentication**: Required for all data access
- **Authorization**: Role-based access control
- **Audit**: All data access logged

### Privacy
- **Anonymization**: Personal data anonymized
- **Compliance**: GDPR and financial regulations
- **Data Minimization**: Only necessary data stored

## Performance

### Optimization
- **Indexing**: Database indexes for fast queries
- **Caching**: Redis caching for frequently accessed data
- **Compression**: Data compression to reduce storage
- **Partitioning**: Time-based data partitioning

### Monitoring
- **Storage Usage**: Monitored and alerted
- **Query Performance**: Tracked and optimized
- **Data Quality**: Validated and monitored
- **Backup Status**: Verified and reported

## Backup and Recovery

### Backup Strategy
- **Frequency**: Daily incremental, weekly full
- **Storage**: Multiple geographic locations
- **Encryption**: All backups encrypted
- **Testing**: Monthly restore testing

### Recovery Procedures
- **RTO**: Recovery Time Objective < 1 hour
- **RPO**: Recovery Point Objective < 15 minutes
- **Automation**: Automated recovery procedures
- **Documentation**: Detailed recovery runbooks

## Data Sources

### Market Data Providers
- **Bybit**: Primary exchange data
- **CoinGecko**: Market cap and metadata
- **NewsAPI**: Financial news data
- **Twitter API**: Social sentiment data

### Internal Sources
- **Trading Engine**: Order and trade data
- **Risk Engine**: Risk metrics and alerts
- **ML Models**: Predictions and confidence scores
- **System Metrics**: Performance and health data

## Usage Guidelines

### Development
- Use `data/test/` for development and testing
- Never use production data in development
- Follow schema validation for all data
- Document any new data structures

### Production
- Monitor data quality continuously
- Validate all incoming data
- Implement proper error handling
- Follow data retention policies

### Maintenance
- Regular cleanup of old data
- Monitor storage usage
- Update schemas as needed
- Maintain backup integrity

## Contact

For questions about data management, contact the OMNI development team.

## Version History

- **v1.0.0**: Initial data structure and schema
- **v1.1.0**: Added ML model data support
- **v1.2.0**: Enhanced security and encryption
