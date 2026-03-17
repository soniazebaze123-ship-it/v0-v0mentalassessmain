-- Reset all assessment scores and progress data
-- This script clears all test results while preserving user accounts

-- Delete all cognitive assessments (MoCA, MMSE)
DELETE FROM assessments;

-- Delete all sensory assessments (visual, auditory, olfactory)
DELETE FROM sensory_assessments;

-- Delete all TCM constitution assessments
DELETE FROM tcm_assessments;

-- Delete all composite risk scores
DELETE FROM composite_risk_scores;

-- Delete all user progress tracking
DELETE FROM user_progress;

-- Delete all uploaded files (TCM tongue/face images)
DELETE FROM uploaded_files;

-- Confirmation message
SELECT 'All assessment scores have been reset successfully' AS status;
