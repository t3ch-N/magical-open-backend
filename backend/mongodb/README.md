# MongoDB Utilities for Magical Kenya Open API

This package provides MongoDB utilities for the Magical Kenya Open API, including connection management, database initialization, and seed data management.

## Installation

The required MongoDB dependencies are already included in the backend requirements:

- `motor` - Async MongoDB driver
- `pymongo` - MongoDB driver

## Configuration

The MongoDB connection is configured via environment variables. Create a `.env` file in the `backend` directory with the following variables:

```
env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=magical_kenya_open
```

## Usage

### Connection Management

```
python
from backend.mongodb import get_database, test_connection, close_connection

# Get database instance
db = get_database()

# Test connection
result = await test_connection()
print(result)

# Close connection (when shutting down)
close_connection()
```

### Database Initialization

To initialize the database with collections and indexes:

```
python
import asyncio
from backend.mongodb import initialize_database

async def init():
    result = await initialize_database()
    print(result)

asyncio.run(init())
```

Or run directly:
```
bash
python -m backend.mongodb.init_db
```

### Seeding Sample Data

To populate the database with sample data for testing:

```
python
import asyncio
from backend.mongodb.seed_data import seed_all_data

async def seed():
    result = await seed_all_data()
    print(result)

asyncio.run(seed())
```

Or run directly:
```
bash
python -m backend.mongodb.seed_data
```

## Available Collections

The database includes the following collections:

### User Management
- `users` - User accounts
- `user_sessions` - User authentication sessions
- `registration_requests` - Role registration requests

### Marshal System
- `marshal_users` - Marshal user accounts
- `marshal_sessions` - Marshal authentication sessions

### Webmaster System
- `webmaster_users` - Webmaster user accounts
- `webmaster_sessions` - Webmaster authentication sessions

### Tournament Data
- `players` - Tournament players
- `leaderboard` - Leaderboard entries
- `tournament_tee_times` - Tee times
- `player_scores` - Player scores
- `player_hole_scores` - Hole-by-hole scores
- `tournaments` - Tournament information
- `tournament_info` - General tournament details
- `tournament_schedule` - Tournament schedule
- `past_winners` - Past tournament winners

### Content Management
- `news_articles` - News articles
- `gallery` - Gallery items
- `sponsors` - Sponsor information
- `board_members` - Board member information

### Ticketing and Enquiries
- `ticket_packages` - Ticket packages
- `enquiries` - Enquiry form submissions
- `contact_messages` - Contact form messages

### Policy Documents
- `policies` - Policy documents

### Volunteer Management
- `volunteers` - Volunteer registrations
- `volunteer_attendance` - Volunteer attendance records

### Marshal Dashboard
- `registration_forms` - Registration forms
- `form_submissions` - Form submissions

### Accreditation System
- `accreditation_modules` - Accreditation modules
- `accreditation_submissions` - Accreditation submissions
- `locations` - Venue locations
- `zones` - Access zones
- `access_levels` - Access level definitions

### Pro-Am System
- `proam_registrations` - Pro-Am registrations
- `proam_tee_times` - Pro-Am tee times
- `proam_settings` - Pro-Am settings

### Audit Logs
- `audit_logs` - System audit logs
- `volunteer_query_presets` - Saved query presets

## ETX API Integration

The leaderboard functionality integrates with the ETX API Premium Plus for live tournament data. The backend already includes the necessary endpoints:

- `/api/leaderboard/live` - Live leaderboard data
- `/api/leaderboard/tee-times` - Tee times
- `/api/leaderboard/player/{player_id}` - Player details

Configure ETX API credentials in your `.env` file:

```
env
ETX_API_KEY=your_api_key
ETX_SUBSCRIPTION_KEY=your_subscription_key
ETX_BASE_URL=https://etx.europeantour.com/premplus
ETX_TOURNAMENT_ID=2019010
```

## License

MIT License
