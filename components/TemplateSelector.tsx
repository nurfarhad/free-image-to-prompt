
import React, { useState, useEffect } from 'react';
import { Template, PromptOptions } from '../services/geminiService';
import Tooltip from './Tooltip';

interface TemplateSelectorProps {
  onApplyTemplate: (template: Template) => void;
  disabled?: boolean;
}

const PRESET_TEMPLATES: Template[] = [
    {
        id: 'ecommerce',
        name: 'E-Commerce Product',
        description: 'Clean studio lighting, 4:3, neutral palette.',
        options: {
            preset: 'firefly',
            lighting: 'Studio',
            aspectRatio: '4:3',
            visualStyle: 'Product Photography',
            colorPalette: 'Muted',
            colorTemperature: 50,
            cameraAngle: 'Eye Level'
        }
    },
    {
        id: 'cinematic-portrait',
        name: 'Cinematic Portrait',
        description: 'Midjourney style, 16:9, dramatic lighting.',
        options: {
            preset: 'midjourney',
            lighting: 'Cinematic',
            aspectRatio: '16:9',
            visualStyle: 'Portrait Photography',
            colorTemperature: 40, // Cool
            cameraAngle: 'Eye Level',
            persona: ['cinematic'],
            personaIntensity: 'medium'
        }
    },
    {
        id: '3d-character',
        name: '3D Character Asset',
        description: 'Isometric view, technical specs for modeling.',
        options: {
            preset: '3d-asset',
            visualStyle: '3D Render',
            cameraAngle: 'Isometric',
            lighting: 'Studio',
            persona: ['designer'],
            personaIntensity: 'high'
        }
    }
];

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onApplyTemplate, disabled }) => {
    const [userTemplates, setUserTemplates] = useState<Template[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');

    useEffect(() => {
        const saved = localStorage.getItem('user_prompt_templates');
        if (saved) {
            try {
                setUserTemplates(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to load templates", e);
            }
        }
    }, []);

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = userTemplates.filter(t => t.id !== id);
        setUserTemplates(updated);
        localStorage.setItem('user_prompt_templates', JSON.stringify(updated));
    };

    return (
        <div className="w-full space-y-3">
             <div className="flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                     </svg>
                     <label className="block text-sm font-semibold text-gray-200">Templates</label>
                 </div>
                 <span className="text-xs text-gray-500">Fast-track your setup</span>
             </div>

             <div className="grid grid-cols-1 gap-2">
                 <select 
                    onChange={(e) => {
                        const allTemplates = [...PRESET_TEMPLATES, ...userTemplates];
                        const selected = allTemplates.find(t => t.id === e.target.value);
                        if (selected) onApplyTemplate(selected);
                        // Reset select to default/placeholder after selection to allow re-selecting same one
                        e.target.value = "";
                    }}
                    disabled={disabled}
                    className="w-full bg-brand-dark border border-gray-700 text-gray-300 text-sm rounded-lg p-2.5 focus:ring-brand-primary focus:border-brand-primary cursor-pointer"
                    defaultValue=""
                 >
                     <option value="" disabled>Load a Template...</option>
                     <optgroup label="Presets">
                         {PRESET_TEMPLATES.map(t => (
                             <option key={t.id} value={t.id}>{t.name}</option>
                         ))}
                     </optgroup>
                     {userTemplates.length > 0 && (
                         <optgroup label="My Templates">
                             {userTemplates.map(t => (
                                 <option key={t.id} value={t.id}>{t.name}</option>
                             ))}
                         </optgroup>
                     )}
                 </select>
             </div>
        </div>
    );
};

export default TemplateSelector;
