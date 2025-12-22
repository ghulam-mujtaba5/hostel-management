-- Service Queue System for Task Management
-- Allows members to queue for service tasks with priority boost capabilities

-- Service Queue Table
CREATE TABLE IF NOT EXISTS service_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL, -- matches task category
  description TEXT,
  urgency VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- Queue Position Management
  queue_position INTEGER NOT NULL,
  original_position INTEGER NOT NULL,
  priority_skips_used INTEGER DEFAULT 0, -- Track how many times user has skipped ahead
  priority_skips_available INTEGER DEFAULT 5, -- Max 5 skips per member
  
  -- Status Tracking
  status VARCHAR(30) DEFAULT 'queued', -- 'queued', 'in_service', 'completed', 'cancelled'
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Wait Time Tracking
  estimated_wait_minutes INTEGER,
  actual_wait_minutes INTEGER,
  
  -- Member Priority Factors
  is_hostel_member BOOLEAN DEFAULT TRUE,
  membership_tier VARCHAR(20) DEFAULT 'standard', -- 'standard', 'premium', 'vip'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Priority Skip History (audit trail)
CREATE TABLE IF NOT EXISTS queue_priority_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_entry_id UUID NOT NULL REFERENCES service_queue(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  skip_count INTEGER NOT NULL, -- How many positions they skipped
  reason VARCHAR(100), -- 'urgency', 'membership_priority', 'available_skip'
  previous_position INTEGER NOT NULL,
  new_position INTEGER NOT NULL,
  skipped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queue Configuration per Space
CREATE TABLE IF NOT EXISTS queue_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE UNIQUE,
  
  -- Global Queue Settings
  max_priority_skips_per_member INTEGER DEFAULT 5,
  priority_skip_reset_period VARCHAR(20) DEFAULT 'monthly', -- 'weekly', 'monthly', 'never'
  
  -- Service Time Settings
  avg_service_time_minutes INTEGER DEFAULT 30,
  max_concurrent_services INTEGER DEFAULT 3,
  
  -- Priority Rules
  enable_membership_priority BOOLEAN DEFAULT TRUE,
  enable_urgency_priority BOOLEAN DEFAULT TRUE,
  enable_time_based_priority BOOLEAN DEFAULT FALSE, -- Boost priority if waiting too long
  max_wait_before_boost_minutes INTEGER DEFAULT 120, -- Auto-boost after 2 hours
  
  -- Fair Use Policy
  prevent_skip_abuse BOOLEAN DEFAULT TRUE,
  min_time_between_skips_hours INTEGER DEFAULT 24,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_queue_space ON service_queue(space_id);
CREATE INDEX IF NOT EXISTS idx_service_queue_user ON service_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_service_queue_status ON service_queue(space_id, status);
CREATE INDEX IF NOT EXISTS idx_service_queue_position ON service_queue(space_id, queue_position, status);
CREATE INDEX IF NOT EXISTS idx_priority_history_queue ON queue_priority_history(queue_entry_id);
CREATE INDEX IF NOT EXISTS idx_priority_history_user ON queue_priority_history(user_id, space_id);

-- Enable RLS
ALTER TABLE service_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_priority_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_queue
CREATE POLICY "Space members can view queue" ON service_queue
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = service_queue.space_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create their own queue entries" ON service_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue entries" ON service_queue
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queue entries" ON service_queue
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for queue_priority_history
CREATE POLICY "Space members can view priority history" ON queue_priority_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = queue_priority_history.space_id AND user_id = auth.uid())
  );

-- RLS Policies for queue_settings
CREATE POLICY "Space members can view queue settings" ON queue_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = queue_settings.space_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage queue settings" ON queue_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = queue_settings.space_id AND user_id = auth.uid() AND role = 'admin')
  );

-- Function: Join Service Queue
CREATE OR REPLACE FUNCTION join_service_queue(
  p_space_id UUID,
  p_service_type VARCHAR,
  p_description TEXT DEFAULT NULL,
  p_urgency VARCHAR DEFAULT 'normal'
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_next_position INTEGER;
  v_queue_entry service_queue;
  v_estimated_wait INTEGER;
  v_settings queue_settings;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if user is a space member
  IF NOT EXISTS (SELECT 1 FROM space_members WHERE space_id = p_space_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'User is not a member of this space';
  END IF;
  
  -- Get queue settings
  SELECT * INTO v_settings FROM queue_settings WHERE space_id = p_space_id;
  
  -- If settings don't exist, create with defaults
  IF NOT FOUND THEN
    INSERT INTO queue_settings (space_id) VALUES (p_space_id) RETURNING * INTO v_settings;
  END IF;
  
  -- Calculate next queue position
  SELECT COALESCE(MAX(queue_position), 0) + 1 INTO v_next_position
  FROM service_queue
  WHERE space_id = p_space_id AND status = 'queued';
  
  -- Calculate estimated wait time
  v_estimated_wait := (v_next_position - 1) * v_settings.avg_service_time_minutes / v_settings.max_concurrent_services;
  
  -- Insert into queue
  INSERT INTO service_queue (
    space_id, user_id, service_type, description, urgency,
    queue_position, original_position, estimated_wait_minutes
  )
  VALUES (
    p_space_id, v_user_id, p_service_type, p_description, p_urgency,
    v_next_position, v_next_position, v_estimated_wait
  )
  RETURNING * INTO v_queue_entry;
  
  -- Create notification
  PERFORM create_notification(
    v_user_id,
    p_space_id,
    'queue_joined',
    'Joined Service Queue',
    format('You are #%s in queue for %s service', v_next_position, p_service_type),
    jsonb_build_object(
      'queue_id', v_queue_entry.id,
      'position', v_next_position,
      'estimated_wait', v_estimated_wait
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'queue_entry', row_to_json(v_queue_entry),
    'message', format('Successfully joined queue at position %s', v_next_position)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Use Priority Skip to Move Ahead in Queue
CREATE OR REPLACE FUNCTION use_priority_skip(
  p_queue_entry_id UUID,
  p_positions_to_skip INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_entry service_queue;
  v_settings queue_settings;
  v_new_position INTEGER;
  v_last_skip_time TIMESTAMP;
  v_skip_reason VARCHAR;
BEGIN
  v_user_id := auth.uid();
  
  -- Get queue entry
  SELECT * INTO v_entry FROM service_queue WHERE id = p_queue_entry_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue entry not found or access denied';
  END IF;
  
  IF v_entry.status != 'queued' THEN
    RAISE EXCEPTION 'Can only skip when in queued status';
  END IF;
  
  -- Get settings
  SELECT * INTO v_settings FROM queue_settings WHERE space_id = v_entry.space_id;
  
  -- Check if user has priority skips available
  IF v_entry.priority_skips_used >= v_entry.priority_skips_available THEN
    RAISE EXCEPTION 'No priority skips remaining (used %/% skips)', 
      v_entry.priority_skips_used, v_entry.priority_skips_available;
  END IF;
  
  -- Limit skip amount (max 5 positions at once)
  p_positions_to_skip := LEAST(p_positions_to_skip, 5);
  
  -- Check if enough skips remaining
  IF v_entry.priority_skips_used + p_positions_to_skip > v_entry.priority_skips_available THEN
    RAISE EXCEPTION 'Not enough priority skips (need %, have % remaining)', 
      p_positions_to_skip, 
      (v_entry.priority_skips_available - v_entry.priority_skips_used);
  END IF;
  
  -- Check minimum time between skips (prevent abuse)
  IF v_settings.prevent_skip_abuse THEN
    SELECT MAX(skipped_at) INTO v_last_skip_time
    FROM queue_priority_history
    WHERE user_id = v_user_id AND space_id = v_entry.space_id;
    
    IF v_last_skip_time IS NOT NULL AND 
       v_last_skip_time > NOW() - (v_settings.min_time_between_skips_hours || ' hours')::INTERVAL THEN
      RAISE EXCEPTION 'Must wait % hours between priority skips', v_settings.min_time_between_skips_hours;
    END IF;
  END IF;
  
  -- Calculate new position (can't go below 1)
  v_new_position := GREATEST(1, v_entry.queue_position - p_positions_to_skip);
  
  -- Update positions of affected entries
  UPDATE service_queue
  SET 
    queue_position = queue_position + 1,
    updated_at = NOW()
  WHERE 
    space_id = v_entry.space_id 
    AND status = 'queued'
    AND queue_position >= v_new_position 
    AND queue_position < v_entry.queue_position
    AND id != p_queue_entry_id;
  
  -- Determine skip reason
  v_skip_reason := CASE
    WHEN v_entry.urgency IN ('urgent', 'high') THEN 'urgency'
    WHEN v_entry.membership_tier IN ('premium', 'vip') THEN 'membership_priority'
    ELSE 'available_skip'
  END;
  
  -- Update queue entry
  UPDATE service_queue
  SET 
    queue_position = v_new_position,
    priority_skips_used = priority_skips_used + p_positions_to_skip,
    updated_at = NOW()
  WHERE id = p_queue_entry_id
  RETURNING * INTO v_entry;
  
  -- Record priority skip in history
  INSERT INTO queue_priority_history (
    queue_entry_id, user_id, space_id, skip_count, reason,
    previous_position, new_position
  )
  VALUES (
    p_queue_entry_id, v_user_id, v_entry.space_id, p_positions_to_skip, v_skip_reason,
    v_entry.queue_position + p_positions_to_skip, v_new_position
  );
  
  -- Recalculate wait times for all in queue
  PERFORM recalculate_queue_wait_times(v_entry.space_id);
  
  -- Notify user
  PERFORM create_notification(
    v_user_id,
    v_entry.space_id,
    'queue_position_updated',
    'Moved Ahead in Queue',
    format('You moved from position #%s to #%s (%s skips remaining)', 
      v_entry.queue_position + p_positions_to_skip, 
      v_new_position,
      v_entry.priority_skips_available - v_entry.priority_skips_used),
    jsonb_build_object(
      'queue_id', p_queue_entry_id,
      'old_position', v_entry.queue_position + p_positions_to_skip,
      'new_position', v_new_position,
      'skips_used', p_positions_to_skip,
      'skips_remaining', v_entry.priority_skips_available - v_entry.priority_skips_used
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'queue_entry', row_to_json(v_entry),
    'old_position', v_entry.queue_position + p_positions_to_skip,
    'new_position', v_new_position,
    'skips_remaining', v_entry.priority_skips_available - v_entry.priority_skips_used,
    'message', format('Moved ahead %s positions in queue', p_positions_to_skip)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Recalculate Wait Times for Entire Queue
CREATE OR REPLACE FUNCTION recalculate_queue_wait_times(p_space_id UUID)
RETURNS void AS $$
DECLARE
  v_settings queue_settings;
  v_avg_time INTEGER;
  v_concurrent INTEGER;
BEGIN
  -- Get settings
  SELECT * INTO v_settings FROM queue_settings WHERE space_id = p_space_id;
  v_avg_time := COALESCE(v_settings.avg_service_time_minutes, 30);
  v_concurrent := COALESCE(v_settings.max_concurrent_services, 3);
  
  -- Update estimated wait times based on current queue position
  UPDATE service_queue
  SET 
    estimated_wait_minutes = (queue_position - 1) * v_avg_time / v_concurrent,
    updated_at = NOW()
  WHERE space_id = p_space_id AND status = 'queued';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Queue Status for Space
CREATE OR REPLACE FUNCTION get_queue_status(p_space_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total_queued INTEGER;
  v_in_service INTEGER;
  v_avg_wait INTEGER;
  v_settings queue_settings;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO v_total_queued
  FROM service_queue
  WHERE space_id = p_space_id AND status = 'queued';
  
  SELECT COUNT(*) INTO v_in_service
  FROM service_queue
  WHERE space_id = p_space_id AND status = 'in_service';
  
  -- Get average wait
  SELECT AVG(estimated_wait_minutes)::INTEGER INTO v_avg_wait
  FROM service_queue
  WHERE space_id = p_space_id AND status = 'queued';
  
  -- Get settings
  SELECT * INTO v_settings FROM queue_settings WHERE space_id = p_space_id;
  
  RETURN json_build_object(
    'total_queued', v_total_queued,
    'in_service', v_in_service,
    'avg_wait_minutes', COALESCE(v_avg_wait, 0),
    'max_concurrent', COALESCE(v_settings.max_concurrent_services, 3),
    'spots_available', COALESCE(v_settings.max_concurrent_services, 3) - v_in_service
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Start Service (called by admin/service provider)
CREATE OR REPLACE FUNCTION start_service(p_queue_entry_id UUID)
RETURNS JSON AS $$
DECLARE
  v_entry service_queue;
BEGIN
  -- Update entry to in_service
  UPDATE service_queue
  SET 
    status = 'in_service',
    started_at = NOW(),
    actual_wait_minutes = EXTRACT(EPOCH FROM (NOW() - queued_at)) / 60,
    updated_at = NOW()
  WHERE id = p_queue_entry_id
  RETURNING * INTO v_entry;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue entry not found';
  END IF;
  
  -- Notify user
  PERFORM create_notification(
    v_entry.user_id,
    v_entry.space_id,
    'service_started',
    'Service Started',
    format('Your %s service has begun', v_entry.service_type),
    jsonb_build_object('queue_id', p_queue_entry_id)
  );
  
  -- Recalculate queue positions and wait times
  PERFORM recalculate_queue_wait_times(v_entry.space_id);
  
  RETURN json_build_object(
    'success', true,
    'queue_entry', row_to_json(v_entry)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete Service
CREATE OR REPLACE FUNCTION complete_service(p_queue_entry_id UUID)
RETURNS JSON AS $$
DECLARE
  v_entry service_queue;
BEGIN
  -- Update entry to completed
  UPDATE service_queue
  SET 
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_queue_entry_id
  RETURNING * INTO v_entry;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue entry not found';
  END IF;
  
  -- Notify user
  PERFORM create_notification(
    v_entry.user_id,
    v_entry.space_id,
    'service_completed',
    'Service Completed',
    format('Your %s service is complete!', v_entry.service_type),
    jsonb_build_object('queue_id', p_queue_entry_id)
  );
  
  -- Recalculate queue
  PERFORM recalculate_queue_wait_times(v_entry.space_id);
  
  RETURN json_build_object(
    'success', true,
    'queue_entry', row_to_json(v_entry)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reset Priority Skips (run periodically)
CREATE OR REPLACE FUNCTION reset_priority_skips()
RETURNS void AS $$
DECLARE
  v_settings RECORD;
BEGIN
  -- For each space with queue settings
  FOR v_settings IN 
    SELECT space_id, priority_skip_reset_period 
    FROM queue_settings 
    WHERE priority_skip_reset_period IN ('weekly', 'monthly')
  LOOP
    -- Reset skips based on period
    UPDATE service_queue
    SET 
      priority_skips_used = 0,
      updated_at = NOW()
    WHERE 
      space_id = v_settings.space_id
      AND status = 'queued'
      AND (
        (v_settings.priority_skip_reset_period = 'weekly' AND created_at < NOW() - INTERVAL '7 days')
        OR
        (v_settings.priority_skip_reset_period = 'monthly' AND created_at < NOW() - INTERVAL '30 days')
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_queue_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_queue_timestamp
  BEFORE UPDATE ON service_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_timestamp();

CREATE TRIGGER trigger_update_queue_settings_timestamp
  BEFORE UPDATE ON queue_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_timestamp();

-- Initialize queue settings for existing spaces
INSERT INTO queue_settings (space_id)
SELECT id FROM spaces
ON CONFLICT (space_id) DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION join_service_queue(UUID, VARCHAR, TEXT, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION use_priority_skip(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_queue_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_service(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_service(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_queue_wait_times(UUID) TO authenticated;

