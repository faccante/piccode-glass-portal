import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePackages } from '@/hooks/usePackages';
import PackageGrid from '@/components/PackageGrid';
import UploadPackage from '@/components/UploadPackage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Upload, Download } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { userPackages, userPackagesLoading, deletePackage } = usePackages();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">Please log in</h3>
            <p className="text-muted-foreground">
              You need to be logged in to access your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalDownloads = userPackages.reduce((sum, pkg) => sum + pkg.total_downloads, 0);
  const approvedPackages = userPackages.filter(pkg => pkg.status === 'approved').length;
  const pendingPackages = userPackages.filter(pkg => pkg.status === 'pending').length;

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user.email}!
        </h1>
        <p className="text-muted-foreground">
          Manage your packages and track their performance
        </p>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userPackages.length}</div>
            <p className="text-xs text-muted-foreground">
              {approvedPackages} approved, {pendingPackages} pending
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDownloads}</div>
            <p className="text-xs text-muted-foreground">
              Across all your packages
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upload New</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <UploadPackage />
          </CardContent>
        </Card>
      </section>

      {/* Packages Grid */}
      <section className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Your Packages</h2>
          <p className="text-muted-foreground">
            Manage and track the performance of your uploaded packages
          </p>
        </div>

        {userPackagesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : userPackages.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No packages yet</h3>
              <CardDescription className="mb-4">
                Upload your first package to get started with the PiccodeScript repository
              </CardDescription>
              <UploadPackage />
            </CardContent>
          </Card>
        ) : (
          <PackageGrid 
            packages={userPackages} 
            onDeletePackage={deletePackage}
            showActions={true}
          />
        )}
      </section>
    </div>
  );
};

export default Dashboard;
