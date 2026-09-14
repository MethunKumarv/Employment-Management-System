import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

client = MongoClient(MONGODB_URL)

db = client["employee_management"]

employees_collection = db["employees"]
counters_collection = db["counters"]
users_collection = db["users"]
users_collection.create_index(
    "username",
    unique=True,
)

try:
    client.admin.command("ping")
    print("MongoDB connection successful!")
except Exception as e:
    print("MongoDB connection failed:", e)