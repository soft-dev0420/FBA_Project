"""
Corrected CatalogItems API Examples
===================================

Fixed examples using only valid includedData values
"""

from sp_api.api import CatalogItems, Products, Catalog
from sp_api.base import Marketplaces, SellingApiException
from credential import credentials
import json
marketplace_map = {
    'US': Marketplaces.US,
    'IN': Marketplaces.IN,
    'CA': Marketplaces.CA,
    'UK': Marketplaces.UK,
    # add other marketplaces as needed
}
def main():
    catalog_items = Catalog(
        marketplace=marketplace_map['US'], 
        credentials=credentials
    )
    item = catalog_items.get_item(
        asin='0443110212',
        marketplaceIds=[marketplace_map['US'].marketplace_id],
        includedData=['summaries', 'images', 'productTypes', 'salesRanks', 'attributes']
    )
    print(item)
    # data = products.get_item_offers(asin='0443110212', item_condition='New', customer_type='Consumer')
    # print(data)
    # listPrice = data.payload.get('Summary').get('ListPrice').get('Amount')
    # buyBoxPrice = data.payload.get('Summary').get('BuyBoxPrices')[0].get('LandedPrice').get('Amount')
    # landedPrice = data.payload.get('Summary').get('LowestPrices')[0].get('LandedPrice').get('Amount')
    # print(buyBoxPrice, listPrice, landedPrice)
     # print("=== Corrected CatalogItems API Examples ===")
    
    # # Initialize the API
    # asins = ['0323930719', '0443110212'];
    # catalog_items = CatalogItems(
    #     marketplace=marketplace_map['US'], 
    #     credentials=credentials
    # )

    # data = []
    # for asin in asins:
    #     try:
    #         item = catalog_items.search_catalog_items(
    #                 keywords=[asin],
    #                 marketplaceIds=[marketplace_map['US'].marketplace_id],
    #                 includedData=['summaries', 'images', 'productTypes', 'salesRanks']
    #             )
    #         # Convert items() tuple to dictionary
    #         payload_dict = dict(item.payload.items())
    #         data.append({'items': payload_dict.get('items', [])})
    #     except Exception as e:
    #         print(f"Error fetching data for ASIN {asin}: {e}")
    #         data.append({'items': []})
    
    # product_list = []
    # found_asins = set()
    
    # for item_data in data:
    #     items = item_data.get('items', [])
    #     print(items)
    #     for item in items:
    #         asin = item.get('asin')
    #         if asin:
    #             found_asins.add(asin)
    #             product_type = item.get('productTypes', [{}])[0].get('productType') if item.get('productTypes') else None
                
    #             # main image link (first image, variant MAIN)
    #             images = item.get('images', [])
    #             main_image_link = None
    #             if images and images[0].get('images'):
    #                 for img in images[0]['images']:
    #                     if img.get('variant') == 'MAIN':
    #                         main_image_link = img['link']
    #                         break
    #                 if not main_image_link:
    #                     main_image_link = images[0]['images'][0]['link']
                
    #             # brandName, itemName, manufacturer from summaries
    #             summaries = item.get('summaries', [{}])
    #             summary = summaries[0] if summaries else {}
    #             brand_name = summary.get('brandName')
    #             item_name = summary.get('itemName')
    #             manufacturer = summary.get('manufacturer')
                
    #             # Get sales rank with proper error handling
    #             sales_rank = None
    #             try:
    #                 sales_ranks = item.get('salesRanks', [])
    #                 if sales_ranks and len(sales_ranks) > 0:
    #                     ranks = sales_ranks[0].get('ranks', [])
    #                     if ranks and len(ranks) > 0:
    #                         sales_rank = ranks[0].get('value')
    #             except (IndexError, KeyError, TypeError) as e:
    #                 print(f"Error getting sales rank for ASIN {asin}: {e}")
    #                 sales_rank = None
                
    #             if asin in asins:
    #                 product_list.append({
    #                     "exist": True,
    #                     "ASIN": asin,
    #                     "productType": product_type,
    #                     "Image URL": main_image_link,
    #                     "Title": item_name,
    #                     "Manufacturer": manufacturer,
    #                     "Product URL": "https://amazon.com/dp/" + asin,
    #                     "SalesRank": sales_rank
    #                 })
    
    # # Add entries for ASINs that were not found
    # for asin in asins:
    #     if asin not in found_asins:
    #         product_list.append({
    #             "exist": False,
    #             "ASIN": asin,
    #         })
            
if __name__ == "__main__":
    main() 