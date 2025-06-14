
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
      
      // First, let's try a simple query without joins to see if we have any approved packages
      const { data: simpleData, error: simpleError } = await supabase
        .from('package_namespaces')
        .select('*')
        .eq('status', 'approved');

      console.log('Simple query result:', simpleData, 'Error:', simpleError);

      // If no approved packages, return empty array
      if (!simpleData || simpleData.length === 0) {
        console.log('No approved packages found');
        return [];
      }

      // Now fetch with profile join
      const { data, error } = await supabase
        .from('package_namespaces')
        .select(`
          *,
          profiles (
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching public packages with profiles:', error);
        // Return simple data without profiles if join fails
        return simpleData.slice(0, 30).map(pkg => ({
          ...pkg,
          latest_version: '1.0.0'
        })) as PublicPackage[];
      }

      console.log('Public packages with profiles:', data);

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
            latest_version: versions && versions.length > 0 ? versions[0].version : '1.0.0'
          };
        })
      );

      console.log('Final packages with versions:', packagesWithVersions);
      return packagesWithVersions as PublicPackage[];
    },
  });

  return {
    packages,
    loading,
    fetchPackages,
  };
};
