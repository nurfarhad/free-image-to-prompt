
import React from 'react';
import Tooltip from './Tooltip';

interface StyleSelectorProps {
  selectedStyle: string | null;
  onSelectStyle: (style: string | null) => void;
  disabled?: boolean;
}

const styles = [
  // Photography Styles
  "Portrait Photography", 
  "Landscape Photography", 
  "Street Photography", 
  "Product Photography",
  "Architectural Photography",
  "Fashion Photography",
  "Macro Photography",
  "Wildlife Photography",
  // Artistic Styles
  "Illustration", 
  "3D Render", 
  "Flat Vector",
  "Oil Painting", 
  "Pixel Art", 
  "Anime",
  "Watercolor",
  "Cyberpunk"
];

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelectStyle, disabled }) => {
  return (
    <div className="w-full">
      <Tooltip content="Defines the artistic medium or visual style of the generated prompt." position="top">
        <label className="block text-sm font-medium text-gray-300 mb-2 cursor-help w-max">Visual Style</label>
      </Tooltip>
      <div className="flex flex-wrap gap-2">
        {styles.map((style) => (
          <button
            key={style}
            onClick={() => onSelectStyle(selectedStyle === style ? null : style)}
            disabled={disabled}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 whitespace-nowrap
              ${selectedStyle === style
                ? 'bg-brand-secondary/20 border-brand-secondary text-brand-secondary shadow-sm hover:bg-brand-secondary/30'
                : 'bg-brand-dark border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
