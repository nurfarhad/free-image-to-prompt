import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TooltipProps {
  content?: string;
  text?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content, text, children, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const displayContent = text || content || '';

  return (
    <div 
      className={cn("relative flex items-center", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && displayContent && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 2 : position === 'bottom' ? -2 : 0, x: position === 'left' ? 2 : position === 'right' ? -2 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            className={cn(
              "absolute z-[100] px-3 py-1.5 text-[10px] font-bold text-zinc-100 bg-zinc-900 rounded-lg shadow-2xl whitespace-nowrap border border-white/10 pointer-events-none uppercase tracking-widest",
              position === 'top' && "bottom-full mb-3 left-1/2 transform -translate-x-1/2",
              position === 'bottom' && "top-full mt-3 left-1/2 transform -translate-x-1/2",
              position === 'left' && "right-full mr-3 top-1/2 transform -translate-y-1/2",
              position === 'right' && "left-full ml-3 top-1/2 transform -translate-y-1/2"
            )}
          >
            {displayContent}
            <div className={cn(
              "absolute w-1.5 h-1.5 bg-zinc-900 transform rotate-45 border-white/10",
              position === 'top' && "-bottom-1 left-1/2 -translate-x-1/2 border-b border-r",
              position === 'bottom' && "-top-1 left-1/2 -translate-x-1/2 border-t border-l",
              position === 'left' && "-right-1 top-1/2 -translate-y-1/2 border-t border-r",
              position === 'right' && "-left-1 top-1/2 -translate-y-1/2 border-b border-l"
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tooltip;
