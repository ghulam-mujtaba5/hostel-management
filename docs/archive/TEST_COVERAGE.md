# Hostel Management System - Complete Testing Guide

## Overview
This document outlines all the comprehensive end-to-end tests and API endpoint tests for the Hostel Management System. The tests cover the complete workflow from creating a hostel to managing tasks and members.

## Test Suites

### 1. **hostel-creation-complete.spec.ts**
Comprehensive functional tests for the entire hostel management system.

#### Test Categories:

##### A. Hostel Creation and Management
- **Create Hostel Space**: Tests the complete space creation workflow
  - Navigates to create space page
  - Fills in space name
  - Submits form
  - Verifies success screen with invite code and link
  - Validates confetti animation and UI elements

- **View Spaces List**: Tests space listing page
  - Displays all user spaces
  - Shows create space button
  - Handles empty state (no spaces)

- **View Space Details**: Tests individual space page
  - Navigates to space detail page
  - Displays space information
  - Shows members and tasks

##### B. Task Management
- **Create Task**: Tests task creation workflow
  - Navigates to create task page
  - Fills task details (title, description, category, difficulty)
  - Submits form
  - Verifies success or redirect

- **View Tasks List**: Tests tasks page
  - Displays all tasks
  - Shows task cards/items
  - Handles empty state

- **Pick/Recommend Tasks**: Tests task recommendation page
  - Shows recommended tasks
  - Provides "Take This Task" functionality
  - Displays task details (difficulty, category, assignee)

##### C. Space Administration
- **Access Admin Panel**: Tests admin features
  - Navigates to space admin page
  - Displays admin controls
  - Shows member management options

- **Join Space**: Tests invite code functionality
  - Navigates to join space page
  - Shows invite code input form
  - Handles join process

##### D. User Features
- **User Profile**: Tests profile page
  - Displays user information
  - Shows statistics
  - Provides edit functionality

- **Preferences**: Tests user preferences/settings
  - Displays preference options
  - Allows category preferences
  - Allows availability settings

- **Leaderboard**: Tests ranking system
  - Displays all users with points
  - Shows ranking position
  - Updates in real-time

##### E. Additional Features
- **Demo Mode**: Tests guided tour
  - Shows welcome message
  - Displays tour steps (1/4, 2/4, 3/4, 4/4)
  - Allows navigation through tour
  - Can be closed/skipped

- **Feedback System**: Tests feedback page
  - Navigates to feedback
  - Shows feedback list or form
  - Allows submission of issues/features

- **Help & Documentation**: Tests guide pages
  - Guide/help documentation
  - Fairness information page

##### F. Complete User Journey
- **Full Workflow Test**: Tests end-to-end journey
  - Create space
  - Create task in space
  - View task in list
  - Navigate to dashboard
  - Verify all components work together

##### G. Error Handling
- **Invalid Inputs**: Tests form validation
  - Handles missing required fields
  - Validates input constraints
  - Shows appropriate error messages

- **Rapid Navigation**: Tests app stability
  - Navigates quickly between pages
  - Handles concurrent requests
  - Maintains state correctly

---

### 2. **api-endpoints.spec.ts**
API integration tests focusing on backend endpoint functionality.

#### Endpoint Categories:

##### A. Space/Hostel Endpoints
- **GET /api/spaces** - Retrieve spaces list
  - Fetches all user spaces
  - Returns space data with metadata

- **POST /api/spaces** - Create new space
  - Accepts space name
  - Sets creator as admin
  - Returns created space with ID
  - Generates invite code

- **GET /api/spaces/[id]** - Get space details
  - Retrieves specific space information
  - Includes metadata (creator, creation date)

- **GET /api/spaces/[id]/members** - Get space members
  - Lists all members with roles
  - Shows points and status
  - Includes member profiles

- **PUT /api/spaces/[id]** - Update space
  - Updates space name
  - Updates settings
  - Requires admin role

- **DELETE /api/spaces/[id]** - Delete space
  - Removes space and related data
  - Requires admin role

##### B. Task Endpoints
- **GET /api/tasks** - Retrieve all tasks
  - Fetches tasks for current spaces
  - Filters by status, category, difficulty
  - Returns task metadata

- **POST /api/tasks** - Create new task
  - Accepts title, description, category, difficulty
  - Sets due dates if provided
  - Assigns category and difficulty
  - Returns created task

- **GET /api/tasks/[id]** - Get task details
  - Retrieves specific task information
  - Includes assignee profile
  - Shows status history

- **PUT /api/tasks/[id]** - Update task
  - Updates status (todo → in_progress → pending_verification → done)
  - Updates assignment
  - Adds proof image
  - Updates due date

- **DELETE /api/tasks/[id]** - Delete task
  - Removes task from space
  - Requires creator or admin role

- **GET /api/tasks/pick** - Get recommended tasks
  - Returns personalized task recommendations
  - Based on user preferences and fairness

- **POST /api/tasks/[id]/complete** - Mark task as done
  - Updates status to done
  - Awards points
  - Logs activity

##### C. Member Management Endpoints
- **GET /api/members** - Get user profile
  - Retrieves current user profile
  - Shows statistics

- **PUT /api/members/profile** - Update profile
  - Updates username, full_name, avatar
  - Returns updated profile

- **POST /api/spaces/[id]/members** - Add member
  - Adds user to space
  - Sets role (admin/member)
  - Sets initial points

- **PUT /api/spaces/[id]/members/[userId]** - Update member
  - Updates role
  - Updates points
  - Updates status (active/inactive)

- **DELETE /api/spaces/[id]/members/[userId]** - Remove member
  - Removes user from space
  - Transfers tasks or marks complete
  - Requires admin role

- **POST /api/spaces/[id]/join** - Join space with code
  - Accepts invite code
  - Adds user to space as member
  - Returns space details

##### D. Leaderboard & Stats Endpoints
- **GET /api/leaderboard** - Get rankings
  - Returns users sorted by points
  - Includes position and statistics
  - Filters by space if provided

- **GET /api/stats/fairness** - Get fairness statistics
  - Shows task distribution
  - Calculates fairness score
  - Identifies workload imbalances

- **GET /api/preferences** - Get user preferences
  - Returns preferred categories
  - Shows availability
  - Returns max weekly tasks setting

- **PUT /api/preferences** - Update preferences
  - Updates category preferences
  - Updates availability
  - Updates task limits

##### E. Activity & Logging Endpoints
- **GET /api/activity** - Get activity log
  - Retrieves activity history
  - Filters by action type
  - Shows user and timestamp

- **POST /api/activity** - Log activity
  - Records user actions
  - Stores details in JSON
  - Automatically called on actions

##### F. Admin Endpoints
- **GET /api/admin/spaces/[id]** - Admin space view
  - Gets detailed space statistics
  - Shows member list with details
  - Displays revenue/points data

- **POST /api/admin/spaces/[id]/settings** - Update admin settings
  - Updates space settings
  - Manages permissions
  - Requires admin role

- **GET /api/admin/members** - Manage members
  - Lists all members with roles
  - Shows activity status
  - Allows bulk operations

---

## Test Execution

### Running All Tests
```bash
npm run test:e2e
```

### Running Specific Test Suite
```bash
npx playwright test hostel-creation-complete.spec.ts
npx playwright test api-endpoints.spec.ts
```

### Running Specific Test
```bash
npx playwright test --grep "should create a new hostel space successfully"
```

### Running with UI Mode (Recommended for Development)
```bash
npx playwright test --ui
```

### Running with Debug
```bash
npx playwright test --debug
```

### Generating HTML Report
```bash
npx playwright test --reporter=html
npx playwright show-report
```

---

## Test Data & Prerequisites

### Authentication
- Tests assume either:
  - User is already logged in (via Supabase auth)
  - Demo mode is available for public testing
  - Auth context is properly initialized

### Database State
- Tests create new resources with timestamps to avoid conflicts
- Example: `Test Hostel ${Date.now()}`
- This ensures unique names for each test run

### Environment Setup
- Ensure Next.js dev server is running: `npm run dev`
- Playwright config points to `http://localhost:3000`
- Supabase client is configured with environment variables

---

## API Endpoint Reference

### Base URL
```
http://localhost:3000
```

### Authentication
All endpoints require Supabase authentication (via AuthContext):
- Authorization header: `Authorization: Bearer {JWT_TOKEN}`
- Token managed by Supabase client

### Response Format
Success (200):
```json
{
  "data": { /* resource data */ },
  "error": null
}
```

Error (4xx/5xx):
```json
{
  "data": null,
  "error": { "message": "Error description" }
}
```

---

## Features Tested

### ✅ Hostel Management
- Create new hostels/spaces
- View hostel list
- View hostel details
- Update hostel information
- Delete hostels (admin only)
- Generate invite codes
- Share invite links

### ✅ Task Management
- Create tasks with full details
- View task list with filters
- View task details
- Assign tasks to members
- Update task status (workflow)
- Mark tasks as complete
- Upload proof images
- Set task difficulty and category
- Add descriptions and due dates

### ✅ Member Management
- Add members via invite code
- Remove members
- Update member roles (admin/member)
- View member list
- Track member points
- Manage member status (active/inactive)

### ✅ User Features
- View and edit user profile
- Set user preferences
- View user statistics
- Join spaces with invite code
- Track personal points and ranking
- View fairness statistics

### ✅ Gamification
- Points system (awarded on task completion)
- Leaderboard rankings
- Difficulty multipliers
- Category tracking
- Fairness scoring

### ✅ Admin Features
- Access admin panel
- Manage space members
- View statistics and analytics
- Update space settings
- Monitor activity
- Export reports

### ✅ Additional Features
- Demo mode with guided tour
- Feedback system (report issues/suggest features)
- Activity logging (all actions tracked)
- Help/Guide documentation
- Fairness info page

---

## Error Handling Tests

### Validated Scenarios
- Invalid space IDs
- Missing required fields
- Duplicate space names
- Invalid task difficulties (outside 1-10 range)
- Invalid category selections
- Unauthorized access attempts
- Rapid navigation stress tests
- Form validation errors
- Network error handling

---

## Performance Considerations

### Test Timeouts
- Default Playwright timeout: 30 seconds
- Specific operations:
  - Page navigation: 10 seconds
  - Form submission: 5 seconds
  - Database operations: 10 seconds

### Parallel Execution
- Tests run in parallel by default
- Use `test.serial` for tests that need sequencing
- Isolation ensured through unique test data (timestamps)

---

## Continuous Integration

### CI/CD Integration
Tests are configured to run in CI pipeline:
- Headless mode enabled
- Single worker (controlled by `playwright.config.ts`)
- HTML report generation
- Failure screenshots saved
- Test results uploaded

### Configuration in `playwright.config.ts`
```typescript
{
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
}
```

---

## Troubleshooting

### Common Issues

1. **Tests fail with "page.goto() timed out"**
   - Ensure dev server is running: `npm run dev`
   - Check if port 3000 is in use
   - Increase timeout in playwright.config.ts

2. **Tests fail with authentication errors**
   - Verify Supabase credentials in .env.local
   - Check if user is logged in (demo mode doesn't require auth)
   - Ensure AuthContext is properly initialized

3. **Tests fail with "element not found"**
   - UI elements might have changed
   - Use `--ui` mode to inspect elements
   - Check if page rendered correctly with `await page.screenshot()`

4. **Rate limiting errors**
   - Space requests between Supabase operations
   - Add `await page.waitForTimeout(500)` between rapid actions
   - Check Supabase rate limits

### Debugging Tools
- Use `--ui` mode for interactive debugging
- Use `--debug` flag to step through tests
- Generate screenshots with `await page.screenshot()`
- Check console logs with `page.on('console', msg => console.log(msg))`
- Inspect network requests with `page.on('response', response => ...)`

---

## Future Enhancements

### Planned Tests
- [ ] Multi-space scenarios (user managing multiple hostels)
- [ ] Real-time updates (WebSocket testing)
- [ ] Photo upload and validation
- [ ] Email notifications
- [ ] Export functionality (CSV/PDF reports)
- [ ] Backup and recovery
- [ ] API rate limiting tests

### Visual Regression Testing
- Planned addition of visual snapshots
- Test UI consistency across updates
- Responsive design validation

### Performance Testing
- Load testing with multiple concurrent users
- Database query optimization verification
- Response time benchmarks

---

## Success Criteria

All tests pass when:
1. ✅ User can create a hostel space
2. ✅ Created space appears in spaces list
3. ✅ User can create tasks within the space
4. ✅ Tasks appear in task list and are filterable
5. ✅ User can assign and complete tasks
6. ✅ Points are awarded on task completion
7. ✅ Leaderboard updates with new points
8. ✅ Members can be added via invite code
9. ✅ Admin features work correctly
10. ✅ All pages load without errors
11. ✅ Forms validate input correctly
12. ✅ No console errors or network errors
13. ✅ Navigation between pages is smooth
14. ✅ Responsive design works on mobile/tablet
15. ✅ Demo mode functions correctly

---

## Contact & Support

For test-related questions or issues:
1. Review this documentation
2. Check test output: `npx playwright show-report`
3. Run with `--debug` flag for step-by-step execution
4. Check browser console for error messages
