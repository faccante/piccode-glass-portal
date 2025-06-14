
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, BarChart3, Download, Users, Plus, MoreVertical, GitBranch, Trash2, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PackageCreateForm from '@/components/PackageCreateForm';
import VersionUploadForm from '@/components/VersionUploadForm';
import VersionManagementForm from '@/components/VersionManagementForm';
import { usePackages } from '@/hooks/usePackages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [showVersionManagement, setShowVersionManagement] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const { packages, loading, deletePackage, fetchPackages } = usePackages();
  const { user } = useAuth();
  const { toast } = useToast();

  console.log('Dashboard - All packages:', packages);
  console.log('Dashboard - Current user ID:', user?.id);

  // Filter packages to show only user's packages
  const userPackages = packages.filter(pkg => {
    console.log('Checking package:', pkg.name, 'author_id:', pkg.author_id, 'user_id:', user?.id);
    return pkg.author_id === user?.id;
  });

  console.log('Dashboard - User packages:', userPackages);

  const handleAddVersion = (packageData: any) => {
    setSelectedPackage(packageData);
    setShowVersionForm(true);
  };

  const handleManageVersions = (packageData: any) => {
    setSelectedPackage(packageData);
    setShowVersionManagement(true);
  };

  const handleDeletePackage = (packageData: any) => {
    setSelectedPackage(packageData);
    setShowDeleteDialog(true);
  };

  const confirmDeletePackage = async () => {
    if (!selectedPackage) return;

    try {
      await deletePackage(selectedPackage.id);
      toast({
        title: "Package deleted",
        description: "The package namespace and all its versions have been deleted.",
      });
      setShowDeleteDialog(false);
      setSelectedPackage(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Delete failed",
        description: `Unable to delete package: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleCreateFormClose = () => {
    setShowCreateForm(false);
    // Refresh packages after creation
    fetchPackages();
  };

  const totalDownloads = userPackages.reduce((sum, pkg) => sum + pkg.total_downloads, 0);

  return (
    <div className="space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your packages and view analytics</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{userPackages.length}</div>
            <p className="text-xs text-gray-500">
              {userPackages.length === 0 ? 'No packages created' : 'Your published packages'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalDownloads}</div>
            <p className="text-xs text-gray-500">
              {totalDownloads === 0 ? 'No downloads yet' : 'Across all packages'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500">No active users</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Growth Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">0%</div>
            <p className="text-xs text-gray-500">No data available</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart */}
      <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Analytics chart will appear here</p>
              <p className="text-sm text-gray-400">Create packages to see data</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Package List */}
      <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Package className="h-5 w-5" />
            My Package Namespaces
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-gray-500">Loading packages...</p>
            </div>
          ) : userPackages.length === 0 ? (
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Your package namespaces will appear here</p>
                <p className="text-sm text-gray-400">Create your first package to get started</p>
                <Button 
                  onClick={fetchPackages} 
                  variant="outline" 
                  className="mt-4"
                >
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namespace</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold text-blue-600">{pkg.name}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{pkg.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          <a 
                            href={pkg.github_repo} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                          >
                            {pkg.github_repo}
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        pkg.latest_version ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {pkg.latest_version || 'No versions'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {pkg.license}
                      </span>
                    </TableCell>
                    <TableCell>{pkg.total_downloads.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        pkg.status === 'approved' ? 'bg-green-100 text-green-800' :
                        pkg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        pkg.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pkg.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(pkg.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleAddVersion(pkg)}>
                            <GitBranch className="h-4 w-4 mr-2" />
                            Add New Version
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManageVersions(pkg)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Versions
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeletePackage(pkg)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Package
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Package Form Modal */}
      {showCreateForm && (
        <PackageCreateForm onClose={handleCreateFormClose} />
      )}

      {/* Version Upload Form Modal */}
      {showVersionForm && selectedPackage && (
        <VersionUploadForm 
          package={selectedPackage}
          onClose={() => {
            setShowVersionForm(false);
            setSelectedPackage(null);
          }}
        />
      )}

      {/* Version Management Form Modal */}
      {showVersionManagement && selectedPackage && (
        <VersionManagementForm 
          package={selectedPackage}
          onClose={() => {
            setShowVersionManagement(false);
            setSelectedPackage(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the package namespace "{selectedPackage?.name}" and all its versions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePackage}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
