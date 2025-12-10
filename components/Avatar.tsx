import React from 'react';

interface AvatarProps {
  url?: string;
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ url, name, color, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${className} rounded-full flex items-center justify-center font-bold text-white shadow-lg relative overflow-hidden shrink-0 border-2 border-white/10`}
      style={{ backgroundColor: color }}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{name.charAt(0).toUpperCase()}</span>
      )}
      
      {/* Gloss effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 pointer-events-none" />
    </div>
  );
};

export default Avatar;