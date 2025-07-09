-- Add missing columns to package_versions table
ALTER TABLE public.package_versions 
ADD COLUMN IF NOT EXISTS malware_scan_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS malware_scan_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS file_hash TEXT;

-- Create file_scan_results table
CREATE TABLE IF NOT EXISTS public.file_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_version_id UUID REFERENCES public.package_versions(id) ON DELETE CASCADE,
  scan_status TEXT NOT NULL DEFAULT 'pending',
  scan_provider TEXT NOT NULL DEFAULT 'virustotal',
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scan_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create role_audit_log table
CREATE TABLE IF NOT EXISTS public.role_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id UUID NOT NULL,
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Enable RLS on new tables
ALTER TABLE public.file_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_scan_results
CREATE POLICY "Managers can view scan results" ON public.file_scan_results
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role IN ('manager', 'moderator')
  )
);

CREATE POLICY "System can insert scan results" ON public.file_scan_results
FOR INSERT WITH CHECK (true);

-- Create RLS policies for role_audit_log
CREATE POLICY "Managers can view role audit log" ON public.role_audit_log
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'manager'
  )
);

CREATE POLICY "Managers can insert role audit log" ON public.role_audit_log
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'manager'
  )
);

-- Create security definer functions
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'manager'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_moderator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('manager', 'moderator')
  );
$$;

-- Add proper RLS policies for existing tables
DROP POLICY IF EXISTS "Anyone can view all package namespaces" ON public.package_namespaces;
DROP POLICY IF EXISTS "Anyone can view all package versions" ON public.package_versions;

CREATE POLICY "Anyone can view approved packages" ON public.package_namespaces
FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own packages" ON public.package_namespaces
FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Managers can view all packages" ON public.package_namespaces
FOR SELECT USING (is_manager_or_moderator());

CREATE POLICY "Anyone can view versions of approved packages" ON public.package_versions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.package_namespaces pn 
    WHERE pn.id = package_namespace_id AND pn.status = 'approved'
  )
);

CREATE POLICY "Users can view versions of their own packages" ON public.package_versions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.package_namespaces pn 
    WHERE pn.id = package_namespace_id AND pn.author_id = auth.uid()
  )
);

CREATE POLICY "Managers can view all versions" ON public.package_versions
FOR SELECT USING (is_manager_or_moderator());

-- Update role management policies
DROP POLICY IF EXISTS "Managers can update user roles" ON public.profiles;

CREATE POLICY "Only managers can update user roles" ON public.profiles
FOR UPDATE USING (
  auth.uid() = id OR (
    is_manager() AND 
    auth.uid() != id AND 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'manager'
  )
);

-- Block download of infected files
CREATE POLICY "Block download of infected files" ON public.package_versions
FOR SELECT USING (
  malware_scan_status != 'infected' OR is_manager_or_moderator()
);