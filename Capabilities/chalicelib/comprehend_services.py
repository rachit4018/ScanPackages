import boto3
name = ''
telephone = []
email = ''
website = ''
address = ''
class ComprehendServices:
    def __init__(self, storage_service):
        self.client = boto3.client('comprehendmedical')
        self.bucket_name = storage_service.get_storage_location()
    def detect_entity(self,name):
        entities = self.client.detect_entities(Text=name)
        #print(entities)
        ent = [e['Type'] for e in entities['Entities']]
        medical_conditions = [e['Text'] for e in entities['Entities']]
        #print(ent)
        #print(medical_conditions)
        return [ent,medical_conditions]