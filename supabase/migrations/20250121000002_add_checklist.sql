-- Migration: Add checklist_items table
-- Description: Stores manual checklist item states for project progress tracking
-- Created: 2025-01-21

-- Create checklist_items table
CREATE TABLE IF NOT EXISTS checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  checked_at TIMESTAMPTZ,
  checked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one entry per item per project
  UNIQUE(project_id, item_id)
);

-- Create index for faster lookups
CREATE INDEX idx_checklist_items_project_id ON checklist_items(project_id);
CREATE INDEX idx_checklist_items_item_id ON checklist_items(item_id);

-- Enable RLS
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see checklist items for their own projects
CREATE POLICY "Users can view their own checklist items"
  ON checklist_items
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can insert checklist items for their own projects
CREATE POLICY "Users can create checklist items for their projects"
  ON checklist_items
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can update checklist items for their own projects
CREATE POLICY "Users can update their own checklist items"
  ON checklist_items
  FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can delete checklist items for their own projects
CREATE POLICY "Users can delete their own checklist items"
  ON checklist_items
  FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_checklist_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_checklist_items_updated_at
  BEFORE UPDATE ON checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION update_checklist_items_updated_at();

-- Add comment to table
COMMENT ON TABLE checklist_items IS 'Stores manual checklist item states for project progress tracking';
COMMENT ON COLUMN checklist_items.item_id IS 'Unique identifier for the checklist item (e.g., budget-detailed, validation-eligibility)';
COMMENT ON COLUMN checklist_items.checked IS 'Whether the checklist item has been completed';
COMMENT ON COLUMN checklist_items.checked_at IS 'Timestamp when the item was last checked/unchecked';
COMMENT ON COLUMN checklist_items.checked_by IS 'User who last checked/unchecked the item';
