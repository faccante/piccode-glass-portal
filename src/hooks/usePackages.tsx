
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
      console.log('Fetching packages...');
      
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching packages:', error);
        throw error;
      }

      console.log('Raw packages data:', data);

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

      console.log('Packages with versions:', packagesWithVersions);
      return packagesWithVersions as PackageNamespace[];
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
    // First, get the package namespace ID from the version
    const { data: versionData, error: versionError } = await supabase
      .from('package_versions')
      .select('package_namespace_id')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    // Record the download in analytics
    const { error: analyticsError } = await supabase
      .from('download_analytics')
      .insert({
        package_id: versionId,
        user_agent: navigator.userAgent,
        ip_address: null, // Will be set by the database
      });

    if (analyticsError) throw analyticsError;

    // Update the version's download count
    const { error: versionUpdateError } = await supabase
      .from('package_versions')
      .update({ 
        downloads: supabase.sql`downloads + 1`
      })
      .eq('id', versionId);

    if (versionUpdateError) throw versionUpdateError;

    // Update the package namespace's total downloads count
    const { error: namespaceUpdateError } = await supabase
      .from('package_namespaces')
      .update({ 
        total_downloads: supabase.sql`total_downloads + 1`
      })
      .eq('id', versionData.package_namespace_id);

    if (namespaceUpdateError) throw namespaceUpdateError;

    // Invalidate queries to refresh download counts
    queryClient.invalidateQueries({ queryKey: ['packages'] });
  };

  const submitPackageMutation = useMutation({
    mutationFn: async (packageData: SubmitPackageData) => {
      if (!user) throw new Error('User not authenticated');

      console.log('Submitting package:', packageData);

      // Create the package namespace
      const { data: namespaceData, error: namespaceError } = await supabase
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

      if (namespaceError) {
        console.error('Error creating namespace:', namespaceError);
        throw namespaceError;
      }

      console.log('Created namespace:', namespaceData);

      // Create the first version
      const { data: versionData, error: versionError } = await supabase
        .from('package_versions')
        .insert({
          package_namespace_id: namespaceData.id,
          version: packageData.version,
          jar_file_url: `uploads/${packageData.name}/${packageData.version}/${packageData.jarFile.name}`,
          jar_file_size: packageData.jarFile.size,
          downloads: 0
        })
        .select()
        .single();

      if (versionError) {
        console.error('Error creating version:', versionError);
        throw versionError;
      }

      console.log('Created version:', versionData);

      return namespaceData;
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
