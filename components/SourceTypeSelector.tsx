
import React from 'react';

interface SourceTypeSelectorProps {
  selectedType: string | null;
  onSelectType: (type: string | null) => void;
  disabled?: boolean;
}

const types = [
  "Photograph", "Illustration", "3D Render", "Digital Art", "Anime", "Painting", "Sketch"
];

const SourceTypeSelector: React.FC<SourceTypeSelectorProps> = ({ selectedType, onSelectType, disabled }) => {
  return (
    <div className="w-full mb-3">
        <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Source Image Type</label>
            {selectedType && (
                <button 
                onClick={() => onSelectType(null)}
                className="text-[9px] text-red-400 hover:text-red-300 transition-colors"
                >
                CLEAR
                </button>
            )}
        </div>
      <div className="flex flex-wrap gap-1.5">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onSelectType(selectedType === type ? null : type)}
            disabled={disabled}
            className={`
              px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-md border transition-all duration-200
              ${selectedType === type
                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                : 'bg-brand-dark border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SourceTypeSelector;
