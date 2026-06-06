import React from 'react';

export default function PlannerLogo({ size = 40, className = "" }) {
  return (
    <img 
      src="/logo.png" 
      alt="My Daily Planner Logo" 
      width={size} 
      height={size} 
      className={className}
      style={{ objectFit: 'contain', width: size, height: size }}
    />
  );
}
