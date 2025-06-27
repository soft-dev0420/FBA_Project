import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Rate limiting configuration
    RATE_LIMIT_CALLS = int(os.getenv('RATE_LIMIT_CALLS', 20))  # Maximum calls per window
    RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', 60))  # Time window in seconds
    REQUEST_TIMEOUT = int(os.getenv('REQUEST_TIMEOUT', 30))  # Timeout for individual requests
    
    # Batch processing configuration
    MAX_BATCH_SIZE = int(os.getenv('MAX_BATCH_SIZE', 100))  # Maximum ASINs per batch
    MAX_WORKERS = int(os.getenv('MAX_WORKERS', 5))  # Maximum concurrent workers
    
    # Retry configuration
    MAX_RETRIES = int(os.getenv('MAX_RETRIES', 3))  # Maximum retry attempts
    RETRY_DELAY_BASE = int(os.getenv('RETRY_DELAY_BASE', 2))  # Base delay for exponential backoff
    
    # Logging configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # Flask configuration
    JSON_SORT_KEYS = False
    JSONIFY_PRETTYPRINT_REGULAR = False 