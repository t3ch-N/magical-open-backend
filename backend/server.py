from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
import aiofiles
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import shutil
import bcrypt
import secrets
import io
import csv
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'magical_kenya_open')]

# Create the main app
app = FastAPI(title="Magical Kenya Open API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Create policies directory
POLICIES_DIR = ROOT_DIR / "policies"
POLICIES_DIR.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== ETX API CONFIGURATION =====================
ETX_API_KEY = os.environ.get('ETX_API_KEY', '')
ETX_SUBSCRIPTION_KEY = os.environ.get('ETX_SUBSCRIPTION_KEY', '')
ETX_BASE_URL = os.environ.get('ETX_BASE_URL', 'https://etx.europeantour.com/premplus')
ETX_TOURNAMENT_ID = os.environ.get('ETX_TOURNAMENT_ID', '')  # MKO Tournament ID (e.g., 2019010)

# In-memory cache for ETX API responses
etx_cache = {
    'leaderboard': {'data': None, 'expires': None},
    'tee_times': {'data': None, 'expires': None},
    'players': {}  # player_id -> {'data': None, 'expires': None}
}
ETX_CACHE_TTL = 20  # seconds

def is_etx_configured():
    """Check if ETX API credentials are configured"""
    return bool(ETX_API_KEY and ETX_SUBSCRIPTION_KEY and ETX_BASE_URL)

async def fetch_from_etx(endpoint: str, params: dict = None) -> dict:
    """Fetch data from ETX API with proper headers"""
    if not is_etx_configured():
        return None
    
    headers = {
        'Ocp-Apim-Subscription-Key': ETX_SUBSCRIPTION_KEY,
        'x-api-key': ETX_API_KEY,
        'Accept': 'application/json'
    }
    
    url = f"{ETX_BASE_URL}{endpoint}"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"ETX API HTTP error: {e.response.status_code} - {e.response.text}")
        return None
    except httpx.RequestError as e:
        logger.error(f"ETX API request error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"ETX API unexpected error: {str(e)}")
        return None

def get_cached_data(cache_key: str, player_id: str = None):
    """Get data from cache if not expired"""
    now = datetime.now(timezone.utc)
    
    if player_id:
        player_cache = etx_cache['players'].get(player_id)
        if player_cache and player_cache['expires'] and player_cache['expires'] > now:
            return player_cache['data']
    else:
        cache_entry = etx_cache.get(cache_key)
        if cache_entry and cache_entry['expires'] and cache_entry['expires'] > now:
            return cache_entry['data']
    
    return None

def set_cached_data(cache_key: str, data: any, player_id: str = None):
    """Store data in cache with TTL"""
    expires = datetime.now(timezone.utc) + timedelta(seconds=ETX_CACHE_TTL)
    
    if player_id:
        etx_cache['players'][player_id] = {'data': data, 'expires': expires}
    else:
        etx_cache[cache_key] = {'data': data, 'expires': expires}

# ===================== EMAIL CONFIG =====================
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.environ.get('SMTP_FROM_EMAIL', SMTP_USER)
SMTP_FROM_NAME = os.environ.get('SMTP_FROM_NAME', 'Magical Kenya Open')

async def send_email(to_email: str, subject: str, html_content: str, plain_content: str = None):
    """Send email via Gmail SMTP"""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured - email not sent")
        return False
    
    try:
        message = MIMEMultipart("alternative")
        message["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message["To"] = to_email
        message["Subject"] = subject
        
        # Add plain text version
        if plain_content:
            part1 = MIMEText(plain_content, "plain")
            message.attach(part1)
        
        # Add HTML version
        part2 = MIMEText(html_content, "html")
        message.attach(part2)
        
        await aiosmtplib.send(
            message,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASSWORD
        )
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

async def send_approval_email(user_email: str, user_name: str, role: str):
    """Send approval notification email"""
    subject = "Your Magical Kenya Open Registration Has Been Approved!"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1a472a; color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; background: #fdfbf7; }}
            .badge {{ display: inline-block; background: #e31937; color: white; padding: 5px 15px; font-size: 12px; text-transform: uppercase; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
            .btn {{ display: inline-block; background: #1a472a; color: white; padding: 12px 30px; text-decoration: none; margin-top: 20px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Magical Kenya Open 2026</h1>
            </div>
            <div class="content">
                <span class="badge">Registration Approved</span>
                <h2>Congratulations, {user_name}!</h2>
                <p>Your registration for the <strong>Magical Kenya Open 2026</strong> has been approved.</p>
                <p><strong>Role:</strong> {role.replace('_', ' ').title()}</p>
                <p>You now have access to the restricted areas of our website based on your role. Log in to access exclusive content and resources.</p>
                <p><strong>Event Details:</strong></p>
                <ul>
                    <li>Date: February 19-22, 2026</li>
                    <li>Venue: Karen Country Club, Nairobi</li>
                </ul>
                <p>We look forward to seeing you at the tournament!</p>
            </div>
            <div class="footer">
                <p>Kenya Open Golf Limited | Nairobi, Kenya</p>
                <p>info@magicalkenyaopen.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    Congratulations, {user_name}!
    
    Your registration for the Magical Kenya Open 2026 has been approved.
    
    Role: {role.replace('_', ' ').title()}
    
    You now have access to the restricted areas of our website based on your role.
    
    Event Details:
    - Date: February 19-22, 2026
    - Venue: Karen Country Club, Nairobi
    
    We look forward to seeing you at the tournament!
    
    ---
    Kenya Open Golf Limited
    info@magicalkenyaopen.com
    """
    
    return await send_email(user_email, subject, html_content, plain_content)

async def send_rejection_email(user_email: str, user_name: str, role: str):
    """Send rejection notification email"""
    subject = "Update on Your Magical Kenya Open Registration"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #1a472a; color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; background: #fdfbf7; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Magical Kenya Open 2026</h1>
            </div>
            <div class="content">
                <h2>Dear {user_name},</h2>
                <p>Thank you for your interest in the Magical Kenya Open 2026.</p>
                <p>After careful review, we regret to inform you that we are unable to approve your registration as <strong>{role.replace('_', ' ').title()}</strong> at this time.</p>
                <p>This may be due to limited availability or incomplete documentation. If you believe this was an error or would like more information, please contact our team.</p>
                <p>We appreciate your understanding and encourage you to attend the tournament as a spectator. Tickets are available on our website.</p>
            </div>
            <div class="footer">
                <p>Kenya Open Golf Limited | Nairobi, Kenya</p>
                <p>info@magicalkenyaopen.com</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    Dear {user_name},
    
    Thank you for your interest in the Magical Kenya Open 2026.
    
    After careful review, we regret to inform you that we are unable to approve your registration as {role.replace('_', ' ').title()} at this time.
    
    This may be due to limited availability or incomplete documentation. If you believe this was an error or would like more information, please contact our team.
    
    We appreciate your understanding and encourage you to attend the tournament as a spectator.
    
    ---
    Kenya Open Golf Limited
    info@magicalkenyaopen.com
    """
    
    return await send_email(user_email, subject, html_content, plain_content)

# ===================== ENUMS =====================
class UserRole(str, Enum):
    ADMIN = "admin"
    MEDIA = "media"
    VOLUNTEER = "volunteer"
    VENDOR = "vendor"
    JUNIOR_GOLF = "junior_golf"
    PUBLIC = "public"

class RoleStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ContentStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"

class ContentType(str, Enum):
    NEWS = "news"
    PHOTO = "photo"
    VIDEO = "video"

# ===================== MODELS =====================
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.PUBLIC
    role_status: RoleStatus = RoleStatus.PENDING
    requested_role: Optional[UserRole] = None
    organization: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    role_status: Optional[RoleStatus] = None
    organization: Optional[str] = None
    phone: Optional[str] = None

class RegistrationRequest(BaseModel):
    requested_role: UserRole
    organization: Optional[str] = None
    phone: Optional[str] = None
    reason: Optional[str] = None

class Player(BaseModel):
    player_id: str = Field(default_factory=lambda: f"player_{uuid.uuid4().hex[:12]}")
    name: str
    country: str
    country_code: str
    photo_url: Optional[str] = None
    world_ranking: Optional[int] = None
    bio: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaderboardEntry(BaseModel):
    entry_id: str = Field(default_factory=lambda: f"entry_{uuid.uuid4().hex[:12]}")
    player_id: str
    position: int
    score_to_par: int
    round1: Optional[int] = None
    round2: Optional[int] = None
    round3: Optional[int] = None
    round4: Optional[int] = None
    total_score: int
    thru: str = "F"
    today: Optional[int] = None
    is_cut: bool = False
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NewsArticle(BaseModel):
    article_id: str = Field(default_factory=lambda: f"article_{uuid.uuid4().hex[:12]}")
    title: str
    slug: str
    excerpt: str
    content: str
    featured_image: Optional[str] = None
    category: str = "news"
    status: ContentStatus = ContentStatus.DRAFT
    author_id: str
    author_name: str
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None

class NewsArticleCreate(BaseModel):
    title: str
    excerpt: str
    content: str
    featured_image: Optional[str] = None
    category: str = "news"
    tags: List[str] = []

class GalleryItem(BaseModel):
    item_id: str = Field(default_factory=lambda: f"gallery_{uuid.uuid4().hex[:12]}")
    title: str
    description: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    content_type: ContentType = ContentType.PHOTO
    category: str = "general"
    status: ContentStatus = ContentStatus.DRAFT
    author_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None

class GalleryItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    content_type: ContentType = ContentType.PHOTO
    category: str = "general"

class TicketPackage(BaseModel):
    package_id: str = Field(default_factory=lambda: f"pkg_{uuid.uuid4().hex[:12]}")
    name: str
    description: str
    price_range: str
    features: List[str]
    category: str  # "daily", "weekly", "hospitality"
    image_url: Optional[str] = None
    booking_url: Optional[str] = None
    is_available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnquiryForm(BaseModel):
    enquiry_id: str = Field(default_factory=lambda: f"enq_{uuid.uuid4().hex[:12]}")
    name: str
    email: str
    phone: Optional[str] = None
    enquiry_type: str  # "tickets", "hospitality", "media", "general"
    package_id: Optional[str] = None
    message: str
    status: str = "new"  # new, contacted, resolved
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EnquiryFormCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    enquiry_type: str
    package_id: Optional[str] = None
    message: str

class ContactMessage(BaseModel):
    message_id: str = Field(default_factory=lambda: f"msg_{uuid.uuid4().hex[:12]}")
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

# ===================== VOLUNTEER MODELS =====================
class VolunteerAvailability(str, Enum):
    ALL_DAY = "all_day"
    MORNING = "morning"
    AFTERNOON = "afternoon"
    NOT_AVAILABLE = "not_available"

class VolunteerRole(str, Enum):
    MARSHAL = "marshal"
    SCORER = "scorer"

class VolunteerStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class VolunteerRegistration(BaseModel):
    volunteer_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    nationality: str
    identification_number: str
    golf_club: Optional[str] = None
    email: str
    phone: str
    role: VolunteerRole
    volunteered_before: bool = False
    availability_thursday: VolunteerAvailability = VolunteerAvailability.NOT_AVAILABLE
    availability_friday: VolunteerAvailability = VolunteerAvailability.NOT_AVAILABLE
    availability_saturday: VolunteerAvailability = VolunteerAvailability.NOT_AVAILABLE
    availability_sunday: VolunteerAvailability = VolunteerAvailability.NOT_AVAILABLE
    photo_attached: bool = False
    consent_given: bool = False
    status: VolunteerStatus = VolunteerStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    # Assignment fields
    assigned_location: Optional[str] = None
    assigned_supervisor: Optional[str] = None
    assigned_shifts: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class VolunteerRegistrationCreate(BaseModel):
    first_name: str
    last_name: str
    nationality: str
    identification_number: str
    golf_club: str  # Made mandatory
    email: str
    phone: str
    role: str
    volunteered_before: bool = False
    availability_thursday: str = "not_available"
    availability_friday: str = "not_available"
    availability_saturday: str = "not_available"
    availability_sunday: str = "not_available"
    photo_attached: bool = False
    consent_given: bool = True

class VolunteerUpdate(BaseModel):
    status: Optional[str] = None
    assigned_location: Optional[str] = None
    assigned_supervisor: Optional[str] = None
    assigned_shifts: Optional[List[str]] = None
    notes: Optional[str] = None

# ===================== MARSHAL AUTH MODELS =====================
class MarshalRole(str, Enum):
    CHIEF_MARSHAL = "chief_marshal"
    CIO = "cio"
    TOURNAMENT_DIRECTOR = "tournament_director"
    OPERATIONS_MANAGER = "operations_manager"
    AREA_SUPERVISOR = "area_supervisor"
    ADMIN = "admin"
    COORDINATOR = "coordinator"
    VIEWER = "viewer"

class MarshalUser(BaseModel):
    marshal_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    full_name: str
    role: MarshalRole
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class MarshalUserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    role: str

class MarshalUserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # Optional password reset

class MarshalLogin(BaseModel):
    username: str
    password: str

class MarshalSession(BaseModel):
    session_id: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    marshal_id: str
    username: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(hours=8))

# ===================== ATTENDANCE MODELS =====================
class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"

class AttendanceRecord(BaseModel):
    attendance_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    volunteer_id: str
    date: str  # YYYY-MM-DD format
    status: AttendanceStatus
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    marked_by: str  # marshal_id who marked
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===================== DYNAMIC FORM BUILDER MODELS =====================
class FormFieldType(str, Enum):
    TEXT = "text"
    EMAIL = "email"
    PHONE = "phone"
    NUMBER = "number"
    SELECT = "select"
    MULTISELECT = "multiselect"
    CHECKBOX = "checkbox"
    TEXTAREA = "textarea"
    DATE = "date"
    FILE = "file"

class FormField(BaseModel):
    field_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Internal field name (snake_case)
    label: str  # Display label
    field_type: str
    required: bool = False
    is_active: bool = True
    options: List[str] = Field(default_factory=list)  # For select/multiselect
    placeholder: Optional[str] = None
    help_text: Optional[str] = None
    validation_regex: Optional[str] = None
    order: int = 0

class RegistrationForm(BaseModel):
    form_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "Volunteer Registration", "Media Accreditation"
    slug: str  # URL-friendly name
    description: Optional[str] = None
    fields: List[FormField] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None

class FormSubmission(BaseModel):
    submission_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    form_id: str
    form_slug: str
    data: Dict[str, Any]  # Dynamic field data
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

# ===================== MULTI-TOURNAMENT MODELS =====================
class Tournament(BaseModel):
    tournament_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "Magical Kenya Open 2026"
    code: str  # e.g., "MKO2026"
    year: int
    start_date: str  # YYYY-MM-DD
    end_date: str
    venue: str
    is_active: bool = True
    is_current: bool = False  # Only one tournament can be current
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===================== UNIFIED ACCREDITATION ENGINE MODELS =====================
class AccreditationModuleType(str, Enum):
    VOLUNTEERS = "volunteers"
    VENDORS = "vendors"
    MEDIA = "media"
    PRO_AM = "pro_am"
    PROCUREMENT = "procurement"
    JOBS = "jobs"

class AccreditationModule(BaseModel):
    module_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    module_type: str  # volunteers, vendors, media, pro_am, procurement, jobs
    name: str
    slug: str
    description: Optional[str] = None
    form_id: Optional[str] = None  # Links to registration_forms
    is_active: bool = True
    is_public: bool = True  # Whether public can apply
    settings: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ASSIGNED = "assigned"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class AccreditationSubmission(BaseModel):
    submission_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    module_id: str
    module_type: str
    form_data: Dict[str, Any]
    status: str = "submitted"
    assigned_location_id: Optional[str] = None
    assigned_zone_id: Optional[str] = None
    assigned_access_level_id: Optional[str] = None
    assigned_shifts: List[str] = Field(default_factory=list)
    reviewer_id: Optional[str] = None
    reviewer_notes: Optional[str] = None
    attachments: List[Dict[str, str]] = Field(default_factory=list)  # [{filename, url, type}]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

# ===================== LOCATION/ZONE/ACCESS MODELS =====================
class Location(BaseModel):
    location_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    name: str  # e.g., "Karen Country Club", "Media Center", "Hole 1"
    code: str  # e.g., "KCC", "MC", "H1"
    location_type: str  # venue, area, hole, facility
    parent_location_id: Optional[str] = None  # For hierarchical locations
    capacity: Optional[int] = None
    description: Optional[str] = None
    coordinates: Optional[Dict[str, float]] = None  # {lat, lng}
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Zone(BaseModel):
    zone_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    location_id: str
    name: str  # e.g., "VIP Area", "Player Lounge", "Press Room"
    code: str
    zone_type: str  # restricted, public, vip, media, service
    description: Optional[str] = None
    required_access_level_ids: List[str] = Field(default_factory=list)
    capacity: Optional[int] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccessLevel(BaseModel):
    access_level_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    name: str  # e.g., "All Access", "Media Only", "General Public"
    code: str  # e.g., "AA", "MED", "GP"
    tier: int  # 1 = highest access, 10 = lowest
    color: Optional[str] = None  # For badge color coding
    description: Optional[str] = None
    allowed_zone_ids: List[str] = Field(default_factory=list)
    allowed_module_types: List[str] = Field(default_factory=list)  # Which modules can have this access
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AccessMapping(BaseModel):
    mapping_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    module_type: str
    access_level_id: str
    is_default: bool = False  # Default access level for this module
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===================== AUDIT TRAIL MODEL =====================
class AuditLog(BaseModel):
    log_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: Optional[str] = None
    user_id: str
    username: str
    action: str  # create, update, delete, approve, reject, assign, login, logout
    entity_type: str  # submission, location, zone, user, etc.
    entity_id: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ===================== AUTH HELPERS =====================
async def get_session_from_request(request: Request) -> Optional[dict]:
    """Extract and validate session from cookies or Authorization header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        return None
    
    # Check expiry
    expires_at = session_doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        return None
    
    return session_doc

async def get_current_user(request: Request) -> Optional[User]:
    """Get current authenticated user"""
    session = await get_session_from_request(request)
    if not session:
        return None
    
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        return None
    
    return User(**user_doc)

async def require_auth(request: Request) -> User:
    """Dependency that requires authentication"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user

async def require_admin(request: Request) -> User:
    """Dependency that requires admin role"""
    user = await require_auth(request)
    if user.role != UserRole.ADMIN or user.role_status != RoleStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===================== MARSHAL AUTH HELPERS =====================
def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

async def get_marshal_session(request: Request) -> Optional[dict]:
    """Get marshal session from cookie or header"""
    session_token = request.cookies.get("marshal_session")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session = await db.marshal_sessions.find_one({"session_id": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.marshal_sessions.delete_one({"session_id": session_token})
        return None
    
    return session

async def require_marshal_auth(request: Request) -> dict:
    """Require marshal authentication"""
    session = await get_marshal_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    return session

async def require_marshal_role(request: Request, allowed_roles: List[str]) -> dict:
    """Require specific marshal roles"""
    session = await require_marshal_auth(request)
    if session["role"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return session

# ===================== WEBMASTER AUTH =====================
async def get_webmaster_session(request: Request) -> Optional[dict]:
    """Get webmaster session from cookie or header"""
    session_token = request.cookies.get("webmaster_session")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    session = await db.webmaster_sessions.find_one({"session_id": session_token}, {"_id": 0})
    if not session:
        return None
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        await db.webmaster_sessions.delete_one({"session_id": session_token})
        return None
    
    return session

async def require_webmaster_auth(request: Request) -> dict:
    """Require webmaster authentication"""
    session = await get_webmaster_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Authentication required")
    return session

# ===================== AUTH ROUTES =====================
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client_http:
        auth_response = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    auth_data = auth_response.json()
    email = auth_data.get("email")
    name = auth_data.get("name")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": UserRole.PUBLIC.value,
            "role_status": RoleStatus.PENDING.value,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    # Get updated user
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def get_me(request: Request):
    """Get current user data"""
    user = await get_current_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session = await get_session_from_request(request)
    if session:
        await db.user_sessions.delete_one({"session_token": session["session_token"]})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@api_router.post("/auth/request-role")
async def request_role(request: Request, reg: RegistrationRequest):
    """Request a specific role (media, volunteer, vendor, junior_golf)"""
    user = await require_auth(request)
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "requested_role": reg.requested_role.value,
            "organization": reg.organization,
            "phone": reg.phone,
            "role_status": RoleStatus.PENDING.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create registration request record
    await db.registration_requests.insert_one({
        "request_id": f"req_{uuid.uuid4().hex[:12]}",
        "user_id": user.user_id,
        "requested_role": reg.requested_role.value,
        "organization": reg.organization,
        "phone": reg.phone,
        "reason": reg.reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Role request submitted successfully"}

# ===================== ADMIN ROUTES =====================
@api_router.get("/admin/users")
async def get_all_users(request: Request, role: Optional[str] = None, status: Optional[str] = None):
    """Get all users (admin only)"""
    await require_admin(request)
    
    query = {}
    if role:
        query["role"] = role
    if status:
        query["role_status"] = status
    
    users = await db.users.find(query, {"_id": 0}).to_list(1000)
    return users

@api_router.get("/admin/registration-requests")
async def get_registration_requests(request: Request, status: Optional[str] = "pending"):
    """Get registration requests (admin only)"""
    await require_admin(request)
    
    query = {"status": status} if status else {}
    requests = await db.registration_requests.find(query, {"_id": 0}).to_list(1000)
    return requests

@api_router.put("/admin/users/{user_id}/approve")
async def approve_user(request: Request, user_id: str, background_tasks: BackgroundTasks):
    """Approve user role request (admin only)"""
    await require_admin(request)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    requested_role = user_doc.get("requested_role", UserRole.PUBLIC.value)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "role": requested_role,
            "role_status": RoleStatus.APPROVED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.registration_requests.update_one(
        {"user_id": user_id, "status": "pending"},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send approval email in background
    background_tasks.add_task(
        send_approval_email,
        user_doc.get("email"),
        user_doc.get("name", "User"),
        requested_role
    )
    
    return {"message": "User approved successfully"}

@api_router.put("/admin/users/{user_id}/reject")
async def reject_user(request: Request, user_id: str, background_tasks: BackgroundTasks):
    """Reject user role request (admin only)"""
    await require_admin(request)
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    requested_role = user_doc.get("requested_role", UserRole.PUBLIC.value)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {
            "role_status": RoleStatus.REJECTED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await db.registration_requests.update_one(
        {"user_id": user_id, "status": "pending"},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send rejection email in background
    background_tasks.add_task(
        send_rejection_email,
        user_doc.get("email"),
        user_doc.get("name", "User"),
        requested_role
    )
    
    return {"message": "User rejected"}

@api_router.put("/admin/users/{user_id}")
async def update_user(request: Request, user_id: str, update: UserUpdate):
    """Update user details (admin only)"""
    await require_admin(request)
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"user_id": user_id}, {"$set": update_data})
    
    return {"message": "User updated successfully"}

# ===================== LEADERBOARD ROUTES =====================
@api_router.get("/players")
async def get_players(active_only: bool = True):
    """Get all players"""
    query = {"is_active": True} if active_only else {}
    players = await db.players.find(query, {"_id": 0}).to_list(1000)
    return players

@api_router.get("/players/{player_id}")
async def get_player(player_id: str):
    """Get single player"""
    player = await db.players.find_one({"player_id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player

@api_router.get("/leaderboard")
async def get_leaderboard():
    """Get current leaderboard"""
    entries = await db.leaderboard.find({}, {"_id": 0}).sort("position", 1).to_list(1000)
    
    # Enrich with player data
    for entry in entries:
        player = await db.players.find_one({"player_id": entry["player_id"]}, {"_id": 0})
        if player:
            entry["player_name"] = player.get("name")
            entry["country"] = player.get("country")
            entry["country_code"] = player.get("country_code")
            entry["photo_url"] = player.get("photo_url")
    
    return entries

# ===================== ETX LIVE LEADERBOARD API =====================
@api_router.get("/leaderboard/live")
async def get_live_leaderboard(
    round_num: Optional[int] = None,
    country: Optional[str] = None,
    top: Optional[int] = None
):
    cached = get_cached_data('leaderboard')
    
    if cached is None and is_etx_configured():
        etx_data = await fetch_from_etx(f"/inplay/leaderboard/{ETX_TOURNAMENT_ID}")
        if etx_data:
            leaderboard = transform_etx_leaderboard(etx_data)
            set_cached_data('leaderboard', leaderboard)
            cached = leaderboard
        else:
            logger.warning("ETX leaderboard fetch failed")
    
    if cached is None:
        # Fallback logic (unchanged, but add rankings if in local db)
        logger.info("Using local leaderboard data")
        entries = await db.leaderboard.find({}, {"_id": 0}).sort("position", 1).to_list(1000)
        for entry in entries:
            player = await db.players.find_one({"player_id": entry["player_id"]}, {"_id": 0})
            if player:
                entry.update({
                    "player_name": player.get("name"),
                    "country": player.get("country"),
                    "country_code": player.get("country_code"),
                    "photo_url": player.get("photo_url"),
                    "owgr": player.get("world_ranking"),
                    "r2dr": player.get("r2dr") # Add if you store these in db.players
                })
        cached = {'source': 'local', 'updated_at': datetime.now(timezone.utc).isoformat(), 'entries': entries}
    
    entries = cached.get('entries', [])
    
    # Filters (unchanged)
    if country:
        entries = [e for e in entries if e.get("country_code", "").upper() == country.upper()]
    if round_num:
        entries = [e for e in entries if e.get("current_round") == round_num] # Assume field exists; add if needed
    if top:
        entries = entries[:top]
    
    for entry in entries:
        entry["is_kenyan"] = entry.get("country_code", "").upper() == "KEN"
    
    return {
        "source": cached['source'],
        "updated_at": cached['updated_at'],
        "tournament_id": ETX_TOURNAMENT_ID,
        "filters_applied": {"round": round_num, "country": country, "top": top},
        "total_count": len(entries),
        "entries": entries
    }

@api_router.get("/leaderboard/tee-times")
async def get_tee_times(
    round_num: Optional[int] = Query(1, ge=1, le=4),
    date: Optional[str] = None
):
    cache_key = f"tee_times_r{round_num}"
    
    # Check cache
    cached = get_cached_data('tee_times')
    
    if cached is None and is_etx_configured():
        # Fetch from ETX API
        params = {"round": round_num}
        if date:
            params["date"] = date
        
        etx_data = await fetch_from_etx(f"/event/teetimes/{ETX_TOURNAMENT_ID}/{round_num}", params)
        
        if etx_data:
            tee_times = transform_etx_tee_times(etx_data)
            set_cached_data('tee_times', tee_times)
            cached = tee_times
    
    # Fallback to local database
    if cached is None:
        logger.info("ETX unavailable, using local tee times data")
        
        # Get tee times from local database
        query = {}
        if round_num:
            query["round"] = round_num
        
        tee_times = await db.tournament_tee_times.find(query, {"_id": 0}).sort("tee_time", 1).to_list(500)
        
        # Mark Kenyan players
        for tt in tee_times:
            players = tt.get("players", [])
            for p in players:
                p["is_kenyan"] = p.get("country_code", "").upper() == "KEN"
        
        cached = {
            "source": "local",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "round": round_num,
            "tee_times": tee_times
        }
    
    return {
        "source": cached.get("source", "etx") if isinstance(cached, dict) else "etx",
        "updated_at": cached.get("updated_at", datetime.now(timezone.utc).isoformat()) if isinstance(cached, dict) else datetime.now(timezone.utc).isoformat(),
        "tournament_id": ETX_TOURNAMENT_ID or "mko-2025",
        "round": round_num,
        "date": date,
        "tee_times": cached.get("tee_times", []) if isinstance(cached, dict) else cached
    }

@api_router.get("/leaderboard/player/{player_id}")
async def get_player_details(player_id: str):
    """
    Get detailed player information and scores from ETX API.
    Falls back to local database if ETX is unavailable.
    """
    # Check cache
    cached = get_cached_data('players', player_id=player_id)
    
    if cached is None and is_etx_configured():
        # Fetch from ETX API
        etx_data = await fetch_from_etx(f"/players/{player_id}")
        
        if etx_data:
            player_data = transform_etx_player(etx_data)
            
            # Also fetch player's tournament scores
            scores_data = await fetch_from_etx(f"/tournaments/{ETX_TOURNAMENT_ID}/players/{player_id}/scores")
            if scores_data:
                player_data["tournament_scores"] = transform_etx_scores(scores_data)
            
            set_cached_data('players', player_data, player_id=player_id)
            cached = player_data
    
    # Fallback to local database
    if cached is None:
        logger.info(f"ETX unavailable, using local player data for {player_id}")
        
        # Try to find player in local database
        player = await db.players.find_one({"player_id": player_id}, {"_id": 0})
        
        if not player:
            # Try by ETX ID
            player = await db.players.find_one({"etx_id": player_id}, {"_id": 0})
        
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        
        # Get player's leaderboard entry
        leaderboard_entry = await db.leaderboard.find_one({"player_id": player_id}, {"_id": 0})
        
        # Get round-by-round scores if available
        scores = await db.player_scores.find({"player_id": player_id}, {"_id": 0}).sort("round", 1).to_list(4)
        
        player["is_kenyan"] = player.get("country_code", "").upper() == "KEN"
        
        cached = {
            "source": "local",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "player": player,
            "current_position": leaderboard_entry.get("position") if leaderboard_entry else None,
            "current_score": leaderboard_entry.get("score_to_par") if leaderboard_entry else None,
            "round_scores": scores
        }
    
    return cached

@api_router.get("/leaderboard/player/{player_id}/hole-scores")
async def get_player_hole_scores(player_id: str, round_num: Optional[int] = Query(None, ge=1, le=4)):
    """Get hole-by-hole scores for a player (per round or all)."""
    cached_key = f"hole_scores_{player_id}_r{round_num or 'all'}"
    cached = get_cached_data(cached_key)  # Extend caching if needed
    
    if cached is None and is_etx_configured():
        params = {'round': round_num} if round_num else {}
        etx_data = await fetch_from_etx(f"/inplay/holebyhole/{ETX_TOURNAMENT_ID}/{round_num or 1}", params)
        if etx_data:
            # Assume etx_data['holes'] = [{'hole':1, 'par':4, 'score':3, 'putts':2}, ...]
            hole_scores = etx_data.get('holes', [])
            cached = {'source': 'etx', 'updated_at': datetime.now(timezone.utc).isoformat(), 'hole_scores': hole_scores}
            set_cached_data(cached_key, cached)
    
    if cached is None:
        # Fallback: Assume db.player_hole_scores collection; implement if needed
        query = {"player_id": player_id}
        if round_num: query["round"] = round_num
        hole_scores = await db.player_hole_scores.find(query, {"_id": 0}).to_list(18)
        cached = {'source': 'local', 'updated_at': datetime.now(timezone.utc).isoformat(), 'hole_scores': hole_scores}
    
    return cached

@api_router.get("/leaderboard/status")
async def get_tournament_status():
    """Get tournament status (current round, cut line, etc.)."""
    if is_etx_configured():
        etx_data = await fetch_from_etx(f"/event/status/{ETX_TOURNAMENT_ID}")
        if etx_data:
            return {
                'current_round': etx_data.get('CurrentRound', 1),
                'cut_line': etx_data.get('CutValue', 0),
                'status': etx_data.get('Status', 'In Progress'),
                'source': 'etx'
            }
    # Fallback
    return {'current_round': 4, 'cut_line': '+2', 'status': 'Completed', 'source': 'local'}  # Mock; store in db

@api_router.get("/leaderboard/kenyan-players")
async def get_kenyan_players():
    """
    Get all Kenyan players in the tournament with their current standings.
    Convenience endpoint for highlighting local players.
    """
    # Get live leaderboard first
    leaderboard_response = await get_live_leaderboard(country="KEN")
    
    kenyan_entries = leaderboard_response.get("entries", [])
    
    # Get additional player details for each Kenyan player
    detailed_players = []
    for entry in kenyan_entries:
        player_id = entry.get("player_id") or entry.get("etx_player_id")
        if player_id:
            try:
                player_details = await get_player_details(player_id)
                detailed_players.append({
                    **entry,
                    "details": player_details
                })
            except:
                detailed_players.append(entry)
        else:
            detailed_players.append(entry)
    
    return {
        "source": leaderboard_response.get("source", "local"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "tournament_id": ETX_TOURNAMENT_ID or "mko-2025",
        "kenyan_player_count": len(detailed_players),
        "players": detailed_players
    }

@api_router.get("/leaderboard/status")
async def get_leaderboard_status():
    """
    Get the status of ETX API integration and data freshness.
    """
    etx_configured = is_etx_configured()
    
    # Check cache status
    cache_status = {}
    now = datetime.now(timezone.utc)
    
    for key in ['leaderboard', 'tee_times']:
        entry = etx_cache.get(key, {})
        if entry.get('expires'):
            cache_status[key] = {
                "cached": entry.get('data') is not None,
                "expires_in_seconds": max(0, (entry['expires'] - now).total_seconds()) if entry.get('data') else 0
            }
        else:
            cache_status[key] = {"cached": False, "expires_in_seconds": 0}
    
    cache_status["players_cached"] = len(etx_cache.get('players', {}))
    
    return {
        "etx_configured": etx_configured,
        "etx_base_url": ETX_BASE_URL if etx_configured else None,
        "tournament_id": ETX_TOURNAMENT_ID if etx_configured else None,
        "cache_ttl_seconds": ETX_CACHE_TTL,
        "cache_status": cache_status,
        "fallback_available": True,
        "timestamp": now.isoformat()
    }

# ===================== ETX DATA TRANSFORMERS =====================
def transform_etx_leaderboard(etx_data: dict) -> dict:
    """Transform ETX leaderboard response to our format"""
    entries = []
    
    # Handle various ETX response formats
    raw_entries = etx_data.get("leaderboard", etx_data.get("entries", etx_data.get("players", [])))
    
    for idx, item in enumerate(raw_entries):
        entry = {
            "position": item.get("Position", item.get("pos", idx + 1)),
            "player_id": item.get("PlayerId", item.get("player_id", str(uuid.uuid4()))),
            "etx_player_id": item.get("PlayerId", item.get("id")),
            "player_name": item.get("PlayerName", item.get("name", item.get("FirstName", "") + " " + item.get("LastName", ""))).strip(),
            "country": item.get("Country", item.get("nationality", "")),
            "country_code": item.get("CountryCode", item.get("country_code", item.get("nat", ""))),
            "score_to_par": item.get("ScoreToPar", item.get("total", item.get("score", 0))),
            "today": item.get("today", item.get("round_score", item.get("CurrentRound", 0))),
            "thru": item.get("thru", item.get("holesPlayed", item.get("hole", "F"))),
            "current_round": item.get("currentRound", item.get("round", 1)),
            "total_strokes": item.get("totalStrokes", item.get("strokes", 0)),
            "photo_url": item.get("imageUrl", item.get("photo", item.get("headshot", ""))),
            "is_kenyan": item.get("CountryCode", item.get("country_code", "")).upper() == "KEN"
        }
        entries.append(entry)
    
    return {
        "source": "etx",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "tournament_name": etx_data.get("tournamentName", "Magical Kenya Open"),
        "round": etx_data.get("currentRound", etx_data.get("round", 1)),
        "status": etx_data.get("status", "in_progress"),
        "entries": entries
    }

def transform_etx_tee_times(etx_data: dict) -> dict:
    """Transform ETX tee times response to our format"""
    tee_times = []
    
    raw_times = etx_data.get("teeTimes", etx_data.get("tee_times", etx_data.get("groups", [])))
    
    for item in raw_times:
        players = []
        raw_players = item.get("players", item.get("group", []))
        
        for p in raw_players:
            players.append({
                "player_id": p.get("playerId", p.get("id")),
                "player_name": p.get("playerName", p.get("name", "")),
                "country_code": p.get("countryCode", p.get("country_code", "")),
                "is_kenyan": p.get("countryCode", p.get("country_code", "")).upper() == "KEN"
            })
        
        tee_times.append({
            "tee_time": item.get("teeTime", item.get("time", "")),
            "tee_number": item.get("tee", item.get("teeNumber", item.get("startingTee", 1))),
            "group_number": item.get("groupNumber", item.get("group_id")),
            "players": players
        })
    
    return {
        "source": "etx",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "round": etx_data.get("round", 1),
        "date": etx_data.get("date", ""),
        "tee_times": tee_times
    }

def transform_etx_player(etx_data: dict) -> dict:
    """Transform ETX player response to our format"""
    return {
        "source": "etx",
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "player": {
            "player_id": etx_data.get("playerId", etx_data.get("id")),
            "etx_id": etx_data.get("playerId", etx_data.get("id")),
            "name": etx_data.get("playerName", etx_data.get("name", "")),
            "first_name": etx_data.get("firstName", ""),
            "last_name": etx_data.get("lastName", ""),
            "country": etx_data.get("country", etx_data.get("nationality", "")),
            "country_code": etx_data.get("countryCode", etx_data.get("country_code", "")),
            "photo_url": etx_data.get("imageUrl", etx_data.get("headshot", "")),
            "world_ranking": etx_data.get("owgr", etx_data.get("worldRanking")),
            "age": etx_data.get("age"),
            "turned_pro": etx_data.get("turnedPro"),
            "is_kenyan": etx_data.get("countryCode", etx_data.get("country_code", "")).upper() == "KEN"
        }
    }

def transform_etx_scores(etx_data: dict) -> list:
    """Transform ETX scores response to our format"""
    scores = []
    
    raw_scores = etx_data.get("rounds", etx_data.get("scores", []))
    
    for item in raw_scores:
        scores.append({
            "round": item.get("round", item.get("roundNumber")),
            "score": item.get("score", item.get("grossScore")),
            "score_to_par": item.get("scoreToPar", item.get("toPar")),
            "holes_played": item.get("holesPlayed", 18),
            "hole_scores": item.get("holeScores", item.get("holes", []))
        })
    
    return scores

@api_router.post("/admin/players")
async def create_player(request: Request, player: Player):
    """Create player (admin only)"""
    await require_admin(request)
    
    player_dict = player.model_dump()
    player_dict["created_at"] = player_dict["created_at"].isoformat()
    await db.players.insert_one(player_dict)
    return player_dict

@api_router.put("/admin/leaderboard/{entry_id}")
async def update_leaderboard_entry(request: Request, entry_id: str, entry: LeaderboardEntry):
    """Update leaderboard entry (admin only)"""
    await require_admin(request)
    
    entry_dict = entry.model_dump()
    entry_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.leaderboard.update_one(
        {"entry_id": entry_id},
        {"$set": entry_dict},
        upsert=True
    )
    return entry_dict

# ===================== NEWS/CONTENT ROUTES =====================
@api_router.get("/news")
async def get_news(category: Optional[str] = None, limit: int = 20):
    """Get published news articles"""
    query = {"status": "published"}
    if category:
        query["category"] = category
    
    articles = await db.news_articles.find(query, {"_id": 0}).sort("published_at", -1).to_list(limit)
    return articles

@api_router.get("/sponsors")
async def get_public_sponsors():
    """Get active sponsors for public display"""
    sponsors = await db.sponsors.find({"is_active": True}, {"_id": 0}).sort("tier", 1).to_list(50)
    return sponsors

@api_router.get("/board-members")
async def get_public_board():
    """Get active board members for public display"""
    members = await db.board_members.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(50)
    return members

@api_router.get("/news/{article_id}")
async def get_article(article_id: str):
    """Get single article"""
    article = await db.news_articles.find_one({"article_id": article_id}, {"_id": 0})
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@api_router.post("/admin/news")
async def create_article(request: Request, article: NewsArticleCreate):
    """Create news article (admin only)"""
    user = await require_admin(request)
    
    slug = article.title.lower().replace(" ", "-")[:50]
    
    new_article = NewsArticle(
        title=article.title,
        slug=slug,
        excerpt=article.excerpt,
        content=article.content,
        featured_image=article.featured_image,
        category=article.category,
        tags=article.tags,
        author_id=user.user_id,
        author_name=user.name
    )
    
    article_dict = new_article.model_dump()
    article_dict["created_at"] = article_dict["created_at"].isoformat()
    await db.news_articles.insert_one(article_dict)
    return article_dict

@api_router.put("/admin/news/{article_id}")
async def update_article(request: Request, article_id: str, update: dict):
    """Update article (admin only)"""
    await require_admin(request)
    
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    if update.get("status") == "published" and not update.get("published_at"):
        update["published_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.news_articles.update_one({"article_id": article_id}, {"$set": update})
    return {"message": "Article updated"}

@api_router.delete("/admin/news/{article_id}")
async def delete_article(request: Request, article_id: str):
    """Delete article (admin only)"""
    await require_admin(request)
    await db.news_articles.delete_one({"article_id": article_id})
    return {"message": "Article deleted"}

# ===================== GALLERY ROUTES =====================
@api_router.get("/gallery")
async def get_gallery(content_type: Optional[str] = None, category: Optional[str] = None, limit: int = 50):
    """Get gallery items"""
    query = {"status": "published"}
    if content_type:
        query["content_type"] = content_type
    if category:
        query["category"] = category
    
    items = await db.gallery.find(query, {"_id": 0}).sort("published_at", -1).to_list(limit)
    return items

@api_router.post("/admin/gallery")
async def create_gallery_item(request: Request, item: GalleryItemCreate):
    """Create gallery item (admin only)"""
    user = await require_admin(request)
    
    new_item = GalleryItem(
        title=item.title,
        description=item.description,
        media_url=item.media_url,
        thumbnail_url=item.thumbnail_url,
        content_type=item.content_type,
        category=item.category,
        author_id=user.user_id
    )
    
    item_dict = new_item.model_dump()
    item_dict["created_at"] = item_dict["created_at"].isoformat()
    await db.gallery.insert_one(item_dict)
    return item_dict

@api_router.put("/admin/gallery/{item_id}")
async def update_gallery_item(request: Request, item_id: str, update: dict):
    """Update gallery item (admin only)"""
    await require_admin(request)
    
    if update.get("status") == "published" and not update.get("published_at"):
        update["published_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.gallery.update_one({"item_id": item_id}, {"$set": update})
    return {"message": "Gallery item updated"}

# ===================== TICKETS ROUTES =====================
@api_router.get("/tickets/packages")
async def get_ticket_packages(category: Optional[str] = None):
    """Get ticket packages"""
    query = {"is_available": True}
    if category:
        query["category"] = category
    
    packages = await db.ticket_packages.find(query, {"_id": 0}).to_list(100)
    return packages

@api_router.post("/admin/tickets/packages")
async def create_ticket_package(request: Request, package: TicketPackage):
    """Create ticket package (admin only)"""
    await require_admin(request)
    
    package_dict = package.model_dump()
    package_dict["created_at"] = package_dict["created_at"].isoformat()
    await db.ticket_packages.insert_one(package_dict)
    return package_dict

@api_router.post("/enquiries")
async def create_enquiry(enquiry: EnquiryFormCreate):
    """Submit enquiry form"""
    new_enquiry = EnquiryForm(**enquiry.model_dump())
    enquiry_dict = new_enquiry.model_dump()
    enquiry_dict["created_at"] = enquiry_dict["created_at"].isoformat()
    await db.enquiries.insert_one(enquiry_dict)
    return {"message": "Enquiry submitted successfully", "enquiry_id": new_enquiry.enquiry_id}

@api_router.get("/admin/enquiries")
async def get_enquiries(request: Request, status: Optional[str] = None):
    """Get all enquiries (admin only)"""
    await require_admin(request)
    
    query = {"status": status} if status else {}
    enquiries = await db.enquiries.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return enquiries

# ===================== CONTACT ROUTES =====================
@api_router.post("/contact")
async def create_contact_message(message: ContactMessageCreate):
    """Submit contact form"""
    new_message = ContactMessage(**message.model_dump())
    message_dict = new_message.model_dump()
    message_dict["created_at"] = message_dict["created_at"].isoformat()
    await db.contact_messages.insert_one(message_dict)
    return {"message": "Message sent successfully"}

@api_router.get("/admin/contact")
async def get_contact_messages(request: Request):
    """Get all contact messages (admin only)"""
    await require_admin(request)
    messages = await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return messages

# ===================== TOURNAMENT INFO =====================
@api_router.get("/tournament/info")
async def get_tournament_info():
    """Get tournament information"""
    info = await db.tournament_info.find_one({}, {"_id": 0})
    if not info:
        # Return default info - 2026 event at Karen Country Club
        return {
            "name": "Magical Kenya Open",
            "year": 2026,
            "dates": "February 19-22, 2026",
            "venue": "Karen Country Club",
            "location": "Nairobi, Kenya",
            "purse": "$2,000,000",
            "defending_champion": "Guido Migliozzi",
            "course_par": 72,
            "course_yards": 6818
        }
    return info

@api_router.get("/tournament/schedule")
async def get_tournament_schedule():
    """Get tournament schedule"""
    schedule = await db.tournament_schedule.find({}, {"_id": 0}).to_list(100)
    if not schedule:
        return [
            {"day": "Thursday", "date": "February 19", "event": "Round 1", "time": "07:00 - 18:00"},
            {"day": "Friday", "date": "February 20", "event": "Round 2", "time": "07:00 - 18:00"},
            {"day": "Saturday", "date": "February 21", "event": "Round 3", "time": "08:00 - 17:00"},
            {"day": "Sunday", "date": "February 22", "event": "Final Round", "time": "08:00 - 17:00"}
        ]
    return schedule

@api_router.get("/tournament/past-winners")
async def get_past_winners():
    """Get past tournament winners"""
    winners = await db.past_winners.find({}, {"_id": 0}).sort("year", -1).to_list(100)
    if not winners:
        return [
            {"year": 2025, "winner": "Jacques Kruyswijk", "country": "South Africa", "score": "-17"},
            {"year": 2024, "winner": "Darius van Driel", "country": "Netherlands", "score": "-10"},
            {"year": 2023, "winner": "Jorge Campillo", "country": "Spain", "score": "-18"},
            {"year": 2022, "winner": "Wu Ashun", "country": "China", "score": "-18"},
            {"year": 2021, "winner": "Justin Harding", "country": "South Africa", "score": "-16"},
            {"year": 2019, "winner": "Guido Migliozzi", "country": "Italy", "score": "-23"},
            {"year": 2018, "winner": "Shubhankar Sharma", "country": "India", "score": "-23"},
            {"year": 2017, "winner": "Francesco Molinari", "country": "Italy", "score": "-20"}
        ]
    return winners

# ===================== IMAGE UPLOAD =====================
@api_router.post("/admin/upload")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Upload image file (admin only)"""
    await require_admin(request)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, WebP allowed.")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Return URL
    return {
        "filename": filename,
        "url": f"/api/uploads/{filename}",
        "content_type": file.content_type
    }

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath)

@api_router.get("/admin/uploads")
async def list_uploads(request: Request):
    """List all uploaded files (admin only)"""
    await require_admin(request)
    
    files = []
    for f in UPLOAD_DIR.iterdir():
        if f.is_file():
            files.append({
                "filename": f.name,
                "url": f"/api/uploads/{f.name}",
                "size": f.stat().st_size,
                "created": datetime.fromtimestamp(f.stat().st_ctime, tz=timezone.utc).isoformat()
            })
    
    return sorted(files, key=lambda x: x["created"], reverse=True)

@api_router.delete("/admin/uploads/{filename}")
async def delete_upload(request: Request, filename: str):
    """Delete uploaded file (admin only)"""
    await require_admin(request)
    
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    filepath.unlink()
    return {"message": "File deleted successfully"}

# ===================== POLICY DOCUMENTS =====================
class PolicyDocument(BaseModel):
    policy_id: str = Field(default_factory=lambda: f"policy_{uuid.uuid4().hex[:12]}")
    title: str
    description: str
    filename: str
    file_url: str
    category: str = "general" # governance, compliance, conduct, other
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

@api_router.post("/admin/policies/upload")
async def upload_policy(request: Request, file: UploadFile = File(...), title: str = "", description: str = "", category: str = "general"):
    """Upload policy PDF document (admin only)"""
    await require_admin(request)
    
    # Validate file type
    allowed_types = ["application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF files allowed.")
    
    # Generate unique filename
    original_name = file.filename.replace(" ", "_")
    filename = f"{uuid.uuid4().hex[:8]}_{original_name}"
    filepath = POLICIES_DIR / filename
    
    # Save file
    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Create policy record
    policy = PolicyDocument(
        title=title or file.filename.replace(".pdf", "").replace("_", " "),
        description=description,
        filename=filename,
        file_url=f"/api/policies/{filename}",
        category=category
    )
    
    policy_dict = policy.model_dump()
    policy_dict["created_at"] = policy_dict["created_at"].isoformat()
    await db.policies.insert_one(policy_dict)
    
    return {
        "policy_id": policy.policy_id,
        "filename": filename,
        "url": f"/api/policies/{filename}",
        "title": policy.title
    }

@api_router.get("/policies")
async def list_policies(category: Optional[str] = None):
    """List all active policy documents"""
    query = {"is_active": True}
    if category:
        query["category"] = category
    
    policies = await db.policies.find(query, {"_id": 0}).to_list(100)
    return policies

@api_router.get("/policies/{filename}")
async def get_policy_file(filename: str):
    """Serve policy PDF files"""
    filepath = POLICIES_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(filepath, media_type="application/pdf", filename=filename)

@api_router.get("/admin/policies")
async def admin_list_policies(request: Request):
    """List all policy documents (admin only)"""
    await require_admin(request)
    
    policies = await db.policies.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return policies

@api_router.delete("/admin/policies/{policy_id}")
async def delete_policy(request: Request, policy_id: str):
    """Delete policy document (admin only)"""
    await require_admin(request)
    
    policy = await db.policies.find_one({"policy_id": policy_id}, {"_id": 0})
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Delete file
    filepath = POLICIES_DIR / policy["filename"]
    if filepath.exists():
        filepath.unlink()
    
    # Delete record
    await db.policies.delete_one({"policy_id": policy_id})
    return {"message": "Policy deleted successfully"}

@api_router.put("/admin/policies/{policy_id}")
async def update_policy(request: Request, policy_id: str, update: dict):
    """Update policy document metadata (admin only)"""
    await require_admin(request)
    
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.policies.update_one({"policy_id": policy_id}, {"$set": update})
    return {"message": "Policy updated successfully"}

# ===================== MARSHAL AUTH APIs =====================
@api_router.post("/marshal/login")
async def marshal_login(credentials: MarshalLogin, response: Response):
    """Marshal dashboard login"""
    # Case-insensitive username lookup
    username_lower = credentials.username.lower()
    user = await db.marshal_users.find_one({"username": username_lower}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Username not found")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled. Contact administrator.")
    
    # Create session
    session_id = secrets.token_urlsafe(32)
    session_data = {
        "session_id": session_id,
        "marshal_id": user["marshal_id"],
        "username": user["username"],
        "role": user["role"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=8)).isoformat()
    }
    
    await db.marshal_sessions.insert_one(session_data)
    
    # Update last login
    await db.marshal_users.update_one(
        {"marshal_id": user["marshal_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Set cookie
    response.set_cookie(
        key="marshal_session",
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=8 * 60 * 60 # 8 hours
    )
    
    return {
        "success": True,
        "session_id": session_id,
        "user": {
            "marshal_id": user["marshal_id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
    }

@api_router.post("/marshal/logout")
async def marshal_logout(request: Request, response: Response):
    """Marshal dashboard logout"""
    session_token = request.cookies.get("marshal_session")
    if session_token:
        await db.marshal_sessions.delete_one({"session_id": session_token})
    
    response.delete_cookie("marshal_session")
    return {"success": True, "message": "Logged out successfully"}

@api_router.get("/marshal/me")
async def get_marshal_profile(request: Request):
    """Get current marshal user profile"""
    session = await get_marshal_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    return {
        "marshal_id": session["marshal_id"],
        "username": session["username"],
        "full_name": session["full_name"],
        "role": session["role"]
    }

# ===================== MARSHAL DASHBOARD APIs =====================
@api_router.get("/marshal/volunteers")
async def get_all_volunteers(
    request: Request,
    status: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None
):
    """Get all volunteers (marshal dashboard)"""
    await require_marshal_auth(request)
    
    query = {}
    if status:
        query["status"] = status
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    volunteers = await db.volunteers.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return volunteers

@api_router.get("/marshal/volunteers/{volunteer_id}")
async def get_volunteer_details(request: Request, volunteer_id: str):
    """Get specific volunteer details"""
    await require_marshal_auth(request)
    
    volunteer = await db.volunteers.find_one({"volunteer_id": volunteer_id}, {"_id": 0})
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Get attendance records
    attendance = await db.volunteer_attendance.find(
        {"volunteer_id": volunteer_id}, {"_id": 0}
    ).sort("date", 1).to_list(100)
    
    volunteer["attendance_records"] = attendance
    return volunteer

@api_router.put("/marshal/volunteers/{volunteer_id}")
async def update_volunteer(request: Request, volunteer_id: str, update: VolunteerUpdate):
    """Update volunteer record"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin"])
    
    volunteer = await db.volunteers.find_one({"volunteer_id": volunteer_id}, {"_id": 0})
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.volunteers.update_one({"volunteer_id": volunteer_id}, {"$set": update_data})
    return {"success": True, "message": "Volunteer updated successfully"}

@api_router.post("/marshal/volunteers/{volunteer_id}/approve")
async def approve_volunteer(request: Request, volunteer_id: str):
    """Approve volunteer"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin"])
    
    result = await db.volunteers.update_one(
        {"volunteer_id": volunteer_id},
        {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    return {"success": True, "message": "Volunteer approved"}

@api_router.post("/marshal/volunteers/{volunteer_id}/reject")
async def reject_volunteer(request: Request, volunteer_id: str):
    """Reject volunteer"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin"])
    
    result = await db.volunteers.update_one(
        {"volunteer_id": volunteer_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    return {"success": True, "message": "Volunteer rejected"}

@api_router.delete("/marshal/volunteers/{volunteer_id}")
async def delete_volunteer(request: Request, volunteer_id: str):
    """Delete volunteer record permanently (admin only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin"])
    
    # First check if volunteer exists
    volunteer = await db.volunteers.find_one({"volunteer_id": volunteer_id}, {"_id": 0})
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Delete the volunteer
    result = await db.volunteers.delete_one({"volunteer_id": volunteer_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Failed to delete volunteer")
    
    # Also delete any related attendance records
    await db.attendance.delete_many({"volunteer_id": volunteer_id})
    
    # Log the deletion for audit
    await db.audit_logs.insert_one({
        "log_id": str(uuid.uuid4()),
        "user_id": session.get("marshal_id"),
        "username": session.get("username"),
        "action": "DELETE",
        "entity_type": "volunteer",
        "entity_id": volunteer_id,
        "old_value": {
            "name": f"{volunteer.get('first_name', '')} {volunteer.get('last_name', '')}",
            "email": volunteer.get("email"),
            "role": volunteer.get("role")
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True, "message": f"Volunteer {volunteer.get('first_name', '')} {volunteer.get('last_name', '')} deleted permanently"}

# ===================== ATTENDANCE APIs =====================
@api_router.post("/marshal/attendance")
async def mark_attendance(request: Request, attendance: dict):
    """Mark volunteer attendance"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "area_supervisor", "admin"])
    
    volunteer_id = attendance.get("volunteer_id")
    date = attendance.get("date") # YYYY-MM-DD
    status = attendance.get("status") # present, absent, late
    
    if not all([volunteer_id, date, status]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    # Check if volunteer exists
    volunteer = await db.volunteers.find_one({"volunteer_id": volunteer_id}, {"_id": 0})
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    
    # Upsert attendance record
    attendance_data = {
        "attendance_id": str(uuid.uuid4()),
        "volunteer_id": volunteer_id,
        "date": date,
        "status": status,
        "check_in_time": attendance.get("check_in_time"),
        "check_out_time": attendance.get("check_out_time"),
        "marked_by": session["marshal_id"],
        "notes": attendance.get("notes"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.volunteer_attendance.update_one(
        {"volunteer_id": volunteer_id, "date": date},
        {"$set": attendance_data},
        upsert=True
    )
    
    return {"success": True, "message": "Attendance marked"}

@api_router.get("/marshal/attendance/{date}")
async def get_attendance_by_date(request: Request, date: str):
    """Get attendance for a specific date"""
    await require_marshal_auth(request)
    
    # Get all volunteers with their attendance for this date
    volunteers = await db.volunteers.find(
        {"status": "approved"}, {"_id": 0}
    ).to_list(1000)
    
    attendance_records = await db.volunteer_attendance.find(
        {"date": date}, {"_id": 0}
    ).to_list(1000)
    
    attendance_map = {a["volunteer_id"]: a for a in attendance_records}
    
    result = []
    for vol in volunteers:
        att = attendance_map.get(vol["volunteer_id"], {})
        result.append({
            **vol,
            "attendance_status": att.get("status"),
            "check_in_time": att.get("check_in_time"),
            "check_out_time": att.get("check_out_time")
        })
    
    return result

# ===================== MARSHAL USER MANAGEMENT =====================
@api_router.post("/marshal/users")
async def create_marshal_user(request: Request, user: MarshalUserCreate):
    """Create marshal user (chief marshal only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio"])
    
    # Case-insensitive username check
    username_lower = user.username.lower()
    existing = await db.marshal_users.find_one({"username": username_lower}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    user_data = {
        "marshal_id": str(uuid.uuid4()),
        "username": username_lower, # Store lowercase
        "password_hash": hash_password(user.password),
        "full_name": user.full_name,
        "role": user.role,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    }
    
    await db.marshal_users.insert_one(user_data)
    
    return {
        "success": True,
        "marshal_id": user_data["marshal_id"],
        "message": "User created successfully"
    }

@api_router.get("/marshal/users")
async def list_marshal_users(request: Request):
    """List all marshal users (chief marshal only)"""
    await require_marshal_role(request, ["chief_marshal", "cio"])
    
    users = await db.marshal_users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return users

@api_router.delete("/marshal/users/{marshal_id}")
async def delete_marshal_user(request: Request, marshal_id: str):
    """Delete marshal user (chief marshal only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio"])
    
    # Can't delete yourself
    if marshal_id == session["marshal_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    await db.marshal_users.delete_one({"marshal_id": marshal_id})
    await db.marshal_sessions.delete_many({"marshal_id": marshal_id})
    
    return {"success": True, "message": "User deleted"}

@api_router.put("/marshal/users/{marshal_id}")
async def update_marshal_user(request: Request, marshal_id: str, update: MarshalUserUpdate):
    """Update marshal user (chief marshal only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio"])
    
    user = await db.marshal_users.find_one({"marshal_id": marshal_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    if update.full_name:
        update_data["full_name"] = update.full_name
    if update.role:
        update_data["role"] = update.role
    if update.is_active is not None:
        update_data["is_active"] = update.is_active
    if update.password:
        update_data["password_hash"] = hash_password(update.password)
    
    if update_data:
        await db.marshal_users.update_one({"marshal_id": marshal_id}, {"$set": update_data})
        # If user is deactivated, delete their sessions
        if update.is_active == False:
            await db.marshal_sessions.delete_many({"marshal_id": marshal_id})
    
    return {"success": True, "message": "User updated successfully"}

@api_router.get("/marshal/roles")
async def get_available_roles(request: Request):
    """Get list of available marshal roles"""
    await require_marshal_auth(request)
    return {
        "roles": [
            {"value": "chief_marshal", "label": "Chief Marshal", "description": "Full system access"},
            {"value": "cio", "label": "CIO", "description": "Chief Information Officer - Full admin access"},
            {"value": "tournament_director", "label": "Tournament Director", "description": "Tournament operations management"},
            {"value": "operations_manager", "label": "Operations Manager", "description": "Volunteer and logistics management"},
            {"value": "area_supervisor", "label": "Area Supervisor", "description": "Supervise specific areas/holes"},
            {"value": "admin", "label": "Admin", "description": "Administrative tasks and approvals"},
            {"value": "coordinator", "label": "Coordinator", "description": "Coordinate volunteers and schedules"},
            {"value": "viewer", "label": "Viewer", "description": "Read-only access"}
        ]
    }

# ===================== DYNAMIC FORM BUILDER APIs =====================
@api_router.post("/marshal/forms")
async def create_registration_form(request: Request, form_data: dict):
    """Create a new registration form (chief marshal/admin only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin", "tournament_director"])
    
    # Generate slug from name
    slug = form_data.get("name", "form").lower().replace(" ", "-").replace("_", "-")
    slug = ''.join(c for c in slug if c.isalnum() or c == '-')
    
    # Check if slug exists
    existing = await db.registration_forms.find_one({"slug": slug}, {"_id": 0})
    if existing:
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"
    
    form = {
        "form_id": str(uuid.uuid4()),
        "name": form_data.get("name"),
        "slug": slug,
        "description": form_data.get("description"),
        "fields": form_data.get("fields", []),
        "is_active": form_data.get("is_active", True),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
        "created_by": session["marshal_id"]
    }
    
    await db.registration_forms.insert_one(form)
    return {"success": True, "form_id": form["form_id"], "slug": slug}

@api_router.get("/marshal/forms")
async def list_registration_forms(request: Request):
    """List all registration forms"""
    await require_marshal_auth(request)
    forms = await db.registration_forms.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return forms

@api_router.get("/marshal/forms/{form_id}")
async def get_registration_form(request: Request, form_id: str):
    """Get a specific registration form"""
    await require_marshal_auth(request)
    form = await db.registration_forms.find_one({"form_id": form_id}, {"_id": 0})
    if not form:
        # Try by slug
        form = await db.registration_forms.find_one({"slug": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    return form

@api_router.put("/marshal/forms/{form_id}")
async def update_registration_form(request: Request, form_id: str, form_data: dict):
    """Update a registration form"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin", "tournament_director"])
    
    form = await db.registration_forms.find_one({"form_id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    update_data = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if "name" in form_data:
        update_data["name"] = form_data["name"]
    if "description" in form_data:
        update_data["description"] = form_data["description"]
    if "fields" in form_data:
        update_data["fields"] = form_data["fields"]
    if "is_active" in form_data:
        update_data["is_active"] = form_data["is_active"]
    
    await db.registration_forms.update_one({"form_id": form_id}, {"$set": update_data})
    return {"success": True, "message": "Form updated successfully"}

@api_router.delete("/marshal/forms/{form_id}")
async def delete_registration_form(request: Request, form_id: str):
    """Delete a registration form"""
    session = await require_marshal_role(request, ["chief_marshal", "cio"])
    
    await db.registration_forms.delete_one({"form_id": form_id})
    return {"success": True, "message": "Form deleted"}

@api_router.post("/marshal/forms/{form_id}/fields")
async def add_form_field(request: Request, form_id: str, field_data: dict):
    """Add a field to a form"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin", "tournament_director"])
    
    form = await db.registration_forms.find_one({"form_id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    field = {
        "field_id": str(uuid.uuid4()),
        "name": field_data.get("name"),
        "label": field_data.get("label"),
        "field_type": field_data.get("field_type", "text"),
        "required": field_data.get("required", False),
        "is_active": field_data.get("is_active", True),
        "options": field_data.get("options", []),
        "placeholder": field_data.get("placeholder"),
        "help_text": field_data.get("help_text"),
        "order": len(form.get("fields", []))
    }
    
    await db.registration_forms.update_one(
        {"form_id": form_id},
        {
            "$push": {"fields": field},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True, "field_id": field["field_id"]}

@api_router.put("/marshal/forms/{form_id}/fields/{field_id}")
async def update_form_field(request: Request, form_id: str, field_id: str, field_data: dict):
    """Update a specific field in a form"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin", "tournament_director"])
    
    form = await db.registration_forms.find_one({"form_id": form_id}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    fields = form.get("fields", [])
    field_index = next((i for i, f in enumerate(fields) if f.get("field_id") == field_id), None)
    
    if field_index is None:
        raise HTTPException(status_code=404, detail="Field not found")
    
    # Update field properties
    for key in ["name", "label", "field_type", "required", "is_active", "options", "placeholder", "help_text", "order"]:
        if key in field_data:
            fields[field_index][key] = field_data[key]
    
    await db.registration_forms.update_one(
        {"form_id": form_id},
        {
            "$set": {
                "fields": fields,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"success": True, "message": "Field updated"}

@api_router.delete("/marshal/forms/{form_id}/fields/{field_id}")
async def delete_form_field(request: Request, form_id: str, field_id: str):
    """Delete a field from a form"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin"])
    
    await db.registration_forms.update_one(
        {"form_id": form_id},
        {
            "$pull": {"fields": {"field_id": field_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"success": True, "message": "Field deleted"}

# Public endpoint to get active forms
@api_router.get("/forms")
async def get_public_forms():
    """Get all active public registration forms"""
    forms = await db.registration_forms.find({"is_active": True}, {"_id": 0}).to_list(100)
    return forms

@api_router.get("/forms/{slug}")
async def get_public_form_by_slug(slug: str):
    """Get a specific form by slug (for public rendering)"""
    form = await db.registration_forms.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or inactive")
    return form

@api_router.post("/forms/{slug}/submit")
async def submit_form(slug: str, submission_data: dict):
    """Submit a form response"""
    form = await db.registration_forms.find_one({"slug": slug, "is_active": True}, {"_id": 0})
    if not form:
        raise HTTPException(status_code=404, detail="Form not found or inactive")
    
    # Validate required fields
    for field in form.get("fields", []):
        if field.get("required") and field.get("is_active"):
            field_name = field.get("name")
            if field_name not in submission_data or not submission_data[field_name]:
                raise HTTPException(status_code=400, detail=f"Field '{field.get('label')}' is required")
    
    submission = {
        "submission_id": str(uuid.uuid4()),
        "form_id": form["form_id"],
        "form_slug": slug,
        "data": submission_data,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None
    }
    
    await db.form_submissions.insert_one(submission)
    return {"success": True, "submission_id": submission["submission_id"], "message": "Form submitted successfully"}

@api_router.get("/marshal/submissions")
async def get_form_submissions(request: Request, form_id: Optional[str] = None, status: Optional[str] = None):
    """Get form submissions"""
    await require_marshal_auth(request)
    
    query = {}
    if form_id:
        query["form_id"] = form_id
    if status:
        query["status"] = status
    
    submissions = await db.form_submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return submissions

@api_router.put("/marshal/submissions/{submission_id}")
async def update_submission_status(request: Request, submission_id: str, update_data: dict):
    """Update submission status"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin", "tournament_director", "operations_manager"])
    
    status = update_data.get("status")
    if status not in ["pending", "approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.form_submissions.update_one(
        {"submission_id": submission_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "message": "Submission updated"}

# ===================== EXPORT APIs =====================
@api_router.get("/marshal/export/volunteers")
async def export_volunteers(request: Request, format: str = "csv"):
    """Export volunteer list as a clean report"""
    await require_marshal_auth(request)
    
    volunteers = await db.volunteers.find({}, {"_id": 0}).sort([("status", 1), ("role", 1), ("last_name", 1)]).to_list(5000)
    
    if format == "csv":
        output = io.StringIO()
        
        # Define clean column headers for the report
        fieldnames = [
            "No.",
            "First Name",
            "Last Name",
            "Role",
            "Status",
            "Phone Number",
            "Email Address",
            "Nationality",
            "ID/Passport",
            "Golf Club",
            "Previous Volunteer",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
            "Assigned Location",
            "Registration Date"
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        
        for idx, vol in enumerate(volunteers, 1):
            # Format phone number to show full number
            phone = vol.get("phone", "")
            if phone and not phone.startswith("+"):
                phone = f"+{phone}"
           
            # Format availability
            def format_availability(val):
                if val == "all_day":
                    return "All Day"
                elif val == "morning":
                    return "Morning"
                elif val == "afternoon":
                    return "Afternoon"
                elif val == "not_available":
                    return "Not Available"
                return val or "-"
           
            # Format date
            created = vol.get("created_at", "")
            if created:
                try:
                    if isinstance(created, str):
                        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    else:
                        dt = created
                    created = dt.strftime("%Y-%m-%d %H:%M")
                except:
                    pass
           
            row = {
                "No.": idx,
                "First Name": vol.get("first_name", ""),
                "Last Name": vol.get("last_name", ""),
                "Role": vol.get("role", "").title(),
                "Status": vol.get("status", "").title(),
                "Phone Number": phone,
                "Email Address": vol.get("email", ""),
                "Nationality": vol.get("nationality", ""),
                "ID/Passport": vol.get("identification_number", ""),
                "Golf Club": vol.get("golf_club", ""),
                "Previous Volunteer": "Yes" if vol.get("volunteered_before") else "No",
                "Thursday": format_availability(vol.get("availability_thursday")),
                "Friday": format_availability(vol.get("availability_friday")),
                "Saturday": format_availability(vol.get("availability_saturday")),
                "Sunday": format_availability(vol.get("availability_sunday")),
                "Assigned Location": vol.get("assigned_location", "-"),
                "Registration Date": created
            }
            writer.writerow(row)
        
        # Add summary at the end
        output.write("\n")
        output.write("SUMMARY\n")
        output.write(f"Total Volunteers:,{len(volunteers)}\n")
        
        approved = len([v for v in volunteers if v.get("status") == "approved"])
        pending = len([v for v in volunteers if v.get("status") == "pending"])
        rejected = len([v for v in volunteers if v.get("status") == "rejected"])
        marshals = len([v for v in volunteers if v.get("role") == "marshal"])
        scorers = len([v for v in volunteers if v.get("role") == "scorer"])
        
        output.write(f"Approved:,{approved}\n")
        output.write(f"Pending:,{pending}\n")
        output.write(f"Rejected:,{rejected}\n")
        output.write(f"Marshals:,{marshals}\n")
        output.write(f"Scorers:,{scorers}\n")
        output.write(f"\nGenerated:,{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        
        output.seek(0)
        
        # Generate filename with date
        filename = f"MKO_Volunteers_Report_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    return volunteers

@api_router.get("/marshal/export/attendance/{date}")
async def export_attendance(request: Request, date: str):
    """Export attendance for a specific date"""
    await require_marshal_auth(request)
    
    attendance_data = await get_attendance_by_date(request, date)
    
    output = io.StringIO()
    if attendance_data:
        fieldnames = ["first_name", "last_name", "role", "assigned_location", "attendance_status", "check_in_time", "check_out_time"]
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(attendance_data)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_{date}.csv"}
    )

@api_router.get("/marshal/stats")
async def get_marshal_dashboard_stats(request: Request):
    """Get dashboard statistics"""
    await require_marshal_auth(request)
    
    total_volunteers = await db.volunteers.count_documents({})
    pending = await db.volunteers.count_documents({"status": "pending"})
    approved = await db.volunteers.count_documents({"status": "approved"})
    rejected = await db.volunteers.count_documents({"status": "rejected"})
    marshals = await db.volunteers.count_documents({"role": "marshal", "status": {"$ne": "rejected"}})
    scorers = await db.volunteers.count_documents({"role": "scorer", "status": {"$ne": "rejected"}})
    
    return {
        "total": total_volunteers,
        "pending": pending,
        "approved": approved,
        "rejected": rejected,
        "by_role": {
            "marshals": marshals,
            "scorers": scorers
        },
        "quotas": {
            "marshals_target": 300,
            "scorers_target": 300
        }
    }

# ===================== ADVANCED VOLUNTEER QUERY ENGINE =====================
# Karen membership normalization - match variations
KAREN_CLUB_VARIATIONS = [
    "karen", "karen country club", "karen golf club", "karen cc",
    "kcc", "karen c.c", "karen c.c.", "karen golf", "kgc"
]
def normalize_club_name(club_name: str) -> str:
    """Normalize club name for matching"""
    if not club_name:
        return ""
    return club_name.lower().strip()

def is_karen_member(club_name: str) -> bool:
    """Check if club name matches Karen Country Club variations"""
    normalized = normalize_club_name(club_name)
    for variation in KAREN_CLUB_VARIATIONS:
        if variation in normalized or normalized in variation:
            return True
    return False

class VolunteerQueryFilters(BaseModel):
    """Advanced query filters for volunteers"""
    role: Optional[str] = None # marshal, scorer
    status: Optional[str] = None # pending, approved, rejected
    days: Optional[List[str]] = None # ["thursday", "friday", "saturday", "sunday"]
    time_slots: Optional[List[str]] = None # ["morning", "afternoon", "all_day"]
    karen_member: Optional[bool] = None # True = Karen members only
    nationality: Optional[str] = None # "kenyan", "non_kenyan"
    volunteered_before: Optional[bool] = None # Previous experience
    search: Optional[str] = None # Name/email/phone search
    assigned_location: Optional[str] = None # Filter by assigned location
    unassigned_only: Optional[bool] = None # Only show unassigned volunteers

class VolunteerQueryResponse(BaseModel):
    """Response for volunteer query"""
    volunteers: List[dict]
    total: int
    filters_applied: dict
    statistics: dict

@api_router.post("/marshal/volunteers/query")
async def query_volunteers(request: Request, filters: VolunteerQueryFilters):
    """
    Advanced volunteer query with combinable filters.
    Supports day, time, Karen membership, nationality, and experience filtering.
    """
    await require_marshal_auth(request)
    
    # Build MongoDB query
    query = {}
    filters_applied = {}
    
    # Role filter (marshal/scorer)
    if filters.role:
        query["role"] = filters.role
        filters_applied["role"] = filters.role
    
    # Status filter
    if filters.status:
        query["status"] = filters.status
        filters_applied["status"] = filters.status
    
    # Day availability filter - combinable multi-select
    if filters.days:
        day_conditions = []
        for day in filters.days:
            day_key = f"availability_{day.lower()}"
            # Include volunteers available for that day (morning, afternoon, or all_day)
            day_conditions.append({day_key: {"$ne": "not_available"}})
       
        if day_conditions:
            if "$and" not in query:
                query["$and"] = []
            # Use $or to find volunteers available on ANY of the selected days
            query["$and"].append({"$or": day_conditions})
            filters_applied["days"] = filters.days
    
    # Time slot filter - drill-down within days
    if filters.time_slots and filters.days:
        time_conditions = []
        for day in filters.days:
            day_key = f"availability_{day.lower()}"
            for slot in filters.time_slots:
                if slot == "all_day":
                    time_conditions.append({day_key: "all_day"})
                elif slot == "morning":
                    time_conditions.append({day_key: {"$in": ["morning", "all_day"]}})
                elif slot == "afternoon":
                    time_conditions.append({day_key: {"$in": ["afternoon", "all_day"]}})
       
        if time_conditions:
            if "$and" not in query:
                query["$and"] = []
            query["$and"].append({"$or": time_conditions})
            filters_applied["time_slots"] = filters.time_slots
    
    # Karen membership filter (normalized matching)
    if filters.karen_member is not None:
        filters_applied["karen_member"] = filters.karen_member
        # This will be applied in post-processing due to normalization needs
    
    # Nationality filter
    if filters.nationality:
        if filters.nationality.lower() == "kenyan":
            query["nationality"] = {"$regex": "kenya", "$options": "i"}
        elif filters.nationality.lower() == "non_kenyan":
            query["nationality"] = {"$not": {"$regex": "kenya", "$options": "i"}}
        filters_applied["nationality"] = filters.nationality
    
    # Previous volunteering experience
    if filters.volunteered_before is not None:
        query["volunteered_before"] = filters.volunteered_before
        filters_applied["volunteered_before"] = filters.volunteered_before
    
    # Text search
    if filters.search:
        search_term = filters.search
        query["$or"] = [
            {"first_name": {"$regex": search_term, "$options": "i"}},
            {"last_name": {"$regex": search_term, "$options": "i"}},
            {"email": {"$regex": search_term, "$options": "i"}},
            {"phone": {"$regex": search_term, "$options": "i"}},
            {"golf_club": {"$regex": search_term, "$options": "i"}}
        ]
        filters_applied["search"] = filters.search
    
    # Assigned location filter
    if filters.assigned_location:
        query["assigned_location"] = filters.assigned_location
        filters_applied["assigned_location"] = filters.assigned_location
    
    # Unassigned only filter
    if filters.unassigned_only:
        query["$or"] = [
            {"assigned_location": None},
            {"assigned_location": ""},
            {"assigned_location": {"$exists": False}}
        ]
        filters_applied["unassigned_only"] = True
    
    # Execute query
    volunteers = await db.volunteers.find(query, {"_id": 0}).sort([
        ("status", 1), # approved first
        ("last_name", 1),
        ("first_name", 1)
    ]).to_list(5000)
    
    # Apply Karen membership filter in post-processing (for normalized matching)
    if filters.karen_member is not None:
        if filters.karen_member:
            volunteers = [v for v in volunteers if is_karen_member(v.get("golf_club", ""))]
        else:
            volunteers = [v for v in volunteers if not is_karen_member(v.get("golf_club", ""))]
    
    # Calculate statistics for the result set
    stats = {
        "total": len(volunteers),
        "by_status": {
            "pending": len([v for v in volunteers if v.get("status") == "pending"]),
            "approved": len([v for v in volunteers if v.get("status") == "approved"]),
            "rejected": len([v for v in volunteers if v.get("status") == "rejected"])
        },
        "by_role": {
            "marshals": len([v for v in volunteers if v.get("role") == "marshal"]),
            "scorers": len([v for v in volunteers if v.get("role") == "scorer"])
        },
        "karen_members": len([v for v in volunteers if is_karen_member(v.get("golf_club", ""))]),
        "first_timers": len([v for v in volunteers if not v.get("volunteered_before")]),
        "experienced": len([v for v in volunteers if v.get("volunteered_before")]),
        "assigned": len([v for v in volunteers if v.get("assigned_location")]),
        "unassigned": len([v for v in volunteers if not v.get("assigned_location")])
    }
    
    return {
        "volunteers": volunteers,
        "total": len(volunteers),
        "filters_applied": filters_applied,
        "statistics": stats
    }

@api_router.post("/marshal/volunteers/bulk-assign")
async def bulk_assign_volunteers(request: Request, assignment: dict):
    """
    Bulk assign volunteers to roles, locations, shifts, and supervisors.
    """
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin", "operations_manager"])
    
    volunteer_ids = assignment.get("volunteer_ids", [])
    location = assignment.get("location")
    supervisor = assignment.get("supervisor")
    shifts = assignment.get("shifts", [])
    day = assignment.get("day") # Optional: specific day assignment
    notes = assignment.get("notes")
    
    if not volunteer_ids:
        raise HTTPException(status_code=400, detail="No volunteers selected")
    
    update_data = {
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    if location:
        update_data["assigned_location"] = location
    if supervisor:
        update_data["assigned_supervisor"] = supervisor
    if shifts:
        update_data["assigned_shifts"] = shifts
    if notes:
        update_data["notes"] = notes
    
    # Update all selected volunteers
    result = await db.volunteers.update_many(
        {"volunteer_id": {"$in": volunteer_ids}},
        {"$set": update_data}
    )
    
    # Log the bulk assignment
    await db.audit_logs.insert_one({
        "log_id": str(uuid.uuid4()),
        "user_id": session.get("marshal_id"),
        "username": session.get("username"),
        "action": "BULK_ASSIGN",
        "entity_type": "volunteers",
        "entity_id": None,
        "new_value": {
            "volunteer_count": len(volunteer_ids),
            "location": location,
            "supervisor": supervisor,
            "shifts": shifts
        },
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "message": f"Successfully assigned {result.modified_count} volunteers",
        "assigned_count": result.modified_count
    }

@api_router.post("/marshal/volunteers/export-query")
async def export_query_results(request: Request, filters: VolunteerQueryFilters, format: str = "csv"):
    """
    Export filtered volunteer results as CSV/Excel.
    Uses the same filtering logic as the query endpoint.
    """
    await require_marshal_auth(request)
    
    # Reuse query logic
    query_result = await query_volunteers(request, filters)
    volunteers = query_result["volunteers"]
    
    if format == "csv":
        output = io.StringIO()
        
        fieldnames = [
            "No.",
            "First Name",
            "Last Name",
            "Role",
            "Status",
            "Phone Number",
            "Email Address",
            "Nationality",
            "ID/Passport",
            "Golf Club",
            "Karen Member",
            "Previous Volunteer",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
            "Assigned Location",
            "Assigned Supervisor",
            "Registration Date"
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        
        for idx, vol in enumerate(volunteers, 1):
            phone = vol.get("phone", "")
            if phone and not phone.startswith("+"):
                phone = f"+{phone}"
           
            def format_availability(val):
                if val == "all_day":
                    return "All Day"
                elif val == "morning":
                    return "Morning"
                elif val == "afternoon":
                    return "Afternoon"
                elif val == "not_available":
                    return "-"
                return val or "-"
           
            created = vol.get("created_at", "")
            if created:
                try:
                    if isinstance(created, str):
                        dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    else:
                        dt = created
                    created = dt.strftime("%Y-%m-%d %H:%M")
                except:
                    pass
           
            row = {
                "No.": idx,
                "First Name": vol.get("first_name", ""),
                "Last Name": vol.get("last_name", ""),
                "Role": vol.get("role", "").title(),
                "Status": vol.get("status", "").title(),
                "Phone Number": phone,
                "Email Address": vol.get("email", ""),
                "Nationality": vol.get("nationality", ""),
                "ID/Passport": vol.get("identification_number", ""),
                "Golf Club": vol.get("golf_club", ""),
                "Karen Member": "Yes" if is_karen_member(vol.get("golf_club", "")) else "No",
                "Previous Volunteer": "Yes" if vol.get("volunteered_before") else "No",
                "Thursday": format_availability(vol.get("availability_thursday")),
                "Friday": format_availability(vol.get("availability_friday")),
                "Saturday": format_availability(vol.get("availability_saturday")),
                "Sunday": format_availability(vol.get("availability_sunday")),
                "Assigned Location": vol.get("assigned_location", "-"),
                "Assigned Supervisor": vol.get("assigned_supervisor", "-"),
                "Registration Date": created
            }
            writer.writerow(row)
        
        # Add summary
        stats = query_result["statistics"]
        output.write("\n")
        output.write("QUERY RESULTS SUMMARY\n")
        output.write(f"Total Results:,{stats['total']}\n")
        output.write(f"Marshals:,{stats['by_role']['marshals']}\n")
        output.write(f"Scorers:,{stats['by_role']['scorers']}\n")
        output.write(f"Karen Members:,{stats['karen_members']}\n")
        output.write(f"Experienced:,{stats['experienced']}\n")
        output.write(f"First-timers:,{stats['first_timers']}\n")
        output.write(f"Assigned:,{stats['assigned']}\n")
        output.write(f"Unassigned:,{stats['unassigned']}\n")
        output.write(f"\nFilters Applied:,{query_result['filters_applied']}\n")
        output.write(f"\nGenerated:,{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        
        output.seek(0)
        
        filename = f"MKO_Volunteers_Query_{datetime.now().strftime('%Y%m%d_%H%M')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    
    return volunteers

@api_router.get("/marshal/assignment-locations")
async def get_assignment_locations(request: Request):
    """
    Get unique locations currently used for volunteer assignments.
    Plus predefined locations for the tournament.
    """
    await require_marshal_auth(request)
    
    # Get unique locations from existing assignments
    pipeline = [
        {"$match": {"assigned_location": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$assigned_location"}},
        {"$sort": {"_id": 1}}
    ]
    
    existing_locations = await db.volunteers.aggregate(pipeline).to_list(100)
    existing = [loc["_id"] for loc in existing_locations if loc["_id"]]
    
    # Predefined golf course locations
    predefined = [
        "Hole 1", "Hole 2", "Hole 3", "Hole 4", "Hole 5",
        "Hole 6", "Hole 7", "Hole 8", "Hole 9", "Hole 10",
        "Hole 11", "Hole 12", "Hole 13", "Hole 14", "Hole 15",
        "Hole 16", "Hole 17", "Hole 18",
        "Clubhouse", "Driving Range", "Practice Green",
        "Starter Area", "Scoring Tent", "Media Center",
        "VIP Area", "Spectator Entrance", "Player Parking",
        "Volunteer Check-in", "First Aid Station"
    ]
    
    # Combine and deduplicate
    all_locations = list(set(predefined + existing))
    all_locations.sort()
    
    return {"locations": all_locations}

@api_router.get("/marshal/assignment-supervisors")
async def get_supervisors(request: Request):
    """
    Get list of area supervisors for assignment.
    """
    await require_marshal_auth(request)
    
    # Get supervisors from marshal_users
    supervisors = await db.marshal_users.find(
        {"role": {"$in": ["area_supervisor", "chief_marshal", "cio", "operations_manager", "admin"]}, "is_active": True},
        {"_id": 0, "marshal_id": 1, "username": 1, "full_name": 1, "role": 1}
    ).to_list(100)
    
    # Also get unique supervisors from existing assignments
    pipeline = [
        {"$match": {"assigned_supervisor": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$assigned_supervisor"}},
        {"$sort": {"_id": 1}}
    ]
    
    existing_supervisors = await db.volunteers.aggregate(pipeline).to_list(100)
    existing = [{"full_name": s["_id"], "marshal_id": None} for s in existing_supervisors if s["_id"]]
    
    # Combine
    all_supervisors = supervisors + existing
    
    return {"supervisors": all_supervisors}

@api_router.get("/marshal/query-presets")
async def get_query_presets(request: Request):
    """
    Get saved query presets for quick access.
    """
    await require_marshal_auth(request)
    
    presets = await db.volunteer_query_presets.find({}, {"_id": 0}).sort("name", 1).to_list(100)
    
    # Add default presets if none exist
    if not presets:
        default_presets = [
            {
                "preset_id": str(uuid.uuid4()),
                "name": "All Scorers - Thursday AM",
                "description": "Scorers available Thursday morning",
                "filters": {"role": "scorer", "days": ["thursday"], "time_slots": ["morning", "all_day"], "status": "approved"}
            },
            {
                "preset_id": str(uuid.uuid4()),
                "name": "Karen Members Only",
                "description": "Volunteers who are Karen Country Club members",
                "filters": {"karen_member": True, "status": "approved"}
            },
            {
                "preset_id": str(uuid.uuid4()),
                "name": "Unassigned Approved Volunteers",
                "description": "Approved volunteers pending assignment",
                "filters": {"status": "approved", "unassigned_only": True}
            },
            {
                "preset_id": str(uuid.uuid4()),
                "name": "Experienced Marshals",
                "description": "Marshals with previous volunteering experience",
                "filters": {"role": "marshal", "volunteered_before": True, "status": "approved"}
            },
            {
                "preset_id": str(uuid.uuid4()),
                "name": "Weekend Coverage - Scorers",
                "description": "Scorers available Saturday and Sunday",
                "filters": {"role": "scorer", "days": ["saturday", "sunday"], "status": "approved"}
            }
        ]
        # Insert default presets
        for preset in default_presets:
            preset["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.volunteer_query_presets.insert_one(preset)
        presets = default_presets
    
    return {"presets": presets}

@api_router.post("/marshal/query-presets")
async def save_query_preset(request: Request, preset: dict):
    """
    Save a query preset for future use.
    """
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin", "operations_manager"])
    
    name = preset.get("name")
    description = preset.get("description", "")
    filters = preset.get("filters", {})
    
    if not name:
        raise HTTPException(status_code=400, detail="Preset name is required")
    
    new_preset = {
        "preset_id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "filters": filters,
        "created_by": session.get("username"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.volunteer_query_presets.insert_one(new_preset)
    
    return {"success": True, "preset_id": new_preset["preset_id"], "message": "Query preset saved"}

@api_router.delete("/marshal/query-presets/{preset_id}")
async def delete_query_preset(request: Request, preset_id: str):
    """
    Delete a saved query preset.
    """
    session = await require_marshal_role(request, ["chief_marshal", "cio", "admin"])
    
    result = await db.volunteer_query_presets.delete_one({"preset_id": preset_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    return {"success": True, "message": "Preset deleted"}

# ===================== TOURNAMENT APIs =====================
@api_router.get("/tournaments")
async def list_tournaments(request: Request):
    """List all tournaments"""
    await require_marshal_auth(request)
    tournaments = await db.tournaments.find({}, {"_id": 0}).sort("year", -1).to_list(100)
    return tournaments

@api_router.get("/tournaments/current")
async def get_current_tournament():
    """Get the current active tournament (public)"""
    tournament = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    if not tournament:
        tournament = await db.tournaments.find_one({"is_active": True}, {"_id": 0})
    return tournament

async def seed_accreditation_modules(tournament_id: str):
    """Seed default accreditation modules for a tournament"""
    modules = [
        {
            "module_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "module_type": "volunteers",
            "name": "Volunteer Registration",
            "slug": "volunteer-registration",
            "description": "Register as a volunteer",
            "form_id": None,
            "is_active": True,
            "is_public": True,
            "settings": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "module_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "module_type": "media",
            "name": "Media Accreditation",
            "slug": "media-accreditation",
            "description": "Apply for media accreditation",
            "form_id": None,
            "is_active": True,
            "is_public": True,
            "settings": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "module_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "module_type": "vendors",
            "name": "Vendor Application",
            "slug": "vendor-application",
            "description": "Apply as a vendor",
            "form_id": None,
            "is_active": True,
            "is_public": True,
            "settings": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "module_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "module_type": "pro_am",
            "name": "Pro-Am Registration",
            "slug": "pro-am-registration",
            "description": "Register for the Pro-Am tournament",
            "form_id": None,
            "is_active": True,
            "is_public": True,
            "settings": {},
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for module in modules:
        await db.accreditation_modules.insert_one(module)

async def seed_default_locations(tournament_id: str):
    """Seed default locations for a tournament"""
    locations = [
        {
            "location_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "name": "Karen Country Club",
            "code": "KCC",
            "location_type": "venue",
            "parent_location_id": None,
            "capacity": None,
            "description": "Main tournament venue",
            "coordinates": None,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for location in locations:
        await db.locations.insert_one(location)

async def seed_default_access_levels(tournament_id: str):
    """Seed default access levels for a tournament"""
    levels = [
        {
            "access_level_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "name": "All Access",
            "code": "AA",
            "tier": 1,
            "color": "#FF0000",
            "description": "Full access to all areas",
            "allowed_zone_ids": [],
            "allowed_module_types": ["volunteers", "media", "vendors", "pro_am"],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "access_level_id": str(uuid.uuid4()),
            "tournament_id": tournament_id,
            "name": "General Public",
            "code": "GP",
            "tier": 10,
            "color": "#00AA00",
            "description": "General public spectator access",
            "allowed_zone_ids": [],
            "allowed_module_types": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for level in levels:
        await db.access_levels.insert_one(level)

async def log_audit(request: Request, user_id: str, username: str, action: str, entity_type: str, entity_id: str, old_value: dict, new_value: dict, tournament_id: str = None):
    """Log an audit trail entry"""
    await db.audit_logs.insert_one({
        "log_id": str(uuid.uuid4()),
        "tournament_id": tournament_id,
        "user_id": user_id,
        "username": username,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "old_value": old_value,
        "new_value": new_value,
        "ip_address": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent"),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

@api_router.post("/tournaments")
async def create_tournament(request: Request, data: dict):
    """Create a new tournament"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director"])
    
    tournament = {
        "tournament_id": str(uuid.uuid4()),
        "name": data.get("name"),
        "code": data.get("code"),
        "year": data.get("year"),
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "venue": data.get("venue"),
        "is_active": data.get("is_active", True),
        "is_current": False,
        "settings": data.get("settings", {}),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tournaments.insert_one(tournament)
    
    # Seed default data for new tournament
    await seed_accreditation_modules(tournament["tournament_id"])
    await seed_default_locations(tournament["tournament_id"])
    await seed_default_access_levels(tournament["tournament_id"])
    
    await log_audit(request, session["marshal_id"], session["username"], "create", "tournament", tournament["tournament_id"], None, tournament)
    
    return {"success": True, "tournament_id": tournament["tournament_id"]}

@api_router.put("/tournaments/{tournament_id}")
async def update_tournament(request: Request, tournament_id: str, data: dict):
    """Update a tournament"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director"])
    
    old_tournament = await db.tournaments.find_one({"tournament_id": tournament_id}, {"_id": 0})
    if not old_tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    update_data = {k: v for k, v in data.items() if k not in ["tournament_id", "created_at"]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # If setting as current, unset others
    if data.get("is_current"):
        await db.tournaments.update_many({}, {"$set": {"is_current": False}})
    
    await db.tournaments.update_one({"tournament_id": tournament_id}, {"$set": update_data})
    await log_audit(request, session["marshal_id"], session["username"], "update", "tournament", tournament_id, old_tournament, update_data)
    
    return {"success": True}

# ===================== ACCREDITATION MODULE APIs =====================
@api_router.get("/accreditation/modules")
async def list_accreditation_modules(request: Request, tournament_id: Optional[str] = None):
    """List all accreditation modules"""
    await require_marshal_auth(request)
    
    query = {}
    if tournament_id:
        query["tournament_id"] = tournament_id
    else:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        if current:
            query["tournament_id"] = current["tournament_id"]
    
    modules = await db.accreditation_modules.find(query, {"_id": 0}).to_list(100)
    return modules

@api_router.get("/accreditation/modules/public")
async def list_public_modules():
    """List active public modules (for application pages)"""
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    if not current:
        return []
    
    modules = await db.accreditation_modules.find({
        "tournament_id": current["tournament_id"],
        "is_active": True,
        "is_public": True
    }, {"_id": 0}).to_list(100)
    return modules

@api_router.put("/accreditation/modules/{module_id}")
async def update_accreditation_module(request: Request, module_id: str, data: dict):
    """Update an accreditation module"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    old_module = await db.accreditation_modules.find_one({"module_id": module_id}, {"_id": 0})
    if not old_module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    update_data = {k: v for k, v in data.items() if k not in ["module_id", "tournament_id", "module_type", "created_at"]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.accreditation_modules.update_one({"module_id": module_id}, {"$set": update_data})
    await log_audit(request, session["marshal_id"], session["username"], "update", "module", module_id, old_module, update_data, old_module.get("tournament_id"))
    
    return {"success": True}

# ===================== LOCATION APIs =====================
@api_router.get("/locations")
async def list_locations(request: Request, tournament_id: Optional[str] = None):
    """List all locations"""
    await require_marshal_auth(request)
    
    query = {}
    if tournament_id:
        query["tournament_id"] = tournament_id
    else:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        if current:
            query["tournament_id"] = current["tournament_id"]
    
    locations = await db.locations.find(query, {"_id": 0}).sort("name", 1).to_list(500)
    return locations

@api_router.post("/locations")
async def create_location(request: Request, data: dict):
    """Create a new location"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "operations_manager", "admin"])
    
    tournament_id = data.get("tournament_id")
    if not tournament_id:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        tournament_id = current["tournament_id"] if current else None
    
    if not tournament_id:
        raise HTTPException(status_code=400, detail="No active tournament")
    
    location = {
        "location_id": str(uuid.uuid4()),
        "tournament_id": tournament_id,
        "name": data.get("name"),
        "code": data.get("code", "").upper(),
        "location_type": data.get("location_type", "area"),
        "parent_location_id": data.get("parent_location_id"),
        "capacity": data.get("capacity"),
        "description": data.get("description"),
        "coordinates": data.get("coordinates"),
        "is_active": data.get("is_active", True),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.locations.insert_one(location)
    await log_audit(request, session["marshal_id"], session["username"], "create", "location", location["location_id"], None, location, tournament_id)
    
    return {"success": True, "location_id": location["location_id"]}

@api_router.put("/locations/{location_id}")
async def update_location(request: Request, location_id: str, data: dict):
    """Update a location"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "operations_manager", "admin"])
    
    old_location = await db.locations.find_one({"location_id": location_id}, {"_id": 0})
    if not old_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    update_data = {k: v for k, v in data.items() if k not in ["location_id", "tournament_id", "created_at"]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.locations.update_one({"location_id": location_id}, {"$set": update_data})
    await log_audit(request, session["marshal_id"], session["username"], "update", "location", location_id, old_location, update_data, old_location.get("tournament_id"))
    
    return {"success": True}

@api_router.delete("/locations/{location_id}")
async def delete_location(request: Request, location_id: str):
    """Delete a location"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director"])
    
    location = await db.locations.find_one({"location_id": location_id}, {"_id": 0})
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    await db.locations.delete_one({"location_id": location_id})
    await log_audit(request, session["marshal_id"], session["username"], "delete", "location", location_id, location, None, location.get("tournament_id"))
    
    return {"success": True}

# ===================== ZONE APIs =====================
@api_router.get("/zones")
async def list_zones(request: Request, tournament_id: Optional[str] = None, location_id: Optional[str] = None):
    """List all zones"""
    await require_marshal_auth(request)
    
    query = {}
    if tournament_id:
        query["tournament_id"] = tournament_id
    else:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        if current:
            query["tournament_id"] = current["tournament_id"]
    
    if location_id:
        query["location_id"] = location_id
    
    zones = await db.zones.find(query, {"_id": 0}).sort("name", 1).to_list(500)
    return zones

@api_router.post("/zones")
async def create_zone(request: Request, data: dict):
    """Create a new zone"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "operations_manager", "admin"])
    
    tournament_id = data.get("tournament_id")
    if not tournament_id:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        tournament_id = current["tournament_id"] if current else None
    
    if not tournament_id:
        raise HTTPException(status_code=400, detail="No active tournament")
    
    zone = {
        "zone_id": str(uuid.uuid4()),
        "tournament_id": tournament_id,
        "location_id": data.get("location_id"),
        "name": data.get("name"),
        "code": data.get("code", "").upper(),
        "zone_type": data.get("zone_type", "public"),
        "description": data.get("description"),
        "required_access_level_ids": data.get("required_access_level_ids", []),
        "capacity": data.get("capacity"),
        "is_active": data.get("is_active", True),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.zones.insert_one(zone)
    await log_audit(request, session["marshal_id"], session["username"], "create", "zone", zone["zone_id"], None, zone, tournament_id)
    
    return {"success": True, "zone_id": zone["zone_id"]}

@api_router.put("/zones/{zone_id}")
async def update_zone(request: Request, zone_id: str, data: dict):
    """Update a zone"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "operations_manager", "admin"])
    
    old_zone = await db.zones.find_one({"zone_id": zone_id}, {"_id": 0})
    if not old_zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    update_data = {k: v for k, v in data.items() if k not in ["zone_id", "tournament_id", "created_at"]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.zones.update_one({"zone_id": zone_id}, {"$set": update_data})
    await log_audit(request, session["marshal_id"], session["username"], "update", "zone", zone_id, old_zone, update_data, old_zone.get("tournament_id"))
    
    return {"success": True}

@api_router.delete("/zones/{zone_id}")
async def delete_zone(request: Request, zone_id: str):
    """Delete a zone"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director"])
    
    zone = await db.zones.find_one({"zone_id": zone_id}, {"_id": 0})
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    await db.zones.delete_one({"zone_id": zone_id})
    await log_audit(request, session["marshal_id"], session["username"], "delete", "zone", zone_id, zone, None, zone.get("tournament_id"))
    
    return {"success": True}

# ===================== ACCESS LEVEL APIs =====================
@api_router.get("/access-levels")
async def list_access_levels(request: Request, tournament_id: Optional[str] = None):
    """List all access levels"""
    await require_marshal_auth(request)
    
    query = {}
    if tournament_id:
        query["tournament_id"] = tournament_id
    else:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        if current:
            query["tournament_id"] = current["tournament_id"]
    
    levels = await db.access_levels.find(query, {"_id": 0}).sort("tier", 1).to_list(100)
    return levels

@api_router.post("/access-levels")
async def create_access_level(request: Request, data: dict):
    """Create a new access level"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    tournament_id = data.get("tournament_id")
    if not tournament_id:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        tournament_id = current["tournament_id"] if current else None
    
    if not tournament_id:
        raise HTTPException(status_code=400, detail="No active tournament")
    
    level = {
        "access_level_id": str(uuid.uuid4()),
        "tournament_id": tournament_id,
        "name": data.get("name"),
        "code": data.get("code", "").upper(),
        "tier": data.get("tier", 5),
        "color": data.get("color"),
        "description": data.get("description"),
        "allowed_zone_ids": data.get("allowed_zone_ids", []),
        "allowed_module_types": data.get("allowed_module_types", []),
        "is_active": data.get("is_active", True),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.access_levels.insert_one(level)
    await log_audit(request, session["marshal_id"], session["username"], "create", "access_level", level["access_level_id"], None, level, tournament_id)
    
    return {"success": True, "access_level_id": level["access_level_id"]}

@api_router.put("/access-levels/{level_id}")
async def update_access_level(request: Request, level_id: str, data: dict):
    """Update an access level"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    old_level = await db.access_levels.find_one({"access_level_id": level_id}, {"_id": 0})
    if not old_level:
        raise HTTPException(status_code=404, detail="Access level not found")
    
    update_data = {k: v for k, v in data.items() if k not in ["access_level_id", "tournament_id", "created_at"]}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.access_levels.update_one({"access_level_id": level_id}, {"$set": update_data})
    await log_audit(request, session["marshal_id"], session["username"], "update", "access_level", level_id, old_level, update_data, old_level.get("tournament_id"))
    
    return {"success": True}

@api_router.delete("/access-levels/{level_id}")
async def delete_access_level(request: Request, level_id: str):
    """Delete an access level"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director"])
    
    level = await db.access_levels.find_one({"access_level_id": level_id}, {"_id": 0})
    if not level:
        raise HTTPException(status_code=404, detail="Access level not found")
    
    await db.access_levels.delete_one({"access_level_id": level_id})
    await log_audit(request, session["marshal_id"], session["username"], "delete", "access_level", level_id, level, None, level.get("tournament_id"))
    
    return {"success": True}

# ===================== UNIFIED ACCREDITATION SUBMISSION APIs =====================
@api_router.post("/accreditation/apply/{module_slug}")
async def submit_accreditation(module_slug: str, data: dict):
    """Public endpoint to submit an accreditation application"""
    # Get current tournament
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    if not current:
        raise HTTPException(status_code=400, detail="No active tournament")
    
    # Get module
    module = await db.accreditation_modules.find_one({
        "tournament_id": current["tournament_id"],
        "slug": module_slug,
        "is_active": True,
        "is_public": True
    }, {"_id": 0})
    
    if not module:
        raise HTTPException(status_code=404, detail="Application module not found or not accepting applications")
    
    # For volunteers, use existing system
    if module["module_type"] == "volunteers":
        raise HTTPException(status_code=400, detail="Please use the volunteer registration page")
    
    submission = {
        "submission_id": str(uuid.uuid4()),
        "tournament_id": current["tournament_id"],
        "module_id": module["module_id"],
        "module_type": module["module_type"],
        "form_data": data.get("form_data", data),
        "status": "submitted",
        "assigned_location_id": None,
        "assigned_zone_id": None,
        "assigned_access_level_id": None,
        "assigned_shifts": [],
        "reviewer_id": None,
        "reviewer_notes": None,
        "attachments": data.get("attachments", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": None,
        "reviewed_at": None
    }
    
    await db.accreditation_submissions.insert_one(submission)
    
    return {
        "success": True,
        "submission_id": submission["submission_id"],
        "message": f"Your {module['name']} application has been submitted successfully."
    }

@api_router.get("/accreditation/submissions")
async def list_submissions(
    request: Request,
    module_type: Optional[str] = None,
    status: Optional[str] = None,
    tournament_id: Optional[str] = None
):
    """List all accreditation submissions"""
    await require_marshal_auth(request)
    
    query = {}
    if tournament_id:
        query["tournament_id"] = tournament_id
    else:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        if current:
            query["tournament_id"] = current["tournament_id"]
    
    if module_type:
        query["module_type"] = module_type
    if status:
        query["status"] = status
    
    submissions = await db.accreditation_submissions.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return submissions

@api_router.get("/accreditation/submissions/{submission_id}")
async def get_submission(request: Request, submission_id: str):
    """Get a specific submission"""
    await require_marshal_auth(request)
    
    submission = await db.accreditation_submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission

@api_router.put("/accreditation/submissions/{submission_id}")
async def update_submission(request: Request, submission_id: str, data: dict):
    """Update a submission (status, assignment, notes)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "operations_manager", "admin", "coordinator"])
    
    old_submission = await db.accreditation_submissions.find_one({"submission_id": submission_id}, {"_id": 0})
    if not old_submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    update_data = {}
    allowed_fields = ["status", "assigned_location_id", "assigned_zone_id", "assigned_access_level_id", "assigned_shifts", "reviewer_notes"]
    
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]
    
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        update_data["reviewer_id"] = session["marshal_id"]
        
        if "status" in update_data and update_data["status"] in ["approved", "rejected"]:
            update_data["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.accreditation_submissions.update_one({"submission_id": submission_id}, {"$set": update_data})
        await log_audit(request, session["marshal_id"], session["username"], "update", "submission", submission_id, old_submission, update_data, old_submission.get("tournament_id"))
    
    return {"success": True}

@api_router.get("/accreditation/stats")
async def get_accreditation_stats(request: Request, tournament_id: Optional[str] = None):
    """Get accreditation statistics across all modules"""
    await require_marshal_auth(request)
    
    if not tournament_id:
        current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
        tournament_id = current["tournament_id"] if current else None
    
    if not tournament_id:
        return {}
    
    # Get counts per module and status
    pipeline = [
        {"$match": {"tournament_id": tournament_id}},
        {"$group": {
            "_id": {"module_type": "$module_type", "status": "$status"},
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.accreditation_submissions.aggregate(pipeline).to_list(100)
    
    stats = {}
    for r in results:
        module_type = r["_id"]["module_type"]
        status = r["_id"]["status"]
        if module_type not in stats:
            stats[module_type] = {"total": 0, "submitted": 0, "under_review": 0, "approved": 0, "rejected": 0, "assigned": 0}
        stats[module_type][status] = r["count"]
        stats[module_type]["total"] += r["count"]
    
    return stats

# ===================== AUDIT LOG APIs =====================
@api_router.get("/audit-logs")
async def list_audit_logs(
    request: Request,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = 100
):
    """List audit logs"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if user_id:
        query["user_id"] = user_id
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return logs

# ===================== EXPORT APIs FOR ACCREDITATION =====================
@api_router.get("/accreditation/export/{module_type}")
async def export_accreditation_submissions(request: Request, module_type: str, status: Optional[str] = None):
    """Export submissions for a module"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    if not current:
        return StreamingResponse(
            iter(["No data"]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={module_type}_export.csv"}
        )
    
    query = {"tournament_id": current["tournament_id"], "module_type": module_type}
    if status:
        query["status"] = status
    
    submissions = await db.accreditation_submissions.find(query, {"_id": 0}).to_list(5000)
    
    output = io.StringIO()
    fieldnames = ["submission_id", "status", "created_at", "reviewed_at"] + sorted(set().union(*(sub.get("form_data", {}).keys() for sub in submissions)))
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for sub in submissions:
        row = {
            "submission_id": sub["submission_id"],
            "status": sub["status"],
            "created_at": sub["created_at"],
            "reviewed_at": sub.get("reviewed_at", "")
        }
        row.update(sub.get("form_data", {}))
        writer.writerow(row)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={module_type}_export.csv"}
    )

@api_router.get("/accreditation/export-badges/{module_type}")
async def export_badge_ready_data(request: Request, module_type: str, status: str = "approved"):
    """Export badge-ready data for approved submissions - formatted for badge printing"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    if not current:
        return StreamingResponse(
            iter(["No active tournament"]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={module_type}_badges.csv"}
        )
    
    query = {"tournament_id": current["tournament_id"], "module_type": module_type, "status": status}
    submissions = await db.accreditation_submissions.find(query, {"_id": 0}).to_list(5000)
    
    if not submissions:
        return StreamingResponse(
            iter(["No approved submissions found"]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={module_type}_badges.csv"}
        )
    
    output = io.StringIO()
    
    # Badge-specific fields - standardized for badge printing software
    badge_fieldnames = [
        "badge_id",
        "full_name",
        "first_name",
        "last_name",
        "organization",
        "role",
        "accreditation_type",
        "access_level",
        "zone_access",
        "email",
        "phone",
        "photo_url",
        "qr_code_data",
        "valid_from",
        "valid_to",
        "created_at"
    ]
    
    writer = csv.DictWriter(output, fieldnames=badge_fieldnames)
    writer.writeheader()
    
    for sub in submissions:
        form_data = sub.get("form_data", {})
        
        # Extract name parts
        full_name = form_data.get("full_name", form_data.get("name", form_data.get("contact_name", "")))
        name_parts = full_name.split(" ", 1) if full_name else ["", ""]
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        # Determine access level based on module type
        access_level_map = {
            "media": "Media Zone",
            "vendors": "Service Area",
            "pro_am": "VIP/Player Area",
            "volunteers": "General Access",
            "procurement": "Service Area",
            "jobs": "Staff Area"
        }
        
        badge_row = {
            "badge_id": sub["submission_id"].upper(),
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "organization": form_data.get("organization", form_data.get("company_name", form_data.get("media_outlet", ""))),
            "role": form_data.get("role", form_data.get("job_title", form_data.get("position", module_type.title()))),
            "accreditation_type": module_type.upper().replace("_", " "),
            "access_level": access_level_map.get(module_type, "General"),
            "zone_access": form_data.get("zone_access", "All Public Areas"),
            "email": form_data.get("email", ""),
            "phone": form_data.get("phone", form_data.get("phone_number", "")),
            "photo_url": form_data.get("photo_url", form_data.get("headshot_url", "")),
            "qr_code_data": f"MKO2026-{sub['submission_id'].upper()}",
            "valid_from": current.get("start_date", "2026-02-19"),
            "valid_to": current.get("end_date", "2026-02-22"),
            "created_at": sub.get("created_at", "")
        }
        
        writer.writerow(badge_row)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={module_type}_badges_{status}.csv"}
    )

@api_router.get("/accreditation/badge-stats")
async def get_badge_stats(request: Request):
    """Get badge printing statistics"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    if not current:
        return {"total_approved": 0, "by_module": {}}
    
    pipeline = [
        {"$match": {"tournament_id": current["tournament_id"], "status": "approved"}},
        {"$group": {"_id": "$module_type", "count": {"$sum": 1}}}
    ]
    
    results = await db.accreditation_submissions.aggregate(pipeline).to_list(100)
    
    by_module = {r["_id"]: r["count"] for r in results}
    total = sum(by_module.values())
    
    return {
        "total_approved": total,
        "by_module": by_module,
        "tournament_name": current.get("name", "Magical Kenya Open 2026")
    }

# ===================== PRO-AM MODULE APIs =====================
# Pro-Am Registration Model
class ProAmRegistration(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    nationality: str
    passport_id: str
    date_of_birth: Optional[str] = None
    gender: str
    handicap: float
    handicap_type: str = "WHS"
    home_club: str
    club_membership_number: Optional[str] = None
    playing_experience_years: Optional[int] = None
    company_name: Optional[str] = None
    company_position: Optional[str] = None
    preferred_date: str = "wednesday"
    previous_proams: Optional[str] = None
    guest_count: int = 0
    guest_names: Optional[str] = None
    dietary_requirements: Optional[str] = None
    special_requests: Optional[str] = None
    shirt_size: str
    emergency_contact_name: str
    emergency_contact_phone: str
    emergency_contact_relation: Optional[str] = None
    payment_method: Optional[str] = None
    terms_accepted: bool
    data_consent: bool
    photo_consent: bool = False
    documents: Optional[Dict[str, str]] = None

# Pro-Am Tee Time Model
class ProAmTeeTime(BaseModel):
    tee_time_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tee_number: int # 1 or 10
    tee_time: str # HH:MM format
    professional_name: str
    professional_id: Optional[str] = None
    wave: str = "morning" # morning or afternoon
    players: List[Dict[str, Any]] = [] # List of amateur players assigned

# Pro-Am Pairing Model
class ProAmPairing(BaseModel):
    pairing_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    professional_name: str
    professional_id: Optional[str] = None
    amateur_ids: List[str] = [] # Up to 3 amateur registration IDs
    tee_time_id: Optional[str] = None
    is_finalized: bool = False

@api_router.get("/pro-am/status")
async def get_proam_status():
    """Get Pro-Am registration status"""
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    # Count registrations
    total_registrations = await db.proam_registrations.count_documents(
        {"tournament_id": tournament_id} if tournament_id else {}
    )
    
    # Max capacity (configurable, default 60 amateur spots = 20 groups * 3 amateurs)
    max_capacity = 60
    
    # Check if registration is open (could be stored in tournament settings)
    settings = await db.proam_settings.find_one({"tournament_id": tournament_id}, {"_id": 0})
    registration_open = settings.get("registration_open", True) if settings else True
    
    return {
        "registration_open": registration_open and total_registrations < max_capacity,
        "total_registrations": total_registrations,
        "max_capacity": max_capacity,
        "spots_remaining": max(0, max_capacity - total_registrations)
    }

@api_router.post("/pro-am/upload-document")
async def upload_proam_document(file: UploadFile = File(...), document_type: str = ""):
    """Upload a Pro-Am registration document"""
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WebP, or PDF allowed.")
    
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size must be less than 5MB")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    file_id = str(uuid.uuid4())
    filename = f"proam_{document_type}_{file_id}.{ext}"
    
    # Save to uploads directory (in production, use external storage)
    proam_dir = UPLOAD_DIR / "proam"
    proam_dir.mkdir(exist_ok=True)
    
    file_path = proam_dir / filename
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(contents)
    
    return {
        "success": True,
        "file_id": file_id,
        "file_url": f"/api/uploads/proam/{filename}",
        "filename": filename
    }

@api_router.post("/pro-am/register")
async def register_proam(registration: ProAmRegistration):
    """Register for Pro-Am tournament"""
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else str(uuid.uuid4())
    
    # Validate handicap
    if registration.gender == "male" and registration.handicap > 24.0:
        raise HTTPException(status_code=400, detail="Men's handicap must be 24.0 or lower")
    if registration.gender == "female" and registration.handicap > 32.0:
        raise HTTPException(status_code=400, detail="Ladies' handicap must be 32.0 or lower")
    
    # Check for duplicate registration (same email or passport)
    existing = await db.proam_registrations.find_one({
        "tournament_id": tournament_id,
        "$or": [
            {"email": registration.email.lower()},
            {"passport_id": registration.passport_id}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="You have already registered for this Pro-Am event")
    
    # Check capacity
    status = await get_proam_status()
    if not status["registration_open"]:
        raise HTTPException(status_code=400, detail="Pro-Am registration is currently closed")
    
    # Create registration
    registration_id = str(uuid.uuid4())
    reg_data = {
        "registration_id": registration_id,
        "tournament_id": tournament_id,
        **registration.dict(),
        "email": registration.email.lower(),
        "status": "submitted", # submitted, approved, rejected, paid, confirmed, cancelled
        "payment_status": "pending", # pending, received, verified, waived
        "payment_amount": 30000, # KES
        "documents_verified": False,
        "handicap_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.proam_registrations.insert_one(reg_data)
    
    # Log audit
    await db.audit_logs.insert_one({
        "log_id": str(uuid.uuid4()),
        "action": "create",
        "entity_type": "proam_registration",
        "entity_id": registration_id,
        "user_id": "public",
        "details": {"email": registration.email, "name": registration.full_name},
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {
        "success": True,
        "registration_id": registration_id,
        "message": "Registration submitted successfully. You will receive confirmation via email."
    }

@api_router.get("/pro-am/registrations")
async def list_proam_registrations(
    request: Request,
    status: Optional[str] = None,
    payment_status: Optional[str] = None
):
    """List Pro-Am registrations (admin only)"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    query = {"tournament_id": tournament_id} if tournament_id else {}
    if status:
        query["status"] = status
    if payment_status:
        query["payment_status"] = payment_status
    
    registrations = await db.proam_registrations.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return registrations

@api_router.get("/pro-am/registrations/{registration_id}")
async def get_proam_registration(request: Request, registration_id: str):
    """Get single Pro-Am registration (admin only)"""
    await require_marshal_auth(request)
    
    registration = await db.proam_registrations.find_one(
        {"registration_id": registration_id}, {"_id": 0}
    )
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    return registration

@api_router.put("/pro-am/registrations/{registration_id}")
async def update_proam_registration(request: Request, registration_id: str, updates: Dict[str, Any]):
    """Update Pro-Am registration (admin only)"""
    session = await require_marshal_auth(request)
    
    allowed_fields = [
        "status", "payment_status", "documents_verified", "handicap_verified",
        "reviewer_notes", "assigned_group", "tee_time_id"
    ]
    filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    filtered_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    filtered_updates["reviewed_by"] = session.get("username")
    
    result = await db.proam_registrations.update_one(
        {"registration_id": registration_id},
        {"$set": filtered_updates}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    # Audit log
    await db.audit_logs.insert_one({
        "log_id": str(uuid.uuid4()),
        "action": "update",
        "entity_type": "proam_registration",
        "entity_id": registration_id,
        "user_id": session.get("marshal_id"),
        "details": filtered_updates,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True}

@api_router.get("/pro-am/stats")
async def get_proam_stats(request: Request):
    """Get Pro-Am statistics (admin only)"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    query = {"tournament_id": tournament_id} if tournament_id else {}
    
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    status_counts = {}
    async for doc in db.proam_registrations.aggregate(pipeline):
        status_counts[doc["_id"]] = doc["count"]
    
    # Payment stats
    payment_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$payment_status",
            "count": {"$sum": 1}
        }}
    ]
    
    payment_counts = {}
    async for doc in db.proam_registrations.aggregate(payment_pipeline):
        payment_counts[doc["_id"]] = doc["count"]
    
    total = await db.proam_registrations.count_documents(query)
    
    return {
        "total_registrations": total,
        "by_status": status_counts,
        "by_payment": payment_counts,
        "max_capacity": 60,
        "spots_remaining": max(0, 60 - total)
    }

# ===================== PRO-AM TEE TIMES & PAIRINGS =====================
@api_router.get("/pro-am/tee-times/public")
async def get_public_tee_times():
    """Get published Pro-Am tee times (public)"""
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    # Check if draw is published
    settings = await db.proam_settings.find_one({"tournament_id": tournament_id}, {"_id": 0})
    is_published = settings.get("draw_published", False) if settings else False
    
    if not is_published:
        return {"is_published": False, "tee_times": []}
    
    tee_times = await db.proam_tee_times.find(
        {"tournament_id": tournament_id, "is_active": True},
        {"_id": 0}
    ).sort([("tee_number", 1), ("tee_time", 1)]).to_list(100)
    
    # Enrich with player names
    for tt in tee_times:
        player_details = []
        for player_id in tt.get("player_ids", []):
            reg = await db.proam_registrations.find_one(
                {"registration_id": player_id},
                {"_id": 0, "full_name": 1, "handicap": 1, "home_club": 1}
            )
            if reg:
                player_details.append({
                    "name": reg["full_name"],
                    "handicap": reg["handicap"],
                    "club": reg.get("home_club", "")
                })
        tt["players"] = player_details
        tt["professional"] = tt.get("professional_name", "TBD")
    
    return {"is_published": is_published, "tee_times": tee_times}

@api_router.get("/pro-am/tee-times")
async def list_tee_times(request: Request):
    """List all tee times (admin only)"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    tee_times = await db.proam_tee_times.find(
        {"tournament_id": tournament_id},
        {"_id": 0}
    ).sort([("tee_number", 1), ("tee_time", 1)]).to_list(100)
    
    # Enrich with player details
    for tt in tee_times:
        player_details = []
        for player_id in tt.get("player_ids", []):
            reg = await db.proam_registrations.find_one(
                {"registration_id": player_id},
                {"_id": 0, "full_name": 1, "handicap": 1, "home_club": 1, "status": 1}
            )
            if reg:
                player_details.append({
                    "id": player_id,
                    "name": reg["full_name"],
                    "handicap": reg["handicap"],
                    "club": reg.get("home_club", ""),
                    "status": reg.get("status", "")
                })
        tt["players"] = player_details
    
    return tee_times

@api_router.post("/pro-am/tee-times")
async def create_tee_time(request: Request, tee_time: ProAmTeeTime):
    """Create a tee time slot (admin only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else str(uuid.uuid4())
    
    data = {
        **tee_time.dict(),
        "tournament_id": tournament_id,
        "player_ids": [],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": session.get("username")
    }
    
    await db.proam_tee_times.insert_one(data)
    
    return {"success": True, "tee_time_id": tee_time.tee_time_id}

@api_router.put("/pro-am/tee-times/{tee_time_id}")
async def update_tee_time(request: Request, tee_time_id: str, updates: Dict[str, Any]):
    """Update tee time (admin only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    allowed_fields = [
        "tee_number", "tee_time", "professional_name", "professional_id",
        "wave", "player_ids", "is_active"
    ]
    filtered = {k: v for k, v in updates.items() if k in allowed_fields}
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    filtered["updated_by"] = session.get("username")
    
    result = await db.proam_tee_times.update_one(
        {"tee_time_id": tee_time_id},
        {"$set": filtered}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Tee time not found")
    
    return {"success": True}

@api_router.delete("/pro-am/tee-times/{tee_time_id}")
async def delete_tee_time(request: Request, tee_time_id: str):
    """Delete tee time (admin only)"""
    await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    result = await db.proam_tee_times.delete_one({"tee_time_id": tee_time_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tee time not found")
    
    return {"success": True}

@api_router.post("/pro-am/tee-times/{tee_time_id}/assign-player")
async def assign_player_to_tee_time(request: Request, tee_time_id: str, player_id: str):
    """Assign a player to a tee time (admin only)"""
    await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    # Verify player exists and is approved
    player = await db.proam_registrations.find_one({"registration_id": player_id})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Check if player already assigned elsewhere
    existing = await db.proam_tee_times.find_one({"player_ids": player_id})
    if existing:
        raise HTTPException(status_code=400, detail="Player already assigned to another tee time")
    
    # Get tee time and check capacity (max 3 amateurs)
    tee_time = await db.proam_tee_times.find_one({"tee_time_id": tee_time_id})
    if not tee_time:
        raise HTTPException(status_code=404, detail="Tee time not found")
    
    if len(tee_time.get("player_ids", [])) >= 3:
        raise HTTPException(status_code=400, detail="Tee time already has maximum 3 amateur players")
    
    # Add player
    await db.proam_tee_times.update_one(
        {"tee_time_id": tee_time_id},
        {"$push": {"player_ids": player_id}}
    )
    
    # Update player's assigned group
    await db.proam_registrations.update_one(
        {"registration_id": player_id},
        {"$set": {"tee_time_id": tee_time_id, "status": "assigned"}}
    )
    
    return {"success": True}

@api_router.post("/pro-am/tee-times/{tee_time_id}/remove-player")
async def remove_player_from_tee_time(request: Request, tee_time_id: str, player_id: str):
    """Remove a player from a tee time (admin only)"""
    await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    await db.proam_tee_times.update_one(
        {"tee_time_id": tee_time_id},
        {"$pull": {"player_ids": player_id}}
    )
    
    await db.proam_registrations.update_one(
        {"registration_id": player_id},
        {"$set": {"tee_time_id": None}, "$unset": {"assigned_group": ""}}
    )
    
    return {"success": True}

# ===================== PRO-AM SETTINGS =====================
@api_router.get("/pro-am/settings")
async def get_proam_settings(request: Request):
    """Get Pro-Am settings (admin only)"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    settings = await db.proam_settings.find_one({"tournament_id": tournament_id}, {"_id": 0})
    
    return settings or {
        "tournament_id": tournament_id,
        "registration_open": True,
        "draw_published": False,
        "max_capacity": 60,
        "entry_fee": 30000,
        "proam_date": "2026-02-19",
        "check_in_opens": "2026-02-19T06:00:00",
        "first_tee_time": "07:00"
    }

@api_router.put("/pro-am/settings")
async def update_proam_settings(request: Request, settings: Dict[str, Any]):
    """Update Pro-Am settings (admin only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else str(uuid.uuid4())
    
    allowed_fields = [
        "registration_open", "draw_published", "max_capacity", "entry_fee",
        "proam_date", "check_in_opens", "first_tee_time", "draw_locked"
    ]
    filtered = {k: v for k, v in settings.items() if k in allowed_fields}
    filtered["updated_at"] = datetime.now(timezone.utc).isoformat()
    filtered["updated_by"] = session.get("username")
    
    await db.proam_settings.update_one(
        {"tournament_id": tournament_id},
        {"$set": filtered, "$setOnInsert": {"tournament_id": tournament_id}},
        upsert=True
    )
    
    # Audit log
    await db.audit_logs.insert_one({
        "log_id": str(uuid.uuid4()),
        "action": "update",
        "entity_type": "proam_settings",
        "entity_id": tournament_id,
        "user_id": session.get("marshal_id"),
        "details": filtered,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"success": True}

@api_router.post("/pro-am/publish-draw")
async def publish_proam_draw(request: Request):
    """Publish the Pro-Am draw (admin only)"""
    session = await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    # Update settings
    await db.proam_settings.update_one(
        {"tournament_id": tournament_id},
        {
            "$set": {
                "draw_published": True,
                "draw_published_at": datetime.now(timezone.utc).isoformat(),
                "published_by": session.get("username")
            },
            "$setOnInsert": {"tournament_id": tournament_id}
        },
        upsert=True
    )
    
    return {"success": True, "message": "Pro-Am draw published successfully"}

@api_router.post("/pro-am/unpublish-draw")
async def unpublish_proam_draw(request: Request):
    """Unpublish the Pro-Am draw (admin only)"""
    await require_marshal_role(request, ["chief_marshal", "cio", "tournament_director", "admin"])
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    await db.proam_settings.update_one(
        {"tournament_id": tournament_id},
        {"$set": {"draw_published": False}}
    )
    
    return {"success": True}

# ===================== PRO-AM CHECK-IN =====================
@api_router.post("/pro-am/check-in/{registration_id}")
async def proam_check_in(request: Request, registration_id: str):
    """Check in a Pro-Am participant (admin only)"""
    session = await require_marshal_auth(request)
    
    result = await db.proam_registrations.update_one(
        {"registration_id": registration_id},
        {
            "$set": {
                "checked_in": True,
                "checked_in_at": datetime.now(timezone.utc).isoformat(),
                "checked_in_by": session.get("username")
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return {"success": True}

@api_router.post("/pro-am/check-out/{registration_id}")
async def proam_check_out(request: Request, registration_id: str):
    """Undo check-in for a Pro-Am participant (admin only)"""
    await require_marshal_auth(request)
    
    result = await db.proam_registrations.update_one(
        {"registration_id": registration_id},
        {"$set": {"checked_in": False}, "$unset": {"checked_in_at": "", "checked_in_by": ""}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    return {"success": True}

# ===================== PRO-AM EXPORT =====================
@api_router.get("/pro-am/export/registrations")
async def export_proam_registrations(request: Request, status: Optional[str] = None):
    """Export Pro-Am registrations as CSV (admin only)"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    query = {"tournament_id": tournament_id} if tournament_id else {}
    if status:
        query["status"] = status
    
    registrations = await db.proam_registrations.find(query, {"_id": 0}).to_list(500)
    
    output = io.StringIO()
    fieldnames = [
        "registration_id", "full_name", "email", "phone", "nationality",
        "gender", "handicap", "home_club", "company_name", "status",
        "payment_status", "shirt_size", "dietary_requirements", "created_at"
    ]
    writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction='ignore')
    writer.writeheader()
    
    for reg in registrations:
        writer.writerow(reg)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=proam_registrations.csv"}
    )

@api_router.get("/pro-am/export/tee-sheet")
async def export_proam_tee_sheet(request: Request):
    """Export Pro-Am tee sheet as CSV (admin only)"""
    await require_marshal_auth(request)
    
    current = await db.tournaments.find_one({"is_current": True}, {"_id": 0})
    tournament_id = current["tournament_id"] if current else None
    
    tee_times = await db.proam_tee_times.find(
        {"tournament_id": tournament_id, "is_active": True},
        {"_id": 0}
    ).sort([("tee_number", 1), ("tee_time", 1)]).to_list(100)
    
    output = io.StringIO()
    fieldnames = ["tee_number", "tee_time", "professional", "player_1", "handicap_1", "player_2", "handicap_2", "player_3", "handicap_3"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    
    for tt in tee_times:
        row = {
            "tee_number": tt.get("tee_number", ""),
            "tee_time": tt.get("tee_time", ""),
            "professional": tt.get("professional_name", "TBD")
        }
        
        # Get player details
        for i, player_id in enumerate(tt.get("player_ids", [])[:3]):
            reg = await db.proam_registrations.find_one(
                {"registration_id": player_id},
                {"_id": 0, "full_name": 1, "handicap": 1}
            )
            if reg:
                row[f"player_{i+1}"] = reg["full_name"]
                row[f"handicap_{i+1}"] = reg["handicap"]
        
        writer.writerow(row)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=proam_tee_sheet.csv"}
    )

# Serve Pro-Am uploaded files
@api_router.get("/uploads/proam/{filename}")
async def serve_proam_file(filename: str):
    """Serve Pro-Am uploaded files"""
    file_path = UPLOAD_DIR / "proam" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# ===================== WEBMASTER PORTAL APIs =====================
# Webmaster role and authentication
class WebmasterRole(str, Enum):
    WEBMASTER = "webmaster"
    CONTENT_MANAGER = "content_manager"
    EDITOR = "editor"

async def seed_webmaster_user():
    """Create default webmaster account if none exists"""
    try:
        existing = await db.webmaster_users.find_one({"role": "webmaster"}, {"_id": 0})
        if not existing:
            default_user = {
                "user_id": str(uuid.uuid4()),
                "username": "webmaster",
                "password_hash": hash_password("MKO2026Web!"),
                "full_name": "Webmaster",
                "role": "webmaster",
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.webmaster_users.insert_one(default_user)
            logger.info("Default webmaster account created: username='webmaster', password='MKO2026Web!'")
        else:
            logger.info("Webmaster account already exists")
    except Exception as e:
        logger.error(f"Failed to seed webmaster user: {e}")

async def migrate_usernames_to_lowercase():
    """One-time migration to convert all existing usernames to lowercase"""
    try:
        # Migrate marshal_users
        marshal_count = 0
        async for user in db.marshal_users.find({}):
            current_username = user.get("username", "")
            if current_username != current_username.lower():
                await db.marshal_users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"username": current_username.lower()}}
                )
                marshal_count += 1
                logger.info(f"Migrated marshal username '{current_username}' -> '{current_username.lower()}'")
        
        # Migrate webmaster_users
        webmaster_count = 0
        async for user in db.webmaster_users.find({}):
            current_username = user.get("username", "")
            if current_username != current_username.lower():
                await db.webmaster_users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"username": current_username.lower()}}
                )
                webmaster_count += 1
                logger.info(f"Migrated webmaster username '{current_username}' -> '{current_username.lower()}'")
        
        if marshal_count > 0 or webmaster_count > 0:
            logger.info(f"Username migration complete: {marshal_count} marshal users, {webmaster_count} webmaster users updated")
        else:
            logger.info("Username migration: No updates needed, all usernames already lowercase")
    except Exception as e:
        logger.error(f"Username migration failed: {e}")

async def require_cio_auth(request: Request):
    """Require CIO role for super admin access"""
    session = await require_marshal_auth(request)
    if session.get("role") != "cio":
        raise HTTPException(status_code=403, detail="CIO access required")
    return session

@api_router.get("/superadmin/webmaster-users")
async def list_webmaster_users(request: Request):
    """List all webmaster users (CIO only)"""
    await require_cio_auth(request)
    users = await db.webmaster_users.find({}, {"_id": 0, "password_hash": 0}).to_list(100)
    return users

@api_router.post("/superadmin/webmaster-users")
async def create_webmaster_user(request: Request, user_data: dict):
    """Create a webmaster user (CIO only)"""
    await require_cio_auth(request)
    
    username = user_data.get("username", "").lower()
    password = user_data.get("password", "")
    full_name = user_data.get("full_name", "")
    role = user_data.get("role", "webmaster")
    
    if not username or not password or not full_name:
        raise HTTPException(status_code=400, detail="Username, password, and full name are required")
    
    existing = await db.webmaster_users.find_one({"username": username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = {
        "user_id": str(uuid.uuid4()),
        "username": username,
        "password_hash": hash_password(password),
        "full_name": full_name,
        "role": role,
        "is_active": user_data.get("is_active", True),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.webmaster_users.insert_one(new_user)
    return {"success": True, "message": "Webmaster user created", "user_id": new_user["user_id"]}

@api_router.put("/superadmin/webmaster-users/{user_id}")
async def update_webmaster_user(request: Request, user_id: str, user_data: dict):
    """Update a webmaster user (CIO only)"""
    await require_cio_auth(request)
    
    existing = await db.webmaster_users.find_one({"user_id": user_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    if user_data.get("full_name"):
        update_data["full_name"] = user_data["full_name"]
    if user_data.get("role"):
        update_data["role"] = user_data["role"]
    if user_data.get("password"):
        update_data["password_hash"] = hash_password(user_data["password"])
    if "is_active" in user_data:
        update_data["is_active"] = user_data["is_active"]
    
    if update_data:
        await db.webmaster_users.update_one({"user_id": user_id}, {"$set": update_data})
    
    return {"success": True, "message": "User updated"}

@api_router.delete("/superadmin/webmaster-users/{user_id}")
async def delete_webmaster_user(request: Request, user_id: str):
    """Delete a webmaster user (CIO only)"""
    await require_cio_auth(request)
    
    result = await db.webmaster_users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete their sessions
    await db.webmaster_sessions.delete_many({"user_id": user_id})
    
    return {"success": True, "message": "User deleted"}

@api_router.get("/superadmin/stats")
async def get_superadmin_stats(request: Request):
    """Get system-wide statistics (CIO only)"""
    await require_cio_auth(request)
    
    stats = {
        "marshal_users": await db.marshal_users.count_documents({}),
        "webmaster_users": await db.webmaster_users.count_documents({}),
        "volunteers": await db.volunteers.count_documents({}),
        "submissions": await db.accreditation_submissions.count_documents({}),
        "proam_registrations": await db.proam_registrations.count_documents({}),
        "news_articles": await db.news_articles.count_documents({}),
        "gallery_items": await db.gallery_items.count_documents({})
    }
    
    return stats

# ===================== EMAIL TEST ENDPOINT =====================
@api_router.post("/superadmin/test-email")
async def test_email_sending(request: Request, data: dict):
    """Test email sending functionality (CIO only)"""
    await require_cio_auth(request)
    
    to_email = data.get("to_email")
    if not to_email:
        raise HTTPException(status_code=400, detail="Email address required")
    
    subject = "Magical Kenya Open - Test Email"
    html_content = """
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #1a472a;">Test Email from MKO System</h1>
        <p>This is a test email to verify the email notification system is working correctly.</p>
        <p><strong>System:</strong> Magical Kenya Open 2026</p>
        <p><strong>Timestamp:</strong> """ + datetime.now(timezone.utc).isoformat() + """</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Kenya Open Golf Limited | Nairobi, Kenya</p>
    </body>
    </html>
    """
    
    result = await send_email(to_email, subject, html_content, "Test email from MKO system")
    
    if result:
        return {"success": True, "message": f"Test email sent to {to_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP credentials.")

# ===================== BULK EMAIL NOTIFICATION =====================
@api_router.post("/superadmin/bulk-email")
async def send_bulk_email(request: Request, data: dict):
    """Send bulk email to selected recipients (CIO only)"""
    await require_cio_auth(request)
    
    target_group = data.get("target_group") # volunteers, submissions, proam
    status_filter = data.get("status", "approved") # approved, pending, all
    subject = data.get("subject")
    message = data.get("message")
    
    if not target_group or not subject or not message:
        raise HTTPException(status_code=400, detail="target_group, subject, and message are required")
    
    # Collect email addresses based on target group
    emails = []
    
    if target_group == "volunteers":
        query = {"status": status_filter} if status_filter != "all" else {}
        async for volunteer in db.volunteers.find(query, {"email": 1}):
            if volunteer.get("email"):
                emails.append(volunteer["email"])
    
    elif target_group == "submissions":
        query = {"status": status_filter} if status_filter != "all" else {}
        async for submission in db.accreditation_submissions.find(query, {"data.email": 1}):
            email = submission.get("data", {}).get("email")
            if email:
                emails.append(email)
    
    elif target_group == "proam":
        query = {"status": status_filter} if status_filter != "all" else {}
        async for reg in db.proam_registrations.find(query, {"contact_email": 1}):
            if reg.get("contact_email"):
                emails.append(reg["contact_email"])
    
    else:
        raise HTTPException(status_code=400, detail="Invalid target_group. Use: volunteers, submissions, proam")
    
    # Remove duplicates
    unique_emails = list(set(emails))
    
    if not unique_emails:
        return {"success": False, "message": "No recipients found matching the criteria", "sent_count": 0}
    
    # Create HTML email template
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #1a472a 0%, #2d5016 100%); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; }}
            .content {{ padding: 30px; background: #fff; }}
            .footer {{ background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Magical Kenya Open 2026</h1>
            </div>
            <div class="content">
                <h2>{subject}</h2>
                <div>{message.replace(chr(10), '<br>')}</div>
            </div>
            <div class="footer">
                <p>Kenya Open Golf Limited | Nairobi, Kenya</p>
                <p>This is an automated message from the MKO Accreditation System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_text = f"{subject}\n\n{message}\n\n---\nMagical Kenya Open 2026\nKenya Open Golf Limited"
    
    # Send emails (in batches to avoid overwhelming SMTP)
    success_count = 0
    failed_emails = []
    
    for email in unique_emails:
        try:
            result = await send_email(email, f"[MKO 2026] {subject}", html_content, plain_text)
            if result:
                success_count += 1
            else:
                failed_emails.append(email)
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {e}")
            failed_emails.append(email)
    
    # Log the bulk email action
    await db.audit_logs.insert_one({
        "log_id": str(uuid.uuid4()),
        "action": "bulk_email_sent",
        "target_group": target_group,
        "status_filter": status_filter,
        "total_recipients": len(unique_emails),
        "success_count": success_count,
        "failed_count": len(failed_emails),
        "subject": subject,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "performed_by": "CIO"
    })
    
    return {
        "success": True,
        "message": "Bulk email sent successfully",
        "total_recipients": len(unique_emails),
        "success_count": success_count,
        "failed_count": len(failed_emails),
        "failed_emails": failed_emails[:10] if failed_emails else [] # Show first 10 failed
    }

@api_router.get("/superadmin/bulk-email/preview")
async def preview_bulk_email_recipients(request: Request, target_group: str, status: str = "approved"):
    """Preview recipients for bulk email (CIO only)"""
    await require_cio_auth(request)
    
    emails = []
    
    if target_group == "volunteers":
        query = {"status": status} if status != "all" else {}
        async for volunteer in db.volunteers.find(query, {"email": 1, "full_name": 1, "role": 1}):
            if volunteer.get("email"):
                emails.append({
                    "email": volunteer["email"],
                    "name": volunteer.get("full_name", "N/A"),
                    "role": volunteer.get("role", "N/A")
                })
    
    elif target_group == "submissions":
        query = {"status": status} if status != "all" else {}
        async for submission in db.accreditation_submissions.find(query, {"data": 1, "module_id": 1}):
            email = submission.get("data", {}).get("email")
            if email:
                emails.append({
                    "email": email,
                    "name": submission.get("data", {}).get("full_name", "N/A"),
                    "module": submission.get("module_id", "N/A")
                })
    
    elif target_group == "proam":
        query = {"status": status} if status != "all" else {}
        async for reg in db.proam_registrations.find(query, {"contact_email": 1, "company_name": 1}):
            if reg.get("contact_email"):
                emails.append({
                    "email": reg["contact_email"],
                    "name": reg.get("company_name", "N/A"),
                    "type": "Pro-Am Registration"
                })
    
    else:
        raise HTTPException(status_code=400, detail="Invalid target_group")
    
    unique_emails = {e["email"]: e for e in emails}.values()
    
    return {
        "target_group": target_group,
        "status_filter": status,
        "total_count": len(list(unique_emails)),
        "recipients": list(unique_emails)[:50] # Return first 50 for preview
    }

# ===================== CMS - PAGES MANAGEMENT =====================
class ContentStatus(str, Enum):
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"
    ARCHIVED = "archived"

class PageCreate(BaseModel):
    title: str
    slug: str
    content: str
    excerpt: Optional[str] = ""
    meta_title: Optional[str] = ""
    meta_description: Optional[str] = ""
    featured_image: Optional[str] = ""
    status: str = "draft"
    publish_at: Optional[str] = None
    unpublish_at: Optional[str] = None

@api_router.get("/webmaster/pages")
async def get_pages(request: Request, status: Optional[str] = None):
    """Get all CMS pages"""
    await require_webmaster_auth(request)
    query = {}
    if status:
        query["status"] = status
    pages = await db.cms_pages.find(query, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return pages

@api_router.get("/webmaster/pages/{page_id}")
async def get_page(request: Request, page_id: str):
    """Get single page with revision history"""
    await require_webmaster_auth(request)
    page = await db.cms_pages.find_one({"page_id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    # Get revision history
    revisions = await db.cms_revisions.find(
        {"page_id": page_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    page["revisions"] = revisions
    return page

@api_router.post("/webmaster/pages")
async def create_page(request: Request, page: PageCreate):
    """Create new CMS page"""
    session = await require_webmaster_auth(request)
    
    # Check slug uniqueness
    existing = await db.cms_pages.find_one({"slug": page.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Page with this slug already exists")
    
    page_id = f"page_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    page_doc = {
        "page_id": page_id,
        "title": page.title,
        "slug": page.slug,
        "content": page.content,
        "excerpt": page.excerpt,
        "meta_title": page.meta_title or page.title,
        "meta_description": page.meta_description,
        "featured_image": page.featured_image,
        "status": page.status,
        "publish_at": page.publish_at,
        "unpublish_at": page.unpublish_at,
        "author": session.get("username", "webmaster"),
        "created_at": now,
        "updated_at": now,
        "version": 1
    }
    
    await db.cms_pages.insert_one(page_doc)
    
    # Create initial revision
    await db.cms_revisions.insert_one({
        "revision_id": f"rev_{uuid.uuid4().hex[:12]}",
        "page_id": page_id,
        "title": page.title,
        "content": page.content,
        "version": 1,
        "author": session.get("username"),
        "created_at": now,
        "change_summary": "Initial creation"
    })
    
    return {"success": True, "page_id": page_id}

@api_router.put("/webmaster/pages/{page_id}")
async def update_page(request: Request, page_id: str, update: dict):
    """Update CMS page and create revision"""
    session = await require_webmaster_auth(request)
    
    existing = await db.cms_pages.find_one({"page_id": page_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Check slug uniqueness if changing
    if "slug" in update and update["slug"] != existing.get("slug"):
        slug_exists = await db.cms_pages.find_one({"slug": update["slug"], "page_id": {"$ne": page_id}})
        if slug_exists:
            raise HTTPException(status_code=400, detail="Slug already in use")
    
    now = datetime.now(timezone.utc).isoformat()
    new_version = existing.get("version", 1) + 1
    
    update["updated_at"] = now
    update["version"] = new_version
    
    await db.cms_pages.update_one({"page_id": page_id}, {"$set": update})
    
    # Create revision if content changed
    if "content" in update or "title" in update:
        await db.cms_revisions.insert_one({
            "revision_id": f"rev_{uuid.uuid4().hex[:12]}",
            "page_id": page_id,
            "title": update.get("title", existing.get("title")),
            "content": update.get("content", existing.get("content")),
            "version": new_version,
            "author": session.get("username"),
            "created_at": now,
            "change_summary": update.get("change_summary", "Content updated")
        })
    
    return {"success": True}

@api_router.post("/webmaster/pages/{page_id}/submit-review")
async def submit_page_for_review(request: Request, page_id: str):
    """Submit page for editorial review"""
    session = await require_webmaster_auth(request)
    
    page = await db.cms_pages.find_one({"page_id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    if page.get("status") != "draft":
        raise HTTPException(status_code=400, detail="Only draft pages can be submitted for review")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.cms_pages.update_one(
        {"page_id": page_id},
        {"$set": {"status": "review", "submitted_at": now, "submitted_by": session.get("username")}}
    )
    
    return {"success": True, "message": "Page submitted for review"}

@api_router.post("/webmaster/pages/{page_id}/approve")
async def approve_page(request: Request, page_id: str, data: dict = {}):
    """Approve and publish page (requires editor role)"""
    session = await require_webmaster_auth(request)
    
    # Check if user has approval rights
    if session.get("role") not in ["webmaster", "editor", "admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions to approve")
    
    page = await db.cms_pages.find_one({"page_id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    now = datetime.now(timezone.utc).isoformat()
    publish_at = data.get("publish_at")
    
    update_data = {
        "approved_by": session.get("username"),
        "approved_at": now,
        "updated_at": now
    }
    
    if publish_at:
        update_data["status"] = "scheduled"
        update_data["publish_at"] = publish_at
    else:
        update_data["status"] = "published"
        update_data["published_at"] = now
    
    await db.cms_pages.update_one({"page_id": page_id}, {"$set": update_data})
    
    return {"success": True, "message": "Page approved", "status": update_data.get("status")}

@api_router.post("/webmaster/pages/{page_id}/reject")
async def reject_page(request: Request, page_id: str, data: dict):
    """Reject page and send back to draft"""
    session = await require_webmaster_auth(request)
    
    page = await db.cms_pages.find_one({"page_id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.cms_pages.update_one(
        {"page_id": page_id},
        {"$set": {
            "status": "draft",
            "rejection_reason": data.get("reason", ""),
            "rejected_by": session.get("username"),
            "rejected_at": now
        }}
    )
    
    return {"success": True, "message": "Page sent back to draft"}

@api_router.post("/webmaster/pages/{page_id}/unpublish")
async def unpublish_page(request: Request, page_id: str):
    """Unpublish a page"""
    await require_webmaster_auth(request)
    
    now = datetime.now(timezone.utc).isoformat()
    await db.cms_pages.update_one(
        {"page_id": page_id},
        {"$set": {"status": "draft", "unpublished_at": now}}
    )
    
    return {"success": True, "message": "Page unpublished"}

@api_router.post("/webmaster/pages/{page_id}/restore/{revision_id}")
async def restore_revision(request: Request, page_id: str, revision_id: str):
    """Restore page to a previous revision"""
    session = await require_webmaster_auth(request)
    
    revision = await db.cms_revisions.find_one({"revision_id": revision_id, "page_id": page_id})
    if not revision:
        raise HTTPException(status_code=404, detail="Revision not found")
    
    page = await db.cms_pages.find_one({"page_id": page_id})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    now = datetime.now(timezone.utc).isoformat()
    new_version = page.get("version", 1) + 1
    
    await db.cms_pages.update_one(
        {"page_id": page_id},
        {"$set": {
            "title": revision.get("title"),
            "content": revision.get("content"),
            "version": new_version,
            "status": "draft"
        }}
    )
    
    # Create new revision for the restore
    await db.cms_revisions.insert_one({
        "revision_id": f"rev_{uuid.uuid4().hex[:12]}",
        "page_id": page_id,
        "title": revision.get("title"),
        "content": revision.get("content"),
        "version": new_version,
        "author": session.get("username"),
        "created_at": now,
        "change_summary": f"Restored from version {revision.get('version')}"
    })
    
    return {"success": True, "message": f"Restored to version {revision.get('version')}"}

@api_router.delete("/webmaster/pages/{page_id}")
async def delete_page(request: Request, page_id: str):
    """Delete a CMS page"""
    await require_webmaster_auth(request)
    
    result = await db.cms_pages.delete_one({"page_id": page_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Also delete revisions
    await db.cms_revisions.delete_many({"page_id": page_id})
    
    return {"success": True, "message": "Page deleted"}

# ===================== CMS - MEDIA LIBRARY =====================
@api_router.get("/webmaster/media")
async def get_media_library(request: Request, media_type: Optional[str] = None, search: Optional[str] = None):
    """Get media library items"""
    await require_webmaster_auth(request)
    
    query = {}
    if media_type:
        query["type"] = media_type
    if search:
        query["$or"] = [
            {"filename": {"$regex": search, "$options": "i"}},
            {"alt_text": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    # Exclude file_data from listing to keep response small
    media = await db.media_library.find(query, {"_id": 0, "file_data": 0}).sort("uploaded_at", -1).to_list(200)
    return media

@api_router.post("/webmaster/media")
async def upload_media(request: Request, file: UploadFile = File(...), alt_text: str = "", tags: str = ""):
    """Upload media to library"""
    session = await require_webmaster_auth(request)
    
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024: # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
    media_id = f"media_{uuid.uuid4().hex[:12]}"
    filename = f"{media_id}.{ext}"
    
    # Save file locally (for preview environment)
    upload_dir = Path("./uploads/media")
    upload_dir.mkdir(parents=True, exist_ok=True)
    filepath = upload_dir / filename
    
    async with aiofiles.open(filepath, "wb") as f:
        await f.write(contents)
    
    # Determine type
    media_type = "image" if file.content_type.startswith("image") else "video" if file.content_type.startswith("video") else "document"
    
    # Store file data as base64 in MongoDB for production persistence
    # Only store images up to 5MB in database to avoid bloat
    file_data_b64 = None
    if len(contents) <= 5 * 1024 * 1024 and media_type == "image":
        file_data_b64 = base64.b64encode(contents).decode('utf-8')
    
    now = datetime.now(timezone.utc).isoformat()
    media_doc = {
        "media_id": media_id,
        "filename": file.filename,
        "stored_filename": filename,
        "url": f"/api/uploads/media/{filename}",
        "type": media_type,
        "mime_type": file.content_type,
        "size": len(contents),
        "alt_text": alt_text,
        "tags": [t.strip() for t in tags.split(",") if t.strip()],
        "uploaded_by": session.get("username"),
        "uploaded_at": now,
        "file_data": file_data_b64 # Store base64 for persistence in production
    }
    
    await db.media_library.insert_one(media_doc)
    
    return {"success": True, "media_id": media_id, "url": media_doc["url"]}

@api_router.put("/webmaster/media/{media_id}")
async def update_media(request: Request, media_id: str, update: dict):
    """Update media metadata"""
    await require_webmaster_auth(request)
    
    allowed_fields = ["alt_text", "tags"]
    safe_update = {k: v for k, v in update.items() if k in allowed_fields}
    
    if "tags" in safe_update and isinstance(safe_update["tags"], str):
        safe_update["tags"] = [t.strip() for t in safe_update["tags"].split(",") if t.strip()]
    
    await db.media_library.update_one({"media_id": media_id}, {"$set": safe_update})
    return {"success": True}

@api_router.delete("/webmaster/media/{media_id}")
async def delete_media(request: Request, media_id: str):
    """Delete media from library"""
    await require_webmaster_auth(request)
    
    media = await db.media_library.find_one({"media_id": media_id})
    if not media:
        raise HTTPException(status_code=404, detail="Media not found")
    
    # Delete file
    filepath = Path(f"./uploads/media/{media.get('stored_filename')}")
    if filepath.exists():
        filepath.unlink()
    
    await db.media_library.delete_one({"media_id": media_id})
    return {"success": True}

# ===================== CMS - PUBLIC PAGE ACCESS =====================
@api_router.get("/pages/{slug}")
async def get_public_page(slug: str):
    """Get published page by slug (public)"""
    page = await db.cms_pages.find_one(
        {"slug": slug, "status": "published"},
        {"_id": 0}
    )
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@api_router.get("/cms/pages/list")
async def list_public_pages():
    """List all published pages (for navigation)"""
    pages = await db.cms_pages.find(
        {"status": "published"},
        {"_id": 0, "title": 1, "slug": 1, "excerpt": 1, "meta_title": 1}
    ).to_list(50)
    return pages

# ===================== CMS - DASHBOARD STATS =====================
@api_router.get("/webmaster/cms-stats")
async def get_cms_stats(request: Request):
    """Get CMS statistics for dashboard"""
    await require_webmaster_auth(request)
    
    stats = {
        "pages": {
            "total": await db.cms_pages.count_documents({}),
            "published": await db.cms_pages.count_documents({"status": "published"}),
            "draft": await db.cms_pages.count_documents({"status": "draft"}),
            "review": await db.cms_pages.count_documents({"status": "review"}),
            "scheduled": await db.cms_pages.count_documents({"status": "scheduled"})
        },
        "news": {
            "total": await db.news_articles.count_documents({}),
            "published": await db.news_articles.count_documents({"status": "published"}),
            "draft": await db.news_articles.count_documents({"status": "draft"}),
            "review": await db.news_articles.count_documents({"status": "review"})
        },
        "media": {
            "total": await db.media_library.count_documents({}),
            "images": await db.media_library.count_documents({"type": "image"}),
            "videos": await db.media_library.count_documents({"type": "video"}),
            "documents": await db.media_library.count_documents({"type": "document"})
        }
    }
    
    return stats

# ===================== HALL OF FAME MANAGEMENT =====================
@api_router.get("/webmaster/hall-of-fame/champions")
async def get_hof_champions(request: Request):
    """Get all Hall of Fame champions"""
    await require_webmaster_auth(request)
    champions = await db.hof_champions.find({}, {"_id": 0}).sort("year", -1).to_list(100)
    return champions

@api_router.post("/webmaster/hall-of-fame/champions")
async def create_hof_champion(request: Request, data: dict):
    """Create a new champion entry"""
    await require_webmaster_auth(request)
    
    champion_id = f"champ_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    champion = {
        "champion_id": champion_id,
        "year": data.get("year"),
        "winner": data.get("winner"),
        "country": data.get("country"),
        "country_code": data.get("country_code", ""),
        "score": data.get("score", ""),
        "venue": data.get("venue", "Karen Country Club"),
        "runner_up": data.get("runner_up", ""),
        "purse": data.get("purse", ""),
        "image": data.get("image", ""),
        "created_at": now,
        "updated_at": now
    }
    
    await db.hof_champions.insert_one(champion)
    return {"success": True, "champion_id": champion_id}

@api_router.put("/webmaster/hall-of-fame/champions/{champion_id}")
async def update_hof_champion(request: Request, champion_id: str, data: dict):
    """Update a champion entry"""
    await require_webmaster_auth(request)
    
    allowed = ["year", "winner", "country", "country_code", "score", "venue", "runner_up", "purse", "image"]
    update = {k: v for k, v in data.items() if k in allowed}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hof_champions.update_one({"champion_id": champion_id}, {"$set": update})
    return {"success": True}

@api_router.delete("/webmaster/hall-of-fame/champions/{champion_id}")
async def delete_hof_champion(request: Request, champion_id: str):
    """Delete a champion entry"""
    await require_webmaster_auth(request)
    await db.hof_champions.delete_one({"champion_id": champion_id})
    return {"success": True}

@api_router.get("/webmaster/hall-of-fame/inductees")
async def get_hof_inductees(request: Request):
    """Get all Hall of Fame inductees"""
    await require_webmaster_auth(request)
    inductees = await db.hof_inductees.find({}, {"_id": 0}).sort([("year", -1), ("name", 1)]).to_list(100)
    return inductees

@api_router.post("/webmaster/hall-of-fame/inductees")
async def create_hof_inductee(request: Request, data: dict):
    """Create a new inductee entry"""
    await require_webmaster_auth(request)
    
    inductee_id = f"ind_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    inductee = {
        "inductee_id": inductee_id,
        "name": data.get("name"),
        "category": data.get("category"),
        "year": data.get("year"),
        "achievement": data.get("achievement", ""),
        "image": data.get("image", ""),
        "created_at": now,
        "updated_at": now
    }
    
    await db.hof_inductees.insert_one(inductee)
    return {"success": True, "inductee_id": inductee_id}

@api_router.put("/webmaster/hall-of-fame/inductees/{inductee_id}")
async def update_hof_inductee(request: Request, inductee_id: str, data: dict):
    """Update an inductee entry"""
    await require_webmaster_auth(request)
    
    allowed = ["name", "category", "year", "achievement", "image"]
    update = {k: v for k, v in data.items() if k in allowed}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.hof_inductees.update_one({"inductee_id": inductee_id}, {"$set": update})
    return {"success": True}

@api_router.delete("/webmaster/hall-of-fame/inductees/{inductee_id}")
async def delete_hof_inductee(request: Request, inductee_id: str):
    """Delete an inductee entry"""
    await require_webmaster_auth(request)
    await db.hof_inductees.delete_one({"inductee_id": inductee_id})
    return {"success": True}

# Public API for Hall of Fame
@api_router.get("/hall-of-fame")
async def get_public_hall_of_fame():
    """Get public Hall of Fame data (only entries with images)"""
    champions = await db.hof_champions.find(
        {"image": {"$ne": "", "$exists": True}},
        {"_id": 0}
    ).sort("year", -1).to_list(100)
    
    inductees = await db.hof_inductees.find(
        {"image": {"$ne": "", "$exists": True}},
        {"_id": 0}
    ).sort([("year", -1), ("name", 1)]).to_list(100)
    
    return {"champions": champions, "inductees": inductees}

# ===================== SITE CONFIGURATION (CMS-Driven) =====================
@api_router.get("/site-config")
async def get_site_config():
    """Get all site configuration for frontend - NO REDEPLOY NEEDED"""
    config = await db.site_config.find_one({"config_id": "main"}, {"_id": 0})
    if not config:
        # Return defaults if no config exists
        config = {
            "hero_images": [],
            "featured_content": [],
            "partner_logos": {
                "main_partner": {"name": "", "logo_url": "", "alt": ""},
                "official_partners": [],
                "tournament_sponsors": []
            },
            "ctas": {
                "primary": {"text": "Get Tickets", "url": "/tickets"},
                "secondary": {"text": "Volunteer", "url": "/volunteer"}
            },
            "social_links": {},
            "contact_info": {}
        }
    return config

@api_router.get("/webmaster/site-config")
async def get_webmaster_site_config(request: Request):
    """Get site configuration for editing"""
    await require_webmaster_auth(request)
    config = await db.site_config.find_one({"config_id": "main"}, {"_id": 0})
    return config or {}

@api_router.put("/webmaster/site-config")
async def update_site_config(request: Request, data: dict):
    """Update site configuration - changes reflect immediately without redeploy"""
    await require_webmaster_auth(request)
    
    data["config_id"] = "main"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.site_config.update_one(
        {"config_id": "main"},
        {"$set": data},
        upsert=True
    )
    return {"success": True}

# Full Hall of Fame data (for CMS to fully manage champions/inductees)
@api_router.get("/hall-of-fame/full")
async def get_full_hall_of_fame():
    """Get ALL Hall of Fame data including entries without images"""
    champions = await db.hof_champions.find({}, {"_id": 0}).sort("year", -1).to_list(100)
    inductees = await db.hof_inductees.find({}, {"_id": 0}).sort([("year", -1), ("name", 1)]).to_list(100)
    return {"champions": champions, "inductees": inductees}

# ===================== CMS - CONTENT TEMPLATES =====================
TEMPLATE_CATEGORIES = [
    {"id": "header", "name": "Header Sections", "icon": "layout"},
    {"id": "content", "name": "Content Blocks", "icon": "file-text"},
    {"id": "faq", "name": "FAQ Sections", "icon": "help-circle"},
    {"id": "cta", "name": "Call to Action", "icon": "mouse-pointer"},
    {"id": "gallery", "name": "Image Galleries", "icon": "image"},
    {"id": "contact", "name": "Contact Forms", "icon": "mail"},
    {"id": "team", "name": "Team/Staff", "icon": "users"},
    {"id": "testimonial", "name": "Testimonials", "icon": "quote"},
    {"id": "pricing", "name": "Pricing Tables", "icon": "dollar-sign"},
    {"id": "footer", "name": "Footer Sections", "icon": "layout"}
]

@api_router.get("/webmaster/templates/categories")
async def get_template_categories(request: Request):
    """Get available template categories"""
    await require_webmaster_auth(request)
    return {"categories": TEMPLATE_CATEGORIES}

@api_router.get("/webmaster/templates")
async def get_content_templates(request: Request, category: Optional[str] = None):
    """Get all content templates"""
    await require_webmaster_auth(request)
    
    query = {}
    if category:
        query["category"] = category
    
    templates = await db.content_templates.find(query, {"_id": 0}).sort("name", 1).to_list(200)
    
    # If no templates exist, seed with defaults
    if not templates:
        await seed_default_templates()
        templates = await db.content_templates.find(query, {"_id": 0}).sort("name", 1).to_list(200)
    
    return templates

@api_router.get("/webmaster/templates/{template_id}")
async def get_template(request: Request, template_id: str):
    """Get single template"""
    await require_webmaster_auth(request)
    template = await db.content_templates.find_one({"template_id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@api_router.post("/webmaster/templates")
async def create_template(request: Request, data: dict):
    """Create new content template"""
    session = await require_webmaster_auth(request)
    
    template_id = f"tpl_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    template = {
        "template_id": template_id,
        "name": data.get("name", "Untitled Template"),
        "description": data.get("description", ""),
        "category": data.get("category", "content"),
        "content": data.get("content", ""),
        "thumbnail": data.get("thumbnail", ""),
        "is_system": False,
        "created_by": session.get("username"),
        "created_at": now,
        "updated_at": now,
        "usage_count": 0
    }
    
    await db.content_templates.insert_one(template)
    return {"success": True, "template_id": template_id}

@api_router.put("/webmaster/templates/{template_id}")
async def update_template(request: Request, template_id: str, data: dict):
    """Update content template"""
    await require_webmaster_auth(request)
    
    template = await db.content_templates.find_one({"template_id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template.get("is_system"):
        raise HTTPException(status_code=403, detail="Cannot modify system templates")
    
    allowed = ["name", "description", "category", "content", "thumbnail"]
    update = {k: v for k, v in data.items() if k in allowed}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.content_templates.update_one({"template_id": template_id}, {"$set": update})
    return {"success": True}

@api_router.delete("/webmaster/templates/{template_id}")
async def delete_template(request: Request, template_id: str):
    """Delete content template"""
    await require_webmaster_auth(request)
    
    template = await db.content_templates.find_one({"template_id": template_id})
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template.get("is_system"):
        raise HTTPException(status_code=403, detail="Cannot delete system templates")
    
    await db.content_templates.delete_one({"template_id": template_id})
    return {"success": True}

@api_router.post("/webmaster/templates/{template_id}/use")
async def use_template(request: Request, template_id: str):
    """Increment template usage count"""
    await require_webmaster_auth(request)
    await db.content_templates.update_one(
        {"template_id": template_id},
        {"$inc": {"usage_count": 1}}
    )
    return {"success": True}

async def seed_default_templates():
    """Seed default content templates"""
    default_templates = [
        {
            "template_id": "tpl_hero_centered",
            "name": "Centered Hero Section",
            "description": "A centered hero section with title, subtitle, and call-to-action button",
            "category": "header",
            "is_system": True,
            "content": """<div style="text-align: center; padding: 60px 20px; background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; border-radius: 8px;">
  <h1 style="font-size: 3rem; margin-bottom: 1rem;">Your Page Title</h1>
  <p style="font-size: 1.25rem; opacity: 0.9; max-width: 600px; margin: 0 auto 2rem;">Add your compelling subtitle or description here to engage visitors.</p>
  <a href="#" style="display: inline-block; background: #D50032; color: white; padding: 12px 32px; border-radius: 4px; text-decoration: none; font-weight: 600;">Get Started</a>
</div>"""
        },
        {
            "template_id": "tpl_faq_accordion",
            "name": "FAQ Accordion Section",
            "description": "Expandable FAQ section with questions and answers",
            "category": "faq",
            "is_system": True,
            "content": """<div style="max-width: 800px; margin: 0 auto;">
  <h2 style="text-align: center; margin-bottom: 2rem;">Frequently Asked Questions</h2>
  
  <div style="border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 1rem;">
    <div style="padding: 1rem; font-weight: 600; cursor: pointer; background: #f9f9f9;">Q: What is the Magical Kenya Open?</div>
    <div style="padding: 1rem; border-top: 1px solid #e5e5e5;">A: The Magical Kenya Open is a professional golf tournament on the DP World Tour, held annually at Karen Country Club in Nairobi, Kenya.</div>
  </div>
  
  <div style="border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 1rem;">
    <div style="padding: 1rem; font-weight: 600; cursor: pointer; background: #f9f9f9;">Q: How can I buy tickets?</div>
    <div style="padding: 1rem; border-top: 1px solid #e5e5e5;">A: Tickets can be purchased through our official ticketing partner. Visit the Tickets page for more information.</div>
  </div>
  
  <div style="border: 1px solid #e5e5e5; border-radius: 8px; margin-bottom: 1rem;">
    <div style="padding: 1rem; font-weight: 600; cursor: pointer; background: #f9f9f9;">Q: Can I volunteer at the tournament?</div>
    <div style="padding: 1rem; border-top: 1px solid #e5e5e5;">A: Yes! We welcome volunteers for various roles including marshaling and scoring. Register through our volunteer registration page.</div>
  </div>
</div>"""
        },
        {
            "template_id": "tpl_cta_banner",
            "name": "Call to Action Banner",
            "description": "Eye-catching banner with action button",
            "category": "cta",
            "is_system": True,
            "content": """<div style="background: #D50032; color: white; padding: 40px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
  <div>
    <h3 style="font-size: 1.5rem; margin: 0 0 0.5rem 0;">Ready to Join Us?</h3>
    <p style="margin: 0; opacity: 0.9;">Don't miss the biggest golf event in East Africa!</p>
  </div>
  <a href="#" style="background: white; color: #D50032; padding: 12px 32px; border-radius: 4px; text-decoration: none; font-weight: 600;">Register Now</a>
</div>"""
        },
        {
            "template_id": "tpl_two_column",
            "name": "Two Column Layout",
            "description": "Content in two columns with image and text",
            "category": "content",
            "is_system": True,
            "content": """<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
  <div>
    <img src="https://placehold.co/600x400/1a1a1a/white?text=Your+Image" alt="Description" style="width: 100%; border-radius: 8px;" />
  </div>
  <div>
    <h2>Section Title</h2>
    <p>Add your content here. This two-column layout is perfect for showcasing features, services, or any content that benefits from visual accompaniment.</p>
    <ul>
      <li>Key point one</li>
      <li>Key point two</li>
      <li>Key point three</li>
    </ul>
  </div>
</div>"""
        },
        {
            "template_id": "tpl_team_grid",
            "name": "Team Members Grid",
            "description": "Grid layout for displaying team or staff members",
            "category": "team",
            "is_system": True,
            "content": """<div style="text-align: center; margin-bottom: 2rem;">
  <h2>Our Team</h2>
  <p style="color: #666;">Meet the people behind the tournament</p>
</div>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px;">
  <div style="text-align: center;">
    <img src="https://placehold.co/200x200/1a1a1a/white?text=Photo" alt="Team member" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem;" />
    <h4 style="margin: 0 0 0.25rem 0;">John Doe</h4>
    <p style="color: #666; margin: 0;">Tournament Director</p>
  </div>
  <div style="text-align: center;">
    <img src="https://placehold.co/200x200/1a1a1a/white?text=Photo" alt="Team member" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem;" />
    <h4 style="margin: 0 0 0.25rem 0;">Jane Smith</h4>
    <p style="color: #666; margin: 0;">Operations Manager</p>
  </div>
  <div style="text-align: center;">
    <img src="https://placehold.co/200x200/1a1a1a/white?text=Photo" alt="Team member" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem;" />
    <h4 style="margin: 0 0 0.25rem 0;">Mike Johnson</h4>
    <p style="color: #666; margin: 0;">Marketing Lead</p>
  </div>
</div>"""
        },
        {
            "template_id": "tpl_contact_info",
            "name": "Contact Information Block",
            "description": "Contact details with icons",
            "category": "contact",
            "is_system": True,
            "content": """<div style="background: #f9f9f9; padding: 40px; border-radius: 8px;">
  <h2 style="text-align: center; margin-bottom: 2rem;">Get in Touch</h2>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; text-align: center;">
    <div>
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">📍</div>
      <h4>Address</h4>
      <p style="color: #666;">Karen Country Club<br/>Nairobi, Kenya</p>
    </div>
    <div>
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">📧</div>
      <h4>Email</h4>
      <p style="color: #666;">info@kenyaopen.com</p>
    </div>
    <div>
      <div style="font-size: 2rem; margin-bottom: 0.5rem;">📞</div>
      <h4>Phone</h4>
      <p style="color: #666;">+254 20 123 4567</p>
    </div>
  </div>
</div>"""
        },
        {
            "template_id": "tpl_testimonial",
            "name": "Testimonial Quote",
            "description": "Single testimonial with quote styling",
            "category": "testimonial",
            "is_system": True,
            "content": """<div style="background: linear-gradient(135deg, #f9f9f9 0%, #fff 100%); padding: 40px; border-radius: 8px; text-align: center; border-left: 4px solid #D50032;">
  <div style="font-size: 3rem; color: #D50032; line-height: 1;">"</div>
  <blockquote style="font-size: 1.25rem; font-style: italic; color: #333; max-width: 700px; margin: 0 auto 1.5rem;">
    The Magical Kenya Open is not just a tournament, it's an experience that showcases the best of Kenyan hospitality and world-class golf.
  </blockquote>
  <div style="font-weight: 600;">— Guest Name</div>
  <div style="color: #666; font-size: 0.9rem;">Title / Organization</div>
</div>"""
        },
        {
            "template_id": "tpl_stats_row",
            "name": "Statistics Row",
            "description": "Display key statistics in a row",
            "category": "content",
            "is_system": True,
            "content": """<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; padding: 40px 0;">
  <div>
    <div style="font-size: 3rem; font-weight: 700; color: #D50032;">$2.7M</div>
    <div style="color: #666;">Prize Fund</div>
  </div>
  <div>
    <div style="font-size: 3rem; font-weight: 700; color: #D50032;">156</div>
    <div style="color: #666;">Players</div>
  </div>
  <div>
    <div style="font-size: 3rem; font-weight: 700; color: #D50032;">4</div>
    <div style="color: #666;">Days</div>
  </div>
  <div>
    <div style="font-size: 3rem; font-weight: 700; color: #D50032;">50K+</div>
    <div style="color: #666;">Spectators</div>
  </div>
</div>"""
        },
        {
            "template_id": "tpl_image_gallery",
            "name": "Image Gallery Grid",
            "description": "Simple 3-column image gallery",
            "category": "gallery",
            "is_system": True,
            "content": """<div style="margin: 2rem 0;">
  <h2 style="text-align: center; margin-bottom: 1.5rem;">Photo Gallery</h2>
  <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
    <img src="https://placehold.co/400x300/1a1a1a/white?text=Image+1" alt="Gallery image" style="width: 100%; border-radius: 8px;" />
    <img src="https://placehold.co/400x300/1a1a1a/white?text=Image+2" alt="Gallery image" style="width: 100%; border-radius: 8px;" />
    <img src="https://placehold.co/400x300/1a1a1a/white?text=Image+3" alt="Gallery image" style="width: 100%; border-radius: 8px;" />
    <img src="https://placehold.co/400x300/1a1a1a/white?text=Image+4" alt="Gallery image" style="width: 100%; border-radius: 8px;" />
    <img src="https://placehold.co/400x300/1a1a1a/white?text=Image+5" alt="Gallery image" style="width: 100%; border-radius: 8px;" />
    <img src="https://placehold.co/400x300/1a1a1a/white?text=Image+6" alt="Gallery image" style="width: 100%; border-radius: 8px;" />
  </div>
</div>"""
        },
        {
            "template_id": "tpl_pricing_table",
            "name": "Pricing/Ticket Table",
            "description": "Display pricing options in cards",
            "category": "pricing",
            "is_system": True,
            "content": """<div style="text-align: center; margin-bottom: 2rem;">
  <h2>Ticket Options</h2>
  <p style="color: #666;">Choose the best option for you</p>
</div>
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
  <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px; text-align: center;">
    <h3>Daily Pass</h3>
    <div style="font-size: 2.5rem; font-weight: 700; color: #D50032; margin: 1rem 0;">KES 500</div>
    <ul style="list-style: none; padding: 0; margin: 1.5rem 0;">
      <li style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">Single day access</li>
      <li style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">General admission</li>
      <li style="padding: 0.5rem 0;">Food court access</li>
    </ul>
    <a href="#" style="display: block; background: #D50032; color: white; padding: 12px; border-radius: 4px; text-decoration: none;">Buy Now</a>
  </div>
  <div style="border: 2px solid #D50032; border-radius: 8px; padding: 30px; text-align: center; position: relative;">
    <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #D50032; color: white; padding: 4px 16px; border-radius: 20px; font-size: 0.8rem;">BEST VALUE</div>
    <h3>Season Pass</h3>
    <div style="font-size: 2.5rem; font-weight: 700; color: #D50032; margin: 1rem 0;">KES 1,500</div>
    <ul style="list-style: none; padding: 0; margin: 1.5rem 0;">
      <li style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">All 4 days access</li>
      <li style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">Priority entry</li>
      <li style="padding: 0.5rem 0;">Souvenir included</li>
    </ul>
    <a href="#" style="display: block; background: #D50032; color: white; padding: 12px; border-radius: 4px; text-decoration: none;">Buy Now</a>
  </div>
  <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 30px; text-align: center;">
    <h3>VIP Pass</h3>
    <div style="font-size: 2.5rem; font-weight: 700; color: #D50032; margin: 1rem 0;">KES 5,000</div>
    <ul style="list-style: none; padding: 0; margin: 1.5rem 0;">
      <li style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">All 4 days access</li>
      <li style="padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0;">VIP hospitality tent</li>
      <li style="padding: 0.5rem 0;">Exclusive parking</li>
    </ul>
    <a href="#" style="display: block; background: #D50032; color: white; padding: 12px; border-radius: 4px; text-decoration: none;">Buy Now</a>
  </div>
</div>"""
        }
    ]
    
    now = datetime.now(timezone.utc).isoformat()
    for tpl in default_templates:
        tpl["created_at"] = now
        tpl["updated_at"] = now
        tpl["usage_count"] = 0
        tpl["created_by"] = "system"
        existing = await db.content_templates.find_one({"template_id": tpl["template_id"]})
        if not existing:
            await db.content_templates.insert_one(tpl)

# ===================== HEALTH CHECK =====================
@api_router.get("/")
async def root():
    return {"message": "Magical Kenya Open API", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Root-level health check for Kubernetes (without /api prefix)
@app.get("/health")
async def kubernetes_health_check():
    """Health check endpoint for Kubernetes probes"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS - Handle credentials properly
cors_origins_env = os.environ.get('CORS_ORIGINS', '')
if cors_origins_env == '*' or cors_origins_env == '':
    # When using wildcard or empty, we need to handle CORS dynamically
    # to support credentials (cookies)
    cors_origins = ["*"]
    cors_allow_credentials = False  # Cannot use credentials with wildcard
else:
    cors_origins = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]
    cors_allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_credentials=cors_allow_credentials,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()