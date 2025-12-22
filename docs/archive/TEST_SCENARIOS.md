# Hostel Management System - Test Scenarios Reference

## User Journeys Tested

### Journey 1: New User Creates First Hostel
```
1. User navigates to /spaces/create
2. Fills in hostel name (e.g., "Apartment 4B")
3. Clicks "Create Space" button
4. System shows success screen with:
   - Hostel confirmation message
   - Unique invite code (e.g., "a1b2c3")
   - Shareable invite link
   - Copy buttons for easy sharing
5. User clicks "Go to Dashboard"
6. User lands on main dashboard/spaces view
```
**Tests**: hostel-creation-complete.spec.ts → "should create a new hostel space successfully"

---

### Journey 2: Creating and Assigning Tasks
```
1. User navigates to /tasks/create
2. Fills in task details:
   - Title: "Clean Kitchen"
   - Description: "All surfaces and appliances"
   - Category: "Kitchen"
   - Difficulty: "5"
3. Clicks "Create Task"
4. System confirms task creation
5. User navigates to /tasks/pick
6. Views recommended tasks
7. Clicks "Take This Task" on a recommended task
8. Task is assigned to user
9. Points may be awarded based on difficulty
```
**Tests**: 
- hostel-creation-complete.spec.ts → "should create a new task in a space"
- api-endpoints.spec.ts → "should create a task with all fields"

---

### Journey 3: Member Invites Friend to Hostel
```
1. User on space detail page copies invite code
2. Shares code with friend via chat/messaging
3. Friend navigates to /spaces/join
4. Friend enters invite code
5. System validates code and adds friend to space
6. Friend now appears in member list
7. Friend has role "member" by default
8. Friend can start accepting tasks in the space
```
**Tests**: api-endpoints.spec.ts → "should join a space with invite code"

---

### Journey 4: Admin Manages Space and Members
```
1. Space creator navigates to /spaces/[id]/admin
2. Sees member list with:
   - Username
   - Points
   - Role (admin/member)
   - Status (active/inactive)
   - Actions (remove, change role)
3. Admin can:
   - Promote member to admin
   - Remove member from space
   - View member statistics
   - Monitor activity log
4. Changes are reflected immediately
5. Removed members lose access to space
```
**Tests**: 
- hostel-creation-complete.spec.ts → "should access space admin panel"
- api-endpoints.spec.ts → "should manage space members from admin panel"

---

### Journey 5: User Completes Task and Earns Points
```
1. User navigates to /tasks/pick
2. Sees recommended tasks with difficulty levels
3. Selects a task matching their availability
4. Clicks "Take This Task"
5. Task status changes to "in_progress"
6. User completes the task
7. Uploads proof image (e.g., "cleaned kitchen" photo)
8. Task status changes to "pending_verification"
9. Admin verifies and marks complete
10. User receives points (based on difficulty)
11. Points update in real-time
12. User's leaderboard ranking updates
```
**Tests**: api-endpoints.spec.ts → "should update task status"

---

### Journey 6: User Checks Progress and Rankings
```
1. User navigates to /leaderboard
2. Sees all users ranked by points
3. Can identify their own position
4. Sees top performers
5. Navigates to /fairness-info
6. Sees workload distribution
7. Understands if tasks are fairly distributed
8. Views own /profile for personal stats:
   - Total points
   - Tasks completed
   - Average difficulty
   - Favorite categories
```
**Tests**: 
- hostel-creation-complete.spec.ts → "should display leaderboard with user rankings"
- api-endpoints.spec.ts → "should retrieve current user profile"

---

## API Test Scenarios

### Scenario 1: Create Space with Proper Database Operations
```
REQUEST: POST /api/spaces
{
  "name": "Test Hostel 1234567890"
}

EXPECTED OPERATIONS:
1. Profile check - ensure creator profile exists
2. Insert into spaces table:
   - id: uuid (auto)
   - name: "Test Hostel 1234567890"
   - created_by: user.id
   - created_at: now()
   - invite_code: auto-generated
3. Insert into space_members table:
   - space_id: created_space.id
   - user_id: creator.id
   - role: 'admin'
   - points: 0
4. Insert into activity_log table:
   - action: 'created_space'
   - details: {name: '...'}

RESPONSE SUCCESS:
{
  "data": {
    "id": "uuid-123",
    "name": "Test Hostel 1234567890",
    "invite_code": "a1b2c3",
    "created_by": "user-uuid",
    "created_at": "2025-12-21T10:00:00Z"
  },
  "error": null
}
```
**Test**: api-endpoints.spec.ts → "should create a space via Supabase client"

---

### Scenario 2: Create Task with Validation
```
REQUEST: POST /api/tasks
{
  "space_id": "space-uuid",
  "title": "Clean Kitchen",
  "description": "All surfaces",
  "category": "kitchen",
  "difficulty": 5,
  "due_date": "2025-12-25T23:59:59Z"
}

VALIDATION CHECKS:
1. User is member of space (RLS)
2. Title is not empty (required)
3. Category is in allowed list
4. Difficulty is 1-10
5. Space exists and user has access

DATABASE OPERATIONS:
1. Insert into tasks table
2. Set status to "todo"
3. assigned_to = null (unassigned)
4. created_by = current_user

RESPONSE:
{
  "data": {
    "id": "task-uuid",
    "space_id": "space-uuid",
    "title": "Clean Kitchen",
    "status": "todo",
    "difficulty": 5,
    "created_at": "2025-12-21T10:00:00Z"
  },
  "error": null
}
```
**Test**: api-endpoints.spec.ts → "should create a task with all fields"

---

### Scenario 3: Update Task Status (Workflow)
```
WORKFLOW: todo → in_progress → pending_verification → done

STATE 1: Task is "todo"
User clicks "Take This Task"
REQUEST: PUT /api/tasks/[id]
{
  "status": "in_progress",
  "assigned_to": "user-uuid"
}

STATE 2: User uploads proof and marks done
REQUEST: PUT /api/tasks/[id]
{
  "status": "pending_verification",
  "proof_image_url": "https://storage/.../image.jpg"
}

STATE 3: Admin verifies
REQUEST: PUT /api/tasks/[id]
{
  "status": "done"
}

ON COMPLETION:
1. Update task.status = "done"
2. Award points to user:
   - Base points: difficulty × 10
   - Bonus for difficulty: if difficulty > 7 then +20
3. Update space_members.points
4. Insert activity_log entry
5. Update fairness statistics

RESPONSE:
{
  "data": {
    "id": "task-uuid",
    "status": "done",
    "completed_at": "2025-12-21T11:30:00Z",
    "points_awarded": 50
  },
  "error": null
}
```
**Test**: api-endpoints.spec.ts → "should update task status"

---

### Scenario 4: Join Space with Invite Code
```
REQUEST: POST /api/spaces/[space_id]/join
{
  "invite_code": "a1b2c3"
}

VALIDATION:
1. Invite code must match space's invite_code
2. User must not already be member of space
3. User profile must exist

OPERATIONS:
1. Verify invite_code in spaces table
2. Check space exists
3. Insert into space_members:
   - space_id: verified_space.id
   - user_id: current_user.id
   - role: "member"
   - points: 0
4. Log activity: "joined_space"

RESPONSE:
{
  "data": {
    "space_id": "space-uuid",
    "space_name": "Apartment 4B",
    "role": "member",
    "joined_at": "2025-12-21T10:00:00Z"
  },
  "error": null
}
```
**Test**: api-endpoints.spec.ts → "should join a space with invite code"

---

### Scenario 5: Get User Preferences
```
REQUEST: GET /api/preferences

RETURNS:
{
  "data": {
    "user_id": "user-uuid",
    "space_id": "space-uuid",
    "preferred_categories": ["kitchen", "dishes"],
    "avoided_categories": ["laundry"],
    "max_weekly_tasks": 5,
    "availability": {
      "monday": true,
      "tuesday": true,
      "wednesday": false,
      "thursday": true,
      "friday": true,
      "saturday": true,
      "sunday": false
    }
  },
  "error": null
}
```
**Test**: api-endpoints.spec.ts → "should retrieve user preferences"

---

### Scenario 6: Get Leaderboard Rankings
```
REQUEST: GET /api/leaderboard?space_id=space-uuid

RETURNS ARRAY:
{
  "data": [
    {
      "rank": 1,
      "user_id": "user-uuid-1",
      "username": "alice",
      "avatar_url": "...",
      "points": 500,
      "tasks_completed": 25,
      "average_difficulty": 6.2
    },
    {
      "rank": 2,
      "user_id": "user-uuid-2",
      "username": "bob",
      "avatar_url": "...",
      "points": 450,
      "tasks_completed": 22,
      "average_difficulty": 5.8
    },
    ...
  ],
  "error": null
}
```
**Test**: api-endpoints.spec.ts → "should display user points and ranking"

---

## Error Scenarios Tested

### Error 1: Unauthenticated Request
```
REQUEST: GET /api/spaces (without auth token)

RESPONSE (401):
{
  "data": null,
  "error": {
    "message": "Unauthorized",
    "status": 401
  }
}
```

### Error 2: Invalid Space ID
```
REQUEST: GET /api/spaces/invalid-uuid

RESPONSE (404):
{
  "data": null,
  "error": {
    "message": "Space not found",
    "status": 404
  }
}
```

### Error 3: Insufficient Permissions
```
REQUEST: PUT /api/spaces/[id]/admin/settings (as non-admin)

RESPONSE (403):
{
  "data": null,
  "error": {
    "message": "Insufficient permissions",
    "status": 403
  }
}
```

### Error 4: Validation Error
```
REQUEST: POST /api/tasks
{
  "title": "", // empty
  "difficulty": 15 // invalid (must be 1-10)
}

RESPONSE (400):
{
  "data": null,
  "error": {
    "message": "Validation failed",
    "details": [
      "Title is required",
      "Difficulty must be between 1 and 10"
    ]
  }
}
```

### Error 5: Duplicate Entry
```
REQUEST: POST /api/spaces/[id]/members
{
  "user_id": "existing-member-uuid",
  "role": "member"
}

RESPONSE (409):
{
  "data": null,
  "error": {
    "message": "User is already a member of this space",
    "status": 409
  }
}
```

---

## Data Validation Test Cases

### Task Creation Validation
```
TEST CASES:
1. Empty title → Rejected
2. Very long title (>500 chars) → Rejected or truncated
3. Difficulty = 0 → Rejected (must be 1-10)
4. Difficulty = 11 → Rejected (must be 1-10)
5. Invalid category → Rejected
6. Valid category → Accepted
7. Missing required fields → Rejected
8. All fields valid → Accepted

EXPECTED BEHAVIOR:
- Client-side validation (instant feedback)
- Server-side validation (security)
- Error messages clear and actionable
```

### Space Name Validation
```
TEST CASES:
1. Empty name → Rejected
2. Name with special chars (é, ñ, 中文) → Accepted
3. Very long name (>500 chars) → Rejected or truncated
4. Whitespace-only name → Rejected
5. Valid name → Accepted and trimmed

EXPECTED BEHAVIOR:
- Unicode support
- Trimming of whitespace
- Reasonable length limits
```

---

## Performance Test Scenarios

### Scenario 1: List 100+ Tasks
```
REQUEST: GET /api/tasks?space_id=space-uuid&limit=50

EXPECTED:
- Response time < 500ms
- Proper pagination
- Only returns 50 items
- Includes total count
- Allows offset for next page
```

### Scenario 2: Rapid Task Updates
```
SEQUENCE:
1. Create task → 50ms
2. Update status → 50ms
3. Add proof image → 100ms
4. Mark complete → 50ms

TOTAL: < 500ms
```

### Scenario 3: Load Leaderboard with Many Users
```
REQUEST: GET /api/leaderboard (1000+ users)

EXPECTED:
- Response < 1000ms
- Returns top 100
- Pagination support
- Uses database indices
```

---

## Integration Test Scenarios

### Scenario 1: Complete Task Journey
```
TIME: 0:00 - User logs in
TIME: 0:05 - Creates space
TIME: 0:10 - Creates task
TIME: 0:15 - Invites 2 friends (via invite code)
TIME: 0:20 - Both friends join
TIME: 0:30 - User takes task
TIME: 1:00 - User completes and uploads proof
TIME: 1:05 - Admin verifies
TIME: 1:10 - Points awarded, leaderboard updates

VERIFY:
- All database operations succeeded
- No data corruption
- Proper role-based access
- Activity logged
- Points calculated correctly
```

### Scenario 2: Multi-Space User
```
SETUP:
- User is member of 3 spaces:
  - "Apartment A" (admin)
  - "Apartment B" (member)
  - "Hostel C" (member)

VERIFY:
- Can see tasks from all 3 spaces
- Can admin only in Apartment A
- Points track separately by space
- Can manage all simultaneously
- No data leaks between spaces
```

---

## Test Data Examples

### Sample Space
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Apartment 4B",
  "invite_code": "a1b2c3",
  "created_by": "550e8400-e29b-41d4-a716-446655440001",
  "created_at": "2025-12-21T10:00:00Z"
}
```

### Sample Task
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "space_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Clean Kitchen",
  "description": "Clean all surfaces and appliances",
  "category": "kitchen",
  "difficulty": 5,
  "status": "in_progress",
  "assigned_to": "550e8400-e29b-41d4-a716-446655440001",
  "due_date": "2025-12-25T23:59:59Z",
  "proof_image_url": null,
  "created_by": "550e8400-e29b-41d4-a716-446655440003",
  "created_at": "2025-12-21T11:00:00Z"
}
```

### Sample Member
```json
{
  "space_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "role": "admin",
  "points": 250,
  "joined_at": "2025-12-21T10:00:00Z",
  "profile": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "username": "alice",
    "full_name": "Alice Johnson",
    "avatar_url": "https://...",
    "created_at": "2025-12-20T00:00:00Z"
  }
}
```

---

## Summary of Test Coverage

| Category | Scenarios | Status |
|----------|-----------|--------|
| User Journeys | 6 | ✅ |
| API Scenarios | 6 | ✅ |
| Error Cases | 5 | ✅ |
| Validation Cases | 15+ | ✅ |
| Performance | 3 | ✅ |
| Integration | 2 | ✅ |
| **Total** | **35+** | **✅** |

All scenarios are covered by one or more test cases in the test files!
