from flask import Blueprint, request, jsonify
from sp_api.api import CatalogItems, Products, CatalogItemsVersion, ProductFees, Sales
from sp_api.base import Marketplaces, Granularity
from credential import credentials
from datetime import datetime, timedelta

marketplace_map = {
    'US': Marketplaces.US,
    'IN': Marketplaces.IN,
    'CA': Marketplaces.CA,
    'UK': Marketplaces.UK,
    # add other marketplaces as needed
}
granularity = Granularity
asins_bp = Blueprint('items', __name__)

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
        
        productFees = ProductFees( marketplace=marketplace_map[country], 
            credentials=credentials)
        
        sales = Sales(marketplace=marketplace_map[country], 
            credentials=credentials)
        
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
        
        fee_data = productFees.get_product_fees_estimate_for_asin(asin,  price= buyBoxPrice, is_fba=True).payload
        fee_list = fee_data.get('FeesEstimateResult').get('FeesEstimate').get('FeeDetailList')
        referral_fee = 0
        fba_fee = 0
        closing_fee =0
        for fee in fee_list:
            fee_type = fee.get('FeeType')
            amount = fee.get('FinalFee', {}).get('Amount', 0)
            if fee_type == 'ReferralFee':
                referral_fee = amount
            elif fee_type == 'VariableClosingFee':
                closing_fee = amount
            else:
                fba_fee = amount
        nowTime = datetime.utcnow().isoformat() + 'Z'
        past7time = (datetime.utcnow()-timedelta(days=7)).isoformat() + 'Z'
        past30time = (datetime.utcnow()-timedelta(days=30)).isoformat() + 'Z'
        
        sold_7days = sales.get_order_metrics(interval=(past7time, nowTime), 
                                               granularity = Granularity.DAY, 
                                               granularityTimeZone='US/Central', 
                                               asin=asin).payload
        sold_30days = sales.get_order_metrics(interval=(past30time, nowTime), 
                                               granularity = Granularity.DAY, 
                                               granularityTimeZone='US/Central', 
                                               asin=asin).payload
        sum_7day = 0
        sum_30day = 0
        for day in sold_7days:
            if day.get('orderItemCount') != 0:
                sum_7day +=1
        for day in sold_30days:
            if day.get('orderItemCount') != 0:
                sum_30day +=1
                
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
            'Referal Fee': referral_fee,
            'Closing Fee': closing_fee,
            'FBA fee': fba_fee,
            'Sold - 7 Days': sum_7day,
            'Sold - 30 Days': sum_30day,
            'success': True
        }
        
    except Exception as e:
        return {
            'asin': asin, 
            'success': False, 
            'error': str(e)
        }
        
