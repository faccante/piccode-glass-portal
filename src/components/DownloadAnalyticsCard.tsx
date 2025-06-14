
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, TrendingUp, Calendar, Clock } from 'lucide-react';
import { useDownloadAnalytics } from '@/hooks/useDownloadAnalytics';

const DownloadAnalyticsCard: React.FC = () => {
  const { downloadStats, isLoading } = useDownloadAnalytics();

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
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!downloadStats) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Download Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{downloadStats.totalDownloads}</div>
            <div className="text-sm text-muted-foreground">Total Downloads</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{downloadStats.downloadsThisMonth}</div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{downloadStats.downloadsThisWeek}</div>
            <div className="text-sm text-muted-foreground">This Week</div>
          </div>
        </div>

        {/* Recent Downloads */}
        {downloadStats.recentDownloads.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Downloads
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {downloadStats.recentDownloads.slice(0, 5).map((download) => (
                <div key={download.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                  <div className="text-sm">
                    Download recorded
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(download.downloaded_at).toLocaleString()}
                  </div>
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
