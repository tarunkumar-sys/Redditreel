import React from 'react';

interface AppIconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function AppIcon({ size = 32, className, style }: AppIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect width="32" height="32" rx="8" fill="url(#grad-icon)"/>
      <path d="M8 22 L11 10 L16 18 L21 10 L24 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="16" cy="7" r="2" fill="white" fillOpacity="0.85"/>
      <defs>
        <linearGradient id="grad-icon" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff2d55"/>
          <stop offset="100%" stopColor="#cc0040"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
