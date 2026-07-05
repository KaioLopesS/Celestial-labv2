import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  vertical?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 40, 
  showText = true,
  vertical = false 
}) => {
  const [imageError, setImageError] = useState(false);

  // ------------------------------------------------
  // Fallback SVG (Only shown if image fails)
  // ------------------------------------------------
  const FallbackLogo = () => (
    <div className={`flex ${vertical ? 'flex-col text-center' : 'flex-row text-left'} items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]"
        >
           <defs>
            <linearGradient id="logoGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E0E7FF" />
              <stop offset="50%" stopColor="#4B5EAA" />
              <stop offset="100%" stopColor="#00F0FF" />
            </linearGradient>
          </defs>
          {/* Simple stylized planet fallback */}
          <circle cx="50" cy="50" r="35" stroke="url(#logoGradient)" strokeWidth="2" fill="none" />
          <ellipse cx="50" cy="50" rx="48" ry="12" stroke="url(#logoGradient)" strokeWidth="2" fill="none" transform="rotate(-15 50 50)" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col select-none">
          <span className={`font-serif tracking-[0.15em] leading-none text-white font-bold ${vertical ? 'text-2xl mt-4' : 'text-lg'}`}>
            CELESTIAL
          </span>
          <span className={`font-sans tracking-[0.3em] leading-none text-celestial-accent ${vertical ? 'text-sm mt-2' : 'text-[10px] mt-1'}`}>
            EQUATIONS
          </span>
        </div>
      )}
    </div>
  );

  // ------------------------------------------------
  // Main Render: Prioritizes logo.png
  // ------------------------------------------------
  if (!imageError) {
    return (
      <div className={`${className} flex ${vertical ? 'flex-col' : 'flex-row'} items-center justify-center select-none gap-4`}>
        <img 
          src="/logo.png" 
          alt="Celestial Equations" 
          style={{ 
            height: size, 
            width: 'auto', 
            maxWidth: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.3))'
          }}
          onError={() => setImageError(true)}
        />
        {/* If using the PNG, we assume the text is part of the design or we don't render separate text 
            unless explicitly requested for a header layout where the logo might be just the icon. 
            However, based on the user prompt, the PNG is likely the full logo. 
            If showText is true AND it's vertical (Hero), we hide text to let image speak. 
            If it's navbar (horizontal), we might want text if the logo is just an icon. 
            For now, we just render the image as requested.
        */}
      </div>
    );
  }

  return <FallbackLogo />;
};