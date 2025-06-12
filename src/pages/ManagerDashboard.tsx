
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { Package, Download, CheckCircle, XCircle, Eye, Calendar, User, Github, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PendingPackage {
  id: string;
  name: string;
  description: string;
  version: string;
  license: string;
  githubRepo: string;
  authorEmail: string;
  authorId: string;
  uploadedAt: string;
  jarFileSize: number;
  status: 'pending' | 'reviewing';
}

const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<PendingPackage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const { toast } = useToast();

  // Mock pending packages data
  const [pendingPackages, setPendingPackages] = useState<PendingPackage[]>([
    {
      id: '1',
      name: 'data-processor',
      description: 'Advanced data processing tools for PiccodeScript applications with support for CSV, JSON, and XML parsing',
      version: '0.9.1',
      license: 'MIT',
      githubRepo: 'https://github.com/user/data-processor',
      authorEmail: 'developer@example.com',
      authorId: 'dev123',
      uploadedAt: '2024-06-10T14:30:00Z',
      jarFileSize: 2.4,
      status: 'pending'
    },
    {
      id: '2',
      name: 'ui-toolkit',
      description: 'Beautiful UI components and utilities for building modern PiccodeScript applications',
      version: '2.0.0',
      license: 'Apache-2.0',
      githubRepo: 'https://github.com/uiteam/ui-toolkit',
      authorEmail: 'ui.developer@example.com',
      authorId: 'dev456',
      uploadedAt: '2024-06-08T09:15:00Z',
      jarFileSize: 5.1,
      status: 'pending'
    },
    {
      id: '3',
      name: 'math-utils',
      description: 'Mathematical utilities and algorithms for scientific computing',
      version: '1.2.0',
      license: 'GPL-3.0',
      githubRepo: 'https://github.com/mathdev/math-utils',
      authorEmail: 'math.dev@example.com',
      authorId: 'dev789',
      uploadedAt: '2024-06-12T16:45:00Z',
      jarFileSize: 1.8,
      status: 'reviewing'
    }
  ]);

  const handleApprove = (packageId: string) => {
    setPendingPackages(prev => prev.filter(pkg => pkg.id !== packageId));
    toast({
      title: "Package approved",
      description: "The package has been approved and is now available in the registry.",
    });
    setShowDetails(false);
  };

  const handleReject = (packageId: string) => {
    setPendingPackages(prev => prev.filter(pkg => pkg.id !== packageId));
    toast({
      title: "Package rejected",
      description: "The package has been rejected and the author has been notified.",
      variant: "destructive",
    });
    setShowDetails(false);
  };

  const handleDownload = (pkg: PendingPackage) => {
    // Simulate file download
    console.log(`Downloading ${pkg.name}-${pkg.version}.jar`);
    toast({
      title: "Download started",
      description: `Downloading ${pkg.name}-${pkg.version}.jar`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'reviewing': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  // Redirect if not manager
  if (user?.role !== 'manager') {
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
          <p className="text-muted-foreground">Review and manage package submissions</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/50">
          {pendingPackages.length} Pending Reviews
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Packages</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPackages.filter(p => p.status === 'pending').length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPackages.filter(p => p.status === 'reviewing').length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPackages.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Packages List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Package Review Queue</CardTitle>
          <CardDescription>
            Review and approve or reject package submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingPackages.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No packages pending review</p>
              </div>
            ) : (
              pendingPackages.map((pkg) => (
                <div key={pkg.id} className="glass-card p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{pkg.name}</h3>
                        <Badge variant="outline" className="text-xs">v{pkg.version}</Badge>
                        <Badge className={getStatusColor(pkg.status)}>
                          {pkg.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">{pkg.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Author:</span>
                          <span>{pkg.authorEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Uploaded:</span>
                          <span>{formatDate(pkg.uploadedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Size:</span>
                          <span>{pkg.jarFileSize} MB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">License:</span>
                          <span>{pkg.license}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setShowDetails(true);
                      }}
                      className="glass-button"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(pkg)}
                      className="glass-button"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download JAR
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(pkg.id)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(pkg.id)}
                      className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Package Details Modal */}
      {showDetails && selectedPackage && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="glass-card max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl gradient-text">
                {selectedPackage.name} v{selectedPackage.version}
              </DialogTitle>
              <DialogDescription>
                Detailed package information for review
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="glass-card p-4 rounded-lg">
                <h4 className="font-medium mb-3">Package Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{selectedPackage.name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <span className="ml-2 font-medium">{selectedPackage.version}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">License:</span>
                    <span className="ml-2 font-medium">{selectedPackage.license}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">File Size:</span>
                    <span className="ml-2 font-medium">{selectedPackage.jarFileSize} MB</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-4 rounded-lg">
                <h4 className="font-medium mb-3">Description</h4>
                <p className="text-muted-foreground">{selectedPackage.description}</p>
              </div>

              <div className="glass-card p-4 rounded-lg">
                <h4 className="font-medium mb-3">Author Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Email:</span>
                    <span>{selectedPackage.authorEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Repository:</span>
                    <a 
                      href={selectedPackage.githubRepo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      {selectedPackage.githubRepo}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span>{formatDate(selectedPackage.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowDetails(false)}
                  className="glass-button flex-1"
                >
                  Close
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleDownload(selectedPackage)}
                  className="glass-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download JAR
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(selectedPackage.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedPackage.id)}
                  className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ManagerDashboard;
