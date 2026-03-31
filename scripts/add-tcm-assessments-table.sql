-- Migration: Add TCM Constitution Assessments Table
-- Description: Creates a table to store TCM (Traditional Chinese Medicine) constitution assessment results

-- Create tcm_assessments table
CREATE TABLE IF NOT EXISTS tcm_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Primary constitution result
  primary_constitution VARCHAR(50) NOT NULL,
  primary_score DECIMAL(5,2) NOT NULL,
  
  -- All constitution scores (9 types)
  balanced_score DECIMAL(5,2) DEFAULT 0,
  qi_deficiency_score DECIMAL(5,2) DEFAULT 0,
  yang_deficiency_score DECIMAL(5,2) DEFAULT 0,
  yin_deficiency_score DECIMAL(5,2) DEFAULT 0,
  phlegm_dampness_score DECIMAL(5,2) DEFAULT 0,
  damp_heat_score DECIMAL(5,2) DEFAULT 0,
  blood_stasis_score DECIMAL(5,2) DEFAULT 0,
  qi_stagnation_score DECIMAL(5,2) DEFAULT 0,
  special_constitution_score DECIMAL(5,2) DEFAULT 0,
  
  -- Raw answers and metadata
  answers JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  
  -- Overall score (normalized 0-100)
  overall_score INTEGER DEFAULT 0,
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_tcm_assessments_user_id ON tcm_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_tcm_assessments_completed_at ON tcm_assessments(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tcm_assessments_primary_constitution ON tcm_assessments(primary_constitution);

-- Enable Row Level Security
ALTER TABLE tcm_assessments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own TCM assessments
CREATE POLICY "Users can view own tcm assessments" ON tcm_assessments
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own TCM assessments
CREATE POLICY "Users can insert own tcm assessments" ON tcm_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own TCM assessments
CREATE POLICY "Users can update own tcm assessments" ON tcm_assessments
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role full access to tcm assessments" ON tcm_assessments
  FOR ALL USING (auth.role() = 'service_role');

-- Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_tcm_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tcm_assessments_updated_at
  BEFORE UPDATE ON tcm_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_tcm_assessments_updated_at();

-- Add comment to table
COMMENT ON TABLE tcm_assessments IS 'Stores TCM (Traditional Chinese Medicine) constitution assessment results for users';
