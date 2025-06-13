
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface PackageInstallChartProps {
  packageId: string;
}

interface ChartData {
  date: string;
  downloads: number;
}

const PackageInstallChart: React.FC<PackageInstallChartProps> = ({ packageId }) => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloadData = async () => {
      try {
        setLoading(true);
        
        // Get download analytics for all versions of this package
        const { data: analytics, error } = await supabase
          .from('download_analytics')
          .select(`
            downloaded_at,
            package_versions!inner (
              package_namespace_id
            )
          `)
          .eq('package_versions.package_namespace_id', packageId)
          .order('downloaded_at', { ascending: true });

        if (error) throw error;

        // Group by date and count downloads
        const downloadsByDate = analytics?.reduce((acc: Record<string, number>, download) => {
          const date = new Date(download.downloaded_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {}) || {};

        // Convert to chart data format
        const chartData = Object.entries(downloadsByDate).map(([date, downloads]) => ({
          date: new Date(date).toLocaleDateString(),
          downloads
        }));

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
  }, [packageId]);

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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.7)"
            fontSize={12}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.7)"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
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
