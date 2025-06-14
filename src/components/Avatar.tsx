
import React from 'react';
import { Avatar as UIAvatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AvatarProps {
  src?: string | null;
  username?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PatternAvatar: React.FC<{ username: string; size: string }> = ({ username, size }) => {
  // Generate a consistent pattern based on username
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash) % 360;
  const saturation = 50 + (Math.abs(hash * 2) % 30); // 50-80%
  const lightness = 40 + (Math.abs(hash * 3) % 20); // 40-60%
  
  const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  const pattern = Math.abs(hash) % 5; // 5 different patterns
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  
  const patternSize = {
    sm: 4,
    md: 5,
    lg: 8,
    xl: 12
  };
  
  return (
    <div 
      className={`${sizeClasses[size as keyof typeof sizeClasses]} rounded-full flex items-center justify-center relative overflow-hidden`}
      style={{ backgroundColor }}
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        className="absolute inset-0"
      >
        {pattern === 0 && (
          // Diagonal stripes
          <defs>
            <pattern id={`stripes-${username}`} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
              <rect width="5" height="10" fill="rgba(255,255,255,0.2)" />
            </pattern>
          </defs>
        )}
        {pattern === 1 && (
          // Dots
          <defs>
            <pattern id={`dots-${username}`} patternUnits="userSpaceOnUse" width="20" height="20">
              <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.3)" />
            </pattern>
          </defs>
        )}
        {pattern === 2 && (
          // Triangles
          <defs>
            <pattern id={`triangles-${username}`} patternUnits="userSpaceOnUse" width="20" height="20">
              <polygon points="10,2 18,16 2,16" fill="rgba(255,255,255,0.2)" />
            </pattern>
          </defs>
        )}
        {pattern === 3 && (
          // Waves
          <defs>
            <pattern id={`waves-${username}`} patternUnits="userSpaceOnUse" width="40" height="20">
              <path d="M0,10 Q10,0 20,10 T40,10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
            </pattern>
          </defs>
        )}
        {pattern === 4 && (
          // Hexagons
          <defs>
            <pattern id={`hexagons-${username}`} patternUnits="userSpaceOnUse" width="24" height="24">
              <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </pattern>
          </defs>
        )}
        
        <rect 
          width="100%" 
          height="100%" 
          fill={`url(#${['stripes', 'dots', 'triangles', 'waves', 'hexagons'][pattern]}-${username})`} 
        />
      </svg>
      
      <span className="relative z-10 text-white font-semibold text-xs uppercase">
        {username.slice(0, 2)}
      </span>
    </div>
  );
};

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  username = 'User', 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  if (src) {
    return (
      <UIAvatar className={`${sizeClasses[size]} ${className}`}>
        <AvatarImage src={src} alt={username} />
        <AvatarFallback>
          <PatternAvatar username={username} size={size} />
        </AvatarFallback>
      </UIAvatar>
    );
  }

  return <PatternAvatar username={username} size={size} />;
};

export default Avatar;
