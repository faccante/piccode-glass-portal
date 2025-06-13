
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import PackageGrid from '@/components/PackageGrid';
import { useAuth } from '@/hooks/useAuth';
import { usePackages } from '@/hooks/usePackages';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile } = useAuth();
  const { packages, loading, error, recordDownload } = usePackages();
  const navigate = useNavigate();

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePackageClick = (packageId: string) => {
    navigate(`/package/${packageId}`);
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="glass-card p-12 max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold mb-6 gradient-text">
            PiccodeScript Registry
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover, share, and manage PiccodeScript packages. Build faster with community-driven libraries.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            className="pl-12 h-14 text-lg glass-card"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-2">{packages.length}</div>
          <div className="text-muted-foreground">Total Packages</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {packages.reduce((sum, pkg) => sum + pkg.total_downloads, 0)}
          </div>
          <div className="text-muted-foreground">Total Downloads</div>
        </div>
        <div className="glass-card p-6 text-center">
          <div className="text-3xl font-bold text-primary mb-2">
            {packages.filter(pkg => pkg.status === 'approved').length}
          </div>
          <div className="text-muted-foreground">Approved Packages</div>
        </div>
      </section>

      {/* Packages Section */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">
            {searchTerm ? `Search Results (${filteredPackages.length})` : 'Most Downloaded Packages'}
          </h2>
        </div>

        <PackageGrid
          packages={filteredPackages}
          loading={loading}
          error={error}
          onPackageClick={handlePackageClick}
          isManager={profile?.role === 'manager'}
        />
      </section>
    </div>
  );
};

export default Home;
