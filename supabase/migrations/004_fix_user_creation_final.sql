
-- Fix RLS policies with proper logic for user creation

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admin can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admin can create users" ON public.users;
DROP POLICY IF EXISTS "Users can read profiles" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Admin can manage students" ON public.students;
DROP POLICY IF EXISTS "Admin can create students" ON public.students;
DROP POLICY IF EXISTS "Admin can manage faculty" ON public.faculty;
DROP POLICY IF EXISTS "Admin can create faculty" ON public.faculty;

-- Allow authenticated users to read their own profile and admins/faculty to read others
CREATE POLICY "Users can read profiles" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'faculty')
    )
  );

-- Allow admins to insert users, but also allow the trigger to work
CREATE POLICY "Allow user creation" ON public.users
  FOR INSERT WITH CHECK (
    -- Allow if current user is admin
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    ) OR
    -- Allow if this is the initial user creation (no existing users means first admin)
    NOT EXISTS (SELECT 1 FROM public.users) OR
    -- Allow service role for triggers
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Allow admins to update and delete users
CREATE POLICY "Admin can modify users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Admin can delete users" ON public.users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Students table policies
CREATE POLICY "Users can read student profiles" ON public.students
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'faculty')
    )
  );

CREATE POLICY "Admin and faculty can manage students" ON public.students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'faculty')
    )
  );

-- Faculty table policies
CREATE POLICY "Users can read faculty profiles" ON public.faculty
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'faculty')
    )
  );

CREATE POLICY "Admin can manage faculty" ON public.faculty
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Ensure proper permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faculty TO authenticated;

-- Update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users with role from metadata
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', public.users.role),
    updated_at = NOW();
    
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
