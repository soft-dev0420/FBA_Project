from flask import Flask, jsonify
from routes.asin import asins_bp
from routes.auth import auth_bp
from flask_cors import CORS
import os
import logging

# Configure logging

app = Flask(__name__)
CORS(app)

# Configure Flask app
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
    })

if __name__ == "__main__":
    # Use environment variable for port, default to 5000
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
