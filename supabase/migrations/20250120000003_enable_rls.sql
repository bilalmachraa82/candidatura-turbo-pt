-- Projects RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Sections RLS (cascata de projects)
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sections"
  ON sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sections.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify own sections"
  ON sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sections.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Aplicar mesmo padrão a indexed_files, document_chunks, generations
ALTER TABLE indexed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON indexed_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = indexed_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify own files"
  ON indexed_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = indexed_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own chunks"
  ON document_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = document_chunks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify own chunks"
  ON document_chunks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = document_chunks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = generations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify own generations"
  ON generations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = generations.project_id
      AND projects.user_id = auth.uid()
    )
  );
