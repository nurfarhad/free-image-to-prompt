
import React from 'react';

interface ThemeSelectorProps {
  selectedMode: 'light' | 'dark' | null;
  onSelectMode: (mode: 'light' | 'dark' | null) => void;
  disabled?: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ selectedMode, onSelectMode, disabled }) => {
  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Theme Mode</label>
      <div className="flex bg-brand-dark rounded-md p-0.5 border border-gray-700 overflow-hidden h-9">
        <button
          onClick={() => onSelectMode(selectedMode === 'light' ? null : 'light')}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center transition-all ${
            selectedMode === 'light' 
              ? 'bg-yellow-500 text-brand-dark shadow-sm rounded-md font-bold' 
              : 'text-gray-500 hover:text-gray-300'
          } ${disabled ? 'opacity-50' : ''}`}
          title="Light Mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
        <button
          onClick={() => onSelectMode(selectedMode === 'dark' ? null : 'dark')}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center transition-all ${
            selectedMode === 'dark' 
              ? 'bg-indigo-600 text-white shadow-sm rounded-md font-bold' 
              : 'text-gray-500 hover:text-gray-300'
          } ${disabled ? 'opacity-50' : ''}`}
          title="Dark Mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;
