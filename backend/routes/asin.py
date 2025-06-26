from flask import Blueprint, request, jsonify
from sp_api.api import CatalogItems, Products
from sp_api.base import Marketplaces, SellingApiException
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
        credentials=credentials
    )
    validnumber = 3
    for i in range(0,validnumber):
        try:
            product_data = products.get_item_offers(asin, item_condition='New', customer_type='Consumer')
            print(product_data.payload)
            listPrice = product_data.payload.get('Summary').get('ListPrice').get('Amount')
            print("listPrice", listPrice)
            buyBoxPrice = product_data.payload.get('Summary').get('BuyBoxPrices')[0].get('LandedPrice').get('Amount')
            print("buyboxprice", buyBoxPrice)
            lowestFBA = product_data.payload.get('Summary').get('LowestPrices')[1].get('LandedPrice').get('Amount')
            print("lowestFBA", lowestFBA)
            lowestNONFBA = product_data.payload.get('Summary').get('LowestPrices')[2].get('LandedPrice').get('Amount')
            print("lowestNONFBA", lowestNONFBA)
            if 'SalesRankings' in product_data.payload.get('Summary') and i==validnumber-1:
                salesRank = product_data.payload.get('Summary').get('SalesRankings')[0].get('Rank')
            else:
                salesRank = 0
            print("salesrank", salesRank)
            return {'asin':asin,
                            'Title': '', 
                            'Image URL': '', 
                            'Product URL': '', 
                            'SalesRank': salesRank, 
                            'BuyBox Total': buyBoxPrice, 
                            'Lowest FBA': lowestFBA, 
                            'List Price': listPrice, 
                            'Lowest NonFBA': lowestNONFBA,
                            'Product URL': 'https://www.amazon.com/dp/'+asin,
                            'success': True}
        except Exception as e:
            if i == validnumber-1:
                return {'asin':asin, 'success': False}
        
   

#GET /<country>?asin
# @asins_bp.route('/<string:country>', methods=['POST'] )
# def get_OneAsin(country):
#     data = request.get_json()
#     asins = data.get('asins')
#     catalog_items = CatalogItems(
#         marketplace=marketplace_map[country.upper()], 
#         credentials=credentials
#     )

#     products = Products(
#         marketplace=marketplace_map['US'], 
#         credentials=credentials
#     )
    

#     data = []
#     price_list = []
#     for asin in asins:
#         try:
#             item = catalog_items.search_catalog_items(
#                     keywords=[asin],
#                     marketplaceIds=[marketplace_map[country.upper()].marketplace_id],
#                     includedData=['summaries', 'images', 'productTypes', 'salesRanks']
#                 )
#             product_data = products.get_item_offers(asin, item_condition='New', customer_type='Consumer')
#             listPrice = product_data.payload.get('Summary').get('ListPrice').get('Amount')
#             buyBoxPrice = product_data.payload.get('Summary').get('BuyBoxPrices')[0].get('LandedPrice').get('Amount')
#             landedPrice = product_data.payload.get('Summary').get('LowestPrices')[0].get('LandedPrice').get('Amount')
#             # Convert items() tuple to dictionary
#             payload_dict = dict(item.payload.items())
#             data.append({'items': payload_dict.get('items', [])})
#             price_list.append({asin:{'listPrice': listPrice, 'buyBoxPrice': buyBoxPrice, 'landedPrice': landedPrice}})
#         except Exception as e:
#             print(f"Error fetching data for ASIN {asin}: {e}")
#             data.append({'items': []})
#             price_list.append({asin:{'listPrice': '-', 'buyBoxPrice': '-', 'landedPrice': '-'}})
    
#     product_list = []
#     found_asins = set()
#     print(price_list);
#     for item_data in data:
#         items = item_data.get('items', [])
#         for item in items:
#             asin = item.get('asin')
#             if asin:
#                 found_asins.add(asin)
#                 product_type = item.get('productTypes', [{}])[0].get('productType') if item.get('productTypes') else None
                
#                 # main image link (first image, variant MAIN)
#                 images = item.get('images', [])
#                 main_image_link = None
#                 if images and images[0].get('images'):
#                     for img in images[0]['images']:
#                         if img.get('variant') == 'MAIN':
#                             main_image_link = img['link']
#                             break
#                     if not main_image_link:
#                         main_image_link = images[0]['images'][0]['link']
                
#                 # brandName, itemName, manufacturer from summaries
#                 summaries = item.get('summaries', [{}])
#                 summary = summaries[0] if summaries else {}
#                 brand_name = summary.get('brandName')
#                 item_name = summary.get('itemName')
#                 manufacturer = summary.get('manufacturer')
                
#                 # Get sales rank with proper error handling
#                 sales_rank = None
#                 try:
#                     sales_ranks = item.get('salesRanks', [])
#                     if sales_ranks and len(sales_ranks) > 0:
#                         ranks = sales_ranks[0].get('ranks', [])
#                         if ranks and len(ranks) > 0:
#                             sales_rank = ranks[0].get('value')
#                 except (IndexError, KeyError, TypeError) as e:
#                     print(f"Error getting sales rank for ASIN {asin}: {e}")
#                     sales_rank = None
#                 prices = info = next((item[asin] for item in price_list if asin in item), None)
#                 print(prices)
#                 if asin in asins:
#                     product_list.append({
#                         "exist": True,
#                         "ASIN": asin,
#                         "productType": product_type,
#                         "Image URL": main_image_link,
#                         "Title": item_name,
#                         "Manufacturer": manufacturer,
#                         "Product URL": "https://amazon.com/dp/" + asin,
#                         "SalesRank": sales_rank,
#                         "List Price": prices['listPrice'],
#                         "BuyBox Total": prices['buyBoxPrice'],
#                         "Lowest FBA": prices['landedPrice']
#                     })
    
#     # Add entries for ASINs that were not found
#     for asin in asins:
#         if asin not in found_asins:
#             product_list.append({
#                 "exist": False,
#                 "ASIN": asin,
#             })
    
#     return jsonify(product_list)





# POST /items/
@asins_bp.route('/', methods=['POST'])
def create_item():
    data = request.get_json()
    return jsonify({"item": data}), 201
