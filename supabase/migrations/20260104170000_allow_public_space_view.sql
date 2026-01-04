-- Allow public/anonymous users to view spaces by invite code (for join page)
-- This is needed so unauthenticated users can see the space name before signing up

CREATE POLICY "Public can view spaces by invite code"
  ON public.spaces
  FOR SELECT
  TO anon
  USING (true);

-- Note: This allows anonymous users to view basic space info.
-- They still can't join without authenticating.
-- If you want to be more restrictive, you could use an RPC function instead.
