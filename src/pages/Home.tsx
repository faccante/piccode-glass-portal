
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Download, Star, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PackageInfo {
  id: string;
  name: string;
  description: string;
  downloads: number;
  stars: number;
  author: string;
  version: string;
  tags: string[];
}

const Home: React.FC = () => {
  // Mock trending packages data
  const trendingPackages: PackageInfo[] = [
    {
      id: '1',
      name: 'web-framework',
      description: 'A lightweight web framework for PiccodeScript applications',
      downloads: 45230,
      stars: 892,
      author: 'framework-team',
      version: '2.1.4',
      tags: ['web', 'framework', 'http']
    },
    {
      id: '2',
      name: 'data-utils',
      description: 'Utilities for data manipulation and processing',
      downloads: 32100,
      stars: 654,
      author: 'data-dev',
      version: '1.8.2',
      tags: ['data', 'utils', 'processing']
    },
    {
      id: '3',
      name: 'crypto-lib',
      description: 'Cryptographic functions and security utilities',
      downloads: 28950,
      stars: 543,
      author: 'security-team',
      version: '3.0.1',
      tags: ['crypto', 'security', 'encryption']
    },
    {
      id: '4',
      name: 'json-parser',
      description: 'Fast and efficient JSON parsing library',
      downloads: 67800,
      stars: 1234,
      author: 'json-master',
      version: '1.5.0',
      tags: ['json', 'parser', 'serialization']
    },
    {
      id: '5',
      name: 'ui-components',
      description: 'Beautiful UI components for PiccodeScript applications',
      downloads: 19500,
      stars: 432,
      author: 'ui-team',
      version: '0.9.8',
      tags: ['ui', 'components', 'design']
    },
    {
      id: '6',
      name: 'http-client',
      description: 'Simple and powerful HTTP client for API interactions',
      downloads: 41200,
      stars: 789,
      author: 'network-dev',
      version: '2.3.1',
      tags: ['http', 'client', 'api']
    }
  ];

  const formatDownloads = (downloads: number) => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    } else if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}K`;
    }
    return downloads.toString();
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16">
        <div className="glass-card p-12 rounded-3xl floating-element">
          <Package className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6 gradient-text">
            PiccodeScript Package Registry
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover, share, and manage packages for the PiccodeScript programming language. 
            Join thousands of developers building amazing applications.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-primary/20 hover:bg-primary/30 border border-primary/50">
                Get Started
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="glass-button">
              Browse Packages
            </Button>
          </div>
        </div>
      </section>

      {/* Trending Packages */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold gradient-text">Trending Packages</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingPackages.map((pkg) => (
            <Card key={pkg.id} className="glass-card hover:scale-105 transition-transform duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      v{pkg.version} by {pkg.author}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {formatDownloads(pkg.downloads)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {pkg.description}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {pkg.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {formatDownloads(pkg.downloads)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {pkg.stars}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="glass-button">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="glass-card p-8 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">12,543</div>
              <p className="text-muted-foreground">Total Packages</p>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">89,234</div>
              <p className="text-muted-foreground">Monthly Downloads</p>
            </div>
            <div>
              <div className="text-4xl font-bold gradient-text mb-2">3,456</div>
              <p className="text-muted-foreground">Active Developers</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
