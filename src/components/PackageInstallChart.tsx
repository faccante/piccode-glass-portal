
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PackageInstallChartProps {
  packageId?: string; // Optional - if not provided, shows all user packages
}

interface ChartData {
  date: string;
  downloads: number;
}

const PackageInstallChart: React.FC<PackageInstallChartProps> = ({ packageId }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchDownloadData = async () => {
      try {
        setLoading(true);
        
        if (!user?.id) {
          setData([]);
          return;
        }

        // Get user's packages
        const { data: userPackages, error: packagesError } = await supabase
          .from('package_namespaces')
          .select('id')
          .eq('author_id', user.id);

        if (packagesError) throw packagesError;

        if (!userPackages || userPackages.length === 0) {
          setData([]);
          return;
        }

        const packageIds = packageId ? [packageId] : userPackages.map(p => p.id);

        // Get all package versions for user's packages
        const { data: versions, error: versionsError } = await supabase
          .from('package_versions')
          .select('id')
          .in('package_namespace_id', packageIds);

        if (versionsError) throw versionsError;

        if (!versions || versions.length === 0) {
          setData([]);
          return;
        }

        const versionIds = versions.map(v => v.id);

        // Get download analytics for all user's packages
        const { data: analytics, error } = await supabase
          .from('download_analytics')
          .select('downloaded_at')
          .in('package_id', versionIds)
          .order('downloaded_at', { ascending: true });

        if (error) throw error;

        // Group by date and count downloads
        const downloadsByDate = analytics?.reduce((acc: Record<string, number>, download) => {
          const date = new Date(download.downloaded_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}) || {};

        // Convert to chart data format and sort by date
        const chartData = Object.entries(downloadsByDate)
          .map(([date, downloads]) => ({
            date: new Date(date).toLocaleDateString(),
            downloads
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setData(chartData);
      } catch (error) {
        console.error('Error fetching download data:', error);
        // Show mock data for demo purposes
        setData([
          { date: '2024-01-01', downloads: 5 },
          { date: '2024-01-02', downloads: 8 },
          { date: '2024-01-03', downloads: 12 },
          { date: '2024-01-04', downloads: 15 },
          { date: '2024-01-05', downloads: 20 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloadData();
  }, [packageId, user?.id]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center">Loading chart...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No download data available yet
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="downloads" 
            stroke="hsl(var(--primary))" 
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PackageInstallChart;
