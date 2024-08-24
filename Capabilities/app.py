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
from google.cloud import vision
import io
import requests
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract
import re
from io import BytesIO

app = Chalice(app_name='Capabilities')
app.debug = True

# Services initialization
storage_location = 'package-scan1'
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

# Function to preprocess image
def preprocess_image(image):
    # Convert image to grayscale
    image = image.convert('L')
    # Enhance the image contrast
    image = ImageEnhance.Contrast(image).enhance(2)
    # Apply a slight blur to remove noise
    image = image.filter(ImageFilter.MedianFilter())
    return image

def clean_text(text):
    # Basic text cleaning: remove extra spaces, newlines, and irrelevant artifacts
    text = text.replace('\n', ' ').replace('\r', '').strip()
    # Remove common artifacts identified
    text = re.sub(r'[^\w\s,/-]', '', text)  # Remove special characters except useful ones
    return text


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
    with open(f'{image_id}Txtr_extracted_texts.txt', 'w', encoding='utf-8') as f:
            f.write(str(comp_lines))

    comp_dict = dict(zip(keys, values))
    dynamo_service.store_card(comp_dict)
    print(comp_dict)
    return comp_lines

@app.route('/images/{image_id}/get_package_details',methods=['POST'],cors=True)
def get_package_details(image_id):

    req = app.current_request.json_body
    file_url = req.get('fileUrl')
    file_data = requests.get(file_url)
    # Open the image using PIL directly from the bytes
    img = Image.open(BytesIO(file_data.content))

    # Preprocess the image
    # img = preprocess_image(img)
    
    # Use pytesseract to do OCR on the preprocessed image
    # custom_config = r'--oem 3 --psm 6'  # Set OaCR Engine Mode and Page Segmenttion Mode
    # cleaned_text = pytesseract.image_to_string(img, config=custom_config)
    cleaned_text = pytesseract.image_to_string(img)

    # cleaned_text = clean_text(cleaned_text)
    ner_lines = comprehend_service.detect_entity(cleaned_text)
    with open(f'{image_id}_extracted_texts.txt', 'w', encoding='utf-8') as f:
                f.write(str(cleaned_text))
    print("NER Lines",ner_lines)
    # Initialize variables to hold extracted details
    recipient_name = ""
    address = []
    tracking_number = []
    date = ""
    
    name_match = re.search(r'([A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+)', cleaned_text)
    if name_match:
        recipient_name = name_match.group(0)
    
    labels = ner_lines[0]
    values = ner_lines[1]
    #print(comprehend_line)
    for i in range(len(labels)):
        if labels[i] == 'ADDRESS':
            address.clear()
            address.append(values[i])
        elif labels[i] == 'ID':
            tracking_number.clear()
            tracking_number.append(values[i])


        if len(address) == 0:
            address.append("Name")
        if len(tracking_number) == 0:
            tracking_number.append("Name")         
    
    # # Enhanced regex for address detection
    # address_match = re.search(r'(\d+-\d+ \w+ \w+(?: Avenue| St| Street| Rd| Road| Blvd| Boulevard| Lane| Dr| Drive| Ct| Court)[, ]*\w*[ ]*,?\s*\w+\s*,?\s*[A-Za-z]{1,2}\d[A-Za-z]\d[\s\w]+)', cleaned_text)
    # if address_match:
    #     address = address_match.group(0)
    
    # # Extract the tracking number
    # tracking_match = re.search(r'\bTBC\d+\b', cleaned_text)
    # if tracking_match:
    #     tracking_number = tracking_match.group(0)
    
    # Extract the date
    date_match = re.search(r'\b\d{2}/\d{2}\b', cleaned_text)
    if date_match:
        date = date_match.group(0)

    
    details =  {
        "Recipient Name": recipient_name,
        "Address": address[0],
        "Tracking Number": tracking_number[0],
        "Date": date
    }

    print(details)
    return details

@app.route('/images/{image_id}/extract_info',methods=['POST'], cors=True)
def extract_info(image_id):
    comp_lines = []
    b_name = []
    telephone = []
    email = []
    website = []
    address = []
    req = app.current_request.json_body

    file_url = req.get('fileUrl')
    file_data = requests.get(file_url)
    # print("fILE url",file_url)
    if file_data.status_code == 200:
        image_data = file_data.content
        client = vision.ImageAnnotatorClient()

        image = vision.Image(content=image_data)
        response = client.text_detection(image=image)
        texts = response.text_annotations
        # print("Texts",texts)
        if not texts:
            return {'error': 'No text detected in the image.'}, 400

        ner_text = ' '.join([text.description for text in texts])
        # print("NER text",ner_text)
        ner_lines = comprehend_service.detect_entity(ner_text)
        with open(f'{image_id}_extracted_texts.txt', 'w', encoding='utf-8') as f:
                f.write(str(ner_lines))
        labels = ner_lines[0]
        values = ner_lines[1]
        #print(comprehend_line)
        for i in range(len(labels)):
            if labels[i] == 'NAME' or labels[i] == 'PROFESSION':
                b_name.append(values[i])
            elif labels[i] == 'PHONE_OR_FAX':
                telephone.append(values[i])
            elif labels[i] == 'EMAIL':
                email.append(values[i])
            elif labels[i] == 'URL':
                website.append(values[i])
            elif labels[i] == 'ADDRESS':
                address.append(values[i])
        if len(b_name) == 0:
            b_name.append("Name")
        if len(telephone) == 0:
            telephone.append("Name")
        if len(email) == 0:
            email.append("Name")
        if len(website) == 0:
            website.append("Name")
        if len(address) == 0:
            address.append("Name")                
        card_id = str(uuid.uuid4())
        user_id = '100'
        comp_lines = [['card_id','b_name','Telephone','Email','Website','Address','user_id'],[card_id,b_name[0],telephone[0],email[0],website[0],address[0],user_id]]
        # print("========complines========")
        keys = comp_lines[0]  # ['Name', 'Telephone', 'Email', 'Website', 'Address']
        values = comp_lines[1]  # [name, telephone, email, website, address]
        

        comp_dict = dict(zip(keys, values))
        dynamo_service.store_card(comp_dict)

    else:
        return {'error': 'Failed to fetch the file from the provided URL.'}, 400

    if response.error.message:
        raise Exception(f'{response.error.message}')
    
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
    print(user_id)
    print(card_id)
    dynamo_service.delete_card(user_id, card_id)

@app.route('/card/{user_id}/{card_id}', methods=['GET'], cors=True)
def get_card(user_id, card_id):
    return dynamo_service.get_card(user_id, card_id)
