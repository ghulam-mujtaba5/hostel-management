-- Comprehensive Update: Services, Notes, Issues, Wellness

-- 1. Services Catalog (for defining available services in a space)
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Personal Notes
CREATE TABLE IF NOT EXISTS notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE, -- Optional: note linked to a space
  title VARCHAR(255) NOT NULL,
  content TEXT,
  is_private BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Space Issues / Maintenance Reporting
CREATE TABLE IF NOT EXISTS space_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Daily Inspirations / Wellness (Islamic Values & Psychological Support)
CREATE TABLE IF NOT EXISTS daily_inspirations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  source VARCHAR(100), -- e.g., "Quran 2:152", "Hadith", "Psychology Today"
  category VARCHAR(50) DEFAULT 'general', -- 'islamic', 'motivation', 'wellness'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed some inspirations
INSERT INTO daily_inspirations (content, source, category) VALUES
('Verily, with hardship comes ease.', 'Quran 94:6', 'islamic'),
('The best of people are those that bring most benefit to the rest of mankind.', 'Hadith', 'islamic'),
('Take care of your body. It’s the only place you have to live.', 'Jim Rohn', 'wellness'),
('Kindness is a mark of faith, and whoever has not kindness has not faith.', 'Hadith', 'islamic'),
('Your mental health is a priority. Your happiness is an essential. Your self-care is a necessity.', 'Unknown', 'wellness');

-- 5. Add Notification Preferences to Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "push": true, "marketing": false}';

-- RLS Policies

-- Services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Space members can view services" ON services FOR SELECT USING (
  EXISTS (SELECT 1 FROM space_members WHERE space_id = services.space_id AND user_id = auth.uid())
);
CREATE POLICY "Space members can create services" ON services FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM space_members WHERE space_id = services.space_id AND user_id = auth.uid())
);
CREATE POLICY "Space admins can update services" ON services FOR UPDATE USING (
  EXISTS (SELECT 1 FROM space_members WHERE space_id = services.space_id AND user_id = auth.uid() AND role = 'admin')
);

-- Notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own notes" ON notes FOR ALL USING (auth.uid() = user_id);

-- Space Issues
ALTER TABLE space_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Space members can view issues" ON space_issues FOR SELECT USING (
  EXISTS (SELECT 1 FROM space_members WHERE space_id = space_issues.space_id AND user_id = auth.uid())
);
CREATE POLICY "Space members can create issues" ON space_issues FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM space_members WHERE space_id = space_issues.space_id AND user_id = auth.uid())
);
CREATE POLICY "Space members can update issues" ON space_issues FOR UPDATE USING (
  EXISTS (SELECT 1 FROM space_members WHERE space_id = space_issues.space_id AND user_id = auth.uid())
);

-- Daily Inspirations
ALTER TABLE daily_inspirations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view inspirations" ON daily_inspirations FOR SELECT USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_space ON services(space_id);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_space_issues_space ON space_issues(space_id);
