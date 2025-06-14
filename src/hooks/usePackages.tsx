import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PackageVersion {
  id: string;
  version: string;
  created_at: string;
  downloads: number;
  jar_file_url: string | null;
  jar_file_size: number | null;
}

export interface PackageNamespace {
  id: string;
  name: string;
  description: string;
  author_email: string;
  author_id: string;
  license: string;
  github_repo: string;
  status: string;
  total_downloads: number;
  created_at: string;
  updated_at: string;
  latest_version?: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  versions?: PackageVersion[];
}

export const usePackages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading: loading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('package_namespaces')
        .select(`
          *,
          profiles!package_namespaces_author_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PackageNamespace[];
    },
  });

  const getPackageDetails = async (packageId: string): Promise<PackageNamespace> => {
    const { data, error } = await supabase
      .from('package_namespaces')
      .select(`
        *,
        profiles!package_namespaces_author_id_fkey (
          full_name,
          email,
          avatar_url
        ),
        versions:package_versions (
          id,
          version,
          created_at,
          downloads,
          jar_file_url,
          jar_file_size
        )
      `)
      .eq('id', packageId)
      .single();

    if (error) throw error;
    
    // Sort versions by creation date (newest first)
    if (data.versions) {
      data.versions.sort((a: PackageVersion, b: PackageVersion) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    return data as PackageNamespace;
  };

  const recordDownload = async (versionId: string) => {
    const { error } = await supabase
      .from('download_analytics')
      .insert({
        package_id: versionId,
        user_agent: navigator.userAgent,
        ip_address: null, // Will be set by the database
      });

    if (error) throw error;

    // Invalidate queries to refresh download counts
    queryClient.invalidateQueries({ queryKey: ['packages'] });
  };

  return {
    packages,
    loading,
    getPackageDetails,
    recordDownload,
  };
};
