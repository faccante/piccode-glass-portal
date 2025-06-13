
-- First, let's restructure the database to support package namespaces with versions
-- Create a new packages table for the namespace concept
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

-- Create package versions table
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

-- Migrate existing data from packages to the new structure (if packages table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'packages' AND table_schema = 'public') THEN
    -- Insert namespaces
    INSERT INTO public.package_namespaces (
      id, name, description, license, github_repo, author_id, author_email,
      status, total_downloads, created_at, updated_at, approved_at, approved_by
    )
    SELECT 
      id, name, description, license, github_repo, author_id, author_email,
      status, downloads, created_at, updated_at, approved_at, approved_by
    FROM public.packages;

    -- Insert versions
    INSERT INTO public.package_versions (
      package_namespace_id, version, jar_file_url, jar_file_size, downloads, created_at
    )
    SELECT 
      id, version, jar_file_url, jar_file_size, downloads, created_at
    FROM public.packages;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.package_namespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_versions ENABLE ROW LEVEL SECURITY;

-- Policies for package_namespaces
CREATE POLICY "Anyone can view approved package namespaces" 
  ON public.package_namespaces 
  FOR SELECT 
  USING (status = 'approved');

CREATE POLICY "Authenticated users can view their own package namespaces" 
  ON public.package_namespaces 
  FOR SELECT 
  USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can insert package namespaces" 
  ON public.package_namespaces 
  FOR INSERT 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own package namespaces" 
  ON public.package_namespaces 
  FOR UPDATE 
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own package namespaces with low downloads" 
  ON public.package_namespaces 
  FOR DELETE 
  USING (auth.uid() = author_id AND total_downloads < 100);

-- Policies for package_versions
CREATE POLICY "Anyone can view versions of approved packages" 
  ON public.package_versions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.package_namespaces pn 
      WHERE pn.id = package_namespace_id AND pn.status = 'approved'
    )
  );

CREATE POLICY "Authors can view their own package versions" 
  ON public.package_versions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.package_namespaces pn 
      WHERE pn.id = package_namespace_id AND pn.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can insert versions for their packages" 
  ON public.package_versions 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.package_namespaces pn 
      WHERE pn.id = package_namespace_id AND pn.author_id = auth.uid()
    )
  );
