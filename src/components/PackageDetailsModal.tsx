
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Github, Calendar, User, Package, CheckCircle, XCircle } from 'lucide-react';
import { ManagerPackage } from '@/hooks/useManagerPackages';
import Avatar from '@/components/Avatar';
import CopyableInstallCommand from '@/components/CopyableInstallCommand';

interface PackageDetailsModalProps {
  package: ManagerPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (pkg: ManagerPackage) => void;
  onReject?: (pkg: ManagerPackage) => void;
  isUpdatingStatus?: boolean;
}

const PackageDetailsModal: React.FC<PackageDetailsModalProps> = ({
  package: pkg,
  isOpen,
  onClose,
  onApprove,
  onReject,
  isUpdatingStatus = false
}) => {
  if (!pkg) return null;

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Package className="h-6 w-6" />
              <div>
                <DialogTitle className="text-2xl">{pkg.name}</DialogTitle>
                <DialogDescription className="text-base mt-1">
                  {pkg.description}
                </DialogDescription>
              </div>
            </div>
            <Badge className={getStatusColor(pkg.status)}>
              {pkg.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Install Command */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Install Command</h3>
              <CopyableInstallCommand 
                packageName={pkg.name} 
                versionId="demo-version" // This would need to be the actual latest version ID
              />
            </div>

            {/* Package Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Package Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Author:</span>
                  <div className="flex items-center gap-2">
                    <Avatar 
                      src={pkg.profiles?.avatar_url} 
                      username={pkg.profiles?.full_name || pkg.author_email} 
                      size="sm" 
                    />
                    <span>{pkg.profiles?.full_name || pkg.author_email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">License:</span>
                  <span>{pkg.license}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Total Downloads:</span>
                  <span className="font-semibold text-primary">{pkg.total_downloads}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatDate(pkg.created_at)}</span>
                </div>

                {pkg.latest_version && (
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Latest Version:</span>
                    <Badge variant="outline">v{pkg.latest_version}</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Approval Information */}
            {pkg.approved_by_email && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Approval Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Approved by:</span>
                    <span className="ml-2">{pkg.approved_by_email}</span>
                  </div>
                  {pkg.approved_at && (
                    <div>
                      <span className="text-muted-foreground">Approved on:</span>
                      <span className="ml-2">{formatDate(pkg.approved_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => window.open(pkg.github_repo, '_blank')}
                  className="w-full glass-button"
                  variant="ghost"
                >
                  <Github className="h-4 w-4 mr-2" />
                  View on GitHub
                </Button>

                {pkg.status !== 'approved' && pkg.status !== 'rejected' && onApprove && onReject && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Button
                        onClick={() => onApprove(pkg)}
                        disabled={isUpdatingStatus}
                        className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Processing...' : 'Approve Package'}
                      </Button>
                      <Button
                        onClick={() => onReject(pkg)}
                        disabled={isUpdatingStatus}
                        variant="destructive"
                        className="w-full"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {isUpdatingStatus ? 'Processing...' : 'Reject Package'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Package Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Statistics</h3>
              <div className="space-y-3">
                <div className="bg-black/20 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{pkg.total_downloads}</div>
                  <div className="text-sm text-muted-foreground">Total Downloads</div>
                </div>
                <div className="bg-black/20 p-3 rounded-lg">
                  <div className="text-lg font-semibold">{pkg.status}</div>
                  <div className="text-sm text-muted-foreground">Current Status</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageDetailsModal;
