
import React from 'react';
import Tooltip from './Tooltip';

interface DetailTogglesProps {
  details: {
    lighting: boolean;
    mood: boolean;
    background: boolean;
    colors: boolean;
  };
  onChange: (key: keyof DetailTogglesProps['details']) => void;
  disabled?: boolean;
}

const DetailToggles: React.FC<DetailTogglesProps> = ({ details, onChange, disabled }) => {
  const toggleItems = [
    { key: 'lighting', label: 'Lighting' },
    { key: 'mood', label: 'Mood' },
    { key: 'background', label: 'Background' },
    { key: 'colors', label: 'Palette' },
  ] as const;

  return (
    <div className="w-full">
      <Tooltip content="Toggle to include or exclude specific details from the generated prompt." position="top">
        <label className="block text-sm font-medium text-gray-300 mb-2 cursor-help w-max">Include Details</label>
      </Tooltip>
      <div className="flex flex-wrap gap-2">
        {toggleItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            disabled={disabled}
            className={`
              inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
              ${details[item.key]
                ? 'bg-brand-primary/10 border-brand-primary text-brand-primary hover:bg-brand-primary/20'
                : 'bg-brand-dark border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${details[item.key] ? 'bg-brand-primary' : 'bg-gray-600'}`}></span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DetailToggles;
