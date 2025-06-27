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
      PORT: 5000,
      RATE_LIMIT_CALLS: 20,
      RATE_LIMIT_WINDOW: 60,
      REQUEST_TIMEOUT: 30,
      MAX_BATCH_SIZE: 100,
      MAX_WORKERS: 5,
      MAX_RETRIES: 3,
      RETRY_DELAY_BASE: 2,
      LOG_LEVEL: 'INFO'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
} 