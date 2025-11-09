-- Add quality scoring fields to sections table

-- Add quality score column (0-100)
ALTER TABLE sections ADD COLUMN IF NOT EXISTS quality_score INTEGER;

-- Add quality data column (JSON with full quality analysis)
ALTER TABLE sections ADD COLUMN IF NOT EXISTS quality_data JSONB;

-- Add timestamp for last scoring
ALTER TABLE sections ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMPTZ;

-- Add index for quality score for better query performance
CREATE INDEX IF NOT EXISTS idx_sections_quality_score ON sections(quality_score);

-- Add index for last scored timestamp
CREATE INDEX IF NOT EXISTS idx_sections_last_scored_at ON sections(last_scored_at);

-- Add check constraint to ensure quality_score is between 0 and 100
ALTER TABLE sections ADD CONSTRAINT quality_score_range
  CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 100));

-- Add comment to columns
COMMENT ON COLUMN sections.quality_score IS 'Overall quality score from 0-100';
COMMENT ON COLUMN sections.quality_data IS 'Full quality analysis data including breakdown, issues, strengths, and suggestions';
COMMENT ON COLUMN sections.last_scored_at IS 'Timestamp of last quality evaluation';
