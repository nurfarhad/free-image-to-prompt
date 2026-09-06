
import React from 'react';
import Tooltip from './Tooltip';

interface TextureSelectorProps {
  selectedTexture: string | null;
  onSelectTexture: (texture: string | null) => void;
  disabled?: boolean;
}

const textures = [
  "Plastic", "Glass", "Metal", "Wood", 
  "Leather", "Fabric", "Liquid", "Ceramic",
  "Matte", "Glossy", "Metallic", "Rough",
  "Translucent", "Holographic", "Carbon Fiber", "Knitted"
];

const TextureSelector: React.FC<TextureSelectorProps> = ({ selectedTexture, onSelectTexture, disabled }) => {
  return (
    <div className="w-full">
      <Tooltip content="Emphasize specific material properties or surface textures." position="top">
        <label className="block text-sm font-medium text-gray-300 mb-2 cursor-help w-max">Materials & Textures</label>
      </Tooltip>
      <div className="flex flex-wrap gap-2">
        {textures.map((texture) => (
          <button
            key={texture}
            onClick={() => onSelectTexture(selectedTexture === texture ? null : texture)}
            disabled={disabled}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200
              ${selectedTexture === texture
                ? 'bg-blue-900/40 border-blue-500 text-blue-200 shadow-sm ring-1 ring-blue-500/50'
                : 'bg-brand-dark border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {texture}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TextureSelector;
