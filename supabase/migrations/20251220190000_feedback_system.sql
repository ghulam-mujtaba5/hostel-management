-- Create feedback table for issues and feature requests
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('issue', 'feature')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'planned', 'in_progress', 'completed', 'rejected')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback_votes table for voting on features
CREATE TABLE feedback_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(feedback_id, user_id)
);

-- Create feedback_comments table for admin responses
CREATE TABLE feedback_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  is_admin_response BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_votes_feedback_id ON feedback_votes(feedback_id);
CREATE INDEX idx_feedback_votes_user_id ON feedback_votes(user_id);
CREATE INDEX idx_feedback_comments_feedback_id ON feedback_comments(feedback_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER feedback_updated_at_trigger
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback table
-- Users can view all feedback
CREATE POLICY "Users can view all feedback"
  ON feedback FOR SELECT
  USING (true);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for feedback_votes table
-- Users can view all votes
CREATE POLICY "Users can view all votes"
  ON feedback_votes FOR SELECT
  USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can insert own votes"
  ON feedback_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON feedback_votes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for feedback_comments table
-- Users can view all comments
CREATE POLICY "Users can view all comments"
  ON feedback_comments FOR SELECT
  USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
  ON feedback_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON feedback_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create view for feedback with vote counts and user info
CREATE VIEW feedback_with_details AS
SELECT 
  f.id,
  f.user_id,
  f.type,
  f.title,
  f.description,
  f.status,
  f.priority,
  f.created_at,
  f.updated_at,
  COUNT(DISTINCT fv.id) as vote_count,
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'id', fc.id,
        'comment', fc.comment,
        'is_admin_response', fc.is_admin_response,
        'created_at', fc.created_at
      )
    ) FILTER (WHERE fc.id IS NOT NULL),
    '[]'
  ) as comments
FROM feedback f
LEFT JOIN feedback_votes fv ON f.id = fv.feedback_id
LEFT JOIN feedback_comments fc ON f.id = fc.feedback_id
GROUP BY f.id, f.user_id, f.type, f.title, f.description, f.status, f.priority, f.created_at, f.updated_at;
