
import React from 'react';
import { APP_LOGO_SRC, APP_LOGO_ALT } from '../lib/branding';

interface FnpeLogoProps {
  size?: number;
  className?: string; // allow tailwind classes overrides
}

const FnpeLogo: React.FC<FnpeLogoProps> = ({ size, className = "h-10 w-auto" }) => {
  return (
    <img
      src={APP_LOGO_SRC}
      alt={APP_LOGO_ALT}
      className={`object-contain ${className}`}
      style={size ? { height: size, width: 'auto' } : undefined}
    />
  );
};

export default FnpeLogo;
