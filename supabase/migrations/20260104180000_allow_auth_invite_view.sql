-- Allow authenticated users to view spaces by invite code (for join flow)
-- This is needed so users can see the space name before joining via invite

CREATE POLICY "Authenticated users can view spaces by invite code"
  ON public.spaces
  FOR SELECT
  TO authenticated
  USING (invite_code IS NOT NULL);

-- Note: This allows authenticated users to see any space with an invite code.
-- For more restrictive access, you could use a function that only returns
-- the space if a valid invite code is provided.
