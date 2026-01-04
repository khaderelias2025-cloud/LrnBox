import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', theme = 'light' }) => {
  const isDark = theme === 'dark';
  
  const sizeMap = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64
  };
  const dim = sizeMap[size];
  const color = isDark ? '#ffffff' : '#4f46e5'; 

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <g stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
           {/* Outer Hexagon */}
           <path d="M50 5 L93 30 V80 L50 105 L7 80 V30 L50 5 Z" />
           {/* Y shape (Internal edges) */}
           <path d="M50 55 L50 105" />
           <path d="M50 55 L7 30" />
           <path d="M50 55 L93 30" />
        </g>

        {/* Text on faces with Isometric Perspective */}
        <g 
          fill={color} 
          style={{ 
            fontWeight: '800', 
            fontFamily: 'Inter, sans-serif', 
            pointerEvents: 'none',
            userSelect: 'none'
          }} 
          textAnchor="middle" 
          dominantBaseline="middle"
        >
             {/* Top Face: L - Flattened and rotated to match top plane */}
             <g transform="translate(50, 30) scale(1, 0.58) rotate(-45)">
                <text fontSize="48" dy=".1em">L</text>
             </g>
             
             {/* Left Face: R - Skewed Y +30deg to align with left plane */}
             <g transform="translate(28.5, 67.5) skewY(30)">
                <text fontSize="48" dy=".1em">R</text>
             </g>

             {/* Right Face: N - Skewed Y -30deg to align with right plane */}
             <g transform="translate(71.5, 67.5) skewY(-30)">
                <text fontSize="48" dy=".1em">N</text>
             </g>
        </g>
      </svg>
    </div>
  );
};

export default Logo;