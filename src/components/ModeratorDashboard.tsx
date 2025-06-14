
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Users, Download, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import UserDashboard from '@/components/UserDashboard';
import PackageManagerList from '@/components/PackageManagerList';
import PackageInstallChart from '@/components/PackageInstallChart';

const ModeratorDashboard: React.FC = () => {
  const { user, profile } = useAuth();

  // Fetch user's packages (for the stats)
  const { data: userPackages = [] } = useQuery({
    queryKey: ['user-packages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('package_namespaces')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch pending packages count for moderator stats
  const { data: moderatorStats } = useQuery({
    queryKey: ['moderator-stats'],
    queryFn: async () => {
      const { data: packages, error } = await supabase
        .from('package_namespaces')
        .select('status, created_at');

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      return {
        pending: packages.filter(pkg => pkg.status === 'pending').length,
        reviewing: packages.filter(pkg => pkg.status === 'reviewing').length,
        thisMonth: packages.filter(pkg => {
          const createdAt = new Date(pkg.created_at);
          return createdAt.getMonth() === currentMonth && 
                 createdAt.getFullYear() === currentYear &&
                 ['approved', 'rejected'].includes(pkg.status);
        }).length
      };
    },
  });

  const totalDownloads = userPackages.reduce((sum, pkg) => sum + (pkg.total_downloads || 0), 0);

  return (
    <div className="space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Moderator Dashboard
          </h1>
          <p className="text-gray-600">Manage your packages and review submissions</p>
        </div>
      </div>

      <Tabs defaultValue="my-packages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-packages">My Packages</TabsTrigger>
          <TabsTrigger value="review-packages">Package Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="my-packages" className="space-y-8">
          {/* User Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">My Packages</CardTitle>
                <Package className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{userPackages.length}</div>
                <p className="text-xs text-gray-500">Your published packages</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">My Downloads</CardTitle>
                <Download className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{totalDownloads}</div>
                <p className="text-xs text-gray-500">Across all your packages</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Reviews</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{moderatorStats?.pending || 0}</div>
                <p className="text-xs text-gray-500">Awaiting review</p>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Reviewed This Month</CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{moderatorStats?.thisMonth || 0}</div>
                <p className="text-xs text-gray-500">Packages reviewed</p>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Overview */}
          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <BarChart3 className="h-5 w-5" />
                Analytics Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userPackages.length > 0 ? (
                <PackageInstallChart packageId={userPackages[0].id} />
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Create a package to see analytics
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Dashboard Content */}
          <UserDashboard />
        </TabsContent>

        <TabsContent value="review-packages" className="space-y-8">
          <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Shield className="h-5 w-5 text-blue-600" />
                Package Review Center
              </CardTitle>
              <CardDescription>
                Review and approve package submissions from other users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PackageManagerList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModeratorDashboard;
