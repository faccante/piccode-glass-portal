
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Package, LogOut, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="glass-card m-4 rounded-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold gradient-text">PiccodeScript Registry</span>
            </Link>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-muted-foreground">Welcome, {user.email}</span>
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm" className="glass-button">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/account">
                    <Button variant="ghost" size="sm" className="glass-button">
                      <Settings className="h-4 w-4 mr-2" />
                      Account
                    </Button>
                  </Link>
                  <Button onClick={handleLogout} variant="ghost" size="sm" className="glass-button">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="glass-button">
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button size="sm" className="bg-primary/20 hover:bg-primary/30 border border-primary/50">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
