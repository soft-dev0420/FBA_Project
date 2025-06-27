from flask import Blueprint, request, jsonify
from sp_api.api import CatalogItems, Products, CatalogItemsVersion
from sp_api.base import Marketplaces
from credential import credentials
from config import Config
import time
import asyncio
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from functools import wraps
import logging
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=getattr(logging, Config.LOG_LEVEL))
logger = logging.getLogger(__name__)

marketplace_map = {
    'US': Marketplaces.US,
    'IN': Marketplaces.IN,
    'CA': Marketplaces.CA,
    'UK': Marketplaces.UK,
    # add other marketplaces as needed
}

asins_bp = Blueprint('items', __name__)

class RateLimiter:
    def __init__(self, max_calls, window_seconds):
        self.max_calls = max_calls
        self.window_seconds = window_seconds
        self.calls = []
        self.lock = threading.Lock()
    
    def acquire(self):
        with self.lock:
            now = time.time()
            # Remove calls outside the window
            self.calls = [call_time for call_time in self.calls if now - call_time < self.window_seconds]
            
            if len(self.calls) >= self.max_calls:
                # Wait until we can make another call
                sleep_time = self.window_seconds - (now - self.calls[0])
                if sleep_time > 0:
                    logger.info(f"Rate limit reached, waiting {sleep_time:.2f} seconds")
                    time.sleep(sleep_time)
                    return self.acquire()
            
            self.calls.append(now)
            return True

# Global rate limiter
rate_limiter = RateLimiter(Config.RATE_LIMIT_CALLS, Config.RATE_LIMIT_WINDOW)

def rate_limit(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        rate_limiter.acquire()
        return func(*args, **kwargs)
    return wrapper

#test data using get
@asins_bp.route('/<string:asin>', methods=['GET'])
def get_asin_test_data(asin):
    res = asin_data(asin, 'US')
    if res.get('success'):
        return jsonify(res), 200
    else:
        return jsonify(res), 400

#test data using post
@asins_bp.route('/<string:country>', methods=['POST'])
def get_asin_data(country):
    data = request.get_json()
    asin = data.get('asin')
    res = asin_data(asin, country)
    if res.get('success'):
        return jsonify(res), 200
    else:
        return jsonify(res), 400

# New endpoint for batch processing
@asins_bp.route('/batch/<string:country>', methods=['POST'])
def get_batch_asin_data(country):
    data = request.get_json()
    asins = data.get('asins', [])
    
    if not asins:
        return jsonify({'error': 'No ASINs provided'}), 400
    
    if len(asins) > Config.MAX_BATCH_SIZE:
        return jsonify({'error': f'Maximum {Config.MAX_BATCH_SIZE} ASINs per batch'}), 400
    
    # Process ASINs in parallel with rate limiting
    results = process_batch_asins(asins, country)
    
    return jsonify({
        'results': results,
        'total_requested': len(asins),
        'successful': len([r for r in results if r.get('success')]),
        'failed': len([r for r in results if not r.get('success')]),
        'success_rate': f"{(len([r for r in results if r.get('success')]) / len(asins)) * 100:.1f}%"
    }), 200

def process_batch_asins(asins, country):
    """Process multiple ASINs with proper rate limiting and error handling"""
    results = []
    start_time = time.time()
    
    logger.info(f"Starting batch processing of {len(asins)} ASINs for country {country}")
    
    # Use ThreadPoolExecutor for controlled concurrency
    with ThreadPoolExecutor(max_workers=Config.MAX_WORKERS) as executor:
        # Submit all tasks
        future_to_asin = {
            executor.submit(asin_data_with_retry, asin, country): asin 
            for asin in asins
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_asin):
            asin = future_to_asin[future]
            try:
                result = future.result(timeout=Config.REQUEST_TIMEOUT)
                results.append(result)
                logger.info(f"Processed ASIN {asin}: {'Success' if result.get('success') else 'Failed'}")
            except Exception as e:
                logger.error(f"Error processing ASIN {asin}: {str(e)}")
                results.append({
                    'asin': asin,
                    'success': False,
                    'error': str(e)
                })
    
    elapsed_time = time.time() - start_time
    logger.info(f"Batch processing completed in {elapsed_time:.2f} seconds")
    
    return results

def asin_data_with_retry(asin, country, max_retries=None):
    """Wrapper function with retry logic and better error handling"""
    if max_retries is None:
        max_retries = Config.MAX_RETRIES
        
    for attempt in range(max_retries):
        try:
            result = asin_data(asin, country)
            if result.get('success'):
                return result
            else:
                logger.warning(f"ASIN {asin} failed on attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    delay = Config.RETRY_DELAY_BASE ** attempt
                    logger.info(f"Retrying ASIN {asin} in {delay} seconds")
                    time.sleep(delay)  # Exponential backoff
        except Exception as e:
            logger.error(f"ASIN {asin} error on attempt {attempt + 1}: {str(e)}")
            if attempt < max_retries - 1:
                delay = Config.RETRY_DELAY_BASE ** attempt
                logger.info(f"Retrying ASIN {asin} in {delay} seconds")
                time.sleep(delay)
    
    return {
        'asin': asin,
        'success': False,
        'error': 'Max retries exceeded'
    }

@rate_limit
def asin_data(asin, country):
    """Original asin_data function with rate limiting"""
    try:
        products = Products(
            marketplace=marketplace_map[country], 
            credentials=credentials,
        )
        catalogItems = CatalogItems(
            marketplace=marketplace_map[country], 
            credentials=credentials,
            version=CatalogItemsVersion.V_2022_04_01
        )
        
        # Get product offers
        product_data = products.get_item_offers(asin, item_condition='New', customer_type='Consumer')
        
        # Get catalog item data
        data = catalogItems.get_catalog_item(
            asin=asin,
            marketplaceIds=[marketplace_map[country.upper()].marketplace_id],
            includedData=['summaries', 'images', 'productTypes', 'salesRanks','attributes', 'dimensions']
        )
        
        # Extract data with proper error handling
        payload = data.payload
        if not payload:
            return {'asin': asin, 'success': False, 'error': 'No payload received'}
        
        # Extract product types
        productTypes = payload.get('productTypes', [])
        product_Type = productTypes[0].get('productType') if productTypes else ''
        
        # Extract images
        images = payload.get('images', [])
        image = images[0].get('images')[0].get('link') if images and images[0].get('images') else ''
        
        # Extract sales ranks
        salesRanks = payload.get('salesRanks', [])
        sales_Rank = salesRanks[0].get('displayGroupRanks')[0].get('rank') if salesRanks and salesRanks[0].get('displayGroupRanks') else 0
        
        # Extract attributes
        attributes = payload.get("attributes", {})
        
        # Extract dimensions with error handling
        item_dimension = attributes.get('item_dimensions', [])
        width = length = height = weight = ''
        if item_dimension:
            dim = item_dimension[0]
            width = f"{dim.get('width', {}).get('value', '')}{dim.get('width', {}).get('unit', '')}"
            length = f"{dim.get('length', {}).get('value', '')}{dim.get('length', {}).get('unit', '')}"
            height = f"{dim.get('height', {}).get('value', '')}{dim.get('height', {}).get('unit', '')}"
        
        item_weight = attributes.get('item_weight', [])
        if item_weight:
            weight = f"{item_weight[0].get('value', '')}{item_weight[0].get('unit', '')}"
        
        # Extract package dimensions
        item_package_dimensions = attributes.get('item_package_dimensions', [])
        package_width = package_length = package_height = package_weight = ''
        if item_package_dimensions:
            pkg_dim = item_package_dimensions[0]
            package_width = f"{pkg_dim.get('width', {}).get('value', '')}{pkg_dim.get('width', {}).get('unit', '')}"
            package_length = f"{pkg_dim.get('length', {}).get('value', '')}{pkg_dim.get('length', {}).get('unit', '')}"
            package_height = f"{pkg_dim.get('height', {}).get('value', '')}{pkg_dim.get('height', {}).get('unit', '')}"
        
        item_package_weight = attributes.get('item_package_weight', [])
        if item_package_weight:
            package_weight = f"{item_package_weight[0].get('value', '')}{item_package_weight[0].get('unit', '')}"
        
        # Extract other attributes
        item_name = attributes.get('item_name', [])
        title = item_name[0].get('value') if item_name else ''
        
        edition_number = attributes.get('edition_number', [])
        edition = edition_number[0].get('value') if edition_number else ''
        
        publication_date = attributes.get('publication_date', [])
        publication = publication_date[0].get('value').split('T')[0] if publication_date else ''
        
        pages = attributes.get('pages', [])
        numberPage = pages[0].get('value') if pages else ''
        
        list_price_attr = attributes.get('list_price', [])
        list_price = f"{list_price_attr[0].get('value')}{list_price_attr[0].get('currency')}" if list_price_attr else ''
        
        binding_attr = attributes.get('binding', [])
        binding = binding_attr[0].get('value') if binding_attr else ''
        
        manufacturer_attr = attributes.get('manufacturer', [])
        manufacturer = manufacturer_attr[0].get('value') if manufacturer_attr else ''
        
        # Extract pricing data from product offers
        product_payload = product_data.payload
        buyBoxPrice = lowestFBA = lowestNONFBA = 0
        
        if product_payload and product_payload.get('Summary'):
            summary = product_payload.get('Summary')
            
            buybox_prices = summary.get('BuyBoxPrices', [])
            if buybox_prices:
                buyBoxPrice = buybox_prices[0].get('LandedPrice', {}).get('Amount', 0)
            
            lowest_prices = summary.get('LowestPrices', [])
            if len(lowest_prices) > 1:
                lowestFBA = lowest_prices[1].get('LandedPrice', {}).get('Amount', 0)
            if lowest_prices:
                lowestNONFBA = lowest_prices[-1].get('ListingPrice', {}).get('Amount', 0)
        
        return {
            'asin': asin,
            'SalesRank': sales_Rank,
            'Title': title, 
            'Edition': edition,
            'Publication Date': publication, 
            'Format': '',
            'Number of Pages': numberPage,
            'BuyBox Total': buyBoxPrice, 
            'Lowest FBA': lowestFBA,
            'Lowest NonFBA': lowestNONFBA,
            'List Price': list_price, 
            'Product Type': product_Type,
            'Binding': binding,
            'Manufacturer': manufacturer,
            'Width': width,
            'Length': length,
            'Height': height,
            'Weight': weight,
            'Package Width': package_width,
            'Package Length': package_length,
            'Package Height': package_height,
            'Package Weight': package_weight,
            'Product URL': f'https://www.amazon.com/dp/{asin}',
            'Image': image, 
            'success': True
        }
        
    except Exception as e:
        logger.error(f"Error processing ASIN {asin}: {str(e)}")
        return {
            'asin': asin, 
            'success': False, 
            'error': str(e)
        }
        
