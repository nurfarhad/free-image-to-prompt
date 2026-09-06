
import React from 'react';
import Tooltip from './Tooltip';

interface LightingSelectorProps {
  selectedLighting: string | null;
  onSelectLighting: (lighting: string | null) => void;
  disabled?: boolean;
}

const lightingOptions = [
  { 
    id: 'Cinematic', 
    label: 'Cinematic', 
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /> 
  },
  { 
    id: 'Studio', 
    label: 'Studio', 
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /> 
  },
  { 
    id: 'Golden Hour', 
    label: 'Golden Hour', 
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> 
  },
  { 
    id: 'Daylight', 
    label: 'Daylight', 
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /> 
  },
  { 
    id: 'Neon', 
    label: 'Neon', 
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /> 
  },
  { 
    id: 'Night', 
    label: 'Night', 
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /> 
  },
];

const LightingSelector: React.FC<LightingSelectorProps> = ({ selectedLighting, onSelectLighting, disabled }) => {
  return (
    <div className="w-full">
      <Tooltip content="Sets the atmospheric lighting condition for the prompt." position="top">
         <label className="block text-sm font-medium text-gray-300 mb-2 cursor-help w-max">Lighting</label>
      </Tooltip>
      <div className="grid grid-cols-3 gap-2">
        {lightingOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelectLighting(selectedLighting === opt.id ? null : opt.id)}
            disabled={disabled}
            className={`
              flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all duration-200 h-16
              ${selectedLighting === opt.id 
                ? 'bg-brand-secondary/20 border-brand-secondary text-brand-secondary shadow-md ring-1 ring-brand-secondary/50' 
                : 'bg-brand-gray border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={opt.label}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {opt.icon}
            </svg>
            <span className="text-[10px] font-medium">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LightingSelector;
