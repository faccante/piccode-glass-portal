
-- Drop existing tables and recreate them with proper structure and RLS
DROP TABLE IF EXISTS public.package_versions CASCADE;
DROP TABLE IF EXISTS public.package_namespaces CASCADE;
DROP TABLE IF EXISTS public.packages CASCADE;
DROP TABLE IF EXISTS public.download_analytics CASCADE;

-- Create package_namespaces table
CREATE TABLE public.package_namespaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  license TEXT NOT NULL,
  github_repo TEXT NOT NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'::text CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  total_downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id)
);

-- Create package_versions table
CREATE TABLE public.package_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_namespace_id UUID NOT NULL REFERENCES public.package_namespaces(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  jar_file_url TEXT,
  jar_file_size NUMERIC,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(package_namespace_id, version)
);

-- Create download_analytics table
CREATE TABLE public.download_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.package_versions(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address INET,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.package_namespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for package_namespaces
-- Allow anyone to view approved packages
CREATE POLICY "Anyone can view approved package namespaces" 
  ON public.package_namespaces 
  FOR SELECT 
  USING (status = 'approved');

-- Allow authenticated users to view their own packages (any status)
CREATE POLICY "Users can view their own package namespaces" 
  ON public.package_namespaces 
  FOR SELECT 
  USING (auth.uid() = author_id);

-- Allow managers to view all packages
CREATE POLICY "Managers can view all package namespaces" 
  ON public.package_namespaces 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Allow authenticated users to insert their own packages
CREATE POLICY "Users can create package namespaces" 
  ON public.package_namespaces 
  FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

-- Allow users to update their own packages
CREATE POLICY "Users can update their own package namespaces" 
  ON public.package_namespaces 
  FOR UPDATE 
  USING (auth.uid() = author_id);

-- Allow managers to update any package (for status changes)
CREATE POLICY "Managers can update any package namespace" 
  ON public.package_namespaces 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Allow users to delete their own packages
CREATE POLICY "Users can delete their own package namespaces" 
  ON public.package_namespaces 
  FOR DELETE 
  USING (auth.uid() = author_id);

-- RLS Policies for package_versions
-- Allow anyone to view versions of approved packages
CREATE POLICY "Anyone can view versions of approved packages" 
  ON public.package_versions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.package_namespaces pn 
      WHERE pn.id = package_namespace_id AND pn.status = 'approved'
    )
  );

-- Allow users to view versions of their own packages
CREATE POLICY "Users can view their own package versions" 
  ON public.package_versions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.package_namespaces pn 
      WHERE pn.id = package_namespace_id AND pn.author_id = auth.uid()
    )
  );

-- Allow managers to view all versions
CREATE POLICY "Managers can view all package versions" 
  ON public.package_versions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Allow users to insert versions for their own packages
CREATE POLICY "Users can create versions for their packages" 
  ON public.package_versions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.package_namespaces pn 
      WHERE pn.id = package_namespace_id AND pn.author_id = auth.uid()
    )
  );

-- Allow users to update versions of their own packages
CREATE POLICY "Users can update their own package versions" 
  ON public.package_versions 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.package_namespaces pn 
      WHERE pn.id = package_namespace_id AND pn.author_id = auth.uid()
    )
  );

-- Allow users to delete versions of their own packages
CREATE POLICY "Users can delete their own package versions" 
  ON public.package_versions 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.package_namespaces pn 
      WHERE pn.id = package_namespace_id AND pn.author_id = auth.uid()
    )
  );

-- RLS Policies for download_analytics
-- Allow anyone to insert download records
CREATE POLICY "Anyone can record downloads" 
  ON public.download_analytics 
  FOR INSERT 
  WITH CHECK (true);

-- Only allow managers to view download analytics
CREATE POLICY "Managers can view download analytics" 
  ON public.download_analytics 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_package_namespaces_updated_at 
    BEFORE UPDATE ON public.package_namespaces 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
