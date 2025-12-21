-- Add accommodation details to space_members
ALTER TABLE public.space_members ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE public.space_members ADD COLUMN IF NOT EXISTS bed_number TEXT;
ALTER TABLE public.space_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a table for hostel rooms if we want more structure
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  capacity INT DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(space_id, room_number)
);

-- Update space_members to reference rooms (optional but better)
-- For now, let's keep it simple and just use the columns in space_members as requested for "assignments"
