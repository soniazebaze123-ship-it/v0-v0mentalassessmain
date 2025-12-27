-- This script creates the user_progress table to store in-progress assessment data.

CREATE TABLE IF NOT EXISTS public.user_progress (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL, -- e.g., 'MOCA', 'MMSE'
    current_step INTEGER NOT NULL DEFAULT 0,
    scores INTEGER[] NOT NULL DEFAULT '{}', -- Array of scores for completed steps
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, assessment_type) -- Add a composite primary key for unique progress per user per assessment type
);

-- Add RLS policy for the new user_progress table
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to user_progress" ON public.user_progress;
CREATE POLICY "Allow all access to user_progress" ON public.user_progress FOR ALL USING (true);
