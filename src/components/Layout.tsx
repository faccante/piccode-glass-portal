
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Github, Package, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from './Avatar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [headerSearchTerm, setHeaderSearchTerm] = useState('');

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(headerSearchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Maven-style header */}
      <header className="maven-header">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-foreground">PiccodeScript Registry</span>
            </Link>

            {/* Central search bar */}
            <div className="maven-search">
              <form onSubmit={handleHeaderSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  className="pl-10 h-10 glass-card border-gray-300"
                  value={headerSearchTerm}
                  onChange={(e) => setHeaderSearchTerm(e.target.value)}
                />
              </form>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="glass-button">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
              
              {user ? (
                <div className="flex items-center space-x-2">
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="glass-button">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/account">
                    <Button variant="ghost" size="sm" className="glass-button flex items-center gap-2">
                      <Avatar 
                        src={profile?.avatar_url} 
                        username={profile?.full_name || profile?.email || 'User'} 
                        size="sm" 
                      />
                      Profile
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="glass-button">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="maven-container">
        {children}
      </main>
    </div>
  );
};

export default Layout;
