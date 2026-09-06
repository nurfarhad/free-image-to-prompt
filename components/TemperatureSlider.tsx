
import React from 'react';
import Tooltip from './Tooltip';

interface TemperatureSliderProps {
  value: number; // 0 to 100, default 50
  onChange: (value: number) => void;
  disabled?: boolean;
}

const TemperatureSlider: React.FC<TemperatureSliderProps> = ({ value, onChange, disabled }) => {
  const getLabel = () => {
    if (value < 40) return 'Cool';
    if (value > 60) return 'Warm';
    return 'Neutral (Reference)';
  };

  const getLabelColor = () => {
    if (value < 40) return 'text-blue-400';
    if (value > 60) return 'text-orange-400';
    return 'text-gray-400';
  };

  const isModified = value !== 50;

  return (
    <div className="w-full">
        <div className="flex justify-between items-center mb-2">
            <Tooltip content="Adjusts the color temperature (Warm vs Cool). Default (middle) uses the image's original temperature." position="top">
                <label className="block text-sm font-medium text-gray-300 cursor-help w-max">Temperature</label>
            </Tooltip>
            <div className="flex items-center gap-2">
                {isModified && (
                    <button 
                        onClick={() => onChange(50)}
                        disabled={disabled}
                        className="text-[9px] text-red-400 hover:text-red-300 uppercase tracking-wider font-bold transition-colors"
                    >
                        Reset
                    </button>
                )}
                <span className={`text-xs font-medium transition-colors ${getLabelColor()}`}>
                    {getLabel()}
                </span>
            </div>
        </div>
      
      <div className="relative h-6 flex items-center">
        {/* Track Background Gradient */}
        <div className="absolute w-full h-1.5 rounded-full bg-gradient-to-r from-blue-600 via-gray-500 to-orange-600 opacity-60"></div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-transparent appearance-none cursor-pointer z-10 
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-none [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none
            focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        {/* Center Marker */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-gray-300 pointer-events-none opacity-80"></div>
      </div>
    </div>
  );
};

export default TemperatureSlider;
