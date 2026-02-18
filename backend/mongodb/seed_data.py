"""
Seed data script for the Magical Kenya Open API.

This script populates the database with sample data for testing
and development purposes.
"""

import asyncio
from datetime import datetime, timezone
from typing import Dict, Any

from .connection import get_database, test_connection
import os

if os.environ.get('APP_ENV') == 'production':
    print("Skipping init/seeding in production")

async def seed_sample_players(db) -> Dict[str, Any]:
    """
    Seed sample player data.
    
    Args:
        db: The database instance
        
    Returns:
        dict: Status of seeding operation
    """
    # Check if players already exist
    existing = await db.players.count_documents({})
    if existing > 0:
        return {'status': 'skipped', 'message': 'Players already exist'}
    
    sample_players = [
        {
            "player_id": "player_001",
            "name": "John Doe",
            "country": "Kenya",
            "country_code": "KEN",
            "photo_url": None,
            "world_ranking": 250,
            "bio": "Kenyan professional golfer",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "player_id": "player_002",
            "name": "David Flow",
            "country": "United States",
            "country_code": "USA",
            "photo_url": None,
            "world_ranking": 50,
            "bio": "PGA Tour professional",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "player_id": "player_003",
            "name": "Rory McIlroy",
            "country": "Northern Ireland",
            "country_code": "NIR",
            "photo_url": None,
            "world_ranking": 2,
            "bio": "Multiple major winner",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.players.insert_many(sample_players)
    return {'status': 'success', 'count': len(sample_players)}


async def seed_sample_leaderboard(db) -> Dict[str, Any]:
    """
    Seed sample leaderboard data.
    
    Args:
        db: The database instance
        
    Returns:
        dict: Status of seeding operation
    """
    # Check if leaderboard already has data
    existing = await db.leaderboard.count_documents({})
    if existing > 0:
        return {'status': 'skipped', 'message': 'Leaderboard already has data'}
    
    sample_entries = [
        {
            "entry_id": "entry_001",
            "player_id": "player_001",
            "position": 1,
            "score_to_par": -10,
            "round1": 65,
            "round2": 67,
            "total_score": 132,
            "thru": "F",
            "today": -5,
            "is_cut": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "entry_id": "entry_002",
            "player_id": "player_002",
            "position": 2,
            "score_to_par": -8,
            "round1": 66,
            "round2": 68,
            "total_score": 134,
            "thru": "F",
            "today": -4,
            "is_cut": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "entry_id": "entry_003",
            "player_id": "player_003",
            "position": 3,
            "score_to_par": -5,
            "round1": 68,
            "round2": 69,
            "total_score": 137,
            "thru": "F",
            "today": -3,
            "is_cut": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.leaderboard.insert_many(sample_entries)
    return {'status': 'success', 'count': len(sample_entries)}


async def seed_sample_news(db) -> Dict[str, Any]:
    """
    Seed sample news articles.
    
    Args:
        db: The database instance
        
    Returns:
        dict: Status of seeding operation
    """
    # Check if news articles already exist
    existing = await db.news_articles.count_documents({})
    if existing > 0:
        return {'status': 'skipped', 'message': 'News articles already exist'}
    
    sample_articles = [
        {
            "article_id": "article_001",
            "title": "Magical Kenya Open 2026 Announced",
            "slug": "magical-kenya-open-2026-announced",
            "excerpt": "The prestigious golf tournament returns to Karen Country Club.",
            "content": "<p>The Magical Kenya Open 2026 is set to be one of the most exciting editions yet...</p>",
            "featured_image": None,
            "category": "news",
            "status": "published",
            "author_id": "admin_001",
            "author_name": "Admin",
            "tags": ["tournament", "announcement"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "article_id": "article_002",
            "title": "Top Players Confirmed for MKO 2026",
            "slug": "top-players-confirmed-mko-2026",
            "excerpt": "Several world-ranked players have confirmed their participation.",
            "content": "<p>World-class players are gearing up for the Magical Kenya Open...</p>",
            "featured_image": None,
            "category": "news",
            "status": "published",
            "author_id": "admin_001",
            "author_name": "Admin",
            "tags": ["players", "tournament"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.news_articles.insert_many(sample_articles)
    return {'status': 'success', 'count': len(sample_articles)}


async def seed_sample_sponsors(db) -> Dict[str, Any]:
    """
    Seed sample sponsor data.
    
    Args:
        db: The database instance
        
    Returns:
        dict: Status of seeding operation
    """
    # Check if sponsors already exist
    existing = await db.sponsors.count_documents({})
    if existing > 0:
        return {'status': 'skipped', 'message': 'Sponsors already exist'}
    
    sample_sponsors = [
        {
            "sponsor_id": "sponsor_001",
            "name": "Rolex",
            "tier": 1,
            "logo_url": None,
            "website": "https://www.rolex.com",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "sponsor_id": "sponsor_002",
            "name": "Crown Pines",
            "tier": 2,
            "logo_url": None,
            "website": "https://www.crownpines.com",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "sponsor_id": "sponsor_003",
            "name": "Kenya Airways",
            "tier": 2,
            "logo_url": None,
            "website": "https://www.kenya-airways.com",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.sponsors.insert_many(sample_sponsors)
    return {'status': 'success', 'count': len(sample_sponsors)}


async def seed_all_data() -> Dict[str, Any]:
    """
    Seed all sample data.
    
    Returns:
        dict: Status of all seeding operations
    """
    print("Seeding sample data...")
    
    # Test connection first
    conn_test = await test_connection()
    if not conn_test['success']:
        print(f"Connection failed: {conn_test['message']}")
        return {'success': False, 'error': conn_test['message']}
    
    print(f"Connected to MongoDB: {conn_test['database']}")
    
    db = get_database()
    
    # Seed all data
    results = {}
    
    print("Seeding players...")
    results['players'] = await seed_sample_players(db)
    
    print("Seeding leaderboard...")
    results['leaderboard'] = await seed_sample_leaderboard(db)
    
    print("Seeding news articles...")
    results['news'] = await seed_sample_news(db)
    
    print("Seeding sponsors...")
    results['sponsors'] = await seed_sample_sponsors(db)
    
    return {
        'success': True,
        'results': results
    }


if __name__ == '__main__':
    # Skip seeding in production
    if os.environ.get('APP_ENV') == 'production':
        print("Skipping init/seeding in production")
        result = {'success': True, 'message': 'Production mode - no changes made'}
    else:
        # Run seeding
        result = asyncio.run(seed_all_data())
    print("\nSeeding result:")
    print(result)
