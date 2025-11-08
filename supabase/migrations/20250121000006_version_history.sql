-- Create section_versions table for version history
CREATE TABLE IF NOT EXISTS section_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  char_count INTEGER NOT NULL,
  change_summary TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB -- { aiGenerated, model, source, etc. }
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_section_versions_section ON section_versions(section_id);
CREATE INDEX IF NOT EXISTS idx_section_versions_created ON section_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_section_versions_user ON section_versions(user_id);

-- RLS policies
ALTER TABLE section_versions ENABLE ROW LEVEL SECURITY;

-- Members can view section versions
CREATE POLICY "Members can view section versions"
  ON section_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sections s
      JOIN projects p ON s.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE s.id = section_versions.section_id
      AND (p.user_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

-- Members can create versions
CREATE POLICY "Members can create versions"
  ON section_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sections s
      JOIN projects p ON s.project_id = p.id
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE s.id = section_versions.section_id
      AND (p.user_id = auth.uid() OR pm.user_id = auth.uid())
    )
  );

-- Function to cleanup old versions (keep last 50 per section)
CREATE OR REPLACE FUNCTION cleanup_old_versions()
RETURNS void AS $$
BEGIN
  DELETE FROM section_versions
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
        ROW_NUMBER() OVER (
          PARTITION BY section_id
          ORDER BY created_at DESC
        ) as row_num
      FROM section_versions
    ) sub
    WHERE row_num > 50
  );
END;
$$ LANGUAGE plpgsql;

-- Optional: Add a comment to the table
COMMENT ON TABLE section_versions IS 'Stores version history for section content with Git-like capabilities';
COMMENT ON COLUMN section_versions.metadata IS 'JSON metadata: source (manual|auto-save|ai-generated|restore), aiModel, prompt, restoredFrom, deviceInfo';
