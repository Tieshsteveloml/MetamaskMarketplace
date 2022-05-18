from django.shortcuts import render
from django.http import HttpResponse, HttpResponseRedirect
from Addy.models import *
import os
import json
import tempfile
import shutil
from Addy import constant as my_constant
from pycoingecko import CoinGeckoAPI
from datetime import datetime
from web3 import Web3
import requests
import time
# Create your views here.


def get_menu_data():
    data = [
        {'id': 0,
         'url': '/register',
         'name': 'Register'},
        {'id': 1,
         'url': '/',
         'name': 'Pay'},
        {'id': 2,
         'url': '/account',
         'name': 'Account'}
    ]
    return data


def register(request):
    data = {
        "title": "Welcome to Addy.cash",
        "activated_menu": 0,
        "menu_data": get_menu_data(),
    }
    return render(request, 'register.html', data)


def transfer(request):
    data = {
        "title": "Pay Addy.cash or Ether",
        "activated_menu": 1,
        "menu_data": get_menu_data(),
    }
    return render(request, 'transfer.html', data)


def account_address(request, token):
    if len(token) < 10:
        return HttpResponseRedirect('/account')
    request.session['current_address'] = token
    request.session.save()
    return HttpResponseRedirect('/account')


def account(request):
    current_address = request.session.get('current_address', '')
    # request.session.clear()
    urls = []
    if len(current_address) > 0:
        urls = list(ModelUser.objects.filter(address=current_address).values())
    data = {
        "title": "View account",
        "activated_menu": 2,
        "menu_data": get_menu_data(),
        "address": current_address,
        "urls": urls,
    }
    return render(request, 'account.html', data)


def submit_verify(request):
    try:
        params = request.POST
        url = params['url']
        url = url.replace('https://', '')
        url = url.replace('http://', '')
        exist = list(ModelUser.objects.filter(url=url).values())
        if len(exist) > 0:
            return HttpResponse('Already existed website')
        justification = params['justification']
        address = params['address']
        file = request.FILES.getlist('uploading_file')[0]
        tup = tempfile.mkstemp()
        f = os.fdopen(tup[0], 'wb')
        f.write(file.read())
        f.close()

        tup_path = str(tup[1])
        str_file = str(file)

        url_hash = hash(url)
        static_path = 'static/upload/' + str(url_hash)
        if not os.path.exists(static_path):
            os.makedirs(static_path)
        static_path += "/" + str_file
        shutil.move(tup_path, static_path)
        static_path = my_constant.SERVER_URL + static_path
        new_params = {'url': url, 'justification': justification, 'address': address,
                      'proof_path': static_path, 'create_date': datetime.now()}
        new_reg = ModelUser(**new_params)
        new_reg.save()
        return HttpResponse('success')
    except Exception as e:
        print('submit_verify: exception: ' + str(e))
        return HttpResponse('exception')


def get_recipient(request):
    data = {'result': 'exception', 'url': '', 'justification': '', 'address': ''}
    try:
        params = request.GET
        url = params['url']
        url = url.replace('https://', '')
        url = url.replace('http://', '')
        exist = list(ModelUser.objects.filter(url=url).values())
        if len(exist) != 1:
            data['result'] = 'Unregistered or unknown website'
            return HttpResponse(json.dumps(data))
        recipient = exist[0]
        if recipient['is_approved'] is False:
            data['result'] = 'Unapproved website'
            return HttpResponse(json.dumps(data))
        data = {'result': 'success',
                'url': recipient['url'],
                'justification': recipient['justification'],
                'address': recipient['address'],
                'ether': get_ether_price(),
                'addy': get_addy_price()}
        return HttpResponse(json.dumps(data))
    except Exception as e:
        print('get_recipient: exception: ' + str(e))
        return HttpResponse(json.dumps(data))


def get_ether_price():
    try:
        data = CoinGeckoAPI().get_price(ids='ethereum', vs_currencies='usd')
        my_constant.ETHER_PRICE = float(data['ethereum']['usd'])
        return my_constant.ETHER_PRICE
    except Exception as e:
        print('get_ether_price: exception: ' + str(e))
        return my_constant.ETHER_PRICE


def get_addy_price():
    try:
        return my_constant.ADDY_PRICE
    except Exception as e:
        print('get_ether_price: exception: ' + str(e))
        return my_constant.ETHER_PRICE


def save_transaction(request):
    try:
        params = request.POST
        new_params = {'url': params['url'], 'create_date': datetime.now(),
                      'amount': float(params['amount']), 'from_address': params['from_address'],
                      'to_address': params['to_address'], 'chain_id': params['chain_id'],
                      'coin': params['coin'], 'tx_hash': params['tx_hash']}
        new_tx = ModelTransaction(**new_params)
        new_tx.save()
        return HttpResponse('success')
    except Exception as e:
        print('save_transaction: exception: ' + str(e))
        return HttpResponse('exception')


def get_addy_transfer_data(request):
    result = {'result': 'exception'}
    try:
        params = request.GET
        amount = float(params['amount'])
        dest_address = params['to_address']
        contract_addr = Web3.toChecksumAddress(my_constant.ADDY_ADDRESS)
        contract = my_constant.ETH_WEB3.eth.contract(contract_addr, abi=my_constant.ADDY_ABI)
        value = int(amount * pow(10, my_constant.ADDY_DECIMALS))
        dest_address = Web3.toChecksumAddress(dest_address)
        result['data'] = contract.functions.transfer(dest_address, value)._encode_transaction_data()
        result['gasPrice'] = get_gas_price()
        result['gas'] = hex(my_constant.ETH_GAS_LIMIT)
        result['contract_address'] = contract_addr
        result['result'] = 'success'
        return HttpResponse(json.dumps(result))
    except Exception as e:
        print('get_addy_transfer_data: exception: ' + str(e))
        return HttpResponse(json.dumps(result))


def get_gas_price():
    while True:
        try:
            res = requests.get(my_constant.ETH_GAS_URL).json()
            gas_price = int(res[my_constant.ETH_GAS_LEVEL] / 10)
            gas_price = my_constant.ETH_WEB3.toWei(gas_price, 'gwei')
            return hex(gas_price)
        except Exception as e:
            print("get_gas_price:" + str(e))
            time.sleep(1)
