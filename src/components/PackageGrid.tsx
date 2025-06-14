
import React from 'react';
import { PackageNamespace } from '@/hooks/usePackages';
import PackageCard from './PackageCard';

interface PackageGridProps {
  packages: PackageNamespace[];
  loading?: boolean;
  error?: string | null;
  onPackageClick?: (packageId: string) => void;
  onStatusChange?: (packageId: string, status: PackageNamespace['status']) => void;
  onDeletePackage?: (packageId: string) => Promise<void>;
  isManager?: boolean;
  showActions?: boolean;
}

const PackageGrid: React.FC<PackageGridProps> = ({
  packages,
  loading = false,
  error = null,
  onPackageClick,
  onStatusChange,
  onDeletePackage,
  isManager = false,
  showActions = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card h-64 animate-pulse">
            <div className="p-6 space-y-4">
              <div className="h-6 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/5 rounded"></div>
              <div className="h-4 bg-white/5 rounded w-5/6"></div>
              <div className="h-10 bg-white/5 rounded mt-auto"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="glass-card p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-red-400 mb-2">Error Loading Packages</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="glass-card p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium mb-2">No Packages Found</h3>
          <p className="text-muted-foreground">
            {isManager 
              ? "No packages have been submitted yet." 
              : "No approved packages are available yet. Check back later!"
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <PackageCard
          key={pkg.id}
          package={pkg}
          onPackageClick={onPackageClick}
          onStatusChange={onStatusChange}
          onDeletePackage={onDeletePackage}
          isManager={isManager}
          showActions={showActions}
        />
      ))}
    </div>
  );
};

export default PackageGrid;
