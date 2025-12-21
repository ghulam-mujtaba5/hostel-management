# Agent Quick Reference

## Essential Commands for Autonomous Development

### Daily Workflow
```bash
npm install                    # Install dependencies
npm run cli env:setup          # Initialize environment
npm run dev                    # Start development server
npm run type-check             # Validate TypeScript
npm run lint:fix               # Auto-fix code issues
npm run cli test:headed        # Test with browser visible
```

### Testing Checklist
- [ ] Run relevant E2E tests: `npm run cli test [spec-name]`
- [ ] Check test report: `npm run cli test:report`
- [ ] Validate types: `npm run type-check`
- [ ] Lint code: `npm run lint:fix`

### Database Changes
```bash
# 1. Create migration
npm run cli migration:create describe_your_change

# 2. Edit supabase/migrations/[timestamp]_describe_your_change.sql

# 3. Push to Supabase
npm run db:push

# 4. Generate updated types
npm run cli gen:types

# 5. Update src/types/index.ts if needed
```

## Code Patterns Quick Lookup

### Supabase Query with Filters
```typescript
// Location: src/lib/supabase.ts
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('space_id', currentSpace.id)
  .order('created_at', { ascending: false });
```

### Fairness Scoring
```typescript
// Location: src/lib/fairness.ts
const recommendations = calculateTaskRecommendations(
  availableTasks,
  userHistory,
  allMembersStats
);
// Returns TaskRecommendation[] with scores and explanations
```

### Error Handling
```typescript
// Location: src/lib/error-handler.ts
throw new NotFoundError('Task');
throw new ValidationError('Invalid email', { field: 'email' });
throw new UnauthorizedError('Not authenticated');
```

### React Hook Form + Zod
```typescript
// Location: src/components/FormField.tsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### Real-Time Subscriptions
```typescript
// Location: src/lib/realtime.ts
const unsubscribe = subscribeToTasks(spaceId, (tasks) => {
  // Handle updates
});
// Always unsubscribe in cleanup!
return () => unsubscribe();
```

### Authentication Context
```typescript
// Location: src/contexts/AuthContext.tsx
const { user, profile, currentSpace, loading, signIn, signOut } = useAuth();
```

## File Modification Safety Rules

### ✅ Safe to Modify
- `src/**/*.ts` - Application code
- `src/**/*.tsx` - React components
- `e2e/**/*.spec.ts` - Test files
- `.github/**` - GitHub configuration
- `supabase/migrations/**` - Database migrations
- `public/**` - Static assets

### ❌ Protected (Require Extreme Care)
- `.env*` - Environment variables (never commit)
- `package.json` - Dependencies (discuss before changes)
- `tsconfig.json` - TypeScript config
- `next.config.ts` - Build configuration
- `playwright.config.ts` - Test configuration

### ❌ Hands-Off (Never Modify)
- `node_modules/**` - Managed by npm
- `.next/**` - Build output
- `.playwright/**` - Test cache

## Critical Gotchas

### 1. Multi-Tenancy
❌ WRONG:
```typescript
const tasks = await supabase.from('tasks').select('*');
```

✅ CORRECT:
```typescript
const tasks = await supabase
  .from('tasks')
  .select('*')
  .eq('space_id', currentSpace.id);
```

### 2. Auth State
❌ WRONG:
```typescript
if (!user) return <Dashboard />; // Crashes if loading=true
```

✅ CORRECT:
```typescript
if (loading) return <Skeleton />;
if (!user) return null;
return <Dashboard />;
```

### 3. Real-Time Cleanup
❌ WRONG:
```typescript
useEffect(() => {
  subscribeToTasks(id, updateTasks); // Subscription never cleaned up!
}, []);
```

✅ CORRECT:
```typescript
useEffect(() => {
  const unsubscribe = subscribeToTasks(id, updateTasks);
  return () => unsubscribe();
}, [id]);
```

### 4. Supabase Validation
❌ WRONG:
```typescript
import { createClient } from '@supabase/supabase-js';
const client = createClient(url, key); // Could be invalid
```

✅ CORRECT:
```typescript
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
if (!isSupabaseConfigured) throw new Error('Configure Supabase');
```

## Testing Commands by Scenario

```bash
# Test single auth flow
npm run cli test auth

# Debug specific test
npm run cli test:debug navigation

# All tests with visible browser
npm run cli test:headed

# Test a specific scenario in a file
npm run cli test auth -- --grep "signup"

# Check coverage
npm run cli test -- --reporter=html
```

## Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For Supabase CLI access:
```env
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_PROJECT_ID=your-project-id
```

## Performance Targets
- **Build time**: < 2 minutes
- **Dev server start**: < 30 seconds  
- **E2E test suite**: < 5 minutes
- **Page load (Lighthouse)**: CWV all green
- **Type checking**: < 10 seconds
