
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, TrendingUp, Calendar, Package } from 'lucide-react';
import { useDownloadAnalytics } from '@/hooks/useDownloadAnalytics';

const DownloadAnalyticsCard: React.FC = () => {
  const { getDownloadStats, isLoading } = useDownloadAnalytics();

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/10 rounded"></div>
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = getDownloadStats();

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Analytics
        </CardTitle>
        <CardDescription>
          Track how your packages are being downloaded
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Download className="h-3 w-3" />
              Total Downloads
            </div>
          </div>
          
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-green-400">{stats.last7Days}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Last 7 Days
            </div>
          </div>
          
          <div className="text-center p-3 bg-white/5 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{stats.last30Days}</div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Calendar className="h-3 w-3" />
              Last 30 Days
            </div>
          </div>
        </div>

        {Object.keys(stats.byPackage).length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Downloads by Package
            </h4>
            <div className="space-y-2">
              {Object.entries(stats.byPackage)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([packageName, downloads]) => (
                  <div key={packageName} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-sm font-medium truncate">{packageName}</span>
                    <span className="text-sm text-muted-foreground">{downloads} downloads</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DownloadAnalyticsCard;
