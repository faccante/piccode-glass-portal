import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useManagerPackages, ManagerPackage } from '@/hooks/useManagerPackages';
import { useAuth } from '@/hooks/useAuth';
import { 
  Search, 
  Package, 
  Download, 
  Calendar, 
  User, 
  Github, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight,
  Eye
} from 'lucide-react';
import PackageDetailsModal from '@/components/PackageDetailsModal';

const PackageManagerList: React.FC = () => {
  const [packages, setPackages] = useState<ManagerPackage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ManagerPackage | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const { fetchPackages, updatePackageStatus, isUpdatingStatus } = useManagerPackages();
  const { user } = useAuth();
  const { toast } = useToast();

  const ITEMS_PER_PAGE = 10;

  const loadPackages = async (page: number = currentPage, search: string = searchTerm, status: string = statusFilter) => {
    setIsLoading(true);
    try {
      const result = await fetchPackages(page, ITEMS_PER_PAGE, search, status);
      setPackages(result.packages);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast({
        title: "Error loading packages",
        description: "Failed to load packages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadPackages(1, searchTerm, statusFilter);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleApprove = async (pkg: ManagerPackage) => {
    try {
      await updatePackageStatus({ 
        packageId: pkg.id, 
        status: 'approved',
        approverEmail: user?.email
      });
      
      toast({
        title: "Package approved",
        description: `${pkg.name} has been approved and is now available in the registry.`,
      });
      
      loadPackages();
      setShowDetails(false);
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: "Approval failed",
        description: "Failed to approve package",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (pkg: ManagerPackage) => {
    try {
      await updatePackageStatus({ 
        packageId: pkg.id, 
        status: 'rejected',
        approverEmail: user?.email
      });
      
      toast({
        title: "Package rejected",
        description: `${pkg.name} has been rejected.`,
        variant: "destructive",
      });
      
      loadPackages();
      setShowDetails(false);
    } catch (error) {
      console.error('Rejection error:', error);
      toast({
        title: "Rejection failed",
        description: "Failed to reject package",
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Package Management</CardTitle>
          <CardDescription>
            Search and manage package submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search packages by name, description, or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="glass-button"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {!isLoading && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {packages.length > 0 ? ((currentPage - 1) * ITEMS_PER_PAGE) + 1 : 0} to{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} packages
          </span>
          {totalPages > 1 && (
            <span>Page {currentPage} of {totalPages}</span>
          )}
        </div>
      )}

      {/* Package List */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No packages found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{pkg.name}</h3>
                        <Badge variant="outline" className="text-xs">v{pkg.latest_version || 'N/A'}</Badge>
                        <Badge className={getStatusColor(pkg.status)}>
                          {pkg.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">{pkg.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Author:</span>
                          <span>{pkg.profiles?.full_name || pkg.author_email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Submitted:</span>
                          <span>{formatDate(pkg.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Download className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Downloads:</span>
                          <span>{pkg.total_downloads}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">License:</span>
                          <span>{pkg.license}</span>
                        </div>
                      </div>

                      {pkg.approved_by_email && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          Approved by: {pkg.approved_by_email} on {pkg.approved_at ? formatDate(pkg.approved_at) : 'Unknown'}
                        </div>
                      )}
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
                      onClick={() => window.open(pkg.github_repo, '_blank')}
                      className="glass-button"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </Button>
                    <div className="flex-1" />
                    
                    {pkg.status !== 'approved' && pkg.status !== 'rejected' && (
                      <>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(pkg)}
                          disabled={isUpdatingStatus}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(pkg)}
                          disabled={isUpdatingStatus}
                          className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="glass-button"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  disabled={isLoading}
                  className={currentPage === pageNum ? "" : "glass-button"}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="glass-button"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Package Details Modal */}
      <PackageDetailsModal
        package={selectedPackage}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onApprove={handleApprove}
        onReject={handleReject}
        isUpdatingStatus={isUpdatingStatus}
      />
    </div>
  );
};

export default PackageManagerList;
