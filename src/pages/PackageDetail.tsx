import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Download, Github, User, Calendar, Package } from 'lucide-react';
import { usePackages, PackageNamespace } from '@/hooks/usePackages';
import { useToast } from '@/hooks/use-toast';
import PackageInstallChart from '@/components/PackageInstallChart';
import Avatar from '@/components/Avatar';

const PackageDetail = () => {
  const { packageId } = useParams<{ packageId: string }>();
  const navigate = useNavigate();
  const { getPackageDetails, recordDownload } = usePackages();
  const { toast } = useToast();
  const [packageData, setPackageData] = useState<PackageNamespace | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPackageData = useCallback(async () => {
    if (!packageId) return;
    
    try {
      setLoading(true);
      const data = await getPackageDetails(packageId);
      setPackageData(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load package details",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  useEffect(() => {
    fetchPackageData();
  }, [fetchPackageData]);

  const handleDownload = async (versionId: string, version: string) => {
    try {
      await recordDownload(versionId);
      toast({
        title: "Download started",
        description: `Package ${packageData?.name} v${version} download recorded`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to process download request",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Package not found</h1>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="glass-button"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-4xl font-bold gradient-text">{packageData.name}</h1>
            <Badge className={getStatusColor(packageData.status)}>
              {packageData.status}
            </Badge>
          </div>
          <p className="text-xl text-muted-foreground">{packageData.description}</p>
        </div>
      </div>

      {/* Package Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Install Command */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Install Command
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black/20 p-4 rounded-lg font-mono text-sm">
                <code>picoc install {packageData.name}</code>
              </div>
            </CardContent>
          </Card>

          {/* Versions */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Versions</CardTitle>
              <CardDescription>Available versions of this package</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {packageData.versions?.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="font-mono font-semibold text-primary">
                        v{version.version}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(version.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Download className="h-4 w-4" />
                        {version.downloads} downloads
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownload(version.id, version.version)}
                      className="bg-primary/20 hover:bg-primary/30 border border-primary/50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Install Activity Chart */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Install Activity</CardTitle>
              <CardDescription>Download statistics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <PackageInstallChart packageId={packageData.id} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Package Details */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Package Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Author</div>
                <div className="flex items-center gap-3 mt-1">
                  <Avatar 
                    src={packageData.profiles?.avatar_url} 
                    username={packageData.profiles?.full_name || packageData.author_email} 
                    size="sm" 
                  />
                  <span>{packageData.profiles?.full_name || packageData.author_email}</span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground">License</div>
                <div className="mt-1">{packageData.license}</div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground">Total Downloads</div>
                <div className="mt-1 text-2xl font-bold text-primary">{packageData.total_downloads}</div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground">Created</div>
                <div className="mt-1">{new Date(packageData.created_at).toLocaleDateString()}</div>
              </div>

              <Separator />

              <Button
                onClick={() => window.open(packageData.github_repo, '_blank')}
                className="w-full glass-button"
                variant="ghost"
              >
                <Github className="h-4 w-4 mr-2" />
                View on GitHub
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PackageDetail;
