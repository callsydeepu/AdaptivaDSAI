import os
from pymongo import MongoClient
from core.config import MONGODB_URL, DATABASE_NAME

class DBProxy:
    def __getattr__(self, name):
        if _db is not None:
            return getattr(_db, name)
        raise AttributeError("MongoDB connection is not active")

    def __getitem__(self, name):
        if _db is not None:
            return _db[name]
        raise KeyError("MongoDB connection is not active")

    def __bool__(self):
        return _db is not None

class DBConnectedProxy:
    def __bool__(self):
        return _db_connected

# Global internal connection states
_client = None
_db = None
_db_connected = False

# Exported proxy singletons
db = DBProxy()
db_connected = DBConnectedProxy()

def connect_db(url=None, dbname=None):
    global _client, _db, _db_connected
    if url is None:
        url = os.getenv("MONGODB_URL", MONGODB_URL)
    if dbname is None:
        dbname = os.getenv("DATABASE_NAME", DATABASE_NAME)
        
    try:
        if url:
            _client = MongoClient(url, serverSelectionTimeoutMS=2000)
            _client.admin.command('ping')
            _db = _client[dbname]
            _db_connected = True
            print(f"Successfully connected to MongoDB database '{dbname}'")
        else:
            _client = None
            _db = None
            _db_connected = False
    except Exception as e:
        print(f"Warning: MongoDB connection failed ({str(e)}). Running in JSON fallback mode.")
        _client = None
        _db = None
        _db_connected = False

# Initial connection trigger
connect_db()

