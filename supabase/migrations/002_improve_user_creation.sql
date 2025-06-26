
-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create an improved function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Trigger handle_new_user called for user: %', NEW.id;
  
  -- Insert into public.users with default student role
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'student'))
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', public.users.role),
    updated_at = NOW();
    
  RAISE LOG 'User inserted/updated in public.users: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW; -- Don't fail the auth user creation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a policy to allow service role to insert users
CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- Add insert policy for new users
CREATE POLICY "Users can be created" ON public.users
  FOR INSERT WITH CHECK (true);

-- Update existing policies to be more permissive for user creation
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'faculty')
    )
  );

-- Add policy for students table creation
CREATE POLICY "Students can be created" ON public.students
  FOR INSERT WITH CHECK (true);

-- Add policy for faculty table creation  
CREATE POLICY "Faculty can be created" ON public.faculty
  FOR INSERT WITH CHECK (true);
