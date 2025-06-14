
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Package, Users, Eye, Calendar, XCircle, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PackageManagerList from '@/components/PackageManagerList';
import ModeratorManager from '@/components/ModeratorManager';

const ManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [showModeratorManager, setShowModeratorManager] = useState(false);

  // Check if user has manager or moderator role
  if (!profile || !['manager', 'moderator'].includes(profile.role)) {
    return (
      <div className="text-center py-16">
        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access the manager dashboard.</p>
      </div>
    );
  }

  const isManager = profile.role === 'manager';

  // Fetch package statistics
  const { data: packageStats } = useQuery({
    queryKey: ['package-stats'],
    queryFn: async () => {
      const { data: packages, error } = await supabase
        .from('package_namespaces')
        .select('status, created_at');

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const stats = {
        pending: packages.filter(pkg => pkg.status === 'pending').length,
        reviewing: packages.filter(pkg => pkg.status === 'reviewing').length,
        thisMonth: packages.filter(pkg => {
          const createdAt = new Date(pkg.created_at);
          return createdAt.getMonth() === currentMonth && 
                 createdAt.getFullYear() === currentYear &&
                 ['approved', 'rejected'].includes(pkg.status);
        }).length
      };

      return stats;
    },
  });

  // Fetch moderator count (only for managers)
  const { data: moderatorCount } = useQuery({
    queryKey: ['moderator-count'],
    queryFn: async () => {
      if (!isManager) return 0;
      
      const { data: moderators, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'moderator');

      if (error) throw error;
      return moderators.length;
    },
    enabled: isManager,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            {profile.role === 'manager' ? 'Manager' : 'Moderator'} Dashboard
          </h1>
          <p className="text-muted-foreground">
            {profile.role === 'manager' 
              ? 'Review and manage package submissions and moderators' 
              : 'Review and manage package submissions'
            }
          </p>
        </div>
        {isManager && (
          <Button
            onClick={() => setShowModeratorManager(true)}
            className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Manage Moderators
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Packages</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packageStats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packageStats?.reviewing || 0}</div>
            <p className="text-xs text-muted-foreground">Being reviewed</p>
          </CardContent>
        </Card>

        {isManager && (
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Moderators</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{moderatorCount || 0}</div>
              <p className="text-xs text-muted-foreground">Active moderators</p>
            </CardContent>
          </Card>
        )}

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packageStats?.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Packages reviewed</p>
          </CardContent>
        </Card>
      </div>

      {/* Package Management */}
      <PackageManagerList />

      {/* Moderator Manager Modal - Only show for managers */}
      {isManager && (
        <ModeratorManager 
          isOpen={showModeratorManager}
          onClose={() => setShowModeratorManager(false)}
        />
      )}
    </div>
  );
};

export default ManagerDashboard;
