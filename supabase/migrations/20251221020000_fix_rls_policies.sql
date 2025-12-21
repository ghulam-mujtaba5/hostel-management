-- Fix RLS policies to allow authenticated users to insert and read their own data

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create better policies that allow authenticated users to insert
CREATE POLICY "Authenticated users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id AND auth.role() = 'authenticated');

-- Ensure feedback tables have proper RLS policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- Recreate feedback policies if they don't exist
DROP POLICY IF EXISTS "Users can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Users can insert own feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update own feedback" ON feedback;

CREATE POLICY "Users can view all feedback" ON feedback 
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own feedback" ON feedback 
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own feedback" ON feedback 
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Feedback votes policies
DROP POLICY IF EXISTS "Users can view all votes" ON feedback_votes;
DROP POLICY IF EXISTS "Users can insert own votes" ON feedback_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON feedback_votes;

CREATE POLICY "Users can view all votes" ON feedback_votes 
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own votes" ON feedback_votes 
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own votes" ON feedback_votes 
  FOR DELETE USING (auth.uid() = user_id);

-- Feedback comments policies
DROP POLICY IF EXISTS "Users can view all comments" ON feedback_comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON feedback_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON feedback_comments;

CREATE POLICY "Users can view all comments" ON feedback_comments 
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON feedback_comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

CREATE POLICY "Users can update own comments" ON feedback_comments 
  FOR UPDATE USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);
