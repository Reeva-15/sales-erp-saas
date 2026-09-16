import React from 'react';

interface LogoProps {
  className?: string;
  collapsed?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = 'h-9', collapsed = false, light = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Minimal Geometric Connected-Flow "M" Symbol */}
      <svg className="h-8 w-8 flex-shrink-0" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill={light ? '#FFFFFF' : '#4A1525'} />
        {/* Interconnected growth node path forming stylized 'M' */}
        <path
          d="M10 28V14L18 23L22 19L30 28V14"
          stroke={light ? '#4A1525' : '#FFFFFF'}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="30" cy="14" r="2.5" fill={light ? '#943854' : '#E8B6C2'} />
        <circle cx="10" cy="28" r="2.5" fill={light ? '#943854' : '#E8B6C2'} />
      </svg>

      {!collapsed && (
        <div className="flex flex-col">
          <span className={`font-extrabold text-lg tracking-wider leading-none ${light ? 'text-white' : 'text-marron-800'}`}>
            MARRONEX
          </span>
          <span className={`text-[10px] font-medium tracking-widest uppercase mt-1 ${light ? 'text-marron-200' : 'text-marron-600'}`}>
            Sales ERP
          </span>
        </div>
      )}
    </div>
  );
};
