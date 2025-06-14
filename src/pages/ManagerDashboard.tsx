
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Package, Users, Eye, Calendar, XCircle, UserPlus } from 'lucide-react';
import PackageManagerList from '@/components/PackageManagerList';
import ModeratorManager from '@/components/ModeratorManager';

const ManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [showModeratorManager, setShowModeratorManager] = useState(false);

  // Redirect if not manager - check profile.role instead of user.role
  if (profile?.role !== 'manager') {
    return (
      <div className="text-center py-16">
        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access the manager dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Manager Dashboard</h1>
          <p className="text-muted-foreground">Review and manage package submissions and moderators</p>
        </div>
        <Button
          onClick={() => setShowModeratorManager(true)}
          className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Manage Moderators
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Packages</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Being reviewed</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Moderators</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Active moderators</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">Packages reviewed</p>
          </CardContent>
        </Card>
      </div>

      {/* Package Management */}
      <PackageManagerList />

      {/* Moderator Manager Modal */}
      <ModeratorManager 
        isOpen={showModeratorManager}
        onClose={() => setShowModeratorManager(false)}
      />
    </div>
  );
};

export default ManagerDashboard;
