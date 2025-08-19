# Claude Code Session Guide for PowerTrader

## Project Overview

PowerTrader is a web application for managing the buying and selling of small engine machinery (ATVs, Snowmobiles, Lawn Tractors, and Utility Trailers). This guide helps Claude Code understand the project structure, conventions, and requirements during development sessions.

## Key Project Information

**Application Name:** PowerTrader - Buy / Sell the East  
**Purpose:** Inventory management and sales tracking for small engine machinery  
**Architecture:** Docker-first, single container design  
**Development Philosophy:** All development and production runs in Docker with environment-based configuration  
**MCP Integration:** Uses Supabase and Clerk MCP servers for database and authentication management

## Recent Session Notes (August 19, 2025)

### 🚀 **Major Accomplishments**
- **Complete CRUD Operations:** Implemented view, edit, delete functionality for inventory items
- **Photo Upload Integration:** Fixed photo upload in edit forms and ensured proper display
- **Service Role Client Consistency:** Critical fix - all database and storage operations now use service role client to bypass RLS
- **Type Safety Improvements:** Fixed field name mismatches (item_photos vs photos) across components
- **API Endpoint Fixes:** Resolved 404 errors and RLS policy blocking issues in upload endpoints

### 🔧 **Key Technical Fixes**
1. **RLS Policy Resolution:** Fixed Row Level Security blocking by using `serviceSupabase` consistently
2. **Storage Operations:** Fixed Supabase storage operations to use service role client 
3. **Field Name Alignment:** Updated ItemGrid and ItemTable components to use `item_photos` field
4. **Upload Endpoint:** Resolved 404 errors and storage policy violations in `/api/upload`
5. **Photo Display:** Fixed inventory grid/table to properly show uploaded photos with badges

## Docker-First Architecture

### Core Principles
- **Single Container:** The entire application runs in one Docker container
- **Environment-Based Configuration:** Development vs Production differentiated only by .env files
- **No Local Development:** All development happens inside Docker containers
- **Consistent Environments:** Docker ensures identical behavior across all environments
- **Hot Reload in Docker:** Development container supports hot module replacement

### Environment Configuration
```
.env.development    # Development environment variables (port 3040)
.env.production     # Production environment variables (port 3040)
.env.example        # Template for environment variables
```

### Docker Setup Files
```
Dockerfile          # Multi-stage build for both development and production
docker-compose.yml  # Single compose file using environment variables
.env.development    # Development-specific configuration
.env.production     # Production-specific configuration
```

## Technology Stack

### Core Technologies
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Clerk
- **AI Integration:** Google Gemini 2.5 Flash
- **Image Storage:** Supabase Storage
- **Container Runtime:** Docker 24+

### Development Tools
- **Package Manager:** pnpm (for smaller Docker images)
- **Linting:** ESLint
- **Formatting:** Prettier
- **Type Checking:** TypeScript strict mode
- **Git Hooks:** Husky (runs in Docker)

## Project Structure

```
powertrader/
├── src/
│   ├── app/
│   │   ├── api/
│   │   ├── (auth)/
│   │   ├── inventory/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── forms/
│   │   └── layouts/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── gemini/
│   │   └── utils/
│   └── types/
├── public/
├── Dockerfile
├── docker-compose.yml
├── .env.development
├── .env.production
├── .env.example
└── package.json
```

## Docker Development Workflow

### Starting Development
```bash
# Start development container with hot reload
docker-compose up

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### Running Commands in Container
```bash
# Install new package
docker-compose exec app pnpm add [package]

# Run migrations
docker-compose exec app pnpm run migrate

# Run type checking
docker-compose exec app pnpm run type-check
```

### Production Build
```bash
# Set environment to production and run
NODE_ENV=production docker-compose up --build

# Or with env file
docker-compose --env-file .env.production up --build
```

## Coding Standards

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Avoid `any` type
- Use proper error handling with custom error types

### React/Next.js
- Use Server Components by default
- Client Components only when necessary (interactivity)
- Implement proper loading and error boundaries
- Use Next.js Image component for all images
- Implement proper metadata for SEO

### Database Queries
- Use Supabase client for all database operations
- Implement Row Level Security (RLS) policies
- Use database transactions for multi-step operations
- Always validate input data

### API Design
- RESTful endpoints with proper HTTP methods
- Consistent error response format
- Input validation using Zod
- Rate limiting on all endpoints
- Proper CORS configuration

## Key Features Implementation Notes

### 1. Item Management
- Soft delete pattern for data retention
- Optimistic UI updates with rollback on error
- Image upload with progress indicators
- Automatic thumbnail generation

### 2. AI Integration
- Implement retry logic for Gemini API calls
- Cache AI responses to reduce API costs
- Provide fallback for AI failures
- User confirmation before applying AI suggestions

### 3. URL Import
- Implement robust HTML parsing
- Handle various marketplace HTML structures
- Rate limit external requests
- Sanitize imported data

### 4. Authentication
- Clerk middleware on all protected routes
- Role-based access control
- Session management
- Secure API endpoints

## Environment Variables

### Required Variables
```env
# Application
NODE_ENV=development|production
PORT=3040
NEXT_PUBLIC_APP_URL=http://localhost:3040

# Supabase (using MCP server - no service role key needed)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Note: SUPABASE_SERVICE_ROLE_KEY not needed - using Supabase MCP server

# Clerk (using MCP server)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Gemini AI
GEMINI_API_KEY=

# Storage
NEXT_PUBLIC_STORAGE_BUCKET=powertrader-images
```

## MCP Server Integration

PowerTrader uses Claude Code's MCP (Model Context Protocol) servers for external service integration:

### Supabase MCP Server
- **Purpose:** Database operations, schema management, user authentication
- **Benefits:** Direct database access without service role key, simplified queries
- **Usage:** `mcp__supabase__*` tools for all database operations
- **Key Operations:**
  - Table creation and management
  - User sync and authentication
  - Storage bucket management
  - Row Level Security setup

### Clerk MCP Server  
- **Purpose:** User authentication and management
- **Benefits:** Direct user operations, metadata management
- **Usage:** `mcp__clerk__*` tools for user operations
- **Key Operations:**
  - User creation and updates
  - Metadata management (public/private/unsafe)
  - Organization management
  - Invitation system

### Development Notes
- **No Service Keys Needed:** MCP servers handle authentication internally
- **Direct Database Access:** Use MCP tools instead of Supabase client for admin operations
- **User Sync:** Automatic user synchronization between Clerk and Supabase via MCP
- **Schema Management:** Database schema changes done via MCP migration tools

## Database Schema Conventions

- Use UUID for all primary keys
- Include created_at and updated_at timestamps
- Implement soft deletes with deleted_at
- Use snake_case for column names
- Create indexes for frequently queried columns
- Use JSONB for flexible metadata

## Error Handling

### Client-Side
- Use React Error Boundaries
- Show user-friendly error messages
- Log errors to monitoring service
- Implement retry mechanisms

### Server-Side
- Centralized error handling middleware
- Consistent error response format
- Proper HTTP status codes
- Detailed logging for debugging

## Performance Considerations

- Implement image lazy loading
- Use React Suspense for code splitting
- Optimize Docker image size (multi-stage builds)
- Cache static assets
- Implement database query optimization
- Use CDN for image delivery

## Security Best Practices

- Input validation on all endpoints
- SQL injection prevention via parameterized queries
- XSS protection with proper sanitization
- CSRF protection
- Rate limiting
- Secure headers configuration
- Environment variable encryption

## Testing Strategy

### In Docker Container
- Unit tests with Jest
- Integration tests for API endpoints
- E2E tests with Playwright
- All tests run inside Docker container

```bash
# Run tests in container
docker-compose exec app pnpm test
docker-compose exec app pnpm test:e2e
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Docker image optimized for production
- [ ] Database migrations applied
- [ ] SSL certificates configured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Rate limiting configured
- [ ] Security headers enabled

## Common Commands for Claude Code

```bash
# Development (using .env.development by default)
docker-compose up --build  # Rebuild and start (port 3040)
docker-compose down        # Stop and remove containers
docker-compose logs app    # View application logs

# Production (explicitly use production env)
NODE_ENV=production docker-compose up --build
# Or
docker-compose --env-file .env.production up --build

# Database
docker-compose exec app pnpm run db:migrate
docker-compose exec app pnpm run db:seed

# Running with specific environment
export NODE_ENV=production && docker-compose up
export NODE_ENV=development && docker-compose up
```

## Important Notes for Claude Code

1. **Always work within Docker context** - Never suggest local installation or development outside Docker
2. **Environment variables** - Use .env files, never hardcode secrets
3. **File paths** - Use container paths, not host paths
4. **Database connections** - Use Docker service names for database hosts
5. **Port mapping** - Application runs on port 3040
6. **Volume mounts** - Development uses volumes for hot reload
7. **Build optimization** - Multi-stage builds for smaller production images
8. **Health checks** - Implement Docker health checks for production

## Questions to Ask When Starting a Session

1. Which feature/component are we working on?
2. Are we in development or preparing for production?
3. Do we need to modify the Docker configuration?
4. Are there any new environment variables needed?
5. Should we update the database schema?
6. Do we need to add new packages to the container?