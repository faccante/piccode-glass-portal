
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Anyone can view approved package namespaces" ON public.package_namespaces;

-- Create a new policy that allows viewing all packages regardless of status
CREATE POLICY "Anyone can view all package namespaces" 
  ON public.package_namespaces 
  FOR SELECT 
  USING (true);

-- Update the package_versions policy to allow viewing versions of any package
DROP POLICY IF EXISTS "Anyone can view versions of approved packages" ON public.package_versions;

CREATE POLICY "Anyone can view all package versions" 
  ON public.package_versions 
  FOR SELECT 
  USING (true);
