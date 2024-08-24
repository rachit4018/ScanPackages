from chalice import Chalice
import requests
import base64
import json
import uuid
from chalicelib.dynamo_service import DynamoService
from chalicelib.business_card_list import BusinessCardList
from chalicelib.business_card import BusinessCard
from chalicelib import storage_service
from chalicelib import recognition_service
from chalicelib import textract_service
from chalicelib import comprehend_services
from chalicelib import named_entity_recognition_service

app = Chalice(app_name='Capabilities')
app.debug = True

# Services initialization
storage_location = 'package-scan'
table_name = 'PackageScan'
storage_service = storage_service.StorageService(storage_location)
recognition_service = recognition_service.RecognitionService(storage_service)
textract_service = textract_service.TextractService(storage_service)
comprehend_service = comprehend_services.ComprehendServices(storage_service)
named_entity_recognition_service = named_entity_recognition_service.NamedEntityRecognitionService()
dynamo_service = DynamoService(table_name)

# Django authentication base URL
DJANGO_BASE_URL = 'https://127.0.0.0:8000'

#####
# Django Authentication Routes
#####

@app.route('/login', methods=['POST'], cors=True)
def login():
    response = requests.post(f'{DJANGO_BASE_URL}/login/', json=app.current_request.json_body)
    return response.json()

@app.route('/logout', methods=['POST'], cors=True)
def logout():
    response = requests.post(f'{DJANGO_BASE_URL}/logout/')
    return response.json()

@app.route('/signup', methods=['POST'], cors=True)
def signup():
    response = requests.post(f'{DJANGO_BASE_URL}/signup/', json=app.current_request.json_body)
    return response.json()

#####
# Existing RESTful endpoints
#####

@app.route('/images', methods=['POST'], cors=True)
def upload_image():
    request_data = json.loads(app.current_request.raw_body)
    file_name = request_data['filename']
    file_bytes = base64.b64decode(request_data['filebytes'])
    image_info = storage_service.upload_file(file_bytes, file_name)

    return image_info

@app.route('/home', methods=['GET'], cors=True)
def home():
    print("hello")

@app.route('/images/{image_id}/recognize_entities', methods=['POST'], cors=True)
def recognize_image_entities(image_id):
    text_lines = textract_service.detect_text(image_id)
    lines = ""
    comp_lines = []
    b_name = ''
    telephone = []
    email = ''
    website = ''
    address = ''
    URL =''
    #print(text_lines)
    for text in text_lines:
            b_name += text['text'] + ' '
    comprehend_line = comprehend_service.detect_entity(b_name)
    labels = comprehend_line[0]
    values = comprehend_line[1]
    #print(comprehend_line)
    for i in range(len(labels)):
        if labels[i] == 'NAME' or labels[i] == 'PROFESSION':
            b_name = values[i]
        elif labels[i] == 'PHONE_OR_FAX':
            telephone = values[i]
        elif labels[i] == 'EMAIL':
            email = values[i]
        elif labels[i] == 'URL':
            website = values[i]
        elif labels[i] == 'ADDRESS':
            address = values[i]
    card_id = str(uuid.uuid4())
    user_id = '100'
    merge = [card_id,b_name,telephone,email,website,address,user_id]
    comp_lines = [['card_id','b_name','Telephone','Email','Website','Address','user_id'],[card_id,b_name,telephone,email,website,address,user_id]]
    print("========complines========")
    keys = comp_lines[0]  # ['Name', 'Telephone', 'Email', 'Website', 'Address']
    values = comp_lines[1]  # [name, telephone, email, website, address]

# Convert to dictionary
    comp_dict = dict(zip(keys, values))
    dynamo_service.store_card(comp_dict)
    print(comp_dict)
    return comp_lines
@app.route('/cards/{user_id}', methods=['GET'], cors=True)
def get_cards(user_id):
    user_id = '100'
    cardlist_container = dynamo_service.search_cards(user_id)
    cards_list = []
    index = 1
    print(cardlist_container)
    for item in cardlist_container:
        obj = {
            'user_id': item['user_id'],
            'card_id': item['card_id'],
            'b_name': item['b_name'],
            'Telephone': item['Telephone'],
            'Email': item['Email'],
            'Website': item['Website'],
            'Address': item['Address'],
        }
        cards_list.append(obj)
        index += 1

    return cards_list

@app.route('/cards', methods=['POST'], cors=True, content_types=['application/json'])
def post_card():
    req_body = app.current_request.json_body
    print("+++++++++++++++")
    print(req_body)
    req_body['b_name'] = req_body['b_name'][0]
    req_body['Telephone'] = req_body['Telephone'][0]
    req_body['Email'] = req_body['Email'][0]
    result = dynamo_service.update_card(req_body)
    new_card_id = req_body['card_id']
    return new_card_id

@app.route('/cards', methods=['PUT'], cors=True, content_types=['application/json'])
def put_card():
    req_body = app.current_request.json_body
    print('@@@@@@@@@@@')
    print(req_body)
    req_body['b_name'] = req_body['b_name']
    req_body['Telephone'] = req_body['Telephone']
    req_body['Email'] = req_body['Email']
    result = dynamo_service.update_card(req_body)

@app.route('/cards/{user_id}/{card_id}', methods=['DELETE'], cors=True)
def delete_card(user_id, card_id):
    print("+++++++++++++++++++")
    print(card_id)
    return dynamo_service.delete_card(user_id, card_id)

@app.route('/card/{user_id}/{card_id}', methods=['GET'], cors=True)
def get_card(user_id, card_id):
    return dynamo_service.get_card(user_id, card_id)
