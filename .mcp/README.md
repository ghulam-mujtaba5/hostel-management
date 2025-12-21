# MCP Configuration for Hostel Management System

This directory contains Model Context Protocol (MCP) and agent configurations that enable AI agents to autonomously work with the codebase.

## Available MCP Servers

### 1. Filesystem Server
Provides read/write access to project files within allowed paths.

**Usage in Code**:
```typescript
// Agents can list directory contents
list_dir("/src/components")

// Read files
read_file("/src/lib/fairness.ts")

// Create and modify files
create_file("/src/components/NewComponent.tsx", "...")
replace_string_in_file("/src/lib/utils.ts", "old", "new")
```

### 2. Supabase Server
Provides database query capabilities via `mcp-supabase.js`.

**Tools Available**:
- `db:query` - SELECT queries with filtering
- `db:insert` - Insert new records
- `db:update` - Update records with WHERE conditions
- `db:delete` - Delete with required safety filters
- `migration:status` - Check applied migrations
- `schema:tables` - List all tables
- `schema:columns` - Get table structure

**Environment Requirements**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_KEY=sbp_... # For write operations
```

**Example Queries**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "db:query",
    "arguments": {
      "table": "tasks",
      "columns": "id,title,status",
      "filters": {
        "space_id": "abc-123",
        "status": "active"
      }
    }
  }
}
```

### 3. Playwright Server
Executes E2E tests with full browser automation capabilities.

**Commands**:
```bash
npx playwright test                    # Run all tests
npx playwright test --headed           # Visible browser
npx playwright test --debug            # Debug mode
npx playwright show-report             # View results
```

## Configuration Files

### mcp.json
Defines which MCP servers are available and how to launch them.

Update this file to add/remove MCP servers or change launch parameters.

### agent.json
Defines rules, constraints, and goals for AI agents.

**Key Sections**:
- `tools`: Enable/disable capabilities (code modification, testing, builds)
- `allowedPaths`: Directories safe to modify
- `protectedPaths`: Files requiring extreme care
- `goals`: Primary development objectives
- `constraints`: Rules agents must follow

### QUICKREF.md
Agent quick reference with:
- Essential commands
- Code pattern examples
- Safety rules and gotchas
- Testing workflows

## Using MCP with AI Agents

### In VS Code with Copilot
1. Copilot automatically loads `mcp.json` and `agent.json`
2. Use Copilot's inline chat: `@agent <task>`
3. Reference specific tools in requests

### With Claude (Desktop)
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "hostel-filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "."]
    },
    "hostel-supabase": {
      "command": "node",
      "args": ["./scripts/mcp-supabase.js"]
    }
  }
}
```

### With Custom Agents
Use STDIO protocol to communicate:
```javascript
const MCP = require('mcp-client');
const mcp = new MCP({
  command: 'node',
  args: ['./scripts/mcp-supabase.js']
});

const result = await mcp.call('db:query', {
  table: 'tasks',
  filters: { space_id: 'abc-123' }
});
```

## Safety & Approval Workflows

### Automatic (No Approval Required)
- Reading files and schema
- Running tests and linting
- Type checking
- Viewing reports

### Requires Review
- Database migrations (set in `agent.json`)
- Package dependency changes
- Protected file modifications

### Manual Only (Protected)
- Environment variable changes
- Security-critical configuration
- Public API modifications

## Monitoring Agent Actions

Check agent activity:
```bash
# View test results
npm run cli test:report

# Check TypeScript errors
npm run type-check

# Review linting
npm run lint

# List recent database migrations
npm run cli db:list
```

## Troubleshooting

### MCP Server Won't Start
```bash
# Check Node.js is installed
node --version

# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Test Supabase connection
npm run cli migration:status
```

### Agent Can't Access Files
- Check file is in `allowedPaths` in `agent.json`
- Verify file path is absolute: `/workspace/src/...`
- Check permissions on filesystem

### Database Operations Fail
- Verify `SUPABASE_SERVICE_KEY` is set for write ops
- Check `NEXT_PUBLIC_SUPABASE_URL` is valid
- Ensure table exists: `npm run cli schema:tables`

## Performance

MCP servers are stateless - each request is independent. For best performance:
- Batch queries where possible
- Cache schema information
- Reuse connections when available

## References

- [MCP Protocol Spec](https://spec.modelcontextprotocol.io/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Playwright Testing](https://playwright.dev/)
- Agent Configuration: [agent.json](./agent.json)
- Quick Commands: [QUICKREF.md](./QUICKREF.md)
