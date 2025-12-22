-- Notifications System
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'task_assigned', 'task_completed', 'cleaning_request', 'token_used', 'member_joined', 'announcement'
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Request Tokens (for cleaning requests with limit)
CREATE TABLE IF NOT EXISTS task_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  tokens_used INTEGER DEFAULT 0,
  max_tokens INTEGER DEFAULT 5,
  period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  period_type VARCHAR(20) DEFAULT 'weekly', -- 'weekly', 'monthly'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, space_id)
);

-- Task Request History (when user requests cleaning/help)
CREATE TABLE IF NOT EXISTS task_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  proof_image_url TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'in_progress', 'completed', 'rejected'
  token_cost INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Scheduling & Rotation Settings (per space)
CREATE TABLE IF NOT EXISTS task_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE UNIQUE,
  rotation_enabled BOOLEAN DEFAULT TRUE,
  rotation_type VARCHAR(20) DEFAULT 'round_robin', -- 'round_robin', 'random', 'weighted'
  auto_assign_enabled BOOLEAN DEFAULT FALSE,
  max_requests_per_period INTEGER DEFAULT 5,
  request_period VARCHAR(20) DEFAULT 'weekly',
  notification_before_due INTEGER DEFAULT 24, -- hours
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Assignment History (for fair rotation tracking)
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category VARCHAR(50),
  difficulty INTEGER,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  was_auto_assigned BOOLEAN DEFAULT FALSE
);

-- Hostel Profile (additional space settings)
CREATE TABLE IF NOT EXISTS space_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE UNIQUE,
  description TEXT,
  address TEXT,
  rules TEXT,
  announcement TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_task_tokens_user_space ON task_tokens(user_id, space_id);
CREATE INDEX IF NOT EXISTS idx_task_requests_space ON task_requests(space_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_space ON task_assignments(space_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_profiles ENABLE ROW LEVEL SECURITY;

-- Notification policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Task tokens policies
CREATE POLICY "Users can view their own tokens" ON task_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage tokens" ON task_tokens
  FOR ALL USING (true);

-- Task requests policies
CREATE POLICY "Space members can view requests" ON task_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = task_requests.space_id AND user_id = auth.uid())
  );

CREATE POLICY "Space members can create requests" ON task_requests
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = task_requests.space_id AND user_id = auth.uid())
  );

CREATE POLICY "Requester or admin can update requests" ON task_requests
  FOR UPDATE USING (
    requester_id = auth.uid() OR
    EXISTS (SELECT 1 FROM space_members WHERE space_id = task_requests.space_id AND user_id = auth.uid() AND role = 'admin')
  );

-- Task settings policies
CREATE POLICY "Space members can view settings" ON task_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = task_settings.space_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can manage settings" ON task_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = task_settings.space_id AND user_id = auth.uid() AND role = 'admin')
  );

-- Task assignments policies
CREATE POLICY "Space members can view assignments" ON task_assignments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = task_assignments.space_id AND user_id = auth.uid())
  );

CREATE POLICY "System can manage assignments" ON task_assignments
  FOR ALL USING (true);

-- Space profiles policies
CREATE POLICY "Anyone can view space profiles" ON space_profiles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage space profiles" ON space_profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM space_members WHERE space_id = space_profiles.space_id AND user_id = auth.uid() AND role = 'admin')
  );

-- Function to reset tokens weekly/monthly
CREATE OR REPLACE FUNCTION reset_expired_tokens()
RETURNS void AS $$
BEGIN
  UPDATE task_tokens
  SET tokens_used = 0, period_start = NOW(), updated_at = NOW()
  WHERE 
    (period_type = 'weekly' AND period_start < NOW() - INTERVAL '7 days')
    OR (period_type = 'monthly' AND period_start < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_space_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, space_id, type, title, message, data)
  VALUES (p_user_id, p_space_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification when task is assigned
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    PERFORM create_notification(
      NEW.assigned_to,
      NEW.space_id,
      'task_assigned',
      'New Task Assigned',
      'You have been assigned: ' || NEW.title,
      jsonb_build_object('task_id', NEW.id, 'task_title', NEW.title)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON tasks;
CREATE TRIGGER trigger_notify_task_assigned
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assigned();

-- Initialize task tokens for new space members
CREATE OR REPLACE FUNCTION init_member_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_tokens (user_id, space_id, tokens_used, max_tokens)
  VALUES (NEW.user_id, NEW.space_id, 0, 5)
  ON CONFLICT (user_id, space_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_init_member_tokens ON space_members;
CREATE TRIGGER trigger_init_member_tokens
  AFTER INSERT ON space_members
  FOR EACH ROW
  EXECUTE FUNCTION init_member_tokens();

-- Initialize task settings for new spaces
CREATE OR REPLACE FUNCTION init_space_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO task_settings (space_id)
  VALUES (NEW.id)
  ON CONFLICT (space_id) DO NOTHING;
  
  INSERT INTO space_profiles (space_id)
  VALUES (NEW.id)
  ON CONFLICT (space_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_init_space_settings ON spaces;
CREATE TRIGGER trigger_init_space_settings
  AFTER INSERT ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION init_space_settings();
