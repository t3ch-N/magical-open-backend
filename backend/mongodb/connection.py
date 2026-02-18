"""
MongoDB connection utilities for the Magical Kenya Open API.

This module provides:
- Async MongoDB client management
- Database connection helpers
- Connection testing utilities
"""

import os
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Global client instance
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def get_mongo_url() -> str:
    """Get MongoDB connection URL from environment variables."""
    return os.environ.get('MONGO_URL', 'mongodb://localhost:27017')


def get_database_name() -> str:
    """Get database name from environment variables."""
    return os.environ.get('DB_NAME', 'magical_kenya_open')


def get_client() -> AsyncIOMotorClient:
    """
    Get or create the MongoDB client instance.
    
    Returns:
        AsyncIOMotorClient: The MongoDB client instance
    """
    global _client
    
    if _client is None:
        mongo_url = get_mongo_url()
        _client = AsyncIOMotorClient(mongo_url)
    
    return _client


def get_database() -> AsyncIOMotorDatabase:
    """
    Get the MongoDB database instance.
    
    Returns:
        AsyncIOMotorDatabase: The database instance
    """
    global _db
    
    if _db is None:
        client = get_client()
        _db = client[get_database_name()]
    
    return _db


async def test_connection() -> dict:
    """
    Test the MongoDB connection.
    
    Returns:
        dict: Connection status information
    """
    try:
        client = get_client()
        # Ping the database to test connection
        await client.admin.command('ping')
        
        # Get server info
        server_info = await client.server_info()
        
        return {
            'success': True,
            'message': 'MongoDB connection successful',
            'database': get_database_name(),
            'server_version': server_info.get('version', 'unknown'),
            'mongo_url': get_mongo_url().split('@')[-1] if '@' in get_mongo_url() else 'localhost'
        }
    except Exception as e:
        return {
            'success': False,
            'message': f'MongoDB connection failed: {str(e)}',
            'database': get_database_name(),
            'mongo_url': get_mongo_url().split('@')[-1] if '@' in get_mongo_url() else 'localhost'
        }


def close_connection():
    """
    Close the MongoDB connection.
    Should be called when shutting down the application.
    """
    global _client, _db
    
    if _client is not None:
        _client.close()
        _client = None
        _db = None


# For backwards compatibility with server.py
async def init_mongodb():
    """
    Initialize MongoDB connection.
    
    This function is kept for backwards compatibility with server.py
    but the connection is now managed by get_database() and get_client().
    """
    db = get_database()
    await test_connection()
    return db
