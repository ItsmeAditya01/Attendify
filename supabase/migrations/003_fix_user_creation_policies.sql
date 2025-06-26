
-- Fix RLS policies to allow proper user creation

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can be created" ON public.users;
DROP POLICY IF EXISTS "Service role can manage users" ON public.users;
DROP POLICY IF EXISTS "Students can be created" ON public.students;
DROP POLICY IF EXISTS "Faculty can be created" ON public.faculty;

-- Update the users table policies to allow admin user creation
CREATE POLICY "Admin can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Allow users to be created by admins (for INSERT operations)
CREATE POLICY "Admin can create users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Update existing "Users can read own profile" policy to be more inclusive
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read profiles" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'faculty')
    )
  );

-- Allow service role (used by triggers) to insert users
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Update students table policies
CREATE POLICY "Admin can manage students" ON public.students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'faculty')
    )
  );

CREATE POLICY "Admin can create students" ON public.students
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'faculty')
    )
  );

-- Update faculty table policies  
CREATE POLICY "Admin can manage faculty" ON public.faculty
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admin can create faculty" ON public.faculty
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Ensure the trigger function has proper permissions
ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty TO authenticated;
