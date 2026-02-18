"""
Database initialization script for the Magical Kenya Open API.

This script:
- Creates required collections
- Creates indexes for optimal performance
- Initializes default data
"""

import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any

from .connection import get_database, test_connection
import logging
logging.basicConfig(level=logging.INFO)
logging.info("Initializing database...")
import os


# Collection names used by the application
COLLECTIONS = [
    # User management
    'users',
    'user_sessions',
    'registration_requests',
    
    # Marshal system
    'marshal_users',
    'marshal_sessions',
    
    # Webmaster system
    'webmaster_users',
    'webmaster_sessions',
    
    # Tournament data
    'players',
    'leaderboard',
    'tournament_tee_times',
    'player_scores',
    'player_hole_scores',
    'tournaments',
    'tournament_info',
    'tournament_schedule',
    'past_winners',
    
    # Content management
    'news_articles',
    'gallery',
    'sponsors',
    'board_members',
    
    # Ticketing and enquiries
    'ticket_packages',
    'enquiries',
    'contact_messages',
    
    # Policy documents
    'policies',
    
    # Volunteer management
    'volunteers',
    'volunteer_attendance',
    
    # Marshal dashboard
    'registration_forms',
    'form_submissions',
    
    # Accreditation system
    'accreditation_modules',
    'accreditation_submissions',
    'locations',
    'zones',
    'access_levels',
    
    # Pro-Am system
    'proam_registrations',
    'proam_tee_times',
    'proam_settings',
    
    # Audit logs
    'audit_logs',
    
    # Query presets
    'volunteer_query_presets'
]


# Index definitions for collections
INDEXES = {
    'users': [
        {'keys': [('email', 1)], 'unique': True},
        {'keys': [('user_id', 1)], 'unique': True},
    ],
    'user_sessions': [
        {'keys': [('session_token', 1)], 'unique': True},
        {'keys': [('user_id', 1)]},
        {'keys': [('expires_at', 1)], 'expireAfterSeconds': 0},
    ],
    'registration_requests': [
        {'keys': [('user_id', 1)]},
        {'keys': [('status', 1)]},
    ],
    'marshal_users': [
        {'keys': [('username', 1)], 'unique': True},
        {'keys': [('marshal_id', 1)], 'unique': True},
    ],
    'marshal_sessions': [
        {'keys': [('session_id', 1)], 'unique': True},
        {'keys': [('expires_at', 1)], 'expireAfterSeconds': 0},
    ],
    'players': [
        {'keys': [('player_id', 1)], 'unique': True},
        {'keys': [('country_code', 1)]},
        {'keys': [('is_active', 1)]},
    ],
    'leaderboard': [
        {'keys': [('position', 1)]},
        {'keys': [('player_id', 1)]},
    ],
    'tournaments': [
        {'keys': [('is_current', -1)]},
        {'keys': [('year', -1)]},
    ],
    'news_articles': [
        {'keys': [('status', 1)]},
        {'keys': [('published_at', -1)]},
        {'keys': [('category', 1)]},
    ],
    'gallery': [
        {'keys': [('status', 1)]},
        {'keys': [('published_at', -1)]},
        {'keys': [('content_type', 1)]},
    ],
    'volunteers': [
        {'keys': [('volunteer_id', 1)], 'unique': True},
        {'keys': [('email', 1)]},
        {'keys': [('status', 1)]},
        {'keys': [('role', 1)]},
    ],
    'volunteer_attendance': [
        {'keys': [('volunteer_id', 1), ('date', 1)], 'unique': True},
        {'keys': [('date', 1)]},
    ],
    'registration_forms': [
        {'keys': [('slug', 1)], 'unique': True},
        {'keys': [('is_active', 1)]},
    ],
    'form_submissions': [
        {'keys': [('form_id', 1)]},
        {'keys': [('status', 1)]},
    ],
    'accreditation_submissions': [
        {'keys': [('tournament_id', 1)]},
        {'keys': [('module_id', 1)]},
        {'keys': [('status', 1)]},
    ],
    'proam_registrations': [
        {'keys': [('registration_id', 1)], 'unique': True},
        {'keys': [('email', 1)]},
        {'keys': [('status', 1)]},
    ],
    'audit_logs': [
        {'keys': [('created_at', -1)]},
        {'keys': [('entity_type', 1)]},
        {'keys': [('user_id', 1)]},
    ],
}


async def init_collections(db: AsyncIOMotorDatabase) -> Dict[str, bool]:
    """
    Create all required collections if they don't exist.
    
    Args:
        db: The database instance
        
    Returns:
        dict: Status of each collection creation
    """
    results = {}
    
    for collection_name in COLLECTIONS:
        try:
            # Try to create collection (will fail if exists, which is fine)
            await db.create_collection(collection_name)
            results[collection_name] = True
        except Exception:
            # Collection already exists
            results[collection_name] = False
    
    return results


async def create_indexes(db: AsyncIOMotorDatabase) -> Dict[str, bool]:
    """
    Create indexes for all collections.
    
    Args:
        db: The database instance
        
    Returns:
        dict: Status of index creation
    """
    results = {}
    
    for collection_name, indexes in INDEXES.items():
        try:
            collection = db[collection_name]
            for index_def in indexes:
                keys = index_def.get('keys', [])
                unique = index_def.get('unique', False)
                expire_after = index_def.get('expireAfterSeconds')
                
                index_params = {'unique': unique}
                if expire_after is not None:
                    index_params['expireAfterSeconds'] = expire_after
                
                await collection.create_index(keys, **index_params)
            
            results[collection_name] = True
        except Exception as e:
            print(f"Error creating indexes for {collection_name}: {e}")
            results[collection_name] = False
    
    return results


async def init_default_data(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """
    Initialize default data for the database.
    
    Args:
        db: The database instance
        
    Returns:
        dict: Status of default data initialization
    """
    results = {}
    
    # Check if tournament info exists
    tournament_info = await db.tournament_info.find_one({})
    if not tournament_info:
        default_info = {
            "name": "Magical Kenya Open",
            "year": 2026,
            "dates": "February 19-22, 2026",
            "venue": "Karen Country Club",
            "location": "Nairobi, Kenya",
            "purse": "$2,000,000",
            "defending_champion": "Guido Migliozzi",
            "course_par": 72,
            "course_yards": 6818,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.tournament_info.insert_one(default_info)
        results['tournament_info'] = True
    else:
        results['tournament_info'] = False
    
    # Check if tournament schedule exists
    schedule = await db.tournament_schedule.find_one({})
    if not schedule:
        default_schedule = [
            {"day": "Thursday", "date": "February 19", "event": "Round 1", "time": "07:00 - 18:00"},
            {"day": "Friday", "date": "February 20", "event": "Round 2", "time": "07:00 - 18:00"},
            {"day": "Saturday", "date": "February 21", "event": "Round 3", "time": "08:00 - 17:00"},
            {"day": "Sunday", "date": "February 22", "event": "Final Round", "time": "08:00 - 17:00"}
        ]
        await db.tournament_schedule.insert_many(default_schedule)
        results['tournament_schedule'] = True
    else:
        results['tournament_schedule'] = False
    
    # Check if past winners exist
    winners = await db.past_winners.find_one({})
    if not winners:
        default_winners = [
            {"year": 2025, "winner": "Jacques Kruyswijk", "country": "South Africa", "score": "-17"},
            {"year": 2024, "winner": "Darius van Driel", "country": "Netherlands", "score": "-10"},
            {"year": 2023, "winner": "Jorge Campillo", "country": "Spain", "score": "-18"},
            {"year": 2022, "winner": "Wu Ashun", "country": "China", "score": "-18"},
            {"year": 2021, "winner": "Justin Harding", "country": "South Africa", "score": "-16"},
            {"year": 2019, "winner": "Guido Migliozzi", "country": "Italy", "score": "-23"},
            {"year": 2018, "winner": "Shubhankar Sharma", "country": "India", "score": "-23"},
            {"year": 2017, "winner": "Francesco Molinari", "country": "Italy", "score": "-20"}
        ]
        await db.past_winners.insert_many(default_winners)
        results['past_winners'] = True
    else:
        results['past_winners'] = False
    
    return results


async def initialize_database() -> Dict[str, Any]:
    """
    Main function to initialize the database.
    
    Returns:
        dict: Status of all initialization steps
    """
    if os.environ.get('APP_ENV') == 'production':
        print("Skipping init/seeding in production")
        return {'success': True, 'message': 'Production mode - no changes made'}
    
    print("Initializing database...")
    
    # Test connection first
    conn_test = await test_connection()
    if not conn_test['success']:
        print(f"Connection failed: {conn_test['message']}")
        return {'success': False, 'error': conn_test['message']}
    
    print(f"Connected to MongoDB: {conn_test['database']}")
    
    db = get_database()
    
    # Create collections
    print("Creating collections...")
    collections = await init_collections(db)
    print(f"Collections created: {sum(1 for v in collections.values() if v)}/{len(collections)}")
    
    # Create indexes
    print("Creating indexes...")
    indexes = await create_indexes(db)
    print(f"Indexes created: {sum(1 for v in indexes.values() if v)}/{len(indexes)}")
    
    # Initialize default data
    print("Initializing default data...")
    default_data = await init_default_data(db)
    print(f"Default data initialized: {sum(1 for v in default_data.values() if v)}/{len(default_data)}")
    
    return {
        'success': True,
        'collections': collections,
        'indexes': indexes,
        'default_data': default_data
    }


if __name__ == '__main__':
    # Run initialization
    result = asyncio.run(initialize_database())
    print("\nInitialization result:")
    print(result)
