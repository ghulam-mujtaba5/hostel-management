# Service Queue System - Complete Guide

## 🎯 Overview

The **Service Queue System** allows hostel members to request cleaning services and join a queue with **priority skip capabilities**. Each member can skip ahead up to **5 positions** in the queue to minimize wait times while maintaining fairness.

---

## 📊 How the System Works

### 1. **Joining the Queue**

When a member requests a service:
- They join at the **back of the queue** (next available position)
- System calculates **estimated wait time** based on:
  - Current queue position
  - Average service time
  - Number of concurrent services allowed

**Example:**
```
Queue: [Person A, Person B, Person C]
You join → Position #4
Estimated wait: 30 minutes
```

---

### 2. **Priority Skip System** ⚡

Each member gets **5 priority skips** they can use to move ahead in the queue:

#### **How Priority Skips Work:**
- **1 Skip** = Move ahead **1 position** in queue
- Can use **1, 2, or 5 skips** at once (up to 5 total per period)
- Skips reset **monthly** (configurable: weekly/monthly/never)

#### **Skip Limits:**
- Maximum 5 skips per member per period
- Can't skip more positions than available
- Minimum time between skips: **24 hours** (prevents abuse)
- Can't move to position #0 (minimum position is #1)

**Example:**
```
Initial Position: #8
Use 5 skips → New Position: #3
Skips Remaining: 0/5

After monthly reset:
Skips Remaining: 5/5 (available again)
```

---

### 3. **Queue Management**

#### **Queue Positions:**
- Real-time position tracking
- Auto-recalculates when someone:
  - Uses priority skips
  - Leaves queue
  - Service starts/completes

#### **Service Status:**
- **Queued**: Waiting in line
- **In Service**: Currently being served
- **Completed**: Service finished
- **Cancelled**: User left queue

---

## 🎮 Member Experience

### **Dashboard View:**

```
╔═══════════════════════════════════════╗
║   SERVICE QUEUE DASHBOARD              ║
╠═══════════════════════════════════════╣
║ Total in Queue:        8               ║
║ In Service:            2               ║
║ Avg Wait Time:        25 min           ║
║ Spots Available:       1               ║
╚═══════════════════════════════════════╝

YOUR POSITION: #5
Estimated Wait: 45 minutes
Service: Washroom Cleaning
Urgency: Normal

Priority Skips: 3/5 remaining

[Skip Ahead +1] [Skip Ahead +2] [Skip Ahead +5]
[Leave Queue]
```

### **Using Priority Skips:**

1. **Click "Skip Ahead +1"** → Move from #5 to #4
   - Skips used: 1
   - Remaining: 4/5

2. **Click "Skip Ahead +5"** → Move from #4 to #1 (if possible)
   - Skips used: 5 (total of 6)
   - Error: Only 4 skips remaining!

3. **Must use wisely** - once depleted, wait until monthly reset

---

## ⚙️ Admin Configuration

Admins can configure queue settings in **Hostel Settings**:

### **Queue Settings:**

| Setting | Default | Description |
|---------|---------|-------------|
| **Max Priority Skips** | 5 | How many skips each member gets |
| **Reset Period** | Monthly | When skips reset (weekly/monthly/never) |
| **Avg Service Time** | 30 min | Expected duration per service |
| **Max Concurrent** | 3 | How many services run at once |
| **Prevent Abuse** | On | Enforce minimum time between skips |
| **Min Hours Between Skips** | 24 | Cooldown period |

### **Priority Features:**

- ✅ **Membership Priority**: Members get priority over non-members
- ✅ **Urgency Priority**: Urgent requests auto-boost in queue
- ⚙️ **Time-Based Priority**: Auto-boost after waiting 2+ hours
- 🛡️ **Abuse Prevention**: Limits on skip frequency

---

## 🔄 Queue Algorithm

### **Position Calculation:**
```typescript
// Join queue
nextPosition = MAX(currentQueuePositions) + 1

// Estimated wait
estimatedWait = (position - 1) * avgServiceTime / maxConcurrent

// Example:
position = 8
avgServiceTime = 30 minutes
maxConcurrent = 3
estimatedWait = (8-1) * 30 / 3 = 70 minutes
```

### **Priority Skip Execution:**
```typescript
// User at position #8 uses 3 skips
newPosition = MAX(1, currentPosition - skipsUsed)
newPosition = MAX(1, 8 - 3) = 5

// Everyone between old and new position moves back
positions[5,6,7] → positions[6,7,8]
user → position[5]
```

---

## 📱 API Functions

### **Join Queue:**
```typescript
const { data } = await supabase.rpc('join_service_queue', {
  p_space_id: spaceId,
  p_service_type: 'washroom',
  p_description: 'Needs urgent cleaning',
  p_urgency: 'high'
});

// Returns:
{
  success: true,
  queue_entry: { id, position, estimated_wait, ... },
  message: "Successfully joined queue at position 5"
}
```

### **Use Priority Skip:**
```typescript
const { data } = await supabase.rpc('use_priority_skip', {
  p_queue_entry_id: queueEntryId,
  p_positions_to_skip: 3
});

// Returns:
{
  success: true,
  old_position: 8,
  new_position: 5,
  skips_remaining: 2,
  message: "Moved ahead 3 positions in queue"
}

// Throws error if:
// - No skips remaining
// - Used skip within last 24 hours (if abuse prevention enabled)
// - Trying to skip to position < 1
```

### **Get Queue Status:**
```typescript
const { data } = await supabase.rpc('get_queue_status', {
  p_space_id: spaceId
});

// Returns:
{
  total_queued: 8,
  in_service: 2,
  avg_wait_minutes: 25,
  max_concurrent: 3,
  spots_available: 1
}
```

---

## 🎯 Fair Use Policy

### **Prevents Abuse:**
1. **Maximum Skips**: Limited to 5 per period
2. **Cooldown Period**: 24 hours between skip uses
3. **Position Limits**: Can't skip beyond position #1
4. **Skip History**: All skips are logged and auditable

### **Encouraging Fair Behavior:**
- Monthly resets give everyone fresh chances
- Urgency levels provide alternative to constant skipping
- Clear visibility of who's using skips (admin view)

---

## 📊 Skip History Tracking

Every priority skip is recorded:

```typescript
{
  id: uuid,
  queue_entry_id: uuid,
  user_id: uuid,
  skip_count: 3,
  reason: 'available_skip', // or 'urgency', 'membership_priority'
  previous_position: 8,
  new_position: 5,
  skipped_at: timestamp
}
```

Admins can view:
- Who uses skips most frequently
- Average skips per member
- Skip patterns and trends

---

## 🚀 Database Schema

### **service_queue Table:**
```sql
- id (uuid, primary key)
- space_id (uuid, foreign key)
- user_id (uuid, foreign key)
- service_type (varchar) - matches task categories
- queue_position (integer) - current position
- original_position (integer) - starting position
- priority_skips_used (integer) - count of skips used
- priority_skips_available (integer) - max skips (default 5)
- status (varchar) - queued/in_service/completed/cancelled
- estimated_wait_minutes (integer)
- actual_wait_minutes (integer)
```

### **queue_priority_history Table:**
```sql
- id (uuid, primary key)
- queue_entry_id (uuid, foreign key)
- skip_count (integer)
- previous_position (integer)
- new_position (integer)
- reason (varchar)
- skipped_at (timestamp)
```

### **queue_settings Table:**
```sql
- id (uuid, primary key)
- space_id (uuid, foreign key, unique)
- max_priority_skips_per_member (integer, default 5)
- priority_skip_reset_period (varchar, default 'monthly')
- avg_service_time_minutes (integer, default 30)
- max_concurrent_services (integer, default 3)
- prevent_skip_abuse (boolean, default true)
- min_time_between_skips_hours (integer, default 24)
```

---

## 💡 User Scenarios

### **Scenario 1: Normal Queue Experience**
```
John joins queue for bathroom cleaning
→ Position #4, estimated wait 40 min
→ Waits patiently as queue moves
→ 30 minutes later: Position #2
→ Service starts
```

### **Scenario 2: Using Priority Skips**
```
Sarah joins queue
→ Position #10, estimated wait 90 min
→ Has important meeting in 30 min
→ Uses 5 priority skips
→ New position #5, estimated wait 30 min
→ Service completed on time
→ Skips remaining: 0/5 until monthly reset
```

### **Scenario 3: Urgency Priority**
```
Mike marks request as "urgent"
→ Joins at position #8
→ System detects urgency
→ Auto-recommendation: "Use priority skips?"
→ Mike uses 3 skips
→ Position #5
→ Gets faster service
```

---

## 🔐 Security & Permissions

### **Row Level Security:**
- Members can only view queues in their spaces
- Can only create/update their own queue entries
- Admins can manage any queue entry
- System functions enforce business rules

### **Abuse Prevention:**
- Minimum time between skips enforced
- Skip history permanently logged
- Admin notifications for excessive skipping
- Configurable limits per space

---

## 📈 Analytics & Insights

Track these metrics:
- Average wait time per service type
- Skip usage patterns
- Peak queue times
- Service completion rates
- Member satisfaction (via wait time vs estimated)

---

## 🎨 UI Components

### **Queue Page Features:**
- Real-time queue position
- Priority skip buttons (1, 2, 5 positions)
- Visual progress indicator
- Skip availability counter
- Estimated wait time
- Current queue view with all members

### **Settings Page Features:**
- Configure skip limits
- Set reset periods
- Adjust service times
- Enable/disable priority features
- Fair use enforcement options

---

## 🔄 Integration with Existing System

The queue system integrates with:
- **Task Categories**: Uses same categories for service types
- **Notifications**: Alerts on position changes, service start
- **Space Members**: Membership tier affects priority
- **Activity Log**: Records all queue actions
- **Points System**: Can award points for service completion

---

## 🎓 Best Practices

### **For Members:**
1. Use skips wisely - they're limited
2. Set appropriate urgency levels
3. Provide accurate service descriptions
4. Cancel if no longer needed

### **For Admins:**
1. Monitor skip usage patterns
2. Adjust settings based on demand
3. Set realistic service times
4. Enable abuse prevention
5. Review skip history regularly

---

## 📞 Support

If you encounter issues:
1. Check your skip availability
2. Verify cooldown period hasn't elapsed
3. Review queue settings
4. Contact hostel admin
5. Check skip history for audit trail

---

**System Version**: 1.0.0  
**Last Updated**: December 22, 2024  
**Status**: ✅ Production Ready
