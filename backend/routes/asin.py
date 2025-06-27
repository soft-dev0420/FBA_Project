from flask import Blueprint, request, jsonify
from sp_api.api import CatalogItems, Products, CatalogItemsVersion
from sp_api.base import Marketplaces
from credential import credentials

marketplace_map = {
    'US': Marketplaces.US,
    'IN': Marketplaces.IN,
    'CA': Marketplaces.CA,
    'UK': Marketplaces.UK,
    # add other marketplaces as needed
}

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
    res = asin_data(asin, 'US')
    if res.get('success'):
        return jsonify(res), 200
    else:
        return jsonify(res), 400

    
def asin_data(asin, country):
    products = Products(
        marketplace=marketplace_map[country], 
        credentials=credentials,
        
    )
    catalogItems = CatalogItems(marketplace=marketplace_map[country], 
        credentials=credentials,
        version = CatalogItemsVersion.V_2022_04_01
    )
    
    validnumber = 3
    for i in range(0,validnumber):
        try:
            product_data = products.get_item_offers(asin, item_condition='New', customer_type='Consumer')
            data = catalogItems.get_catalog_item(
                    asin=asin,
                    marketplaceIds=[marketplace_map[country.upper()].marketplace_id],
                    includedData=['summaries', 'images', 'productTypes', 'salesRanks','attributes', 'dimensions']
                )
            
            
            productTypes = data.payload.get('productTypes')
            product_Type = productTypes[0].get('productType')
                     
            images = data.payload.get('images')
            image = images[0].get('images')[0].get('link')
            
            salesRanks = data.payload.get('salesRanks')

            sales_Rank = salesRanks[0].get('displayGroupRanks')[0].get('rank')
            
            attributes = data.payload.get("attributes")
            item_dimension = attributes.get('item_dimensions')
            width = str(item_dimension[0].get('width').get('value')) + item_dimension[0].get('width').get('unit')
            length = str(item_dimension[0].get('length').get('value')) + item_dimension[0].get('length').get('unit')
            height = str(item_dimension[0].get('height').get('value')) + item_dimension[0].get('height').get('unit')
            weight = str(attributes.get('item_weight')[0].get('value')) + attributes.get('item_weight')[0].get('unit')
            
            item_package_dimensions = attributes.get('item_package_dimensions')
            package_width = str(item_package_dimensions[0].get('width').get('value')) + item_package_dimensions[0].get('width').get('unit')
            package_length = str(item_package_dimensions[0].get('length').get('value')) + item_package_dimensions[0].get('length').get('unit')
            package_height = str(item_package_dimensions[0].get('height').get('value')) + item_package_dimensions[0].get('height').get('unit')
            package_weight = str(attributes.get('item_package_weight')[0].get('value')) + attributes.get('item_package_weight')[0].get('unit')

            item_name = attributes.get('item_name')
            title = item_name[0].get('value')

            edition_number = attributes.get('edition_number')
            edition = edition_number[0].get('value')

            publication_date = attributes.get('publication_date')
            publication = publication_date[0].get('value').split('T')[0]

            pages = attributes.get('pages')
            numberPage = pages[0].get('value')

            list_price = str(attributes.get('list_price')[0].get('value')) + attributes.get('list_price')[0].get('currency')
            binding = attributes.get('binding')[0].get('value')
            manufacturer = attributes.get('manufacturer')[0].get('value')
            buyBoxPrice = product_data.payload.get('Summary').get('BuyBoxPrices')[0].get('LandedPrice').get('Amount')
            lowestFBA = product_data.payload.get('Summary').get('LowestPrices')[1].get('LandedPrice').get('Amount')
            lowestNONFBA = product_data.payload.get('Summary').get('LowestPrices')[-1].get('ListingPrice').get('Amount')

            return {'asin':asin,
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
                    'Manufacturer' : manufacturer,
                    'Width': width,
                    'Length': length,
                    'Height' : height,
                    'Weight': weight,
                    'Package Width': package_width,
                    'Package Length': package_length,
                    'Package Height': package_height,
                    'Package Weight': package_weight,
                    'Product URL': 'https://www.amazon.com/dp/'+asin,
                    'Image': image, 
                    'success': True
                    }
        except Exception as e:
            if i == validnumber-1:
                return {'asin':asin, 'success': False}
        
