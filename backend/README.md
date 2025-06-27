# FBA Backend - Improved ASIN Processing

This is an improved version of the FBA Backend that handles multiple ASIN requests with proper rate limiting, error handling, and batch processing.

## Key Improvements

### 1. Rate Limiting
- **Configurable rate limits**: Control API calls per time window
- **Thread-safe implementation**: Prevents race conditions
- **Automatic queuing**: Requests wait when rate limit is reached

### 2. Batch Processing
- **New `/asin/batch/<country>` endpoint**: Process multiple ASINs efficiently
- **Controlled concurrency**: Uses ThreadPoolExecutor with configurable workers
- **Progress tracking**: Real-time logging of processing status

### 3. Error Handling
- **Exponential backoff**: Smart retry logic with increasing delays
- **Comprehensive error logging**: Detailed error messages for debugging
- **Graceful degradation**: Failed requests don't stop the entire batch

### 4. Configuration Management
- **Centralized settings**: All configuration in `config.py`
- **Environment variables**: Easy to adjust for different environments
- **Runtime configuration**: View current settings via `/config` endpoint

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with your configuration:
```bash
# Rate limiting configuration
RATE_LIMIT_CALLS=20
RATE_LIMIT_WINDOW=60
REQUEST_TIMEOUT=30

# Batch processing configuration
MAX_BATCH_SIZE=100
MAX_WORKERS=5

# Retry configuration
MAX_RETRIES=3
RETRY_DELAY_BASE=2

# Logging configuration
LOG_LEVEL=INFO

# Flask configuration
PORT=5000
```

## Usage

### Single ASIN Request
```bash
# GET request
curl http://localhost:5000/asin/B08N5WRWNW

# POST request
curl -X POST http://localhost:5000/asin/US \
  -H "Content-Type: application/json" \
  -d '{"asin": "B08N5WRWNW"}'
```

### Batch ASIN Processing
```bash
curl -X POST http://localhost:5000/asin/batch/US \
  -H "Content-Type: application/json" \
  -d '{
    "asins": [
      "B08N5WRWNW",
      "B08N5WRWNW",
      "B08N5WRWNW"
    ]
  }'
```

### Response Format for Batch Processing
```json
{
  "results": [
    {
      "asin": "B08N5WRWNW",
      "SalesRank": 1234,
      "Title": "Product Title",
      "success": true
    }
  ],
  "total_requested": 3,
  "successful": 2,
  "failed": 1,
  "success_rate": "66.7%"
}
```

## Configuration Options

### Rate Limiting
- `RATE_LIMIT_CALLS`: Maximum API calls per time window (default: 20)
- `RATE_LIMIT_WINDOW`: Time window in seconds (default: 60)
- `REQUEST_TIMEOUT`: Timeout for individual requests (default: 30)

### Batch Processing
- `MAX_BATCH_SIZE`: Maximum ASINs per batch (default: 100)
- `MAX_WORKERS`: Maximum concurrent workers (default: 5)

### Retry Logic
- `MAX_RETRIES`: Maximum retry attempts (default: 3)
- `RETRY_DELAY_BASE`: Base delay for exponential backoff (default: 2)

## Monitoring and Debugging

### Health Check
```bash
curl http://localhost:5000/health
```

### Configuration View
```bash
curl http://localhost:5000/config
```

### Logs
The application provides detailed logging:
- Processing status for each ASIN
- Rate limit warnings
- Error details with retry attempts
- Batch processing completion time

## PM2 Configuration

For production deployment with PM2, create a `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'fba-backend',
    script: 'app.py',
    interpreter: 'python3',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '.env'
  }]
}
```

Start with:
```bash
pm2 start ecosystem.config.js
```

## Troubleshooting

### Common Issues

1. **Rate Limit Errors**: Reduce `RATE_LIMIT_CALLS` or increase `RATE_LIMIT_WINDOW`
2. **Timeout Errors**: Increase `REQUEST_TIMEOUT` or reduce `MAX_WORKERS`
3. **Memory Issues**: Reduce `MAX_BATCH_SIZE` or `MAX_WORKERS`
4. **High Failure Rate**: Increase `MAX_RETRIES` or adjust `RETRY_DELAY_BASE`

### Performance Optimization

1. **For high-volume processing**: Increase `MAX_WORKERS` (but stay within rate limits)
2. **For better reliability**: Increase `MAX_RETRIES` and `REQUEST_TIMEOUT`
3. **For faster processing**: Increase `RATE_LIMIT_CALLS` (if API allows)

## API Endpoints

- `GET /asin/<asin>` - Get single ASIN data
- `POST /asin/<country>` - Get single ASIN data (POST)
- `POST /asin/batch/<country>` - Process multiple ASINs
- `GET /health` - Health check
- `GET /config` - View current configuration

## Supported Marketplaces

- US (United States)
- IN (India)
- CA (Canada)
- UK (United Kingdom)

Add more marketplaces in `routes/asin.py` as needed. 