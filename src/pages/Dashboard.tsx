
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, BarChart3, Download, Users, Plus, MoreVertical, GitBranch } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PackageCreateForm from '@/components/PackageCreateForm';
import VersionUploadForm from '@/components/VersionUploadForm';

const Dashboard: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // Mock packages data - empty for now
  const packages: any[] = [];

  const handleAddVersion = (packageData: any) => {
    setSelectedPackage(packageData);
    setShowVersionForm(true);
  };

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

      {/* Stats Overview - Empty state */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500">No packages created</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <p className="text-xs text-gray-500">No downloads yet</p>
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

      {/* Empty Analytics Chart */}
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
            My Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          {packages.length === 0 ? (
            <div className="h-40 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Your packages will appear here</p>
                <p className="text-sm text-gray-400">Create your first package to get started</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{pkg.name}</div>
                        <div className="text-sm text-gray-500">{pkg.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{pkg.latestVersion || 'No versions'}</TableCell>
                    <TableCell>{pkg.license}</TableCell>
                    <TableCell>{pkg.downloads || 0}</TableCell>
                    <TableCell>{new Date(pkg.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleAddVersion(pkg)}>
                            <GitBranch className="h-4 w-4 mr-2" />
                            Add New Version
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
        <PackageCreateForm onClose={() => setShowCreateForm(false)} />
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
    </div>
  );
};

export default Dashboard;
