
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Download, User, Calendar, Plus, Settings, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePackages } from '@/hooks/usePackages';
import PackageUploadForm from '@/components/PackageUploadForm';
import VersionManagementForm from '@/components/VersionManagementForm';
import VersionUploadForm from '@/components/VersionUploadForm';
import DownloadAnalyticsCard from '@/components/DownloadAnalyticsCard';

const UserDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const { deletePackage } = usePackages();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showVersionForm, setShowVersionForm] = useState<any>(null);
  const [showVersionUploadForm, setShowVersionUploadForm] = useState<any>(null);

  // Fetch user's packages
  const { data: userPackages = [], isLoading } = useQuery({
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

  const handleDeletePackage = async (packageId: string, packageName: string) => {
    if (!confirm(`Are you sure you want to delete the package "${packageName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePackage(packageId);
      toast({
        title: "Package deleted",
        description: `Package "${packageName}" has been deleted successfully.`,
      });
      
      // Refresh the packages list
      queryClient.invalidateQueries({ queryKey: ['user-packages'] });
    } catch (error) {
      console.error('Error deleting package:', error);
      toast({
        title: "Delete failed",
        description: "Unable to delete the package. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
      case 'reviewing': return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalDownloads = userPackages.reduce((sum, pkg) => sum + (pkg.total_downloads || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPackages.length}</div>
            <p className="text-xs text-muted-foreground">Published packages</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads}</div>
            <p className="text-xs text-muted-foreground">Across all packages</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {userPackages.filter(pkg => pkg.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">Live packages</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Package className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {userPackages.filter(pkg => pkg.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Download Analytics */}
      <DownloadAnalyticsCard />

      {/* Upload Package Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Packages</h2>
        <Button 
          onClick={() => setShowUploadForm(true)}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Upload Package
        </Button>
      </div>

      {/* Packages List */}
      {userPackages.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No packages yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload your first package to get started with PiccodeScript Registry
            </p>
            <Button onClick={() => setShowUploadForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Your First Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userPackages.map((pkg) => (
            <Card key={pkg.id} className="glass-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{pkg.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {pkg.description}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(pkg.status)}>
                    {pkg.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{profile?.full_name || user?.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(pkg.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Download className="h-4 w-4" />
                  <span>{pkg.total_downloads || 0} downloads</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowVersionForm(pkg)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Manage
                  </Button>
                  
                  <Button
                    onClick={() => setShowVersionUploadForm(pkg)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Add Version
                  </Button>
                  
                  <Button
                    onClick={() => handleDeletePackage(pkg.id, pkg.name)}
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Package Form */}
      {showUploadForm && (
        <PackageUploadForm
          onClose={() => setShowUploadForm(false)}
          onPackageUploaded={() => {
            queryClient.invalidateQueries({ queryKey: ['user-packages'] });
            setShowUploadForm(false);
          }}
        />
      )}

      {/* Version Management Form */}
      {showVersionForm && (
        <VersionManagementForm
          package={showVersionForm}
          onClose={() => setShowVersionForm(null)}
        />
      )}

      {/* Version Upload Form */}
      {showVersionUploadForm && (
        <VersionUploadForm
          package={showVersionUploadForm}
          onClose={() => setShowVersionUploadForm(null)}
          onVersionUploaded={() => {
            queryClient.invalidateQueries({ queryKey: ['user-packages'] });
            setShowVersionUploadForm(null);
          }}
        />
      )}
    </div>
  );
};

export default UserDashboard;
