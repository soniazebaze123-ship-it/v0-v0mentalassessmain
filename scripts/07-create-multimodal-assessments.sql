-- Creates the Phase 4 multimodal assessment table used by the EEG / blood biomarker workflow.
-- This project currently uses app-managed users instead of Supabase Auth sessions,
-- so the policy here follows the existing permissive pattern used by assessments and user_progress.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.multimodal_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    eeg_input JSONB NOT NULL,
    sensory_input JSONB NOT NULL,
    blood_input JSONB NOT NULL,
    result_payload JSONB NOT NULL,
    cognitive_band TEXT NOT NULL,
    probable_ad_profile BOOLEAN NOT NULL DEFAULT false,
    mixed_non_ad_pattern BOOLEAN NOT NULL DEFAULT false,
    specialist_referral BOOLEAN NOT NULL DEFAULT false,
    risk_percent NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS multimodal_assessments_user_id_idx
    ON public.multimodal_assessments(user_id);

CREATE INDEX IF NOT EXISTS multimodal_assessments_cognitive_band_idx
    ON public.multimodal_assessments(cognitive_band);

CREATE INDEX IF NOT EXISTS multimodal_assessments_created_at_idx
    ON public.multimodal_assessments(created_at);

ALTER TABLE public.multimodal_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own multimodal assessments" ON public.multimodal_assessments;
DROP POLICY IF EXISTS "Users can insert their own multimodal assessments" ON public.multimodal_assessments;
DROP POLICY IF EXISTS "Allow all access to multimodal_assessments" ON public.multimodal_assessments;

CREATE POLICY "Allow all access to multimodal_assessments"
    ON public.multimodal_assessments
    FOR ALL
    USING (true)
    WITH CHECK (true);