# Agent Capability Map

## What AI Agents Can Now Do

### 🔧 Command Execution (25+ Commands)
```
npm run cli [command]

Development        Testing           Database         Code Quality
├─ dev            ├─ test            ├─ migration    ├─ lint
├─ build          ├─ test:headed     ├─ db:push      ├─ lint:fix
├─ start          ├─ test:debug      ├─ db:pull      └─ type-check
└─ clean          └─ test:report     └─ db:list
```

**Example**: `npm run cli test auth` runs `e2e/auth.spec.ts` autonomously

### 📦 MCP Tool Access

#### Filesystem Tools
```javascript
list_dir("/src/components")      // Browse structure
read_file("/src/lib/utils.ts")   // Read code
create_file("/src/NewFile.ts")   // Create files
replace_string_in_file()         // Modify code
```

#### Database Tools (Supabase)
```javascript
// Query with multi-tenant safety
db:query({ 
  table: "tasks", 
  filters: { space_id: "abc-123" } 
})

// Create migrations safely
migration:create("add_new_column")

// Check schema
schema:tables()    // List all tables
schema:columns()   // Get table structure
```

#### Browser Automation (Playwright)
```bash
npm run cli test:headed          # Visible browser testing
npm run cli test:debug           # Step through tests
npm run cli test:report          # View results
```

### 🎯 Autonomous Workflows Agents Can Execute

#### 1. Full Development Cycle
```bash
npm run cli env:setup                # 1. Initialize env
npm run dev                          # 2. Start server (background)
npm run type-check                   # 3. Validate types
npm run lint:fix                     # 4. Fix style issues
npm run cli test:headed              # 5. Run tests with browser
npm run cli test:report              # 6. Review results
npm run build                        # 7. Verify production build
```

#### 2. Database Schema Changes
```bash
npm run cli migration:create fix_profiles
# Edit supabase/migrations/[timestamp]_fix_profiles.sql
npm run db:push                      # Apply migration
npm run cli gen:types                # Generate TS types
# Modify src/types/index.ts if needed
npm run type-check                   # Validate types
```

#### 3. Feature Implementation
```bash
# 1. Code the feature
create_file("/src/components/Feature.tsx", code)

# 2. Validate
npm run type-check
npm run lint:fix

# 3. Test
npm run cli test new-feature         # Run feature tests
npm run cli test:report              # Check results

# 4. Build verification
npm run build
```

#### 4. Bug Fixing
```bash
# 1. Find the bug
grep_search("error message")
read_file("/src/lib/problemFile.ts")

# 2. Fix it
replace_string_in_file()

# 3. Verify fix
npm run cli test --grep "bug test"
npm run cli test:report

# 4. Type check
npm run type-check
```

### 🚀 Command Reference Cheat Sheet

#### Quick Start
| Goal | Command |
|------|---------|
| Setup env | `npm run cli env:setup` |
| Start dev | `npm run dev` |
| Run tests | `npm run cli test` |
| View tests | `npm run cli test:report` |
| Check types | `npm run type-check` |

#### Database Operations
| Goal | Command |
|------|---------|
| Create migration | `npm run cli migration:create <name>` |
| Apply migration | `npm run db:push` |
| Sync schema | `npm run db:pull` |
| Check migrations | `npm run cli migration:status` |
| List tables | `npm run cli schema:tables` |
| Get columns | `npm run cli schema:columns` |

#### Code Quality
| Goal | Command |
|------|---------|
| Lint code | `npm run lint` |
| Auto-fix | `npm run lint:fix` |
| Type check | `npm run type-check` |
| Build prod | `npm run build` |
| Test specific | `npm run cli test <spec>` |

### 🛡️ Safety Constraints Built In

**Agents WILL:**
- ✅ Validate types before executing
- ✅ Run tests after code changes
- ✅ Keep migrations organized
- ✅ Filter queries by `space_id` (multi-tenancy)
- ✅ Clean up real-time subscriptions
- ✅ Add error handling with proper types

**Agents WON'T:**
- ❌ Modify `.env*` files directly
- ❌ Delete records without WHERE clauses
- ❌ Skip test validation
- ❌ Use `any` types in TypeScript
- ❌ Create leaky subscriptions
- ❌ Modify protected config files

### 🎯 Agent Decision Tree

```
Need to...

├─ Create code?
│  └─ npm run type-check → npm run lint:fix → npm run cli test
│
├─ Modify database?
│  └─ npm run cli migration:create → Edit → npm run db:push
│
├─ Debug failing test?
│  └─ npm run cli test:debug [spec] → Fix → npm run cli test:report
│
├─ Check architecture?
│  └─ read_file("src/...") → review patterns → code
│
├─ Verify everything works?
│  └─ npm run type-check && npm run lint && npm run build && npm run test
│
└─ Need help?
   └─ npm run cli help → npm run cli info
```

### 📊 Command Success Indicators

#### ✅ Healthy Workflow
```
$ npm run type-check
No errors found

$ npm run lint
✓ All files pass ESLint

$ npm run build  
✓ Compiled successfully

$ npm run cli test
✓ All tests passed (42 passed)
```

#### ⚠️ Issues Found
```
$ npm run type-check
error TS2339: Property 'nonexistent' does not exist

FIX: Use replace_string_in_file() to correct type

$ npm run lint
error: Unexpected var, use 'const' instead

FIX: Run npm run lint:fix to auto-correct
```

### 🔄 Workflow Integration Points

```
Agent Action → Validation → Execution → Verification → Result

1. Code Analysis
   └─ read_file, grep_search, semantic_search

2. Code Generation  
   └─ create_file, replace_string_in_file

3. Validation
   └─ npm run type-check, npm run lint

4. Testing
   └─ npm run cli test, npm run cli test:headed

5. Deployment
   └─ npm run build (verify production readiness)

6. Reporting
   └─ Read test reports, console output
```

## Key AI-Friendly Patterns in This Codebase

1. **Strict TypeScript** - Catches errors before runtime
2. **Centralized Config** (`src/lib/config.ts`) - Feature flags, settings
3. **Error Classes** (`src/lib/error-handler.ts`) - Structured error handling
4. **Test Helpers** (`e2e/helpers.ts`) - Reusable test utilities
5. **Fairness Algorithm** (`src/lib/fairness.ts`) - Complex business logic documented
6. **Real-time Patterns** (`src/lib/realtime.ts`) - Subscription management
7. **Type Guards** - Multi-tenant filters always applied
8. **Context API** - Single source of truth for auth state

## Next: Agent Initialization

When an agent starts working on this project:

1. ✅ Read `.github/copilot-instructions.md` - Architecture overview
2. ✅ Read `.agent/QUICKREF.md` - Patterns and gotchas  
3. ✅ Read `.agent/agent.json` - Rules and constraints
4. ✅ Run `npm run cli info` - See available commands
5. ✅ Run `npm run type-check` - Verify setup
6. ✅ Run `npm run cli test --reporter=html` - Test infrastructure
7. 🚀 Start work! Use `npm run cli <command>`

---

**Ready for autonomous development!** 🤖
