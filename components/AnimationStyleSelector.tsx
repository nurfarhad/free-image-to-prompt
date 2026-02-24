
import React from 'react';
import Tooltip from './Tooltip';

interface AnimationStyleSelectorProps {
  selectedStyle: string | null;
  onSelectStyle: (style: string | null) => void;
  disabled?: boolean;
}

const styles = [
  { label: "Disney Style", group: "Studio" },
  { label: "Pixar Style", group: "Studio" },
  { label: "Studio Ghibli", group: "Studio" },
  { label: "Dreamworks", group: "Studio" },
  { label: "Claymation", group: "Tech" },
  { label: "Low Poly", group: "Tech" },
  { label: "Anime: Shonen", group: "Anime" },
  { label: "Anime: Shojo", group: "Anime" },
  { label: "Anime: Seinen", group: "Anime" },
  { label: "Anime: Chibi", group: "Anime" },
  { label: "Anime: Mecha", group: "Anime" },
  { label: "Anime: 90s Retro", group: "Anime" },
];

const AnimationStyleSelector: React.FC<AnimationStyleSelectorProps> = ({ selectedStyle, onSelectStyle, disabled }) => {
  return (
    <div className="w-full">
      <Tooltip content="Apply specific animation studio styles or anime sub-genres." position="top">
        <label className="block text-sm font-medium text-gray-300 mb-2 cursor-help w-max">Animation Style</label>
      </Tooltip>
      <div className="grid grid-cols-2 gap-2">
        {styles.map((item) => (
          <button
            key={item.label}
            onClick={() => onSelectStyle(selectedStyle === item.label ? null : item.label)}
            disabled={disabled}
            className={`
              px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 text-left flex justify-between items-center
              ${selectedStyle === item.label
                ? 'bg-purple-900/40 border-purple-500 text-purple-200 shadow-sm ring-1 ring-purple-500/50'
                : 'bg-brand-dark border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span>{item.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider ${
                selectedStyle === item.label ? 'bg-purple-500/20 text-purple-200' : 'bg-gray-800 text-gray-500'
            }`}>
                {item.group}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnimationStyleSelector;
