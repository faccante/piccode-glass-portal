import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface PackageNamespace {
  id: string;
  name: string;
  description: string;
  license: string;
  github_repo: string;
  author_id: string;
  author_email: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  total_downloads: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  profiles?: {
    full_name?: string;
    email: string;
  };
  latest_version?: string;
  versions?: PackageVersion[];
}

export interface PackageVersion {
  id: string;
  package_namespace_id: string;
  version: string;
  jar_file_url?: string;
  jar_file_size?: number;
  downloads: number;
  created_at: string;
}

export const usePackages = () => {
  const [packages, setPackages] = useState<PackageNamespace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('package_namespaces')
        .select(`
          *,
          profiles!author_id (
            full_name,
            email
          )
        `);

      // If user is not a manager, only show approved packages
      if (!profile || profile.role !== 'manager') {
        query = query.eq('status', 'approved');
      }

      const { data, error: fetchError } = await query.order('total_downloads', { ascending: false });
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      // Fetch latest version for each package
      const packagesWithVersions = await Promise.all(
        (data || []).map(async (pkg) => {
          const { data: versions } = await supabase
            .from('package_versions')
            .select('*')
            .eq('package_namespace_id', pkg.id)
            .order('created_at', { ascending: false })
            .limit(1);

          return {
            ...pkg,
            latest_version: versions?.[0]?.version,
            status: pkg.status as 'pending' | 'reviewing' | 'approved' | 'rejected'
          };
        })
      );
      
      setPackages(packagesWithVersions);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to fetch packages');
    } finally {
      setLoading(false);
    }
  };

  const getPackageDetails = async (packageId: string) => {
    try {
      const { data: packageData, error: packageError } = await supabase
        .from('package_namespaces')
        .select(`
          *,
          profiles!author_id (
            full_name,
            email
          )
        `)
        .eq('id', packageId)
        .single();

      if (packageError) throw packageError;

      const { data: versions, error: versionsError } = await supabase
        .from('package_versions')
        .select('*')
        .eq('package_namespace_id', packageId)
        .order('created_at', { ascending: false });

      if (versionsError) throw versionsError;

      return {
        ...packageData,
        versions,
        status: packageData.status as 'pending' | 'reviewing' | 'approved' | 'rejected'
      };
    } catch (error) {
      console.error('Error fetching package details:', error);
      throw error;
    }
  };

  const createPackageNamespace = async (packageData: {
    name: string;
    description: string;
    license: string;
    githubRepo: string;
  }) => {
    if (!user || !profile) {
      throw new Error('Not authenticated');
    }

    try {
      // Check if package namespace already exists
      const { data: existingPackage } = await supabase
        .from('package_namespaces')
        .select('id, author_id')
        .eq('name', packageData.name)
        .single();

      if (existingPackage) {
        throw new Error('Package name already exists');
      }

      // Create new package namespace
      const { data: newPackage, error: namespaceError } = await supabase
        .from('package_namespaces')
        .insert({
          name: packageData.name,
          description: packageData.description,
          license: packageData.license,
          github_repo: packageData.githubRepo,
          author_id: user.id,
          author_email: user.email || ''
        })
        .select()
        .single();

      if (namespaceError) throw namespaceError;

      // Refresh packages list
      await fetchPackages();
      
      return { success: true, packageId: newPackage.id };
    } catch (error) {
      console.error('Error creating package namespace:', error);
      throw error;
    }
  };

  const submitPackage = async (packageData: {
    name: string;
    description: string;
    version: string;
    license: string;
    githubRepo: string;
    jarFile: File;
  }) => {
    // For now, just create the namespace - we'll handle versions separately
    return await createPackageNamespace({
      name: packageData.name,
      description: packageData.description,
      license: packageData.license,
      githubRepo: packageData.githubRepo
    });
  };

  const updatePackage = async (packageId: string, updateData: {
    description?: string;
    license?: string;
    github_repo?: string;
  }) => {
    if (!user || !profile) {
      throw new Error('Not authenticated');
    }

    try {
      const { error } = await supabase
        .from('package_namespaces')
        .update(updateData)
        .eq('id', packageId)
        .eq('author_id', user.id);

      if (error) throw error;

      await fetchPackages();
    } catch (error) {
      console.error('Error updating package:', error);
      throw error;
    }
  };

  const updatePackageStatus = async (packageId: string, status: PackageNamespace['status']) => {
    if (!user || !profile || profile.role !== 'manager') {
      throw new Error('Not authorized');
    }

    try {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
      }

      const { error } = await supabase
        .from('package_namespaces')
        .update(updateData)
        .eq('id', packageId);

      if (error) throw error;

      await fetchPackages();
    } catch (error) {
      console.error('Error updating package status:', error);
      throw error;
    }
  };

  const recordDownload = async (versionId: string) => {
    try {
      // Record download analytics using the correct column name 'package_id'
      await supabase
        .from('download_analytics')
        .insert({
          package_id: versionId,
          user_agent: navigator.userAgent
        });

      // Update version download count using RPC or direct increment
      const { data: currentVersion } = await supabase
        .from('package_versions')
        .select('downloads')
        .eq('id', versionId)
        .single();

      if (currentVersion) {
        const { error: updateError } = await supabase
          .from('package_versions')
          .update({ downloads: currentVersion.downloads + 1 })
          .eq('id', versionId);

        if (updateError) {
          console.error('Error updating download count:', updateError);
        }
      }

      // Update namespace total downloads
      const { data: version } = await supabase
        .from('package_versions')
        .select('package_namespace_id')
        .eq('id', versionId)
        .single();

      if (version) {
        const { data: currentNamespace } = await supabase
          .from('package_namespaces')
          .select('total_downloads')
          .eq('id', version.package_namespace_id)
          .single();

        if (currentNamespace) {
          await supabase
            .from('package_namespaces')
            .update({ total_downloads: currentNamespace.total_downloads + 1 })
            .eq('id', version.package_namespace_id);
        }
      }

      // Refresh packages to show updated count
      await fetchPackages();
    } catch (error) {
      console.error('Error recording download:', error);
      // Don't throw error for analytics - allow download to continue
    }
  };

  const deletePackage = async (packageId: string) => {
    if (!user || !profile) {
      throw new Error('Not authenticated');
    }

    try {
      const { error } = await supabase
        .from('package_namespaces')
        .delete()
        .eq('id', packageId)
        .eq('author_id', user.id);

      if (error) throw error;

      await fetchPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [profile]);

  return {
    packages,
    loading,
    error,
    fetchPackages,
    getPackageDetails,
    submitPackage,
    createPackageNamespace,
    updatePackage,
    updatePackageStatus,
    recordDownload,
    deletePackage
  };
};
