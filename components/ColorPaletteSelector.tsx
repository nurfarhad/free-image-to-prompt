
import React from 'react';
import Tooltip from './Tooltip';

interface ColorPaletteSelectorProps {
  selectedPalette: string | null;
  onSelectPalette: (palette: string | null) => void;
  disabled?: boolean;
}

const palettes = [
  { id: 'Vibrant', label: 'Vibrant', classes: 'bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500' },
  { id: 'Pastel', label: 'Pastel', classes: 'bg-gradient-to-r from-pink-200 via-yellow-200 to-blue-200' },
  { id: 'Earth Tones', label: 'Earth', classes: 'bg-gradient-to-r from-amber-800 via-green-800 to-stone-600' },
  { id: 'Cyberpunk', label: 'Neon', classes: 'bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-400' },
  { id: 'Black & White', label: 'B&W', classes: 'bg-gradient-to-r from-gray-900 via-gray-500 to-gray-100' },
  { id: 'Warm', label: 'Warm', classes: 'bg-gradient-to-r from-orange-500 via-red-500 to-rose-600' },
  { id: 'Cool', label: 'Cool', classes: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400' },
  { id: 'Muted', label: 'Muted', classes: 'bg-gradient-to-r from-slate-400 via-gray-400 to-zinc-400' },
];

const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({ selectedPalette, onSelectPalette, disabled }) => {
  return (
    <div className="w-full">
      <Tooltip content="Sets the dominant color scheme or palette for the image." position="top">
        <label className="block text-sm font-medium text-gray-300 mb-2 cursor-help w-max">Color Palette</label>
      </Tooltip>
      <div className="grid grid-cols-4 gap-2">
        {palettes.map((palette) => (
          <button
            key={palette.id}
            onClick={() => onSelectPalette(selectedPalette === palette.id ? null : palette.id)}
            disabled={disabled}
            className={`
              relative flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 overflow-hidden group
              ${selectedPalette === palette.id
                ? 'border-brand-primary ring-1 ring-brand-primary shadow-lg bg-brand-surface'
                : 'border-gray-700 bg-brand-dark hover:border-gray-500'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={palette.label}
          >
            {/* Gradient Preview */}
            <div className={`w-full h-6 rounded-md mb-2 ${palette.classes} shadow-inner`}></div>
            
            <span className={`text-[10px] font-medium transition-colors ${selectedPalette === palette.id ? 'text-brand-primary' : 'text-gray-400 group-hover:text-gray-200'}`}>
                {palette.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ColorPaletteSelector;
