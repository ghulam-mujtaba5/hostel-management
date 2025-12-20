-- Fix the space_members policy to avoid infinite recursion
DROP POLICY IF EXISTS "Members can view other members in same space" ON public.space_members;

-- Create a simpler policy that allows authenticated users to view space membership
CREATE POLICY "Space members can view membership" 
ON public.space_members 
FOR SELECT 
USING (auth.role() = 'authenticated');
