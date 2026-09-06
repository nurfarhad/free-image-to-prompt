
import React from 'react';
import Tooltip from './Tooltip';

interface CameraAngleSelectorProps {
  selectedAngle: string | null;
  onSelectAngle: (angle: string | null) => void;
  disabled?: boolean;
}

const angles = [
  { id: 'Eye Level', label: 'Eye Level', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> },
  { id: 'Low Angle', label: 'Low Angle', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /> },
  { id: 'High Angle', label: 'High Angle', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /> },
  { id: 'Overhead', label: 'Overhead', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h16v16H4V4z M12 12m-3 0a3 3 0 106 0a3 3 0 10-6 0" /> },
  { id: 'Macro', label: 'Macro', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" /> },
  { id: 'Wide Angle', label: 'Wide Angle', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /> },
];

const CameraAngleSelector: React.FC<CameraAngleSelectorProps> = ({ selectedAngle, onSelectAngle, disabled }) => {
  return (
    <div className="w-full">
      <Tooltip content="Forces the prompt to describe the scene from this specific perspective." position="top">
         <label className="block text-sm font-medium text-gray-300 mb-2 cursor-help w-max">Camera Angle</label>
      </Tooltip>
      <div className="grid grid-cols-3 gap-2">
        {angles.map((angle) => (
          <button
            key={angle.id}
            onClick={() => onSelectAngle(selectedAngle === angle.id ? null : angle.id)}
            disabled={disabled}
            className={`
              flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 h-20
              ${selectedAngle === angle.id 
                ? 'bg-brand-secondary/20 border-brand-secondary text-brand-secondary shadow-md ring-1 ring-brand-secondary/50' 
                : 'bg-brand-gray border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={angle.label}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {angle.icon}
            </svg>
            <span className="text-[10px] font-medium">{angle.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CameraAngleSelector;
