-- Migration: Add Claude cost tracking fields to generations table
-- Created: 2025-01-08
-- Purpose: Track prompt caching metrics and cost for Claude generations

-- Add new columns to generations table for detailed cost tracking
ALTER TABLE generations
  ADD COLUMN IF NOT EXISTS input_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS output_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cached_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cache_creation_tokens INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 6) DEFAULT 0;

-- Add index for cost analytics queries
CREATE INDEX IF NOT EXISTS idx_generations_provider_created
  ON generations(provider, created_at DESC);

-- Add index for project cost tracking
CREATE INDEX IF NOT EXISTS idx_generations_project_cost
  ON generations(project_id, estimated_cost);

-- Create view for cost analytics
CREATE OR REPLACE VIEW generation_cost_analytics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  provider,
  COUNT(*) as total_generations,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cached_tokens) as total_cached_tokens,
  SUM(cache_creation_tokens) as total_cache_creation_tokens,
  SUM(estimated_cost) as total_cost,
  AVG(estimated_cost) as avg_cost_per_generation,
  -- Calculate cache hit rate for Claude
  CASE
    WHEN provider = 'claude' AND SUM(input_tokens + cached_tokens) > 0
    THEN ROUND(SUM(cached_tokens) * 100.0 / NULLIF(SUM(input_tokens + cached_tokens), 0), 2)
    ELSE 0
  END as cache_hit_rate_percent
FROM generations
GROUP BY DATE_TRUNC('day', created_at), provider
ORDER BY date DESC, provider;

-- Create function to calculate cache savings
CREATE OR REPLACE FUNCTION calculate_cache_savings()
RETURNS TABLE (
  total_cached_tokens BIGINT,
  savings_usd DECIMAL(10, 6),
  savings_percent DECIMAL(5, 2)
) AS $$
DECLARE
  input_cost_per_million CONSTANT DECIMAL := 3.00;
  cache_read_cost_per_million CONSTANT DECIMAL := 0.30;
BEGIN
  RETURN QUERY
  SELECT
    SUM(g.cached_tokens)::BIGINT as total_cached_tokens,
    SUM(g.cached_tokens * (input_cost_per_million - cache_read_cost_per_million) / 1000000)::DECIMAL(10, 6) as savings_usd,
    CASE
      WHEN SUM(g.input_tokens + g.cached_tokens) > 0
      THEN ROUND(SUM(g.cached_tokens) * 100.0 / NULLIF(SUM(g.input_tokens + g.cached_tokens), 0), 2)
      ELSE 0
    END::DECIMAL(5, 2) as savings_percent
  FROM generations g
  WHERE g.provider = 'claude'
  AND g.cached_tokens > 0;
END;
$$ LANGUAGE plpgsql;

-- Create function to get project generation costs
CREATE OR REPLACE FUNCTION get_project_generation_costs(p_project_id UUID)
RETURNS TABLE (
  provider TEXT,
  generation_count BIGINT,
  total_cost DECIMAL(10, 6),
  avg_cost DECIMAL(10, 6),
  total_tokens BIGINT,
  cached_tokens BIGINT,
  cache_hit_rate DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.provider,
    COUNT(*)::BIGINT as generation_count,
    SUM(g.estimated_cost)::DECIMAL(10, 6) as total_cost,
    AVG(g.estimated_cost)::DECIMAL(10, 6) as avg_cost,
    SUM(g.input_tokens + g.output_tokens)::BIGINT as total_tokens,
    SUM(g.cached_tokens)::BIGINT as cached_tokens,
    CASE
      WHEN SUM(g.input_tokens + g.cached_tokens) > 0
      THEN ROUND(SUM(g.cached_tokens) * 100.0 / NULLIF(SUM(g.input_tokens + g.cached_tokens), 0), 2)
      ELSE 0
    END::DECIMAL(5, 2) as cache_hit_rate
  FROM generations g
  WHERE g.project_id = p_project_id
  GROUP BY g.provider
  ORDER BY total_cost DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comment on table
COMMENT ON TABLE generations IS 'Tracks all AI text generations with detailed cost and caching metrics';

-- Add comments on columns
COMMENT ON COLUMN generations.input_tokens IS 'Number of input tokens (excluding cached)';
COMMENT ON COLUMN generations.output_tokens IS 'Number of output tokens generated';
COMMENT ON COLUMN generations.cached_tokens IS 'Number of tokens read from cache (Claude only)';
COMMENT ON COLUMN generations.cache_creation_tokens IS 'Number of tokens written to cache (Claude only)';
COMMENT ON COLUMN generations.estimated_cost IS 'Estimated cost in USD for this generation';

-- Grant permissions
GRANT SELECT ON generation_cost_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_cache_savings() TO authenticated;
GRANT EXECUTE ON FUNCTION get_project_generation_costs(UUID) TO authenticated;
