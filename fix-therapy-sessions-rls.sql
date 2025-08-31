-- ============================================================================
-- FIX RLS POLICIES: therapy_sessions table
-- ============================================================================
-- Problème: "new row violates row-level security policy for table therapy_sessions"
-- Solution: Ajouter des politiques RLS appropriées pour permettre aux utilisateurs
--           d'insérer, lire, modifier et supprimer leurs propres sessions thérapeutiques
-- ============================================================================

-- Enable RLS on therapy_sessions table (if not already enabled)
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own therapy sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Users can view own therapy sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Users can update own therapy sessions" ON therapy_sessions;
DROP POLICY IF EXISTS "Users can delete own therapy sessions" ON therapy_sessions;

-- Policy: Users can insert their own therapy sessions
-- This allows authenticated users to create therapy sessions where user_id matches their auth.uid()
CREATE POLICY "Users can insert own therapy sessions" ON therapy_sessions
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own therapy sessions  
-- This allows users to read only their own therapy sessions
CREATE POLICY "Users can view own therapy sessions" ON therapy_sessions
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Users can update their own therapy sessions
-- This allows users to modify only their own therapy sessions
CREATE POLICY "Users can update own therapy sessions" ON therapy_sessions  
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own therapy sessions
-- This allows users to delete only their own therapy sessions
CREATE POLICY "Users can delete own therapy sessions" ON therapy_sessions
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Verify policies were created
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'therapy_sessions';