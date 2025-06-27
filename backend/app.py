from flask import Flask, jsonify
from routes.asin import asins_bp
from routes.auth import auth_bp
from flask_cors import CORS
from config import Config
import os
import logging

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Flask app
app.config.from_object(Config)

# Register the items blueprint under /items (just like app.use('/items', ...))
app.register_blueprint(asins_bp, url_prefix='/asin')
app.register_blueprint(auth_bp, url_prefix='/auth')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(429)
def too_many_requests(error):
    return jsonify({'error': 'Too many requests. Please try again later.'}), 429

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy', 
        'message': 'FBA Backend is running',
        'rate_limit': {
            'calls_per_window': Config.RATE_LIMIT_CALLS,
            'window_seconds': Config.RATE_LIMIT_WINDOW
        }
    })

@app.route('/config')
def get_config():
    """Endpoint to view current configuration (for debugging)"""
    return jsonify({
        'rate_limiting': {
            'calls_per_window': Config.RATE_LIMIT_CALLS,
            'window_seconds': Config.RATE_LIMIT_WINDOW,
            'request_timeout': Config.REQUEST_TIMEOUT
        },
        'batch_processing': {
            'max_batch_size': Config.MAX_BATCH_SIZE,
            'max_workers': Config.MAX_WORKERS
        },
        'retry_config': {
            'max_retries': Config.MAX_RETRIES,
            'retry_delay_base': Config.RETRY_DELAY_BASE
        }
    })

if __name__ == "__main__":
    # Use environment variable for port, default to 5000
    port = int(os.getenv('PORT', 5000))
    logger.info(f"Starting FBA Backend on port {port}")
    app.run(host='0.0.0.0', port=port)
