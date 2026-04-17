from pymongo import MongoClient
from app.config.settings import settings

client = MongoClient(settings.mongodb_uri)
db = client.get_default_database()
