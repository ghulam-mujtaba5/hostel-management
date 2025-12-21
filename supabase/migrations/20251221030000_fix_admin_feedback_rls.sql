-- Fix RLS policies to allow admin feedback access
-- The admin portal uses local authentication via AdminGuard
-- So we need to allow SELECT access without requiring Supabase auth

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;

-- Recreate with permissive SELECT for admin read access
CREATE POLICY "Allow all feedback reads" ON feedback 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert own feedback" ON feedback 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON feedback 
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Allow admin to delete feedback
CREATE POLICY "Allow feedback deletion" ON feedback 
  FOR DELETE USING (true);

-- Feedback votes policies - allow open read
DROP POLICY IF EXISTS "Users can view all votes" ON feedback_votes;
DROP POLICY IF EXISTS "Users can insert own votes" ON feedback_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON feedback_votes;

CREATE POLICY "Allow all votes reads" ON feedback_votes 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert votes" ON feedback_votes 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON feedback_votes 
  FOR DELETE USING (auth.uid() = user_id);

-- Feedback comments policies - allow open read
DROP POLICY IF EXISTS "Users can view all comments" ON feedback_comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON feedback_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON feedback_comments;

CREATE POLICY "Allow all comments reads" ON feedback_comments 
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON feedback_comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON feedback_comments 
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
