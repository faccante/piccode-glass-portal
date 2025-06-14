
import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Empty packages array for now
  const packages: any[] = [];

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
            {searchTerm ? `Search Results (${packages.length})` : 'Available Packages'}
          </h2>
        </div>

        {packages.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">No packages found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `No packages match "${searchTerm}"`
                  : "No packages have been uploaded yet. Be the first to contribute!"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {/* Package list will go here when packages exist */}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
