
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Github, Calendar, User } from 'lucide-react';
import { Package } from '@/hooks/usePackages';

interface PackageCardProps {
  package: Package;
  onDownload?: (packageId: string) => void;
  onStatusChange?: (packageId: string, status: Package['status']) => void;
  showActions?: boolean;
  isManager?: boolean;
}

const PackageCard: React.FC<PackageCardProps> = ({ 
  package: pkg, 
  onDownload, 
  onStatusChange, 
  showActions = true,
  isManager = false 
}) => {
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

  const handleDownload = () => {
    if (onDownload) {
      onDownload(pkg.id);
    }
  };

  const openGithubRepo = () => {
    window.open(pkg.github_repo, '_blank');
  };

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{pkg.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {pkg.description}
            </CardDescription>
          </div>
          <Badge className={`ml-2 ${getStatusColor(pkg.status)}`}>
            {pkg.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{pkg.profiles?.full_name || pkg.author_email}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(pkg.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Version: {pkg.version}</span>
            <span className="text-muted-foreground">License: {pkg.license}</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Download className="h-4 w-4" />
            <span>{pkg.downloads} downloads</span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2 mt-4">
            {pkg.status === 'approved' && (
              <Button
                onClick={handleDownload}
                className="flex-1 bg-primary/20 hover:bg-primary/30 border border-primary/50"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
            
            <Button
              onClick={openGithubRepo}
              variant="ghost"
              className="glass-button"
            >
              <Github className="h-4 w-4 mr-2" />
              GitHub
            </Button>
          </div>
        )}

        {isManager && onStatusChange && pkg.status !== 'approved' && (
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => onStatusChange(pkg.id, 'approved')}
              className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50"
            >
              Approve
            </Button>
            <Button
              onClick={() => onStatusChange(pkg.id, 'rejected')}
              variant="ghost"
              className="flex-1 glass-button text-red-400 hover:text-red-300"
            >
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PackageCard;
