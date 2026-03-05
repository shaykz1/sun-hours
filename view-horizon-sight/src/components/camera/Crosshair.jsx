import React from "react";

export default function Crosshair() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
        {/* Outer circle */}
        <circle cx="60" cy="60" r="48" stroke="hsl(160, 80%, 50%)" strokeWidth="1" opacity="0.4" />
        
        {/* Inner circle */}
        <circle cx="60" cy="60" r="24" stroke="hsl(160, 80%, 50%)" strokeWidth="1" opacity="0.6" />
        
        {/* Center dot */}
        <circle cx="60" cy="60" r="3" fill="hsl(160, 80%, 50%)" opacity="0.9" />
        
        {/* Cross lines with gaps */}
        {/* Top */}
        <line x1="60" y1="2" x2="60" y2="32" stroke="hsl(160, 80%, 50%)" strokeWidth="1.5" opacity="0.7" />
        {/* Bottom */}
        <line x1="60" y1="88" x2="60" y2="118" stroke="hsl(160, 80%, 50%)" strokeWidth="1.5" opacity="0.7" />
        {/* Left */}
        <line x1="2" y1="60" x2="32" y2="60" stroke="hsl(160, 80%, 50%)" strokeWidth="1.5" opacity="0.7" />
        {/* Right */}
        <line x1="88" y1="60" x2="118" y2="60" stroke="hsl(160, 80%, 50%)" strokeWidth="1.5" opacity="0.7" />
        
        {/* Tick marks on outer circle */}
        <line x1="60" y1="8" x2="60" y2="14" stroke="hsl(160, 80%, 50%)" strokeWidth="2" opacity="0.5" />
        <line x1="60" y1="106" x2="60" y2="112" stroke="hsl(160, 80%, 50%)" strokeWidth="2" opacity="0.5" />
        <line x1="8" y1="60" x2="14" y2="60" stroke="hsl(160, 80%, 50%)" strokeWidth="2" opacity="0.5" />
        <line x1="106" y1="60" x2="112" y2="60" stroke="hsl(160, 80%, 50%)" strokeWidth="2" opacity="0.5" />
      </svg>
    </div>
  );
}