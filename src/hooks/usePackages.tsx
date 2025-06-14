
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

export interface SubmitPackageData {
  name: string;
  description: string;
  version: string;
  license: string;
  githubRepo: string;
  jarFile: File;
}

export const usePackages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading: loading, refetch: fetchPackages } = useQuery({
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

  const submitPackageMutation = useMutation({
    mutationFn: async (packageData: SubmitPackageData) => {
      if (!user) throw new Error('User not authenticated');

      // For now, we'll just create the namespace without actual file upload
      // In a real implementation, you'd upload the JAR file to storage first
      const { data, error } = await supabase
        .from('package_namespaces')
        .insert({
          name: packageData.name,
          description: packageData.description,
          license: packageData.license,
          github_repo: packageData.githubRepo,
          author_id: user.id,
          author_email: user.email || '',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: string) => {
      if (!user) throw new Error('User not authenticated');

      // First delete all versions of the package
      const { error: versionsError } = await supabase
        .from('package_versions')
        .delete()
        .eq('package_namespace_id', packageId);

      if (versionsError) throw versionsError;

      // Then delete the package namespace
      const { error } = await supabase
        .from('package_namespaces')
        .delete()
        .eq('id', packageId)
        .eq('author_id', user.id); // Ensure user can only delete their own packages

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const submitPackage = async (packageData: SubmitPackageData) => {
    return submitPackageMutation.mutateAsync(packageData);
  };

  const deletePackage = async (packageId: string) => {
    return deletePackageMutation.mutateAsync(packageId);
  };

  return {
    packages,
    loading,
    getPackageDetails,
    recordDownload,
    submitPackage,
    deletePackage,
    fetchPackages,
  };
};
