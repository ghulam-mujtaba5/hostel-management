# 🤖 AI Agent & MCP Configuration Index

Complete setup for autonomous development in the Hostel Management System.

## Quick Navigation

### 📋 For First-Time Agents
Start here → [**SETUP_COMPLETE.md**](./SETUP_COMPLETE.md)
- What was added
- Quick start commands
- Available tools
- Safety features

### ⚡ For Experienced Developers
Quick reference → [**QUICKREF.md**](./QUICKREF.md)
- Essential commands
- Code patterns
- Safety rules
- Testing workflows

### 🎯 What Agents Can Do
Full capability overview → [**CAPABILITY_MAP.md**](./CAPABILITY_MAP.md)
- 25+ automated commands
- MCP tool access
- Autonomous workflows
- Decision trees

### ⚙️ Configuration Files
- [**agent.json**](./agent.json) - Agent rules, paths, constraints
- **[.mcp/mcp.json](../.mcp/mcp.json)** - MCP server definitions
- **[.mcp/README.md](../.mcp/README.md)** - MCP documentation

### 📖 Full Documentation
- [**.github/copilot-instructions.md**](../.github/copilot-instructions.md) - Complete architecture guide
- **scripts/cli.mjs** - CLI implementation (25 commands)
- **scripts/mcp-supabase.js** - Supabase MCP server

## One-Minute Setup

```bash
# 1. Initialize environment
npm run cli env:setup

# 2. See what's available
npm run cli help

# 3. Start development
npm run dev

# 4. Run tests
npm run cli test:headed

# 5. Check everything works
npm run type-check && npm run lint && npm run build
```

## Available Commands

### Development (5 commands)
```bash
npm run cli dev              # Start dev server
npm run cli build            # Production build
npm run cli start            # Run production server
npm run cli clean            # Clean cache/artifacts
npm run cli type-check       # TypeScript validation
```

### Testing (5 commands)
```bash
npm run cli test [spec]      # Run tests (optional specific spec)
npm run cli test:headed      # Tests with visible browser
npm run cli test:debug       # Debug with inspector
npm run cli test:report      # View HTML report
```

### Database (6 commands)
```bash
npm run cli migration:create <name>    # Create migration
npm run cli db:push                    # Apply migrations
npm run cli db:pull                    # Sync schema
npm run cli db:list                    # List migrations
npm run cli migration:status           # Check applied
npm run cli schema:tables              # List all tables
npm run cli schema:columns <table>     # Get table structure
npm run cli gen:types                  # Generate TS types
```

### Code Quality (3 commands)
```bash
npm run cli lint             # Run ESLint
npm run cli lint:fix         # Auto-fix issues
npm run cli type-check       # TypeScript check
```

### Utilities (5+ commands)
```bash
npm run cli env:setup        # Initialize .env.local
npm run cli info             # Project information
npm run cli help             # Show all commands
npm run cli clean            # Clean artifacts
```

## MCP Capabilities

### Filesystem Access
- Browse directories
- Read/write files
- Create components
- Modify existing code

### Database Operations
- Query with filters
- Insert/update/delete safely
- Create migrations
- View schema structure
- Check migration status

### Test Execution
- Run E2E tests
- Debug with visible browser
- View test reports
- Run specific test files

## Key Rules

### ✅ DO
- Filter queries by `space_id` (multi-tenancy)
- Check `loading` before rendering auth-dependent UI
- Unsubscribe from real-time in cleanup
- Use custom error classes from `src/lib/error-handler.ts`
- Validate Supabase credentials at runtime
- Run tests before committing

### ❌ DON'T
- Modify `.env*` directly
- Delete without WHERE clauses
- Use `any` types in TypeScript
- Skip test validation
- Leave subscriptions without cleanup
- Modify protected config files

## File Structure

```
hostel-management/
├── .agent/                    ← Agent configuration directory
│   ├── agent.json            # Agent rules & constraints
│   ├── QUICKREF.md           # Quick reference guide
│   ├── SETUP_COMPLETE.md     # What was added
│   ├── CAPABILITY_MAP.md     # Agent capabilities
│   └── README.md             # This file
│
├── .mcp/                      ← MCP configuration
│   ├── mcp.json              # MCP server definitions
│   └── README.md             # MCP documentation
│
├── .github/
│   └── copilot-instructions.md    # Full architecture guide
│
├── scripts/
│   ├── cli.mjs               # CLI implementation
│   └── mcp-supabase.js       # Supabase MCP server
│
└── [Rest of project structure]
```

## Command Examples by Scenario

### Adding a New Feature
```bash
# 1. Create component
create_file("src/components/Feature.tsx", code)

# 2. Validate
npm run type-check && npm run lint:fix

# 3. Create tests if needed
create_file("e2e/feature.spec.ts", tests)
npm run cli test feature

# 4. Build verification
npm run build
```

### Fixing a Bug
```bash
# 1. Find the issue
grep_search("error message")

# 2. Read problematic file
read_file("src/lib/buggyFile.ts")

# 3. Fix it
replace_string_in_file(path, old, new)

# 4. Validate and test
npm run type-check
npm run cli test
npm run build
```

### Database Schema Change
```bash
# 1. Create migration
npm run cli migration:create add_new_column

# 2. Edit migration file
# supabase/migrations/[timestamp]_add_new_column.sql

# 3. Apply and sync
npm run db:push
npm run cli gen:types

# 4. Update TypeScript types if needed
# src/types/index.ts

# 5. Verify
npm run type-check
```

## Monitoring Agent Work

### Check Test Results
```bash
npm run cli test:report    # View detailed test results
npm run cli test           # Run quick test check
```

### Verify Code Quality
```bash
npm run type-check         # TypeScript errors
npm run lint               # ESLint issues
npm run build              # Production build test
```

### Monitor Database
```bash
npm run cli migration:status   # Applied migrations
npm run cli schema:tables      # Available tables
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't access file | Check `allowedPaths` in `agent.json` |
| Database query fails | Verify `SUPABASE_URL` and credentials set |
| Tests won't run | Check `npm run dev` is running in background |
| TypeScript errors | Run `npm run type-check` to see all issues |
| MCP server won't start | Verify Node.js installed: `node --version` |

## Support & Documentation

- **Architecture**: [.github/copilot-instructions.md](../.github/copilot-instructions.md)
- **Quick Tips**: [QUICKREF.md](./QUICKREF.md)
- **MCP Details**: [.mcp/README.md](../.mcp/README.md)
- **Setup Info**: [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)
- **Capabilities**: [CAPABILITY_MAP.md](./CAPABILITY_MAP.md)

---

**Agent setup complete!** Ready for autonomous development. 🚀

Use `npm run cli help` to see all available commands.
