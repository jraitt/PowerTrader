# PowerTrader - Project Planning Document

## Vision Statement

PowerTrader revolutionizes small engine machinery trading by providing a streamlined, AI-powered inventory management system that runs entirely in Docker. By combining modern web technologies with intelligent automation, PowerTrader enables small businesses to efficiently track, price, and sell their inventory while maintaining complete control over their data and deployment.

## Core Values

- **Simplicity First:** Single container deployment, one-click setup
- **Docker Native:** Development to production in Docker, no exceptions
- **AI-Augmented:** Smart features that save time without complexity
- **Beautiful UX:** Clean, modern interface that's a joy to use
- **Business Focused:** Built for real-world trading operations

## System Architecture

### Docker-First Design

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Container                      │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │              Next.js Application               │    │
│  │                                                │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │  React   │  │   API    │  │  Static  │   │    │
│  │  │  Client  │  │  Routes  │  │  Assets  │   │    │
│  │  └──────────┘  └──────────┘  └──────────┘   │    │
│  │                                                │    │
│  │  ┌──────────────────────────────────────┐    │    │
│  │  │         Business Logic Layer         │    │    │
│  │  └──────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Environment Variables (.env.development/.production)    │
└─────────────────────────────────────────────────────────┘
                              │
                              ├──── Supabase (External)
                              ├──── Clerk (External)
                              └──── Gemini AI (External)
```

### Data Flow Architecture

```
User Input → Next.js Frontend → API Routes → Business Logic
                                     ↓
                            External Services
                          (Supabase, Clerk, Gemini)
                                     ↓
                            Response Processing
                                     ↓
                            Frontend Update → User
```

### Component Architecture

```
src/
├── app/                       # Next.js App Router
│   ├── (auth)/               # Authentication routes
│   ├── api/                  # API endpoints
│   │   ├── items/
│   │   ├── upload/
│   │   ├── ai/
│   │   └── stats/
│   ├── inventory/            # Main application
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   └── new/
│   └── layout.tsx
│
├── components/               # React components
│   ├── ui/                  # shadcn/ui components
│   ├── forms/               # Form components
│   │   ├── ItemForm.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── AIAssist.tsx
│   ├── layouts/             # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Hero.tsx
│   └── features/            # Feature components
│       ├── ItemGrid.tsx
│       ├── ItemDetail.tsx
│       └── StatsCards.tsx
│
├── lib/                     # Utilities and integrations
│   ├── supabase/           # Database client
│   ├── gemini/             # AI integration
│   ├── clerk/              # Auth configuration
│   ├── validators/         # Zod schemas
│   └── utils/              # Helper functions
│
└── types/                  # TypeScript definitions
```

## Technology Stack

### Core Framework
- **Next.js 14+** - Full-stack React framework with App Router
- **TypeScript** - Type safety and better DX
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

### Authentication
- **Clerk** - Complete authentication solution
- **JWT Tokens** - Secure session management
- **Role-Based Access** - Permission system

### AI Integration
- **Google Gemini 2.5 Flash** - Image analysis and text extraction
- **Vercel AI SDK** - AI integration utilities

### Development Tools
- **pnpm** - Fast, disk space efficient package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Zod** - Runtime type validation

### Monitoring & Analytics
- **Sentry** - Error tracking
- **Vercel Analytics** - Performance monitoring
- **PostHog** - Product analytics

## Infrastructure Requirements

### Docker Host Requirements
- Docker Engine 24.0+
- Docker Compose 2.20+
- 2GB RAM minimum
- 10GB disk space
- Linux/macOS/Windows with WSL2

### External Services

#### Supabase
- Project creation
- Database setup
- Storage bucket configuration
- RLS policies implementation
- API keys generation

#### Clerk
- Application setup
- Authentication providers configuration
- Webhook endpoints
- User roles definition

#### Google Gemini
- API key generation
- Model selection (2.5 Flash)
- Rate limit configuration
- Error handling setup

### Environment Configuration

```env
# Application Configuration
NODE_ENV=development|production
PORT=3040
NEXT_PUBLIC_APP_URL=http://localhost:3040

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-key]
DATABASE_URL=postgresql://[connection-string]

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=[pub-key]
CLERK_SECRET_KEY=[secret-key]
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/inventory
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/inventory

# AI (Gemini)
GEMINI_API_KEY=[api-key]
GEMINI_MODEL=gemini-2.5-flash

# Storage
NEXT_PUBLIC_STORAGE_BUCKET=powertrader-images
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_URL_IMPORT=true
ENABLE_ANALYTICS=true
```

## Development Workflow

### Docker Configuration (Single docker-compose.yml)

```yaml
# docker-compose.yml - Works for both development and production
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: ${BUILD_TARGET:-development}
    ports:
      - "${PORT:-3040}:3040"
    volumes:
      - ${DEV_VOLUME_MOUNT:-.:/app}
      - ${DEV_NODE_MODULES:-/app/node_modules}
      - ${DEV_NEXT_CACHE:-/app/.next}
    env_file:
      - .env.${NODE_ENV:-development}
    environment:
      - NODE_ENV=${NODE_ENV:-development}
    command: ${DOCKER_COMMAND:-pnpm dev}
    restart: ${RESTART_POLICY:-unless-stopped}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3040/api/health"]
      interval: ${HEALTH_INTERVAL:-30s}
      timeout: 3s
      retries: 3
```

### Environment-Specific Configuration

```bash
# .env.development
NODE_ENV=development
BUILD_TARGET=development
PORT=3040
DOCKER_COMMAND=pnpm dev
RESTART_POLICY=unless-stopped
DEV_VOLUME_MOUNT=.:/app
DEV_NODE_MODULES=/app/node_modules
DEV_NEXT_CACHE=/app/.next
HEALTH_INTERVAL=60s

# .env.production
NODE_ENV=production
BUILD_TARGET=production
PORT=3040
DOCKER_COMMAND=pnpm start
RESTART_POLICY=always
DEV_VOLUME_MOUNT=
DEV_NODE_MODULES=
DEV_NEXT_CACHE=
HEALTH_INTERVAL=30s
```

## Security Architecture

### Application Security
- Input validation on all forms
- SQL injection prevention via parameterized queries
- XSS protection with content sanitization
- CSRF tokens for state-changing operations
- Rate limiting on API endpoints

### Docker Security
- Non-root user in container
- Minimal base images
- No secrets in images
- Read-only filesystem where possible
- Security scanning with Trivy

### Data Security
- Encryption at rest (Supabase)
- Encryption in transit (HTTPS)
- Secure environment variable management
- Regular security updates
- Audit logging

## Performance Targets

### Frontend Performance
- Lighthouse Score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1

### Backend Performance
- API Response Time < 200ms (p95)
- Database Query Time < 50ms (p95)
- Image Upload < 5s for 5MB file
- AI Processing < 3s per image

### Scalability
- Support 10,000+ inventory items
- Handle 100+ concurrent users
- Process 1000+ images/day
- 99.9% uptime target

## Required Tools List

### Development Environment
1. **Docker Desktop** (or Docker Engine + Docker Compose)
2. **Git** - Version control
3. **Code Editor** (VS Code recommended)
4. **Node.js** - For occasional local tooling
5. **pnpm** - Package manager

### VS Code Extensions (Recommended)
- Docker
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript
- Prisma (for database)
- GitLens

### External Service Accounts
1. **Supabase Account** - Database and storage
2. **Clerk Account** - Authentication