"""
MongoDB database utilities for the Magical Kenya Open API.

This package provides utilities for:
- Database connection management
- Database initialization
- Seed data management
"""

from .connection import (
    get_database,
    get_client,
    test_connection,
    close_connection
)

from .init_db import (
    init_collections,
    create_indexes,
    init_default_data
)

__all__ = [
    'get_database',
    'get_client', 
    'test_connection',
    'close_connection',
    'init_collections',
    'create_indexes',
    'init_default_data'
]
