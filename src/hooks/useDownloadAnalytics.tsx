
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DownloadAnalytic {
  id: string;
  package_id: string;
  downloaded_at: string;
  user_agent: string | null;
  package_versions: {
    id: string;
    version: string;
    package_namespace_id: string;
    package_namespaces: {
      id: string;
      name: string;
      description: string;
    };
  };
}

export const useDownloadAnalytics = () => {
  const { user } = useAuth();

  const { data: userDownloads = [], isLoading } = useQuery({
    queryKey: ['user-downloads', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get downloads for packages owned by the current user
      const { data, error } = await supabase
        .from('download_analytics')
        .select(`
          id,
          package_id,
          downloaded_at,
          user_agent,
          package_versions!inner (
            id,
            version,
            package_namespace_id,
            package_namespaces!inner (
              id,
              name,
              description,
              author_id
            )
          )
        `)
        .eq('package_versions.package_namespaces.author_id', user.id)
        .order('downloaded_at', { ascending: false });

      if (error) throw error;
      return data as DownloadAnalytic[];
    },
    enabled: !!user?.id,
  });

  const getDownloadStats = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentDownloads = userDownloads.filter(
      download => new Date(download.downloaded_at) >= thirtyDaysAgo
    );

    const weeklyDownloads = userDownloads.filter(
      download => new Date(download.downloaded_at) >= sevenDaysAgo
    );

    return {
      total: userDownloads.length,
      last30Days: recentDownloads.length,
      last7Days: weeklyDownloads.length,
      byPackage: userDownloads.reduce((acc, download) => {
        const packageName = download.package_versions.package_namespaces.name;
        acc[packageName] = (acc[packageName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  };

  return {
    userDownloads,
    isLoading,
    getDownloadStats,
  };
};
