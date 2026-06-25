import React, { useState } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'white' | 'colored';
}

export default function Logo({ size = 48, className = '', variant = 'colored' }: LogoProps) {
  const [useFallback, setUseFallback] = useState(false);
  const isWhite = variant === 'white';
  
  if (!useFallback) {
    const src = isWhite ? '/backgroundwhitelogo.png' : '/logo.png';
    return (
      <img
        src={src}
        alt="LafiaPay Logo"
        width={size}
        height={size}
        className={className}
        onError={() => setUseFallback(true)}
        style={{ display: 'block', objectFit: 'contain', borderRadius: '20%' }}
      />
    );
  }

  // Fallback to high-quality SVG Wallet
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      {/* Background Wallet shape */}
      <rect x="15" y="25" width="70" height="55" rx="16" fill={isWhite ? 'rgba(255, 255, 255, 0.15)' : '#0E7055'} />
      
      {/* Top flap */}
      <path d="M15 37C15 28.1634 22.1634 21 31 21H69C77.8366 21 85 28.1634 85 37V42H15V37Z" fill={isWhite ? 'rgba(255, 255, 255, 0.1)' : '#0A523E'} />
      
      {/* Top flap card accent */}
      <rect x="62" y="27" width="12" height="8" rx="2" fill="#D4A017" />
      
      {/* Intertwined infinity symbol in the middle */}
      <path
        d="M30 55C30 49.4772 34.4772 45 40 45C44.1421 45 47.6863 47.518 49.1623 51.109C50.8377 55.109 54.1421 58 59 58C64.5228 58 69 53.5228 69 48C69 42.4772 64.5228 38 59 38C54.1421 38 50.8377 40.891 49.1623 54.891C47.6863 58.482 44.1421 61 40 61C34.4772 61 30 56.5228 30 51"
        stroke="#D4A017"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M69 52C69 57.5228 64.5228 62 59 62C54.8579 62 51.3137 59.482 49.8377 55.891C48.1623 51.891 44.8579 49 40 49C34.4772 49 30 53.4772 30 59"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
