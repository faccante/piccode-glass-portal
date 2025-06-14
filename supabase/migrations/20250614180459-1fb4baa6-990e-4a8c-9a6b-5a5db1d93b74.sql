
-- Create a security definer function to get current user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop the problematic policies and recreate them using the function
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update user roles" ON public.profiles;

-- Recreate the policies using the security definer function
CREATE POLICY "Managers can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() IN ('manager', 'moderator')
  OR id = auth.uid()
);

CREATE POLICY "Managers can update user roles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() = 'manager'
);

-- Also fix the package namespace policies to use the function
DROP POLICY IF EXISTS "Managers and moderators can view all packages" ON public.package_namespaces;
DROP POLICY IF EXISTS "Managers and moderators can update packages" ON public.package_namespaces;

CREATE POLICY "Managers and moderators can view all packages"
ON public.package_namespaces
FOR SELECT
TO authenticated
USING (
  public.get_current_user_role() IN ('manager', 'moderator')
  OR author_id = auth.uid()
  OR status = 'approved'
);

CREATE POLICY "Managers and moderators can update packages"
ON public.package_namespaces
FOR UPDATE
TO authenticated
USING (
  public.get_current_user_role() IN ('manager', 'moderator')
);
