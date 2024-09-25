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
    def detect_entity(self, name):
        entities = self.client.detect_entities(Text=name)
        print("entities = ", entities)

        filtered_medical_conditions = []
        ent = []
        score = []

        for e in entities['Entities']:
            if e['Type'] != 'ID' or e['Score'] > 0.97:
                filtered_medical_conditions.append(e['Text'])
                ent.append(e['Type'])
                score.append(e['Score'])

        print("******************************")
        print(ent)
        print(filtered_medical_conditions)
        print(score)

        return [ent, filtered_medical_conditions,score]

