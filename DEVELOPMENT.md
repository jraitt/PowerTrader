# PowerTrader Development Guide

## 🎯 Current Status: LIVE & WORKING

**Application URL:** http://localhost:3040/  
**Last Updated:** August 18, 2025

The PowerTrader application is currently running and fully operational with complete authentication flow, database integration, and user interface.

### ✅ **Current Working Features:**
- **Homepage:** Full marketing page with Hero section
- **Authentication:** Google OAuth via Clerk working perfectly
- **User Flow:** Sign-in → inventory dashboard redirect
- **Database:** Supabase connected with user sync
- **Docker:** Hot reload development environment
- **Health Checks:** Application monitoring endpoints

### 🔧 **Test the Application:**
1. **Homepage:** http://localhost:3040/
2. **Sign In:** Click "Sign In" → Google OAuth → Auto-redirect to inventory
3. **Inventory:** Protected dashboard with user welcome message
4. **Sign Out:** Available in inventory dashboard

## Quick Start

### Prerequisites
- Docker Engine 24.0+
- Docker Compose 2.20+
- Git

### 1. Application Is Already Running
The application is currently active. To restart or rebuild:

```bash
# Check current status
docker-compose ps

# View logs
docker-compose logs -f app

# Restart if needed
docker-compose restart app
```

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.example .env.development

# Edit .env.development with your service credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# - CLERK_SECRET_KEY
# - GEMINI_API_KEY
```

### 3. Start Development Environment
```bash
# Build and start the development container
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f app
```

### 4. Access the Application
- **Application**: http://localhost:3040
- **Health Check**: http://localhost:3040/api/health

## Environment Configuration

### Required Services

#### Supabase (Database & Storage)
1. Create account at https://supabase.com
2. Create new project
3. Go to Settings > API to get:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Note:** No service role key needed - using Supabase MCP server

#### Clerk (Authentication)
1. Create account at https://clerk.com
2. Create new application
3. Go to API Keys to get:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - **Note:** Using Clerk MCP server for user management

#### Google Gemini (AI)
1. Get API key from Google AI Studio
2. Set `GEMINI_API_KEY`

### Environment Files
- `.env.development` - Development configuration
- `.env.production` - Production configuration
- `.env.example` - Template with all variables

## Development Workflow

### Common Commands
```bash
# Start development
docker-compose up

# Rebuild and start
docker-compose up --build

# Stop containers
docker-compose down

# View logs
docker-compose logs app

# Run commands inside container
docker-compose exec app pnpm add <package>
docker-compose exec app pnpm run lint
docker-compose exec app pnpm run type-check
```

### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API endpoints
│   ├── inventory/         # Main app pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── layouts/          # Layout components
├── lib/                  # Utilities & integrations
│   ├── supabase/        # Database client
│   ├── gemini/          # AI integration
│   └── utils.ts         # Helper functions
└── types/               # TypeScript definitions
```

## Development Features

### Hot Reload
The development container supports hot module replacement. Changes to your code will automatically reload the application.

### Type Checking
```bash
docker-compose exec app pnpm run type-check
```

### Linting
```bash
docker-compose exec app pnpm run lint
docker-compose exec app pnpm run lint:fix
```

### Code Formatting
```bash
docker-compose exec app pnpm run format
docker-compose exec app pnpm run format:check
```

## Database Setup

### Initial Setup
1. Create Supabase project
2. Run database migrations (when created)
3. Set up Row Level Security policies
4. Configure storage bucket for images

### Schema
The database schema includes:
- `items` - Main inventory items
- `item_photos` - Item photos and metadata
- `activity_log` - Activity tracking

## Testing

### Unit Tests
```bash
docker-compose exec app pnpm test
docker-compose exec app pnpm test:watch
```

### E2E Tests
```bash
docker-compose exec app pnpm test:e2e
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Stop any processes using port 3040
lsof -ti:3040 | xargs kill -9

# Or change port in .env.development
PORT=3041
```

#### Docker Build Issues
```bash
# Clean Docker build cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### Environment Variables Not Loading
- Ensure `.env.development` exists
- Check variable names match exactly
- Restart Docker containers after changes

#### Module Not Found Errors
```bash
# Reinstall dependencies
docker-compose exec app rm -rf node_modules
docker-compose exec app pnpm install
```

### Health Check Status
Visit `/api/health` to check service status:
- **ok**: All services operational
- **degraded**: Some services have issues
- **error**: Critical failure

## Production Deployment

### Build Production Image
```bash
NODE_ENV=production docker-compose up --build
```

### Environment Variables
Ensure production environment variables are set in `.env.production`:
- Use production URLs and keys
- Set `NODE_ENV=production`
- Configure proper restart policies

## Code Standards

### TypeScript
- Use strict mode
- Define interfaces for all data structures
- Avoid `any` type

### React/Next.js
- Use Server Components by default
- Client Components only when necessary
- Implement proper error boundaries

### Styling
- Use Tailwind CSS utility classes
- Follow shadcn/ui component patterns
- Implement responsive design

### API Design
- RESTful endpoints
- Proper HTTP status codes
- Input validation with Zod
- Error handling

## Git Workflow

### Branch Naming
- `feature/description`
- `fix/description`
- `docs/description`

### Commit Messages
- Use conventional commits
- Include scope when relevant
- Keep messages clear and concise

### Pre-commit Hooks
Husky runs automatically:
- ESLint checking
- Prettier formatting
- Type checking

## Support

### Documentation
- [README.md](./README.md) - Project overview
- [PLANNING.md](./PLANNING.md) - Architecture and planning
- [PRD.md](./PRD.md) - Product requirements
- [TASKS.md](./TASKS.md) - Development milestones

### Getting Help
1. Check documentation files
2. Review error logs: `docker-compose logs app`
3. Check health endpoint: `/api/health`
4. Review environment configuration