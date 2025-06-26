from flask import Flask, jsonify
from routes.asin import asins_bp
from routes.auth import auth_bp
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)
# Configure for production
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

# Register the items blueprint under /items (just like app.use('/items', ...))
app.register_blueprint(asins_bp, url_prefix='/asin')
app.register_blueprint(auth_bp, url_prefix='/auth')

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

@app.route('/health')
def health_check():
    return jsonify({'status': 'healthy', 'message': 'FBA Backend is running'})

if __name__ == "__main__":
    # Use environment variable for port, default to 8000
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
