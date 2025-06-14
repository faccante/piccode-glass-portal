
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Github, Package, User, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Avatar from './Avatar';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();

  const currentPath = location.pathname;

  const mobileNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
    { path: '/account', label: 'Profile', icon: User, requiresAuth: true },
  ];

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

            {/* Central search bar - hidden on mobile */}
            {!isMobile && (
              <div className="maven-search">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search packages..."
                    className="pl-10 h-10 glass-card border-gray-300"
                  />
                </div>
              </div>
            )}

            {/* Desktop navigation */}
            <div className="flex items-center space-x-3 desktop-nav-actions">
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

            {/* Mobile menu button placeholder */}
            {isMobile && (
              <div className="w-8 h-8" /> // Placeholder for visual balance
            )}
          </div>

          {/* Mobile search bar */}
          {isMobile && (
            <div className="maven-search mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  className="pl-10 h-12 glass-card border-gray-300"
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="maven-container">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {mobileNavItems.map((item) => {
            // Hide auth-required items if user is not logged in
            if (item.requiresAuth && !user) return null;
            
            const isActive = currentPath === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="mobile-nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {/* Authentication buttons for mobile */}
          {!user && (
            <>
              <Link to="/login" className="mobile-nav-item">
                <User className="mobile-nav-icon" />
                <span>Login</span>
              </Link>
              <Link to="/signup" className="mobile-nav-item">
                <User className="mobile-nav-icon" />
                <span>Sign Up</span>
              </Link>
            </>
          )}
        </nav>
      )}
    </div>
  );
};

export default Layout;
