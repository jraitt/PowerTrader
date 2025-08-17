# PowerTrader - Buy / Sell the East

[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green.svg)](https://supabase.com/)

> A modern, AI-powered inventory management system for small engine machinery trading businesses. Built with Docker-first architecture for seamless development and deployment.

## 🚀 Overview

PowerTrader is a comprehensive web application designed to help small businesses efficiently track, manage, and sell small engine machinery including ATVs, snowmobiles, lawn tractors, and utility trailers. The application combines modern web technologies with AI-powered features to streamline inventory management and sales operations.

### Key Features

- **🤖 AI-Powered Item Creation** - Analyze photos and extract marketplace listings using Google Gemini 2.5 Flash
- **📱 Responsive Design** - Beautiful, modern interface that works on all devices
- **🐳 Docker-First Architecture** - Single container deployment for consistent development and production environments
- **🔒 Secure Authentication** - User management powered by Clerk
- **🖼️ Smart Image Management** - Multiple photo uploads with drag-and-drop interface
- **📊 Analytics Dashboard** - Track sales, inventory value, and business metrics
- **🔍 Advanced Search & Filtering** - Find items quickly with powerful search capabilities

## 🛠️ Technology Stack

### Core Framework
- **Next.js 14+** - Full-stack React framework with App Router
- **TypeScript** - Type safety and enhanced developer experience
- **React 18** - UI library with Server Components

### Containerization
- **Docker** - Container runtime (v24+)
- **Docker Compose** - Multi-container orchestration
- **Multi-stage Builds** - Optimized production images

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide Icons** - Modern icon library
- **Framer Motion** - Animation library

### Database & Storage
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Storage** - Object storage for images
- **Row Level Security** - Database-level security

### Authentication & AI
- **Clerk** - Complete authentication solution
- **Google Gemini 2.5 Flash** - AI for image analysis and text extraction

### Development Tools
- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Zod** - Runtime type validation

## 🚀 Quick Start

### Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+
- 2GB RAM minimum
- 10GB disk space

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PowerTrader
   ```

2. **Create environment files**
   ```bash
   cp .env.example .env.development
   cp .env.example .env.production
   ```

3. **Configure environment variables**
   ```env
   # Application
   NODE_ENV=development
   PORT=3040
   NEXT_PUBLIC_APP_URL=http://localhost:3040

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[service-key]

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[pub-key]
   CLERK_SECRET_KEY=[secret-key]

   # Gemini AI
   GEMINI_API_KEY=[api-key]

   # Storage
   NEXT_PUBLIC_STORAGE_BUCKET=powertrader-images
   ```

### Development

Start the development environment:

```bash
# Start development container with hot reload
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f app
```

The application will be available at `http://localhost:3040`

### Production

Deploy to production:

```bash
# Set environment to production and build
NODE_ENV=production docker-compose up --build

# Or with explicit env file
docker-compose --env-file .env.production up --build
```

## 📁 Project Structure

```
powertrader/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── api/               # API endpoints
│   │   │   ├── items/         # Item management
│   │   │   ├── upload/        # File uploads
│   │   │   ├── ai/            # AI processing
│   │   │   └── stats/         # Analytics
│   │   ├── inventory/         # Main application
│   │   └── layout.tsx
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Form components
│   │   ├── layouts/          # Layout components
│   │   └── features/         # Feature components
│   ├── lib/                  # Utilities and integrations
│   │   ├── supabase/        # Database client
│   │   ├── gemini/          # AI integration
│   │   ├── clerk/           # Auth configuration
│   │   ├── validators/      # Zod schemas
│   │   └── utils/           # Helper functions
│   └── types/               # TypeScript definitions
├── public/                  # Static assets
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Container orchestration
├── .env.development        # Development environment
├── .env.production         # Production environment
└── package.json           # Dependencies
```

## 📊 Data Model

### Core Item Properties

- **Category** (Required): ATV, Snowmobile, Trailer, Small Engine
- **Manufacturer** (Required): Text with autocomplete
- **Model** (Required): Text field
- **Year** (Optional): Number (1900-current year + 1)
- **Condition** (Required): Scale 1-10
- **Asking Price** (Required): Initial listing price
- **Final Price** (Optional): Negotiated price
- **Sold Price** (Optional): Actual transaction amount
- **Purchase Location** (Optional): Where item was acquired
- **Purchase Date** (Optional): Date picker
- **Sale Date** (Optional): Auto-populated when sold
- **Status** (Required): Available, Pending, Sold, Hold
- **Description** (Required): Rich text editor
- **VIN/Serial Number** (Optional): Text field
- **Photos** (Required): 1-20 images

## 🤖 AI Features

### Photo Analysis
Upload images to automatically extract:
- Category detection
- Manufacturer/Model identification  
- Condition assessment
- Generated descriptions

### URL Import
Import listings from:
- Facebook Marketplace
- Craigslist
- Extract photos, descriptions, prices, and metadata

## 🔧 Development Commands

```bash
# Container management
docker-compose up --build        # Build and start development
docker-compose down             # Stop and remove containers
docker-compose logs app         # View application logs

# Package management (in container)
docker-compose exec app pnpm add [package]    # Install package
docker-compose exec app pnpm remove [package] # Remove package

# Database operations
docker-compose exec app pnpm run db:migrate   # Run migrations
docker-compose exec app pnpm run db:seed      # Seed database

# Testing
docker-compose exec app pnpm test            # Run unit tests
docker-compose exec app pnpm test:e2e        # Run E2E tests

# Code quality
docker-compose exec app pnpm run lint        # Lint code
docker-compose exec app pnpm run type-check  # Type checking
```

## 🎯 Core Workflows

### Adding Items

1. **Manual Entry** - Complete form with drag-and-drop photo upload
2. **AI Photo Analysis** - Upload photos, review AI suggestions
3. **URL Import** - Paste marketplace URL, confirm extracted data

### Managing Inventory

- **Grid/List Views** - Toggle between visual layouts
- **Advanced Filtering** - Category, status, price, condition, date ranges
- **Bulk Operations** - Update multiple items simultaneously
- **Status Tracking** - Available → Pending → Sold workflow

### Analytics & Reporting

- **Dashboard Overview** - Total inventory value, monthly sales, active listings
- **Performance Metrics** - Sales trends, category breakdowns, profit analysis
- **Export Capabilities** - CSV, PDF reports

## 🔒 Security Features

- **Authentication** - Secure user management with Clerk
- **Authorization** - Role-based access (Admin, User, Viewer)
- **Data Protection** - Encryption at rest and in transit
- **Input Validation** - XSS and SQL injection prevention
- **Rate Limiting** - API endpoint protection
- **Secure Uploads** - File type validation and sanitization

## 📈 Performance Targets

- **Frontend**: Lighthouse Score > 90, FCP < 1.5s
- **Backend**: API responses < 200ms (p95)
- **Scalability**: 10,000+ items, 100+ concurrent users
- **AI Processing**: < 3s per image analysis
- **Uptime**: 99.9% target

## 🚢 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Docker image optimized
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Monitoring setup (Sentry)
- [ ] Analytics configured
- [ ] Backup strategy implemented
- [ ] Rate limiting configured
- [ ] Security headers enabled

### Health Monitoring

The application includes health check endpoints:
- `/api/health` - Basic application health
- Docker health checks configured for container monitoring

## 📚 Documentation

- **[PLANNING.md](./PLANNING.md)** - Project vision, architecture, and technical planning
- **[PRD.md](./PRD.md)** - Complete product requirements document
- **[TASKS.md](./TASKS.md)** - Development milestones and task breakdown
- **[CLAUDE.md](./CLAUDE.md)** - Claude Code session guide and conventions

## 🤝 Contributing

### Development Workflow

1. Create feature branch
2. Develop in Docker container
3. Write tests alongside code
4. Update documentation
5. Create pull request
6. Code review and merge

### Definition of Done

- [ ] Code complete and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Docker build successful
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Accessibility checked
- [ ] Performance acceptable

## 📞 Support

For issues, questions, or feature requests:
- Create an issue in the repository
- Check existing documentation
- Review troubleshooting guide

## 📄 License

This project is proprietary software for PowerTrader business operations.

---

**PowerTrader** - Revolutionizing small engine machinery trading with modern technology and AI-powered automation.