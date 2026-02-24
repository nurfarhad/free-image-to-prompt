
import React, { useState } from 'react';
import { ModelPreset } from '../services/geminiService';
import Tooltip from './Tooltip';

interface ModelSelectorProps {
  selectedPreset: ModelPreset;
  onSelectPreset: (preset: ModelPreset) => void;
  disabled?: boolean;
}

type TabType = 'image' | 'creative' | 'utility';

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedPreset, onSelectPreset, disabled }) => {
  const [activeTab, setActiveTab] = useState<TabType>('image');

  // Helper to sync tab with external selection if it changes (optional but good practice)
  // For now, we rely on user clicking tabs.

  const tabs: { id: TabType; label: string }[] = [
      { id: 'image', label: 'Image Gen' },
      { id: 'creative', label: 'Creative & 3D' },
      { id: 'utility', label: 'Training' }
  ];

  const presets: Record<TabType, { id: ModelPreset; label: string; desc: string }[]> = {
    image: [
        { id: 'standard', label: 'Standard', desc: 'Balanced, descriptive paragraph.' },
        { id: 'midjourney', label: 'Midjourney v6', desc: 'Artistic prose, texture-focused, --v 6.' },
        { id: 'dall-e-3', label: 'DALL-E 3', desc: 'Natural language, high prompt adherence.' },
        { id: 'flux', label: 'Flux.1', desc: 'Natural language, highly descriptive, accurate.' },
        { id: 'stable-diffusion', label: 'SDXL', desc: 'Tag-heavy, comma-separated keywords.' },
        { id: 'firefly', label: 'Firefly', desc: 'Photorealistic, commercial lighting & composition.' },
        { id: 'playground-v3', label: 'Playground v3', desc: 'Vibrant, artistic, balanced details.' },
        { id: 'ideogram', label: 'Ideogram', desc: 'Typography and layout aware prompting.' },
    ],
    creative: [
        { id: 'story-script', label: 'Story Script', desc: 'Generates a screenplay scene with dialogue.' },
        { id: '3d-asset', label: '3D Engine', desc: 'Technical specs for Blender/Unreal (Mesh, Materials).' },
    ],
    utility: [
        { id: 'lora-caption', label: 'LoRA Caption', desc: 'Strict, objective tagging for model fine-tuning.' },
    ]
  };

  const handleTabClick = (tab: TabType) => {
      setActiveTab(tab);
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center">
        <Tooltip content="Select the output format or target application." position="top">
            <label className="block text-sm font-medium text-gray-300 cursor-help w-max">Output Mode</label>
        </Tooltip>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-brand-dark p-1 rounded-lg border border-gray-700/50">
          {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                disabled={disabled}
                className={`
                    flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200
                    ${activeTab === tab.id 
                        ? 'bg-gray-700 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-gray-300'
                    }
                `}
              >
                  {tab.label}
              </button>
          ))}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-2 animate-fade-in">
        {presets[activeTab].map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset.id)}
            disabled={disabled}
            className={`
              py-2 px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 border text-left flex flex-col
              ${selectedPreset === preset.id
                ? 'bg-brand-surface border-brand-primary text-brand-primary shadow-sm ring-1 ring-brand-primary/50'
                : 'bg-brand-dark/50 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={preset.desc}
          >
            <span className="font-semibold block">{preset.label}</span>
            <span className="text-[10px] opacity-70 font-normal truncate w-full block mt-0.5">{preset.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;
