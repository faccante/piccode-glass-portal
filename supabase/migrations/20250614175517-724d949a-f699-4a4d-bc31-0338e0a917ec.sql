
-- Add moderator role to the existing role options
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'manager');
    END IF;
    
    -- Add moderator if it doesn't exist
    BEGIN
        ALTER TYPE public.app_role ADD VALUE 'moderator';
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- Update profiles table to ensure we can query by email efficiently
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Update package_namespaces to track who approved each package
ALTER TABLE public.package_namespaces 
ADD COLUMN IF NOT EXISTS approved_by_email text;

-- Add indexes for better performance on package queries
CREATE INDEX IF NOT EXISTS idx_package_namespaces_status ON public.package_namespaces(status);
CREATE INDEX IF NOT EXISTS idx_package_namespaces_created_at ON public.package_namespaces(created_at);
CREATE INDEX IF NOT EXISTS idx_package_namespaces_name ON public.package_namespaces(name);

-- Add a function to search profiles by email (for finding users to make moderators)
CREATE OR REPLACE FUNCTION public.search_profiles_by_email(search_email text)
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT p.id, p.email, p.full_name, p.role, p.avatar_url
  FROM public.profiles p
  WHERE p.email ILIKE '%' || search_email || '%'
  ORDER BY p.email
  LIMIT 10;
$$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Managers can update user roles" ON public.profiles;
CREATE POLICY "Managers can update user roles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles manager_profile
    WHERE manager_profile.id = auth.uid()
    AND manager_profile.role = 'manager'
  )
);

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
CREATE POLICY "Managers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles manager_profile
    WHERE manager_profile.id = auth.uid()
    AND manager_profile.role IN ('manager', 'moderator')
  )
  OR id = auth.uid()
);

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Managers and moderators can view all packages" ON public.package_namespaces;
CREATE POLICY "Managers and moderators can view all packages"
ON public.package_namespaces
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles user_profile
    WHERE user_profile.id = auth.uid()
    AND user_profile.role IN ('manager', 'moderator')
  )
  OR author_id = auth.uid()
  OR status = 'approved'
);

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Managers and moderators can update packages" ON public.package_namespaces;
CREATE POLICY "Managers and moderators can update packages"
ON public.package_namespaces
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles user_profile
    WHERE user_profile.id = auth.uid()
    AND user_profile.role IN ('manager', 'moderator')
  )
);
