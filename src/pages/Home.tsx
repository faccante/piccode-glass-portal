
import React, { useState } from 'react';
import { Search, Package, ExternalLink, Calendar, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { usePackages } from '@/hooks/usePackages';
import { useNavigate } from 'react-router-dom';
import Avatar from '@/components/Avatar';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { packages, loading } = usePackages();
  const navigate = useNavigate();

  console.log('Home page - packages loaded:', packages);
  console.log('Home page - loading state:', loading);

  // For now, show all packages to debug what's in the database
  // Filter packages by search term only
  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePackageClick = (packageId: string) => {
    navigate(`/package/${packageId}`);
  };

  return (
    <div className="space-y-8 py-8">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          PiccodeScript Central Repository
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Search and explore PiccodeScript packages. Find the libraries you need for your projects.
        </p>
      </section>

      {/* Search Section */}
      <section className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search packages..."
            className="pl-12 h-14 text-lg glass-card border-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {searchTerm ? `Search Results (${filteredPackages.length})` : `All Packages (${packages.length})`}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPackages.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No packages found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No packages match "${searchTerm}"`
                  : "No packages are available yet. Check back later!"
                }
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Total packages in database: {packages.length}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => handlePackageClick(pkg.id)}
                className="p-6 rounded-lg border border-border bg-card hover:bg-accent/50 cursor-pointer transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {pkg.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        v{pkg.latest_version || '1.0.0'}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        pkg.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                        pkg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {pkg.status}
                      </span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {pkg.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar 
                          src={pkg.profiles?.avatar_url} 
                          username={pkg.profiles?.full_name || pkg.author_email} 
                          size="sm" 
                        />
                        <span>{pkg.profiles?.full_name || pkg.author_email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(pkg.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{pkg.total_downloads} downloads</span>
                      </div>
                      <div className="px-2 py-1 bg-muted rounded text-xs">
                        {pkg.license}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
