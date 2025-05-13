
import React from 'react';

const LogoPT2030: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 bg-pt-green rounded flex items-center justify-center">
        <span className="text-white font-bold text-xs">PT</span>
      </div>
      <div className="flex flex-col">
        <span className="text-pt-blue font-bold text-sm leading-tight pt2030-logo-text">TURISMO</span>
        <span className="text-pt-green font-bold text-sm leading-tight pt2030-logo-text">PT2030</span>
      </div>
    </div>
  );
};

export default LogoPT2030;
