
import React from 'react';
import Tooltip from './Tooltip';

interface AspectRatioSelectorProps {
  selectedRatio: string | null;
  onSelectRatio: (ratio: string | null) => void;
  disabled?: boolean;
}

const ratios = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9"];

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onSelectRatio, disabled }) => {
  const handleClick = (ratio: string) => {
    if (selectedRatio === ratio) {
        onSelectRatio(null);
    } else {
        onSelectRatio(ratio);
    }
  };

  return (
    <div className="w-full">
      <Tooltip content="Defines the target composition dimensions for the generated prompt." position="top">
         <label className="block text-sm font-medium text-gray-300 mb-2 cursor-help w-max">Aspect Ratio</label>
      </Tooltip>
      <div className="grid grid-cols-4 gap-2">
        {ratios.map((ratio) => (
          <button
            key={ratio}
            onClick={() => handleClick(ratio)}
            disabled={disabled}
            className={`
              px-2 py-2 text-sm font-medium rounded-md border transition-all duration-200
              ${selectedRatio === ratio 
                ? 'bg-brand-primary border-brand-primary text-white shadow-md transform scale-105' 
                : 'bg-brand-gray border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {ratio}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;
