import os
from pymongo import MongoClient
from core.config import MONGODB_URL, DATABASE_NAME

db_client = None
db = None
db_connected = False

try:
    if MONGODB_URL:
        # Connect to MongoDB with a short 2-second timeout
        db_client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        # Force a connection check (ping)
        db_client.admin.command('ping')
        db = db_client[DATABASE_NAME]
        db_connected = True
        print(f"Successfully connected to MongoDB database '{DATABASE_NAME}'")
except Exception as e:
    print(f"Warning: MongoDB connection failed ({str(e)}). Running in JSON fallback mode.")
    db_client = None
    db = None
    db_connected = False
