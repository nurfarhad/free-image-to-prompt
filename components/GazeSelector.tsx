
import React from 'react';
import Tooltip from './Tooltip';

interface GazeSelectorProps {
  onSelect: (gaze: string) => void;
  disabled: boolean;
}

const GazeSelector: React.FC<GazeSelectorProps> = ({ onSelect, disabled }) => {
  const handleGazeClick = (gaze: string) => {
    if (!disabled) {
      onSelect(gaze);
    }
  };

  const ControlButton = ({ label, gaze, icon, className = '' }: { label: string, gaze: string, icon: React.ReactNode, className?: string }) => (
    <Tooltip content={label} position="top">
      <button
        type="button"
        onClick={() => handleGazeClick(gaze)}
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

  // SVG Icons for eyes looking in directions
  const EyeIcon = ({ transform = '' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" transform={transform} />
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-2 p-2 w-full h-full">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center border-b border-gray-800 w-full pb-2">
        Eye Gaze
      </div>

      <div className="grid grid-cols-3 gap-1 mt-auto mb-auto">
        {/* Up */}
        <div className="col-start-2">
            <ControlButton label="Look Up" gaze="looking up" className="w-8 h-8" icon={<EyeIcon transform="translate(0, -1.5)" />} />
        </div>

        {/* Left */}
        <div className="col-start-1 row-start-2">
            <ControlButton label="Look Left" gaze="looking left" className="w-8 h-8" icon={<EyeIcon transform="translate(-1.5, 0)" />} />
        </div>
        
        {/* Center / Camera */}
        <div className="col-start-2 row-start-2">
            <ControlButton label="Look at Camera" gaze="looking directly at the camera" className="w-8 h-8 bg-brand-primary/10 border-brand-primary/30 text-brand-primary" icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            } />
        </div>

        {/* Right */}
        <div className="col-start-3 row-start-2">
             <ControlButton label="Look Right" gaze="looking right" className="w-8 h-8" icon={<EyeIcon transform="translate(1.5, 0)" />} />
        </div>

        {/* Down */}
        <div className="col-start-2 row-start-3">
             <ControlButton label="Look Down" gaze="looking down" className="w-8 h-8" icon={<EyeIcon transform="translate(0, 1.5)" />} />
        </div>
      </div>

       <div className="w-full h-px bg-gray-800 my-1"></div>
       
       <ControlButton label="Look Away / Candid" gaze="looking away from camera" className="w-full h-8" icon={
            <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold">CANDID</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
            </div>
       } />

    </div>
  );
};

export default GazeSelector;
