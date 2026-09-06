
import React from 'react';
import Tooltip from './Tooltip';

interface ViewpointSelectorProps {
  onSelect: (view: string) => void;
  disabled: boolean;
}

const ViewpointSelector: React.FC<ViewpointSelectorProps> = ({ onSelect, disabled }) => {
  const handleViewClick = (view: string) => {
    if (!disabled) {
      onSelect(view);
    }
  };

  const ControlButton = ({ label, view, icon, className = '' }: { label: string, view: string, icon: React.ReactNode, className?: string }) => (
    <Tooltip content={label} position="left">
      <button
        type="button"
        onClick={() => handleViewClick(view)}
        disabled={disabled}
        className={`
          flex items-center justify-center rounded-md border transition-all duration-200 shadow-sm
          ${disabled 
            ? 'opacity-50 cursor-not-allowed bg-gray-800 border-gray-700 text-gray-500' 
            : 'bg-brand-surface border-gray-700 text-gray-400 hover:bg-brand-primary hover:border-brand-primary hover:text-white hover:shadow-lg hover:shadow-brand-primary/20 active:scale-95'
          }
          ${className}
        `}
      >
        {icon}
      </button>
    </Tooltip>
  );

  return (
    <div className="flex flex-col items-center gap-2 p-1 w-full">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center border-b border-gray-800 w-full pb-1.5">
        3D View
      </div>

      {/* Directional Pad */}
      <div className="grid grid-cols-3 gap-1">
        {/* Row 1 */}
        <div className="col-start-2">
            <ControlButton label="Top View" view="Top-down / Overhead" className="w-7 h-7" icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7" /></svg>
            } />
        </div>

        {/* Row 2 */}
        <div className="col-start-1 row-start-2">
            <ControlButton label="Left Profile" view="Left Side Profile" className="w-7 h-7" icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            } />
        </div>
        <div className="col-start-2 row-start-2">
            <ControlButton label="Front View" view="Front View" className="w-7 h-7 bg-gray-800/50" icon={
                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
            } />
        </div>
        <div className="col-start-3 row-start-2">
            <ControlButton label="Right Profile" view="Right Side Profile" className="w-7 h-7" icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            } />
        </div>

        {/* Row 3 */}
        <div className="col-start-2 row-start-3">
            <ControlButton label="Bottom View" view="Bottom-up / Low Angle" className="w-7 h-7" icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7-7-7" /></svg>
            } />
        </div>
      </div>

      <div className="w-full h-px bg-gray-800"></div>

      {/* Special Views */}
      <div className="flex flex-col gap-1.5 w-full px-1">
         <ControlButton label="Isometric View" view="Isometric View" className="w-full h-7 flex space-x-2" icon={
             <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                <span className="text-[8px] font-bold">ISO</span>
             </>
         } />
         
         <ControlButton label="Back View" view="Back View" className="w-full h-7" icon={
             <span className="text-[8px] font-bold">BACK</span>
         } />
      </div>
    </div>
  );
};

export default ViewpointSelector;
