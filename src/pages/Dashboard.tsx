
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Package, Plus, TrendingUp, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import UploadPackage from '@/components/UploadPackage';

interface UserPackage {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'pending' | 'approved' | 'rejected';
  downloads: number;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [showUpload, setShowUpload] = useState(false);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year' | '2years' | '5years'>('month');

  // Mock user packages
  const userPackages: UserPackage[] = [
    {
      id: '1',
      name: 'my-awesome-lib',
      description: 'A utility library for common operations',
      version: '1.2.3',
      status: 'approved',
      downloads: 1250,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'data-processor',
      description: 'Advanced data processing tools',
      version: '0.9.1',
      status: 'pending',
      downloads: 0,
      createdAt: '2024-06-10'
    },
    {
      id: '3',
      name: 'ui-toolkit',
      description: 'Beautiful UI components',
      version: '2.0.0',
      status: 'rejected',
      downloads: 0,
      createdAt: '2024-05-20'
    }
  ];

  // Mock analytics data
  const getAnalyticsData = () => {
    const ranges = {
      day: Array.from({ length: 24 }, (_, i) => ({
        period: `${i}:00`,
        downloads: Math.floor(Math.random() * 50)
      })),
      week: Array.from({ length: 7 }, (_, i) => ({
        period: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        downloads: Math.floor(Math.random() * 200)
      })),
      month: Array.from({ length: 30 }, (_, i) => ({
        period: `Day ${i + 1}`,
        downloads: Math.floor(Math.random() * 100)
      })),
      year: Array.from({ length: 12 }, (_, i) => ({
        period: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        downloads: Math.floor(Math.random() * 1000)
      })),
      '2years': Array.from({ length: 24 }, (_, i) => ({
        period: `${Math.floor(i / 12) + 2023}-${String((i % 12) + 1).padStart(2, '0')}`,
        downloads: Math.floor(Math.random() * 1000)
      })),
      '5years': Array.from({ length: 5 }, (_, i) => ({
        period: (2020 + i).toString(),
        downloads: Math.floor(Math.random() * 5000)
      }))
    };
    return ranges[timeRange];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const totalDownloads = userPackages.reduce((sum, pkg) => sum + pkg.downloads, 0);
  const approvedPackages = userPackages.filter(pkg => pkg.status === 'approved').length;

  if (user?.role === 'manager') {
    // Redirect to manager dashboard
    window.location.href = '/manager-dashboard';
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">Manage your packages and view analytics</p>
        </div>
        <Button 
          onClick={() => setShowUpload(true)}
          className="bg-primary/20 hover:bg-primary/30 border border-primary/50"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Package
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Packages</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPackages}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userPackages.filter(pkg => pkg.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="packages">My Packages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-6">
          <div className="grid gap-4">
            {userPackages.map((pkg) => (
              <Card key={pkg.id} className="glass-card">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <CardDescription>v{pkg.version} • Created {pkg.createdAt}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(pkg.status)}>
                      {pkg.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{pkg.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {pkg.downloads.toLocaleString()} downloads
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="glass-button">
                        View Details
                      </Button>
                      {pkg.status === 'approved' && (
                        <Button size="sm" variant="ghost" className="glass-button">
                          Update
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Downloads Analytics
                  </CardTitle>
                  <CardDescription>Track your package download trends</CardDescription>
                </div>
                <div className="flex gap-2">
                  {(['day', 'week', 'month', 'year', '2years', '5years'] as const).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className={timeRange === range ? "bg-primary/20 border border-primary/50" : "glass-button"}
                    >
                      {range === '2years' ? '2Y' : range === '5years' ? '5Y' : range.charAt(0).toUpperCase() + range.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getAnalyticsData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="period" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="downloads" 
                    stroke="hsl(260, 75%, 60%)" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(260, 75%, 60%)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showUpload && (
        <UploadPackage onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
};

export default Dashboard;
