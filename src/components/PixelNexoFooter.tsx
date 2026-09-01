import React from 'react';

export const PixelNexoFooter: React.FC = () => {
  return (
    <div
      id="pixel-nexo-badge-pill-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '16px 0 20px 0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <a
        id="pixel-nexo-badge-pill"
        href="https://www.pixelnexo.com.br"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 18px',
          backgroundColor: '#2B0843',
          color: '#FFFFFF',
          border: '1px solid #581C87',
          borderRadius: '9999px',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
          transition: 'all 0.25s ease',
          boxShadow: '0 2px 8px rgba(43, 8, 67, 0.15)',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.03)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(43, 8, 67, 0.15)';
        }}
      >
        <span style={{ color: '#C4B5FD', fontWeight: 400 }}>Desenvolvimento Digital</span>
        <svg
          style={{ height: '22px', width: 'auto', verticalAlign: 'middle' }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 150 36"
          width="150"
          height="36"
          fill="none"
        >
          {/* Pixel Nexo Emblem */}
          <g transform="translate(2, 4)">
            <path
              d="M14 2L24 7.77V19.33L14 25.1L4 19.33V7.77L14 2Z"
              stroke="#FFD000"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
            <circle cx="14" cy="13.5" r="3" fill="#FFD000" />
            <path
              d="M14 5V10M14 17V22M6.5 9.5L11 12M17 15L21.5 17.5M6.5 17.5L11 15M17 12L21.5 9.5"
              stroke="#FFD000"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <rect x="28" y="5" width="4" height="4" rx="0.8" fill="#FFD000" />
            <rect x="34" y="5" width="4" height="4" rx="0.8" fill="#FFD000" />
            <rect x="40" y="5" width="4" height="4" rx="0.8" fill="#FFD000" />
            <rect x="28" y="11" width="4" height="4" rx="0.8" fill="#FFD000" opacity="0.9" />
            <rect x="34" y="11" width="4" height="4" rx="0.8" fill="#FFD000" />
            <rect x="40" y="11" width="4" height="4" rx="0.8" fill="#FFD000" opacity="0.5" />
            <rect x="28" y="17" width="4" height="4" rx="0.8" fill="#FFD000" opacity="0.7" />
            <rect x="34" y="17" width="4" height="4" rx="0.8" fill="#FFD000" opacity="0.8" />
            <rect x="40" y="17" width="4" height="4" rx="0.8" fill="#FFD000" />
          </g>
          {/* Typography */}
          <text
            x="56"
            y="16"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="800"
            fontSize="11"
            letterSpacing="2.2"
          >
            PIXEL
          </text>
          <text
            x="56"
            y="28"
            fill="#FFD000"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontWeight="900"
            fontSize="13"
            letterSpacing="1.8"
          >
            NEXO
          </text>
        </svg>
        <span style={{ color: '#FFD000', fontSize: '14px' }}>↗</span>
      </a>
    </div>
  );
};
