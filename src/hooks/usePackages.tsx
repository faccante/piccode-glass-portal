import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Package {
  id: string;
  name: string;
  description: string;
  version: string;
  license: string;
  github_repo: string;
  author_id: string;
  author_email: string;
  jar_file_url?: string;
  jar_file_size?: number;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  downloads: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  // Join with profiles table
  profiles?: {
    full_name?: string;
    email: string;
  };
}

export const usePackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile } = useAuth();

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('packages')
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

      const { data, error: fetchError } = await query.order('created_at', { ascending: false });
      
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      
      // Type assertion to ensure status is properly typed
      const typedPackages: Package[] = data?.map(pkg => ({
        ...pkg,
        status: pkg.status as 'pending' | 'reviewing' | 'approved' | 'rejected'
      })) || [];
      
      setPackages(typedPackages);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to fetch packages');
    } finally {
      setLoading(false);
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
    if (!user || !profile) {
      throw new Error('Not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('packages')
        .insert({
          name: packageData.name,
          description: packageData.description,
          version: packageData.version,
          license: packageData.license,
          github_repo: packageData.githubRepo,
          author_id: user.id,
          author_email: user.email || '',
          jar_file_size: packageData.jarFile.size
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Refresh packages list
      await fetchPackages();
      
      return data;
    } catch (error) {
      console.error('Error submitting package:', error);
      throw error;
    }
  };

  const updatePackageStatus = async (packageId: string, status: Package['status'], approvedBy?: string) => {
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
        .from('packages')
        .update(updateData)
        .eq('id', packageId);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh packages list
      await fetchPackages();
    } catch (error) {
      console.error('Error updating package status:', error);
      throw error;
    }
  };

  const recordDownload = async (packageId: string) => {
    try {
      // Record download analytics
      await supabase
        .from('download_analytics')
        .insert({
          package_id: packageId,
          ip_address: null, // Could be populated server-side
          user_agent: navigator.userAgent
        });

      // Increment download count
      await supabase
        .from('packages')
        .update({ 
          downloads: packages.find(p => p.id === packageId)?.downloads + 1 || 1 
        })
        .eq('id', packageId);

      // Refresh packages to show updated count
      await fetchPackages();
    } catch (error) {
      console.error('Error recording download:', error);
      // Don't throw error for analytics - allow download to continue
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [profile]); // Refetch when profile changes (role might affect visibility)

  return {
    packages,
    loading,
    error,
    fetchPackages,
    submitPackage,
    updatePackageStatus,
    recordDownload
  };
};
