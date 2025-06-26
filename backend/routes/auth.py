from flask import Blueprint, request, jsonify
from credential import credentials
from sp_api.api import Sellers
from sp_api.base import SellingApiException, Marketplaces
auth_bp = Blueprint('auth', __name__)


#get info from credintial. /auth/ get
@auth_bp.route('/', methods=['GET'])
def get_Info():
    sellers_api = Sellers(marketplace=Marketplaces.US, credentials=credentials)
    result = sellers_api.get_marketplace_participation()
    print("Account Info:")
    print(type(result.payload))
    print(result.payload)

    return jsonify(result.payload), 201