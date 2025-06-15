
import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Home, LogIn, UserPlus } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left">
            <p className="text-muted-foreground text-sm">
              © 2024 PiccodeScript Registry. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
            
            <Link 
              to="/login" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span className="text-sm">Login</span>
            </Link>
            
            <Link 
              to="/signup" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-sm">Sign Up</span>
            </Link>
            
            <a 
              href="https://github.com/Glimmr-Lang/PiccodeScript"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="h-4 w-4" />
              <span className="text-sm">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
