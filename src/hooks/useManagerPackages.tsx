
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ManagerPackage {
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
  approved_at: string | null;
  approved_by: string | null;
  approved_by_email: string | null;
  latest_version?: string;
  profiles?: {
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

export interface SearchProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

export const useManagerPackages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchPackages = async (page: number = 1, limit: number = 10, search: string = '', status: string = '') => {
    if (!user) throw new Error('User not authenticated');

    console.log('Fetching manager packages...', { page, limit, search, status });

    let query = supabase
      .from('package_namespaces')
      .select(`
        *,
        profiles!package_namespaces_author_id_fkey (
          full_name,
          email,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,author_email.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching manager packages:', error);
      throw error;
    }

    console.log('Manager packages data:', data);

    // Get latest version for each package
    const packagesWithVersions = await Promise.all(
      (data || []).map(async (pkg) => {
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

    return {
      packages: packagesWithVersions as ManagerPackage[],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    };
  };

  const updatePackageStatus = useMutation({
    mutationFn: async ({ packageId, status, approverEmail }: { packageId: string; status: string; approverEmail?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
        updateData.approved_by_email = approverEmail || user.email;
      }

      const { error } = await supabase
        .from('package_namespaces')
        .update(updateData)
        .eq('id', packageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-packages'] });
    },
  });

  const searchProfiles = async (email: string): Promise<SearchProfile[]> => {
    if (!email.trim()) return [];

    const { data, error } = await supabase.rpc('search_profiles_by_email', {
      search_email: email
    });

    if (error) {
      console.error('Error searching profiles:', error);
      throw error;
    }

    return data || [];
  };

  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-profiles'] });
    },
  });

  return {
    fetchPackages,
    updatePackageStatus: updatePackageStatus.mutateAsync,
    searchProfiles,
    updateUserRole: updateUserRole.mutateAsync,
    isUpdatingStatus: updatePackageStatus.isPending,
    isUpdatingRole: updateUserRole.isPending,
  };
};
