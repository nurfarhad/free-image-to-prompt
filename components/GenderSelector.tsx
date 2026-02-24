
import React from 'react';

interface GenderSelectorProps {
  selectedGender: 'male' | 'female' | 'non-binary' | null;
  onSelectGender: (gender: 'male' | 'female' | 'non-binary' | null) => void;
  disabled?: boolean;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ selectedGender, onSelectGender, disabled }) => {
  const options: { id: 'male' | 'female' | 'non-binary'; label: string }[] = [
    { id: 'male', label: '♂' },
    { id: 'female', label: '♀' },
    { id: 'non-binary', label: '⚧' }
  ];

  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Gender</label>
      <div className="flex bg-brand-dark rounded-md p-0.5 border border-gray-700 overflow-hidden h-9">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelectGender(selectedGender === opt.id ? null : opt.id)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center text-xs transition-all ${
              selectedGender === opt.id 
                ? 'bg-brand-primary text-white shadow-sm rounded-md font-bold' 
                : 'text-gray-500 hover:text-gray-300'
            } ${disabled ? 'opacity-50' : ''}`}
            title={opt.id.charAt(0).toUpperCase() + opt.id.slice(1)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenderSelector;
