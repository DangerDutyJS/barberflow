-- Allow authenticated users to insert their own profile (needed when trigger didn't fire)
CREATE POLICY "users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Backfill profiles for any auth users that don't have one yet
INSERT INTO profiles (id, full_name, avatar_url, role)
SELECT
  au.id,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'avatar_url',
  'admin'
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
