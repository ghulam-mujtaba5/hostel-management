# AI Copilot Instructions for Hostel Management System

## Project Overview
**HostelMate** is a mobile-first, multi-tenant duty management system using Next.js 16, TypeScript, Tailwind CSS, and Supabase. The app handles task assignment with fairness algorithms, gamification (points/leaderboards), proof systems (photo uploads), and real-time updates.

## Architecture

### Core Structure
- **App Router**: Next.js 16 app router with route groups: `(auth)` for login/signup, `(main)` for authenticated pages
- **Database**: Supabase PostgreSQL with multi-tenancy via `spaces` table. Key entities:
  - `profiles` (user data), `spaces` (hostels/flats), `space_members` (relationships), `tasks`, `task_proofs`
- **State Management**: React Context (`AuthContext` in `src/contexts/AuthContext.tsx`) for user/session/space state
- **Client SDK**: `@supabase/supabase-js` - must use `src/lib/supabase.ts` (validates credentials at runtime)

### Data Flow
1. Auth: Supabase handles registration/login → `AuthProvider` hydrates context
2. Spaces: User selects space → context updates `currentSpace` and `spaceMembership`
3. Tasks: Real-time via Supabase subscriptions (see `src/lib/realtime.ts`)
4. Fairness: `src/lib/fairness.ts` scores tasks based on workload balance, category diversity, preferences

## Critical Developer Workflows

### Setup & Dev
```bash
npm install
npm run cli env:setup                    # Initialize .env.local template
npm run dev                              # Localhost:3000, hot reload with React Compiler
npm run build                            # Verify builds for production
npm run type-check                       # TypeScript validation
```

### Testing
```bash
npm run test:e2e                         # All Playwright tests
npm run test:headed                      # Tests with visible browser
npm run test:debug                       # Debug mode with inspector
npm run test:report                      # View HTML test report
npm run cli test auth                    # Run specific test file (e2e/auth.spec.ts)
```

Playwright helpers in `e2e/helpers.ts` (signUp, signIn, generateTestEmail). Tests use generated unique data to avoid conflicts.

### Database
```bash
npm run cli migration:create <name>      # Create new migration
npm run db:push                          # Apply pending migrations
npm run db:pull                          # Sync latest schema
npm run cli db:list                      # List all migrations
npm run cli migration:status             # Check applied migrations
```

Schema defined in `supabase/schema.sql`. Always add foreign keys for multi-tenant safety.

## Key Conventions & Patterns

### Type Safety
- All data types in `src/types/index.ts`
- Use `Profile`, `Space`, `SpaceMember`, `Task`, `FairnessStats` types consistently
- No `any` types - leverage TypeScript strict mode

### Error Handling
Custom error classes in `src/lib/error-handler.ts`:
- `AppError` (base), `ValidationError`, `NotFoundError`, `UnauthorizedError`, `ForbiddenError`
- Always include `code`, `statusCode`, and optional `context` for debugging
- Example: `throw new NotFoundError('Task')`

### Feature Flags & Config
`src/lib/config.ts` centralized. Examples:
- `CONFIG.features.realTimeUpdates` - toggle subscriptions
- `CONFIG.business.defaultPointsForTask` - game mechanics
- `isFeatureEnabled('realTimeUpdates')` to check dynamically

### Component Patterns
- Use React Hook Form + Zod for validation (`src/components/FormField.tsx`)
- UI components in `src/components/ui/` (shadcn-style, Tailwind)
- Error boundaries in `src/components/GlobalErrorBoundary.tsx`
- Loading states with `AdvancedLoading.tsx` and `Skeleton.tsx`

### Real-Time Updates
`src/lib/realtime.ts` wraps Supabase subscriptions. Subscribe to task changes:
```typescript
subscribeToTasks(spaceId, (tasks) => { /* update state */ })
```

### Fairness Algorithm
`src/lib/fairness.ts` scores tasks by:
1. **Workload Balance** (±20): User's point deficit vs. average
2. **Category Diversity** (±15): Penalize repeating recent categories
3. **Difficulty** (±10): Mix easy/hard tasks
4. **Preferences** (±10): Boost preferred categories
5. **Recency** (±5): Avoid users who just completed a task

## Environment & Secrets
- `.env.local` (dev): Supabase URL and anon key (public)
- Vercel deployment uses environment variables (set via `set-vercel-env.js`)
- Validate credentials at runtime (see `src/lib/supabase.ts` checks)

## Common Gotchas
1. **Multi-tenancy**: Always filter queries by `space_id` - no global task lists
2. **Auth state**: Must check `loading` in `AuthContext` before rendering protected UI
3. **Real-time**: Subscriptions are active connections - unsubscribe in cleanup
4. **Image optimization**: Supabase storage URLs use `remotePatterns: { hostname: '**' }`

## File Reference Guide
| Path | Purpose |
|------|---------|
| `src/app/(main)` | Protected pages (dashboard, tasks, etc.) |
| `src/app/(auth)` | Public auth pages (login, signup) |
| `src/lib/supabase.ts` | Client SDK initialization with validation |
| `src/lib/fairness.ts` | Task recommendation scoring algorithm |
| `src/components/admin/` | Admin-specific UI (gated by `AdminGuard.tsx`) |
| `e2e/` | Playwright test specs (use helpers for common actions) |
| `supabase/migrations/` | Database schema changes |

## AI Agent Tools & MCP Configuration

### CLI Commands (npm run cli)
Automated workflow commands for agents:
- `npm run cli dev` - Start dev server
- `npm run cli test [spec]` - Run tests (optional specific spec)
- `npm run cli test:headed` - Run tests with visible browser
- `npm run cli test:debug` - Debug tests with inspector
- `npm run cli test:report` - Open test report
- `npm run cli lint` - Run ESLint
- `npm run cli lint:fix` - Auto-fix linting issues
- `npm run cli type-check` - TypeScript validation
- `npm run cli migration:create <name>` - Create database migration
- `npm run cli db:push` - Apply migrations to Supabase
- `npm run cli db:pull` - Pull latest schema
- `npm run cli gen:types` - Generate types from schema
- `npm run cli clean` - Clean build artifacts
- `npm run cli env:setup` - Initialize environment

### MCP Servers Configuration
Located in `.mcp/mcp.json`. Provides AI-accessible tools:

**Filesystem Server**: Browse and read project files
**Supabase Server**: Execute database queries and migrations
- `db:query` - SELECT with filters
- `db:insert` - Insert records
- `db:update` - Update with filters
- `db:delete` - Delete with safety checks
- `migration:status` - Check applied migrations
- `schema:tables` - List all tables
- `schema:columns` - Get table column info

**Playwright Server**: Run and debug E2E tests

### Agent Configuration
File: `.agent/agent.json` defines:
- **Allowed modifications**: `src/**`, `e2e/**`, `.github/**`, `supabase/migrations/**`
- **Protected files**: `.env*`, `package.json`, `tsconfig.json`, `next.config.ts`
- **Key goals**: Type safety, fairness algorithms, multi-tenant isolation, E2E testing
- **Constraints**: Auth trigger rules, fairness scoring, real-time cleanup, Supabase validation
