
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicPackage {
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
}

export const usePublicPackages = () => {
  const { data: packages = [], isLoading: loading, refetch: fetchPackages } = useQuery({
    queryKey: ['public-packages'],
    queryFn: async () => {
      console.log('Fetching public packages...');
      
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
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching public packages:', error);
        throw error;
      }

      console.log('Raw public packages data:', data);

      // Get latest version for each package
      const packagesWithVersions = await Promise.all(
        data.map(async (pkg) => {
          const { data: versions, error: versionError } = await supabase
            .from('package_versions')
            .select('version, created_at')
            .eq('package_namespace_id', pkg.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (versionError) {
            console.error('Error fetching versions for package:', pkg.id, versionError);
          }

          return {
            ...pkg,
            latest_version: versions && versions.length > 0 ? versions[0].version : undefined
          };
        })
      );

      console.log('Public packages with versions:', packagesWithVersions);
      return packagesWithVersions as PublicPackage[];
    },
  });

  return {
    packages,
    loading,
    fetchPackages,
  };
};
