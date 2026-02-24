import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className={`relative flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-xl whitespace-nowrap border border-gray-700 pointer-events-none transition-opacity duration-200
          ${position === 'top' ? '-top-10 left-1/2 transform -translate-x-1/2' : ''}
          ${position === 'bottom' ? 'top-full mt-2 left-1/2 transform -translate-x-1/2' : ''}
          ${position === 'left' ? 'right-full mr-2 top-1/2 transform -translate-y-1/2' : ''}
          ${position === 'right' ? 'left-full ml-2 top-1/2 transform -translate-y-1/2' : ''}
        `}>
          {content}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 border-gray-700
            ${position === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2 border-b border-r' : ''} 
            ${position === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2 border-t border-l' : ''}
            ${position === 'left' ? '-right-1 top-1/2 -translate-y-1/2 border-t border-r' : ''}
            ${position === 'right' ? '-left-1 top-1/2 -translate-y-1/2 border-b border-l' : ''}
          `}></div> 
        </div>
      )}
    </div>
  );
};

export default Tooltip;