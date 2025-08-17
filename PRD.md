# Product Requirements Document (PRD)
## PowerTrader - Small Engine Machinery Trading Application

### 1. Executive Summary

This document outlines the requirements for a web application designed to help a small business track and manage the buying and selling of small engine machinery including ATVs, snowmobiles, lawn tractors, and utility trailers. The application will provide inventory management, automated data extraction from photos and URLs, and a modern, beautiful user interface.

### 2. Product Overview

**Product Name:** PowerTrader - Buy / Sell the East

**Purpose:** A comprehensive inventory management and sales tracking system for small engine machinery trading businesses.

**Target Users:** Small business owners and employees in the small engine machinery trading industry.

### 3. Core Features

#### 3.1 Item Management

**Item Properties:**
- **Category** (Required): Dropdown selection
  - ATV
  - Snowmobile
  - Trailer
  - Small Engine
- **Manufacturer** (Required): Text field with autocomplete from database
- **Model** (Required): Text field
- **Year** (Optional): Number field (1900-current year + 1)
- **Condition** (Required): Slider/Number input (1-10 scale)
  - 1-3: Poor/Parts
  - 4-6: Fair/Good
  - 7-9: Very Good/Excellent
  - 10: Like New/Mint
- **Asking Price** (Required): Currency field - initial listing price
- **Final Price** (Optional): Currency field - negotiated price if different from asking
- **Sold Price** (Optional): Currency field - actual transaction amount
- **Purchase Location** (Optional): Text field for where item was acquired
- **Purchase Date** (Optional): Date picker
- **Sale Date** (Optional): Date picker (auto-populated when status changes to Sold)
- **Status** (Required): Dropdown
  - Available
  - Pending
  - Sold
  - Hold
- **Description** (Required): Rich text editor for detailed information
- **VIN/Serial Number** (Optional): Text field
- **Photos** (Required): Multiple image upload (minimum 1, maximum 20)
- **Created At** (Auto): Timestamp
- **Updated At** (Auto): Timestamp

#### 3.2 CRUD Operations

- **Create**: Add new items through multiple methods (see section 3.3)
- **Read**: View items in grid/list views with filtering and sorting
- **Update**: Edit all item properties, update photos, change status
- **Delete**: Soft delete with confirmation dialog

#### 3.3 Item Creation Methods

1. **Manual Entry**
   - Form-based input with all fields
   - Drag-and-drop or click-to-upload for multiple photos
   - Real-time validation
   - Save as draft functionality

2. **AI Photo Analysis**
   - Upload single or multiple photos
   - Gemini 2.5 Flash analyzes images to extract:
     - Category detection
     - Manufacturer/Model identification
     - Condition assessment
     - Suggested description
   - User reviews and confirms AI suggestions before saving

3. **URL Import**
   - Support for Facebook Marketplace and Craigslist URLs
   - Gemini AI extracts:
     - All photos from listing
     - Title and description
     - Price information
     - Location data
     - Contact information (if available)
   - Data mapping to internal fields with user review

### 4. User Interface Requirements

#### 4.1 Design Principles
- Clean, modern, and responsive design
- Mobile-first approach
- Intuitive navigation
- Fast load times
- Accessibility compliant (WCAG 2.1 AA)

#### 4.2 Key Pages

**Homepage/Dashboard**
- Hero section with:
  - Business logo
  - "PowerTrader - Buy / Sell the East" branding
  - Hero image of machinery
- Quick stats cards:
  - Total inventory value
  - Items sold this month
  - Active listings
  - Pending deals
- Recent activity feed
- Quick add button

**Inventory Page**
- Filter sidebar:
  - Category
  - Status
  - Price range
  - Condition range
  - Date ranges
- Sortable columns:
  - Photo thumbnail
  - Category/Make/Model
  - Condition
  - Price
  - Status
  - Actions
- View toggles (Grid/List)
- Bulk actions toolbar

**Item Detail Page**
- Photo carousel with lightbox
- All item properties displayed
- Edit/Delete actions
- Status change workflow
- Activity history
- Print view option

**Add/Edit Item Page**
- Step-by-step wizard or single form
- Live preview
- Photo upload with drag-and-drop
- AI assistance toggle
- Validation feedback

### 5. Technical Requirements

#### 5.1 Architecture
- Single Docker container deployment
- Node.js/Next.js application
- RESTful API design
- Real-time updates via WebSockets

#### 5.2 Technology Stack
- **Frontend**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **AI Integration**: Google Gemini 2.5 Flash API
- **Image Storage**: Supabase Storage
- **Deployment**: Docker container

#### 5.3 Performance Requirements
- Page load time < 2 seconds
- API response time < 500ms
- Support for 10,000+ inventory items
- Concurrent user support: 10+
- Application port: 3040

### 6. Security Requirements

- All data encrypted in transit (HTTPS)
- Role-based access control (Admin, User, Viewer)
- Secure API endpoints
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting on API endpoints
- Secure file upload with type validation

### 7. Data Model

```sql
-- Core Tables
items (
  id UUID PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  manufacturer VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER,
  condition INTEGER NOT NULL CHECK (condition >= 1 AND condition <= 10),
  asking_price DECIMAL(10,2) NOT NULL,
  final_price DECIMAL(10,2),
  sold_price DECIMAL(10,2),
  purchase_location TEXT,
  purchase_date DATE,
  sale_date DATE,
  status VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  vin_serial VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  deleted_at TIMESTAMP
)

item_photos (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
)

activity_log (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES items(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### 8. API Endpoints

- `GET /api/items` - List items with filtering/pagination
- `GET /api/items/:id` - Get single item details
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Soft delete item
- `POST /api/items/analyze-photo` - AI photo analysis
- `POST /api/items/import-url` - Import from URL
- `GET /api/stats` - Dashboard statistics
- `POST /api/upload` - Handle file uploads

### 9. Success Metrics

- User adoption rate > 80% within first month
- Average time to add item < 2 minutes
- AI accuracy for photo analysis > 75%
- System uptime > 99.9%
- User satisfaction score > 4.5/5

### 10. Future Enhancements

- Mobile native apps (iOS/Android)
- Integration with accounting software
- Automated posting to marketplace platforms
- Customer management system
- Financial reporting and analytics
- Barcode/QR code scanning
- Email/SMS notifications
- Multi-location support
- Auction functionality