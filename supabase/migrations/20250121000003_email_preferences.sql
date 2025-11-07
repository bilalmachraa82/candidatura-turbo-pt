-- Create email_preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  project_shared BOOLEAN DEFAULT true,
  deadline_reminders BOOLEAN DEFAULT true,
  export_ready BOOLEAN DEFAULT true,
  validation_issues BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily_digest', 'never')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- Enable RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own email preferences"
  ON email_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences"
  ON email_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
  ON email_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email preferences"
  ON email_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create deadline_reminders_sent table to track sent reminders
CREATE TABLE IF NOT EXISTS deadline_reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  days_before INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_project_id ON deadline_reminders_sent(project_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_user_id ON deadline_reminders_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_deadline_reminders_sent_at ON deadline_reminders_sent(sent_at);

-- Enable RLS
ALTER TABLE deadline_reminders_sent ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own deadline reminders"
  ON deadline_reminders_sent
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create project_shares table for sharing projects
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  permission TEXT DEFAULT 'edit' CHECK (permission IN ('view', 'edit', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_shares_project_id ON project_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_user_id ON project_shares(user_id);

-- Enable RLS
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Create policies for project_shares
CREATE POLICY "Users can view shares for their projects"
  ON project_shares
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM projects WHERE id = project_shares.project_id
    )
  );

CREATE POLICY "Project owners can create shares"
  ON project_shares
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM projects WHERE id = project_shares.project_id
    )
  );

CREATE POLICY "Project owners can update shares"
  ON project_shares
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM projects WHERE id = project_shares.project_id
    )
  );

CREATE POLICY "Project owners can delete shares"
  ON project_shares
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM projects WHERE id = project_shares.project_id
    )
  );

-- Create profiles table if it doesn't exist (for user info)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_email_preferences_updated_at ON email_preferences;
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_shares_updated_at ON project_shares;
CREATE TRIGGER update_project_shares_updated_at
  BEFORE UPDATE ON project_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON TABLE email_preferences IS 'Stores user email notification preferences';
COMMENT ON TABLE deadline_reminders_sent IS 'Tracks deadline reminder emails that have been sent';
COMMENT ON TABLE project_shares IS 'Stores project sharing permissions between users';
COMMENT ON TABLE profiles IS 'Stores user profile information';
