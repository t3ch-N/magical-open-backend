# Magical Kenya Open - Product Requirements Document

## Original Problem Statement
Build a professional international golf tournament website and digital operations platform for the Magical Kenya Open, including public fan content, tickets and hospitality information, media and broadcast resources, and secure role-based registration modules for media, volunteers, vendors, and junior golf participants with ability for news and content (videos, photos), leaderboard etc.

## User Personas
1. **Golf Fans/Spectators** - Access leaderboard, buy tickets, view news/gallery
2. **Media/Press** - Access media resources, request accreditation
3. **Volunteers** - Register for volunteer roles
4. **Vendors** - Apply for vendor accreditation
5. **Junior Golf Participants** - Register for junior programs
6. **Admin/Organizers** - Manage content, users, leaderboard, enquiries

## Core Requirements (Static)
- Premium golf tournament website with Kenyan identity
- Live/mock leaderboard with player data
- Tickets & hospitality info with enquiry forms
- Role-based registration (Google OAuth)
- Admin dashboard for content management
- Editorial workflow (draft/review/publish)
- News & gallery sections
- Tournament information & history

## What's Been Implemented (V1 - January 2025)

### Pages Completed
- ✅ Home (hero, countdown, leaderboard preview, news, sponsors)
- ✅ Tournament (about, course, schedule, past winners tabs)
- ✅ Players & Leaderboard (live scores table, search, filtering)
- ✅ Tickets & Hospitality (packages, enquiry modal)
- ✅ Travel & Experience (hotels, attractions, tips)
- ✅ Media & Broadcast (schedule, resources, accreditation)
- ✅ Registration & Accreditation (Google OAuth, role selection)
- ✅ News & Gallery (articles, photo grid, lightbox)
- ✅ About Tournament (history, timeline, impact)
- ✅ About KOGL (organization info, partners)
- ✅ Contact (form, social links)
- ✅ Admin Dashboard (overview, users, content, leaderboard, enquiries)

### Backend APIs
- Auth (Google OAuth, session management, role requests)
- Users (CRUD, role approval workflow)
- Players & Leaderboard (CRUD with mock data)
- News/Content (create, update, publish, delete)
- Gallery (photos/videos management)
- Tickets/Packages
- Enquiries & Contact forms
- Tournament info endpoints

### Design System
- Playfair Display + Barlow Condensed + DM Sans fonts
- Kenya green (#1a472a) + Magical red (#e31937) + Safari gold (#d4af37)
- Premium photography-focused design
- Responsive mobile-first approach

## Prioritized Backlog

### P0 (Critical - Next Phase)
- Live API integration for real tournament scores
- Email notifications for registration approvals
- Image upload functionality for admin

### P1 (High Priority)
- Stripe/payment integration for tickets
- Player profile detail pages
- Video player for gallery videos
- Push notifications for score updates

### P2 (Medium Priority)
- Social sharing for news articles
- Multi-language support (Swahili)
- Dark mode toggle
- Advanced search with filters

## Tech Stack
- Frontend: React 19 + Tailwind CSS + shadcn/ui
- Backend: FastAPI + MongoDB
- Auth: Emergent Google OAuth
- Deployment: Kubernetes/Docker

## Testing Results
- Backend: 94.4% pass rate
- Frontend: 100% pass rate
- Overall: 98.2% success

## Update Log - January 2026

### Features Added (V1.1)
- ✅ **Image Upload System**: Admin can upload images via Media Library for use in news/gallery
- ✅ **2026 Tournament Update**: February 19-22, 2026 at Karen Country Club (Par 72, 6,818 yards)
- ✅ **KOGL Page Enhancement**: Added Governance, Board, Policies, Partners tabs
- ✅ **Social Media Links**: Facebook, Twitter, Instagram, YouTube, LinkedIn in footer
- ✅ **Admin Login Link**: Visible in footer for easy access

### Backend Endpoints Added
- `POST /api/admin/upload` - Upload images
- `GET /api/uploads/{filename}` - Serve uploaded files
- `GET /api/admin/uploads` - List all uploads
- `DELETE /api/admin/uploads/{filename}` - Delete upload

### Testing Results (V1.1)
- Backend: 94.4% pass rate
- Frontend: 100% pass rate
- Overall: 98.2% success

### Features Added (V1.2)
- ✅ **Email Notifications**: System ready for Gmail SMTP (add credentials to enable)
  - Sends approval email when user registration is approved
  - Sends rejection email when user registration is rejected
- ✅ **Policy Document Management**: Admin can upload/manage PDF policies
  - Upload PDFs via Admin Dashboard → Policies section
  - Policies display on public KOGL page with download links
  - Category support: Governance, Compliance, Conduct, General, Other
- ✅ **Enhanced Admin Dashboard**: 
  - Media section for image uploads
  - Policies section for PDF uploads
  - Both integrated into admin navigation

### To Enable Email Notifications
Add to `/app/backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM_EMAIL=your-gmail@gmail.com
SMTP_FROM_NAME=Magical Kenya Open
```
Then restart backend: `sudo supervisorctl restart backend`

### Features Added (V1.3 - January 2025)
- ✅ **Homepage Media Carousel**: Featured content with videos, articles, gallery items
- ✅ **Player Spotlight Section**: Showcasing key players with photos
- ✅ **Venue Update**: Karen Country Club as 2026 host venue with course details
- ✅ **Kenya Experience CTA**: Promotional section for safari/tourism

### Features Added (V1.4 - January 2025)
- ✅ **Updated Sponsor Logos**: Added official sponsor images provided by user
  - Main Partner: Ministry of Youth Affairs, Creative Economy and Sports (Government of Kenya)
  - Official Partners: DP World Tour (European Tour), Magical Kenya Open
  - Tournament Sponsors: DP World (blue logo), ABSA Kenya, Johnnie Walker, SportPesa
- ✅ **Top Banner**: DP World Tour logo (left) + KOGL logo (right) - no "Official Partners" text
- ✅ **Sponsors Section Hierarchy**: Clear visual hierarchy with Main Partner, Official Partners, and Tournament Sponsors
- ✅ **KOGL Page Logo**: Added KOGL logo prominently on About KOGL page
- ✅ **Removed Emergent Branding**: "Made with Emergent" badge removed, page title updated to "Magical Kenya Open | DP World Tour"
- ✅ **Registration Disabled**: Public Google OAuth registration temporarily disabled (Coming Soon)

**Important Distinction:**
- DP World Tour = European Tour organization (Magical Kenya Open is part of this tour)
- DP World = Company sponsor (appears in Tournament Sponsors section)

### Features Added (V1.5 - January 2025)
- ✅ **Volunteer Registration System** (`/volunteer-register`)
  - Public registration form (no login required)
  - Fields: Name, Nationality, ID/Passport, Email, Phone, Golf Club, Role (Marshal/Scorer)
  - Availability selection for all 4 tournament days (Feb 19-22, 2026)
  - Consent acknowledgment checkbox
  - Success confirmation page after submission
  - Quotas: Minimum 150 marshals, Maximum 60 scorers

- ✅ **Marshal Dashboard** (`/marshal-dashboard`)
  - Secure username/password authentication (no Google OAuth)
  - Role-based access control:
    - **Chief Marshal**: Full access (user management, approvals, all features)
    - **Area Supervisor**: View volunteers + mark attendance
    - **Admin**: Data corrections + approvals
    - **Viewer**: Read-only access
  - Dashboard Tabs:
    - **Overview**: Stats cards, role breakdown, quick actions
    - **Volunteers**: Full list with search, filter by status/role, approve/reject
    - **Attendance**: Daily attendance tracking (present/absent/late) per tournament day
    - **Users**: User management (Chief Marshal only)
  - CSV/Excel export for volunteers and attendance
  - Session timeout (8 hours)
  - No indexing by search engines (noindex meta tag)
  - Fully KOGL branded (no Emergent branding)

**Default Chief Marshal Credentials:**
- Username: `chiefmarshal`
- Password: `MKO2026Admin!`

**Test Report:** 30/30 tests passed (100% backend + frontend)

## Prioritized Backlog (Updated)

### P0 (Critical - Next Phase)
- ✅ ~~Update homepage sponsor logos~~ (COMPLETED)
- ✅ ~~Volunteer Registration System~~ (COMPLETED)
- ✅ ~~Marshal Dashboard~~ (COMPLETED)
- Email notifications (BLOCKED - waiting for user Gmail credentials)
- PDF downloads for policies (ensure download functionality works)

### P1 (High Priority)
- Live API integration for real tournament scores
- Board member photo uploads
- Player profile detail pages
- Volunteer assignment to specific holes/zones in marshal dashboard

### P2 (Medium Priority)
- Stripe/payment integration for tickets
- Social sharing for news articles
- Multi-language support (Swahili)

---

## Features Added (V2.0 - Unified Accreditation Platform - January 2026)

### Phase 1: Backend Architecture (COMPLETED)
- ✅ **Multi-tournament support**: Backend now supports multiple tournaments with `tournament_id` partitioning
- ✅ **Accreditation Modules Engine**: Unified system to manage 6 module types:
  - Volunteers (existing)
  - Vendors
  - Media/Press
  - Pro-Am
  - Procurement/Tenders
  - Jobs
- ✅ **Locations Management**: Create and manage venue locations
- ✅ **Zones Management**: Define access zones (VIP, Media, Course, etc.)
- ✅ **Access Levels**: Tiered access levels for badge generation
- ✅ **Operations Dashboard** (`/operations-dashboard`): Admin UI to manage tournaments, modules, locations, zones, access levels
- ✅ **Audit Trail**: All CUD operations logged with user, timestamp, and changes

### Phase 2: Public Application Pages (COMPLETED - January 20, 2026)
- ✅ **Dynamic Public Forms** (`/apply/:moduleSlug`): Single route renders module-specific forms
  - `/apply/vendors` - Vendor & Supplier Accreditation
  - `/apply/media` - Media/Press Accreditation
  - `/apply/pro-am` - Pro-Am Tournament Registration
  - `/apply/procurement` - Procurement & Tender Applications
  - `/apply/jobs` - Job Applications
- ✅ **Central Apply Page** (`/apply`): Hub page listing all application types with:
  - Color-coded module cards with icons and descriptions
  - Featured volunteer registration section
  - Quick navigation to each application form
- ✅ **Homepage Quick Access** ("Get Involved" section): 4 prominent cards on homepage:
  - Volunteer (links to `/volunteer-register`)
  - Jobs (links to `/apply/jobs`)
  - Procurement (links to `/apply/procurement`)
  - Accreditation (links to `/apply` hub)
- ✅ **Module-specific form fields**: Each module has comprehensive field configurations
- ✅ **Form validation**: Client-side required field validation with toast notifications
- ✅ **Consent checkbox**: Terms & conditions acknowledgment required
- ✅ **Success page**: Confirmation message after successful submission
- ✅ **Invalid slug handling**: Shows "Application Not Found" for non-existent modules
- ✅ **Module activation control**: Forms only available when module `is_active=true`

**Test Report:** 100% backend (11/11 tests) + 100% frontend

### Phase 2.5: Submissions Management Dashboard (COMPLETED - January 20, 2026)
- ✅ **Enhanced Submissions Tab** in Operations Dashboard with:
  - Real-time stats summary (Pending, Under Review, Approved, Rejected, Total)
  - Search and filter by module type and status
  - Bulk selection with batch approve/reject actions
  - Module icons for visual identification
  - Detailed applicant and contact information display
  - Quick action buttons (View, Mark Under Review, Approve, Reject)
  - CSV export functionality per module
- ✅ **Enhanced Detail Modal**:
  - Full application data display with categorization
  - Reviewer notes/comments functionality
  - Assignment section (Location, Access Level) for approved submissions
  - Status history tracking
  - Approve/Reject/Under Review actions with notes
- ✅ **Workflow States**: submitted → under_review → approved/rejected → assigned

### Phase 3: Pro-Am Module (COMPLETED - January 20, 2026)
**Public Website Pages:**
- ✅ `/pro-am` - Pro-Am landing page with:
  - Overview tab: Event description, eligibility rules, entry fee (KES 30,000), format details, playing tees info, past winners
  - Register tab: Link to registration form
  - Tee Times & Draw tab: Public searchable tee sheet (when published)
  - Terms tab: Full Terms of Competition
- ✅ `/pro-am/register` - Comprehensive registration form with:
  - Personal details, golf handicap validation (Men ≤24.0, Ladies ≤32.0)
  - Document uploads (handicap certificate, ID, payment proof)
  - Emergency contact, dietary requirements, shirt size
  - Terms acceptance and data consent checkboxes
  - Duplicate registration prevention

**Admin Dashboard (Operations Dashboard → Pro-Am Tab):**
- ✅ **Registrations Management**:
  - View all registrations with stats (Pending, Approved, Paid, Rejected, Total)
  - Search and filter by status/payment
  - Document verification tracking
  - Handicap verification tracking
  - Payment status management (pending/received/verified/waived)
  - Approve/reject with reviewer notes
  - CSV export
- ✅ **Tee Times & Pairings Engine**:
  - Create tee time slots (Tee 1 / Tee 10, morning/afternoon waves)
  - Assign professionals to groups
  - Assign amateur players to groups (max 3 per group)
  - Publish/unpublish draw to public website
  - Tee sheet CSV export
- ✅ **Check-In System**:
  - Day-of check-in for confirmed players
  - Check-in timestamp tracking
  - Undo check-in capability
- ✅ **Settings Management**:
  - Registration open/close toggle
  - Draw publish/unpublish
  - Max capacity configuration
  - Entry fee configuration
  - Pro-Am date and first tee time settings

**Backend APIs Added:**
- `GET/POST /api/pro-am/register` - Public registration
- `GET /api/pro-am/status` - Registration status and availability
- `POST /api/pro-am/upload-document` - Document upload
- `GET/PUT /api/pro-am/registrations` - Admin registration management
- `GET/POST/PUT/DELETE /api/pro-am/tee-times` - Tee time management
- `POST /api/pro-am/tee-times/{id}/assign-player` - Player assignment
- `POST /api/pro-am/publish-draw` / `unpublish-draw` - Draw visibility
- `POST /api/pro-am/check-in/{id}` - Day-of check-in
- `GET /api/pro-am/export/registrations` - CSV export
- `GET /api/pro-am/export/tee-sheet` - Tee sheet export

**Database Collections:**
- `proam_registrations` - Player registrations with documents
- `proam_tee_times` - Tee time slots and pairings
- `proam_settings` - Module configuration

### Backend API Endpoints Added (V2.0)
- `GET /api/accreditation/modules` - List all modules (auth required)
- `GET /api/accreditation/modules/public` - List active public modules
- `PUT /api/accreditation/modules/{module_id}` - Update module settings
- `POST /api/accreditation/apply/{module_slug}` - Public submission endpoint
- `GET /api/accreditation/submissions` - List submissions with filters
- `PUT /api/accreditation/submissions/{submission_id}` - Update submission status
- `GET /api/accreditation/stats` - Statistics across all modules
- `GET /api/accreditation/export/{module_type}` - CSV export

### Key Database Collections (V2.0)
- `tournaments` - Multi-tournament support
- `accreditation_modules` - Module configurations
- `accreditation_submissions` - All application submissions
- `locations` - Venue locations
- `zones` - Access zones
- `access_levels` - Badge access tiers
- `audit_logs` - Change tracking

---

## Prioritized Backlog (Updated January 20, 2026)

### P0 (Critical - In Progress)
- ✅ **Phase 3: Pro-Am Module** (COMPLETED - January 20, 2026)
- 🔄 **Phase 4**: Procurement & Jobs workflow enhancements

### P1 (High Priority)
- Phase 5: Badge-ready data export functionality
- Submissions dashboard in `/operations-dashboard` to review/approve applications
- Email notifications for submission status changes (BLOCKED - needs Gmail credentials)

### P2 (Medium Priority)
- External storage for file uploads (currently using backend filesystem)
- Live leaderboard API integration
- Board member photo uploads
- Stripe ticket integration

---

## Credentials

### Marshal/Operations Dashboard
- **URL**: `/marshal-login`
- **Username**: `chiefmarshal`
- **Password**: `MKO2026Admin!`
- **Access**: `/marshal-dashboard`, `/operations-dashboard`

### Public Application URLs
- `/apply` - Central hub with all application types
- `/apply/vendors` - Vendor accreditation
- `/apply/media` - Media accreditation
- `/apply/pro-am` - Pro-Am registration
- `/apply/procurement` - Tender applications
- `/apply/jobs` - Job applications
- `/volunteer-register` - Volunteer registration (dedicated page)

---

## Features Added (V2.1 - January 21, 2026)

### Phase 4: Webmaster Portal & Multi-Role Authentication (COMPLETED)

**Webmaster Content Management Portal:**
- ✅ `/webmaster-login` - Dedicated login for content managers
- ✅ `/webmaster-dashboard` - Full CMS for website content:
  - News article management (create, edit, publish, delete)
  - Photo gallery management
  - Sponsor management
  - Board member profiles
  - Tournament information updates
- ✅ Default webmaster credentials: `webmaster` / `MKO2026Web!`

**CIO Super Admin Role:**
- ✅ `cio` role added to `marshal_users` collection
- ✅ Default credentials: `cio` / `MKO2026CIO!`
- ✅ Full system access across all dashboards

**Case-Insensitive Login:**
- ✅ Both marshal and webmaster logins now accept usernames in any case
- ✅ Database migration on startup converts all existing usernames to lowercase
- ✅ New users are stored with lowercase usernames

**Login UX Improvements:**
- ✅ Specific error messages: "Username not found" vs "Incorrect password"
- ✅ "Back to Home" button added to both login pages

### Phase 5: Homepage UI Updates (COMPLETED - January 21, 2026)
- ✅ Hero images updated with user-provided photos:
  - Karen photo (event crowd)
  - Cheque presentation photo
- ✅ Quick Stats confirmed: $2,750,000 Prize Fund, 144 Players, Karen CC, 4 Days
- ✅ SportPesa logo removed from sponsors
- 🔄 Avenue Healthcare logo - placeholder added (waiting for user to provide)

### Email Integration (READY)
- ✅ SMTP credentials configured in backend/.env
- ✅ `email-validator` package installed
- ✅ Email sending function implemented (`send_email`, `send_approval_email`)
- 🔄 Email triggers in approval/rejection workflows (to be tested)

---

## Credentials Summary

### Marshal/Operations Dashboard
- **URL**: `/marshal-login`
- **Users**:
  - `chiefmarshal` / `MKO2026Admin!` (Chief Marshal)
  - `cio` / `MKO2026CIO!` (Super Admin)
  - `wmaina` / `MKO2026Admin!` (Viewer)
  - `jondigo` / `MKO2026Admin!` (Admin)

### Webmaster Portal
- **URL**: `/webmaster-login`
- **Username**: `webmaster`
- **Password**: `MKO2026Web!`

### Public Pages
- `/apply` - All accreditation applications hub
- `/pro-am` - Pro-Am tournament info
- `/volunteer-register` - Volunteer registration

---

## Prioritized Backlog (Updated January 21, 2026)

### P0 (Critical - Completed)
- ✅ Login fix for user-created accounts (wmaina, jondigo)
- ✅ Homepage UI updates (photos, stats, sponsors)
- ✅ Case-insensitive login
- ✅ Back to Home button on login pages

### P1 (High Priority - Next)
- 🔄 Super Admin Dashboard for CIO role (placeholder exists)
- 🔄 Avenue Healthcare logo (waiting for user)
- Email notification testing

### P2 (Medium Priority)
- Badge-ready data export
- External storage for file uploads
- Live leaderboard API integration

---

## Features Added (V2.2 - January 22, 2026)

### Homepage & Content Updates (COMPLETED)
- ✅ User-provided photos added to Featured Content Carousel:
  - "MKO 2026 Launch Event" (Karen photo)
  - "Prize Cheque Presentation" (Cheque presentation photo)
- ✅ Photos also rotate in Hero section
- ✅ Avenue Healthcare logo added to sponsors section (SportPesa removed)
- ✅ Volunteer quotas updated: 300 Marshals, 300 Scorers (continuous registration enabled)

### Super Admin Dashboard (CIO) - COMPLETED
- ✅ Route: `/super-admin-dashboard`
- ✅ Access Control: CIO role only
- ✅ Features:
  - System-wide statistics overview
  - Marshal user management (CRUD)
  - Webmaster user management (CRUD)
  - Locations, zones, access levels management
  - Audit logs viewer
  - Email test functionality
- ✅ "Super Admin" button added to Marshal Dashboard header for CIO users

### Email Notifications - COMPLETED
- ✅ SMTP Configuration: Gmail credentials configured
- ✅ Test Email Endpoint: `/api/superadmin/test-email`
- ✅ Email sending verified working

### Backend APIs Added
- `/api/superadmin/stats` - System-wide statistics
- `/api/superadmin/webmaster-users` - Webmaster user CRUD
- `/api/superadmin/test-email` - Email testing

### Testing Results (Iteration 6)
- Backend: 16/16 tests passed (100%)
- Frontend: All UI tests passed
- All login flows verified working
- Email functionality tested and working

---

## Test Credentials (Updated)

| Portal | URL | Username | Password |
|--------|-----|----------|----------|
| Marshal/Operations | `/marshal-login` | chiefmarshal | MKO2026Admin! |
| CIO Super Admin | `/marshal-login` | cio | MKO2026CIO! |
| Webmaster | `/webmaster-login` | webmaster | MKO2026Web! |
| Test Users | `/marshal-login` | wmaina | MKO2026Admin! |
| Test Users | `/marshal-login` | jondigo | MKO2026Admin! |

---

## Features Added (V2.3 - January 22, 2026)

### New Photo Added to Featured Content
- ✅ **Junaid Manji - QUALIFIED** photo added to featured carousel
- ✅ Photo appears in hero rotation and featured content carousel
- ✅ Category: PLAYERS

### Bulk Email Notification Feature (NEW)
- ✅ **Route:** Super Admin Dashboard > Bulk Email tab
- ✅ **Target Groups:** Volunteers, Accreditation Submissions, Pro-Am Registrations
- ✅ **Status Filters:** Approved, Pending, All
- ✅ **Features:**
  - Preview recipients before sending
  - Professional HTML email template
  - Audit logging of bulk email sends
  - Success/failure tracking
- ✅ **APIs:**
  - `POST /api/superadmin/bulk-email` - Send bulk emails
  - `GET /api/superadmin/bulk-email/preview` - Preview recipients

### Leaderboard Test Data Removed
- ✅ Cleared mock leaderboard entries
- ✅ Cleared mock player data
- ✅ Page now shows "No leaderboard data available yet"

---

## Deployment & Data Persistence

### ⚠️ IMPORTANT: Production Deployment Notes

**Data Safety:** All user data and content is stored in MongoDB (Atlas in production). Redeployment of the application code does **NOT** affect your data because:

1. **Database is External:** MongoDB runs separately from the app. Your collections (users, volunteers, submissions, news, etc.) persist independently.

2. **What IS Safe During Redeployment:**
   - All user accounts (marshal_users, webmaster_users)
   - All volunteer registrations
   - All accreditation submissions
   - All Pro-Am registrations
   - All news articles and gallery items
   - All tournament configuration

3. **What Gets Re-seeded (if missing):**
   - Default admin accounts (chiefmarshal, cio, webmaster) - only created if they don't exist
   - Default accreditation modules - only created if none exist
   - Default locations and access levels - only created if none exist

4. **Admin-Created Users:** Users created through the admin dashboard (like wmaina, jondigo) are stored in MongoDB and will persist across all redeployments.

### To Verify Data Persistence:
```bash
# Check users in database
mongo <ATLAS_URI> --eval "db.marshal_users.find({}).count()"
mongo <ATLAS_URI> --eval "db.webmaster_users.find({}).count()"
```

### Backup Recommendation:
Before major redeployments, export critical collections:
- marshal_users
- webmaster_users
- volunteers
- accreditation_submissions

---

## Features Added (V2.4 - January 22, 2026)

### Ticketing URL Updated
- ✅ HustleSasa event-specific URL: `http://kenyaopen.hustlesasa.shop/`
- ✅ All ticket purchase buttons now redirect to this URL

### KOGL Board Updates
- ✅ **Peter Mungai** added as Finance Director
- ✅ **Faith Kanaga** role updated from "Director" to Legal Director
- ✅ **Board Member Photos** added for all directors
  - Professional headshot images for all 11 board members
  - Images display in circular format with border styling

### Badge Export Feature (NEW)
- ✅ **Backend Endpoints:**
  - `GET /api/accreditation/export-badges/{module_type}` - Export badge-ready CSV
  - `GET /api/accreditation/badge-stats` - Get badge printing statistics
- ✅ **Badge CSV Format:** Includes standardized fields for badge printing:
  - badge_id, full_name, first_name, last_name
  - organization, role, accreditation_type
  - access_level, zone_access, email, phone
  - photo_url, qr_code_data, valid_from, valid_to
- ✅ **Badge Export Tab** in Operations Dashboard:
  - Badge Export Center header with instructions
  - Per-module export cards showing approved count
  - "Export Badge Data" button for each module
  - Badge CSV format documentation
  - Bulk export options (all approved badges, full data)
- ✅ **Quick Export Button** in Submissions tab (per module)

---

## Features Added (V2.7 - February 7, 2026)

### Content Templates Feature (NEW)
Reusable content blocks that can be quickly inserted into pages:

**Template Categories:**
- Header Sections (Hero, banners)
- Content Blocks (Two-column layouts, stats)
- FAQ Sections (Accordion-style Q&A)
- Call to Action (Promotional banners)
- Image Galleries (Grid layouts)
- Contact Forms (Contact info blocks)
- Team/Staff (Team member grids)
- Testimonials (Quote styling)
- Pricing Tables (Ticket/pricing cards)
- Footer Sections

**10 Pre-built System Templates:**
1. Centered Hero Section
2. Two Column Layout
3. Statistics Row
4. FAQ Accordion Section
5. Call to Action Banner
6. Contact Information Block
7. Team Members Grid
8. Testimonial Quote
9. Image Gallery Grid
10. Pricing/Ticket Table

**Features:**
- ✅ Template browser modal in page editor
- ✅ Category filtering
- ✅ Live HTML preview
- ✅ One-click insert into page content
- ✅ Usage tracking per template
- ✅ Create custom templates
- ✅ Edit/delete custom templates (system templates protected)
- ✅ Templates tab in Webmaster Dashboard

**Backend APIs:**
- `GET /api/webmaster/templates` - List all templates
- `GET /api/webmaster/templates/categories` - Get category list
- `POST /api/webmaster/templates` - Create custom template
- `PUT /api/webmaster/templates/{id}` - Update template
- `DELETE /api/webmaster/templates/{id}` - Delete template
- `POST /api/webmaster/templates/{id}/use` - Track usage

---

## Features Added (V2.6 - February 7, 2026)

### Full CMS with Editorial Workflow (NEW - MAJOR FEATURE)
Extended the Webmaster Dashboard with comprehensive content management capabilities:

**New CMS Modules:**
- ✅ **Pages Management** - Create and manage static pages (About, Tournament, Privacy Policy, Terms of Service, FAQ)
- ✅ **Media Library** - Centralized media browser with search, filter, and upload capabilities
- ✅ **Rich Text Editor** - WYSIWYG editor (ReactQuill) for news and pages with formatting toolbar

**Editorial Workflow:**
- ✅ **Draft → Review → Published** states with role-based permissions
- ✅ **Content Scheduling** - Set publish and unpublish dates for pages
- ✅ **Revision History** - Track all content changes with ability to restore previous versions
- ✅ **Approval/Rejection** - Editors can approve or reject content with comments

**Backend APIs:**
- `GET/POST/PUT/DELETE /api/webmaster/pages` - Full CRUD for CMS pages
- `POST /api/webmaster/pages/{id}/submit-review` - Submit page for review
- `POST /api/webmaster/pages/{id}/approve` - Approve and publish page
- `POST /api/webmaster/pages/{id}/reject` - Reject with reason
- `POST /api/webmaster/pages/{id}/restore/{revision_id}` - Restore previous version
- `GET/POST/DELETE /api/webmaster/media` - Media library management
- `GET /api/webmaster/cms-stats` - Dashboard statistics
- `GET /api/pages/{slug}` - Public page access

**Frontend:**
- New "Pages" tab with editorial workflow UI
- New "Media" tab with grid view and upload
- Quick-start templates for default pages
- SEO fields (meta title, description) per page
- Revision history viewer with restore capability
- Public `/page/{slug}` route for CMS pages

---

## Features Added (V2.5 - February 7, 2026)

### Advanced Volunteer Query Engine (NEW - MAJOR FEATURE)
Comprehensive filtering and assignment system for tournament operations:

**Backend APIs:**
- ✅ `POST /api/marshal/volunteers/query` - Advanced query with combinable filters
- ✅ `POST /api/marshal/volunteers/bulk-assign` - Bulk assign to locations/supervisors
- ✅ `POST /api/marshal/volunteers/export-query` - Export filtered results to CSV
- ✅ `GET /api/marshal/assignment-locations` - Get 29 predefined tournament locations
- ✅ `GET /api/marshal/assignment-supervisors` - Get supervisors list
- ✅ `GET/POST/DELETE /api/marshal/query-presets` - Saved query presets

**Query Filters (All Combinable):**
- Volunteer Type: Scorer / Marshal / All
- Status: Approved / Pending / Rejected / All
- Day of Volunteering: Thursday / Friday / Saturday / Sunday (multi-select)
- Time Slot: AM / PM / All Day (drill-down when days selected)
- Karen Membership: Karen Members Only / Non-Karen (normalized matching for variations)
- Nationality: Kenyan / Non-Kenyan
- Previous Experience: Has Volunteered Before / First-time
- Unassigned Only filter

**Karen Membership Normalization:**
- Matches variations: "Karen", "Karen Country Club", "Karen Golf Club", "KCC", "Karen CC", etc.
- Keyword-based matching, not exact string matching

**Frontend UI (Query Engine Tab):**
- Quick Presets panel with default presets:
  - All Scorers - Thursday AM
  - Karen Members Only
  - Unassigned Approved Volunteers
  - Experienced Marshals
  - Weekend Coverage - Scorers
- Filter panel with all query options
- Results table with checkboxes for bulk selection
- Statistics display (total, marshals, scorers, Karen members, unassigned)
- Bulk Assignment modal with locations/supervisors dropdowns
- Export to CSV button
- Save as Preset functionality

### Ticketing Page Updates
- ✅ **Narrower horizontal card layout** (max-w-5xl constraint)
- ✅ **JGF Card Holders placeholder** - FREE ENTRY section for Junior Golf Foundation members
  - Styled as a special card with dashed border
  - Features: Valid JGF card required, All 4 days access, Present card at gate
  - "Supporting youth golf development in Kenya" tagline

### Homepage Past Winners Fix
- ✅ **Correct images mapped to past champions:**
  - Jacques Kruyswijk (RSA) - 2025 Champion
  - Darius van Driel (NED) - 2024 Champion  
  - Jorge Campillo (ESP) - 2023 Champion
  - Wu Ashun (CHN) - 2022 Champion
  - Justin Harding (RSA) - 2021 Champion
  - Guido Migliozzi (ITA) - 2019 Champion

---

## Next Tasks (Prioritized)

### P0 (Critical)
- M-Pesa Direct Integration (on hold - awaiting API credentials)

### P1 (High Priority)  
- Cloud storage for file uploads (AWS S3)
- Live leaderboard API integration
- Badge-Ready Data Preview feature

### P2 (Medium Priority)
- Multi-language support (Swahili)
- Virtual course tour
- Hall of Fame nomination form

### Future/Backlog
- LinkedIn profiles for board members
- Advanced badge design preview
- QR code generation for badges

---

## Update Log - February 7, 2026

### Features Added (V3.1 - CMS Bug Fixes & Hall of Fame Management)

#### Bug Fixes
- ✅ **CMS Error Handling Fix**: Fixed silent failures when saving Sponsors, News, Board Members, etc.
  - Added proper error handling with toast notifications for all CRUD operations
  - Users now see specific error messages when operations fail
  - Console logging added for debugging

#### Hall of Fame CMS Management (COMPLETED)
- ✅ **Hall of Fame Tab** in Webmaster Dashboard:
  - **Past Champions Section**: 
    - Table view with Year, Champion, Country, Score, Image columns
    - Add/Edit/Delete champions with full form: Year, Score, Winner, Country, Country Code, Venue, Runner-up, Prize Fund, Photo
    - ImagePicker integration for photo uploads
  - **Inductees Section**:
    - Card grid view with photo, category badge, year, name, achievement
    - Add/Edit/Delete inductees with categories: Patron, Distinguished Leadership, Distinguished Service, Lifetime Achievement, Media Excellence, Tournament Excellence, Special Recognition
    - ImagePicker integration for photo uploads
- ✅ **Public Hall of Fame Page** updated to fetch data from CMS API
- ✅ **Backend APIs** for Hall of Fame management:
  - `GET/POST /api/webmaster/hall-of-fame/champions` - List/Create champions
  - `PUT/DELETE /api/webmaster/hall-of-fame/champions/{id}` - Update/Delete champions
  - `GET/POST /api/webmaster/hall-of-fame/inductees` - List/Create inductees
  - `PUT/DELETE /api/webmaster/hall-of-fame/inductees/{id}` - Update/Delete inductees
  - `GET /api/hall-of-fame` - Public API (returns entries with images)

**Database Collections:**
- `hof_champions` - Past Kenya Open winners with images
- `hof_inductees` - Hall of Fame honorees with images

**Files Modified:**
- `/app/frontend/src/pages/WebmasterDashboard.js` - Added Hall of Fame tab, modals, CRUD functions
- `/app/frontend/src/pages/HallOfFamePage.js` - Fixed API endpoint path

---

## Update Log - February 8, 2026

### Bug Fix (V3.2 - Homepage Featured Content Image Cropping)

#### Issue
User reported that images in the "Featured Content" carousel on the homepage were being cropped, cutting off parts of the photos (e.g., the prize cheque presentation image).

#### Fix Applied
- ✅ **FeaturedCarousel Component** (`/app/frontend/src/pages/HomePage.js` lines 213-314):
  - Changed image CSS from `w-full h-full object-cover` to `max-w-full max-h-full w-auto h-auto object-contain`
  - Added `bg-black flex items-center justify-center` to container for proper centering
  - Updated gradient overlay to be less intrusive (`via-black/20` instead of `via-black/40`)

#### Verification
- ✅ Testing agent verified fix - 100% frontend tests passed
- ✅ Prize Cheque Presentation image now shows full content without cropping
- ✅ All carousel navigation (thumbnails, arrows, auto-play) working correctly
- ✅ All homepage sections (Hero, News, Sponsors, Players, Course) loading properly

**Test Report:** `/app/test_reports/iteration_8.json` - 100% pass rate

---

## Next Tasks (Prioritized)

### P0 (Critical)
- None currently

### P1 (High Priority)
- Badge-Ready Data Preview feature in Operations Dashboard
- Cloud storage for file uploads (AWS S3)
- Live leaderboard API integration

### P2 (Medium Priority)
- M-Pesa Direct Integration (ON HOLD - awaiting API credentials)
- Multi-language support (Swahili)
- Hall of Fame nomination form
- LinkedIn profiles for board members

### Future/Backlog
- Virtual course tour
- Advanced badge design preview
- QR code generation for badges

---
