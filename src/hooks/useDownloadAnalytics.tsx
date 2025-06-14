
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DownloadAnalytic {
  id: string;
  package_id: string;
  downloaded_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

export interface DownloadStats {
  totalDownloads: number;
  downloadsThisMonth: number;
  downloadsThisWeek: number;
  recentDownloads: DownloadAnalytic[];
}

export const useDownloadAnalytics = () => {
  const { user } = useAuth();

  const { data: downloadStats, isLoading } = useQuery({
    queryKey: ['download-analytics', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get user's packages
      const { data: userPackages, error: packagesError } = await supabase
        .from('package_namespaces')
        .select('id')
        .eq('author_id', user.id);

      if (packagesError) throw packagesError;

      if (!userPackages || userPackages.length === 0) {
        return {
          totalDownloads: 0,
          downloadsThisMonth: 0,
          downloadsThisWeek: 0,
          recentDownloads: []
        };
      }

      const packageIds = userPackages.map(p => p.id);

      // Get all package versions for user's packages
      const { data: versions, error: versionsError } = await supabase
        .from('package_versions')
        .select('id')
        .in('package_namespace_id', packageIds);

      if (versionsError) throw versionsError;

      if (!versions || versions.length === 0) {
        return {
          totalDownloads: 0,
          downloadsThisMonth: 0,
          downloadsThisWeek: 0,
          recentDownloads: []
        };
      }

      const versionIds = versions.map(v => v.id);

      // Get download analytics
      const { data: downloads, error: downloadsError } = await supabase
        .from('download_analytics')
        .select('*')
        .in('package_id', versionIds)
        .order('downloaded_at', { ascending: false });

      if (downloadsError) throw downloadsError;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

      return {
        totalDownloads: downloads?.length || 0,
        downloadsThisMonth: downloads?.filter(d => 
          new Date(d.downloaded_at) >= startOfMonth
        ).length || 0,
        downloadsThisWeek: downloads?.filter(d => 
          new Date(d.downloaded_at) >= startOfWeek
        ).length || 0,
        recentDownloads: downloads?.slice(0, 10) || []
      };
    },
    enabled: !!user?.id,
  });

  return {
    downloadStats,
    isLoading
  };
};
