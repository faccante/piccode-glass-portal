
import React, { useState, useEffect } from 'react';
import { Search, Package, ExternalLink, Calendar, User, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { usePublicPackages } from '@/hooks/usePublicPackages';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Avatar from '@/components/Avatar';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('created_at');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const { packages, loading } = usePublicPackages();
  const navigate = useNavigate();

  // Update search term when URL parameters change
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch && urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  // Update URL when search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  // Filter and sort packages
  const filteredAndSortedPackages = packages
    .filter(pkg => {
      const matchesSearch = searchTerm === '' || 
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.profiles?.full_name || pkg.author_email).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'approved' && pkg.status === 'approved') ||
        (filterBy === 'this-week' && new Date(pkg.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (filterBy === 'popular' && pkg.total_downloads > 10);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'downloads':
          return b.total_downloads - a.total_downloads;
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handlePackageClick = (packageId: string) => {
    navigate(`/package/${packageId}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchParams({});
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
            placeholder="Search packages, descriptions, or authors..."
            className="pl-12 h-14 text-lg glass-card border-gray-300"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-card border rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Latest</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="downloads">Most Downloaded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter by</label>
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Packages</SelectItem>
                    <SelectItem value="approved">Approved Only</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="popular">Popular (10+ downloads)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Results Section */}
      <section className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {searchTerm ? `Search Results (${filteredAndSortedPackages.length})` : 'Available Packages'}
          </h2>
          {searchTerm && (
            <Button variant="ghost" onClick={clearSearch}>
              Clear Search
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredAndSortedPackages.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No packages found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No packages match "${searchTerm}"`
                  : "No approved packages are available yet. Check back later!"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedPackages.map((pkg) => (
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
