import boto3
import uuid
from boto3.dynamodb.conditions import Attr
from chalicelib.business_card import BusinessCard
from chalicelib.business_card_list import BusinessCardList
from boto3.dynamodb.conditions import Key

class CustomText:
    def __init__(self, items):
        self.items = items

    def insert(self, index, value):
        self.items.insert(index, value)  # Delegate to the list's insert method

    def __repr__(self):
        return repr(self.items)
class DynamoService:
    """Service to manage interaction with AWS DynamoDB
    """

    def __init__(self, table_name):
        """Constructor

        Args:
            table_name (str): Table name in DynamoDB service
        """
        self.table_name = table_name
        self.dynamodb = boto3.resource('dynamodb','ca-central-1')

    def store_card(self, text):
        """Creates a new card record if not already present

        Args:
            text (dict): Card details to be included in the DynamoDB

        Returns:
            bool: Operation result
        """
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table("PackageScan")
        received_date = text.get('received_date')
        b_name = text.get('b_name')
        card_id = text.get('card_id')

        # Check if an item with the same received_date and b_name exists
        response = table.query(
                KeyConditionExpression=Key('card_id').eq(card_id)
            )
            
            # Check if the item exists
        if response['Items']:
                # Check if the existing item matches the received_date and b_name
                for item in response['Items']:
                    if item.get('received_date') == received_date and item.get('b_name') == b_name:
                        print("Item already exists with the same received_date and b_name.")
                        return False 
                    else:

        # If no such item exists, put the new item
                        table.put_item(Item=text)
                        print(f"Created new item with details: {text}")
                        return True

    def update_card(self, text):
        """Updates a new card record

        Args:
            card (BusinessCard): Card to be updated in the DynamoBD

        Returns:
            bool: Operation result
        """
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table("PackageScan")
        print("!!!!!!!!!")
        print(text)
        id_to_update = text['card_id']
        
        key = {'card_id': id_to_update}
        update_expression = 'SET b_name = :b_name, Telephone = :Telephone, Email = :Email, Website = :Website, Address =:Address'
        expression_attribute_values = {':b_name': text['b_name'], ':Telephone': text['Telephone'], ':Email': text['Email'], ':Website':text['Website'], ':Address':text['Address']}

        response = table.update_item(
            Key=key,
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ConditionExpression=Attr('card_id').eq(id_to_update)
        ) 
        return response['ResponseMetadata']['HTTPStatusCode'] == 200

    def delete_card(self, user_id, card_id):
        """Deletes a card record in DynamoDB

        Args:
            user_id (str): User unique identifier
            card_id (str): Card unique identifier

        Returns:
            bool: Operation result, true if card does not exist
        """
        response = self.dynamodb.delete_item(
            TableName=self.table_name,
            Key={'card_id': {'S': card_id}}
        )
        return response['ResponseMetadata']['HTTPStatusCode'] == 200

    def get_card(self, text):
        """Retrieves card information from DynamoDB

        Args:
            user_id (str): User unique identifier
            card_id (str): Card unique identifier

        Returns:
            BusinessCard: Card information, None if card_id does not exists
        """
        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table("PackageScan")
        print(text[0])
        # Create a new item with default values
        if len(text) >= 6:
        # Create a new item with default values
                 item = {
            "card_id": text[0],
            "name": text[1],
            "phone_numbers": text[2],
            "email": text[3],
            "website": text[4],
            "address": text[5]
            }
                 table.put_item(Item=item)
        print(f"Created new item with name {text}")

    def search_cards(self, user_id, filter='', page=1, pagesize=10):
        """Method for searching the cards of a particular user.
        It takes into account the page number and pagesize to retrieve the appropriate elements
        ordering the results first by card names.

        To search all items filter should be None or empty string

        Args:
            user_id (str): User unique identifier
            filter (str, optional): Filter criteria for names, email, company name, website or address. Defaults to None.
            page (int, optional): Page number to retrieve. Defaults to 1.
            pagesize (int, optional): Number of records per page. Defaults to 10.

        Returns:
            BusinessCardList: Object that encapsulates a list of BusinessCard and metadata for pagination purposes
        """
        self.dynamodb = boto3.client('dynamodb')
        self.table_name = self.table_name
        if not user_id:
            raise ValueError('user_id is a mandatory field')

        try:
            if filter:
                # Perform the scan operation with filter criteria
                response = self.dynamodb.scan(
                    TableName=self.table_name,
                    FilterExpression='contains(b_names, :filter) OR '
                                     'contains(Email, :filter) OR '
                                     'contains(Telephone, :filter) OR '
                                     'contains(Website, :filter) OR '
                                     'contains(Address, :filter)',
                    ExpressionAttributeValues={
                        ':filter_criteria': {'S': filter}
                    },
                )
            else:
                # Empty search case - scan the table for items with the specified user_id
                dynamodb = boto3.resource("dynamodb")
                table = dynamodb.Table("PackageScan")
                response = table.scan(
                FilterExpression='user_id = :user_id',
                ExpressionAttributeValues={
                     ':user_id': user_id
                        }
                    )

                items = response.get('Items', [])
                for item in items:
                    print(item)
                
            # Return the scanned items
        
        except Exception as e:
            print(f"Error scanning DynamoDB: {e}")
            return []

        print(items)
        return items
        # return BusinessCardList(response, 1, 10)
