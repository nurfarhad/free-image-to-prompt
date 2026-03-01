
import React from 'react';
import Tooltip from './Tooltip';

export type PersonaType = 'photographer' | 'designer' | 'artist' | 'marketer' | 'cinematic';
export type PersonaIntensity = 'low' | 'medium' | 'high';

interface PersonaSelectorProps {
  selectedPersonas: PersonaType[];
  onTogglePersona: (persona: PersonaType) => void;
  intensity: PersonaIntensity;
  onSelectIntensity: (intensity: PersonaIntensity) => void;
  disabled?: boolean;
}

const personas: { id: PersonaType; label: string; icon: React.ReactNode; desc: string }[] = [
  { 
    id: 'photographer', 
    label: 'Photographer', 
    desc: 'Emphasize camera settings, lenses, lighting, and technical composition.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  },
  { 
    id: 'designer', 
    label: 'Designer', 
    desc: 'Highlight visual style, color theory, layout, and typography cues.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
  },
  { 
    id: 'artist', 
    label: 'Artist', 
    desc: 'Elevate artistic style, medium, brushwork, textures, and mood.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
  },
  { 
    id: 'marketer', 
    label: 'Marketer', 
    desc: 'Focus on emotional triggers, storytelling, brand messaging, and audience.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
  },
  { 
    id: 'cinematic', 
    label: 'Director', 
    desc: 'Prioritize scene framing, atmosphere, storytelling arcs, and cinematic language.',
    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>
  },
];

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ 
  selectedPersonas, 
  onTogglePersona, 
  intensity, 
  onSelectIntensity, 
  disabled 
}) => {
  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <Tooltip content="Select a persona to influence the tone, vocabulary, and focus of the prompt." position="top">
          <label className="block text-sm font-medium text-gray-300 cursor-help w-max">Persona Layer</label>
        </Tooltip>
        
        {/* Intensity Toggle - Only show if a persona is selected */}
        {selectedPersonas.length > 0 && (
          <div className="flex bg-brand-dark rounded-lg p-0.5 border border-gray-700">
            {(['low', 'medium', 'high'] as PersonaIntensity[]).map((level) => (
              <button
                key={level}
                onClick={() => onSelectIntensity(level)}
                disabled={disabled}
                className={`
                  px-2 py-0.5 text-[10px] font-bold uppercase rounded-md transition-all
                  ${intensity === level 
                    ? 'bg-brand-primary text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                {level}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {personas.map((persona) => {
          const isSelected = selectedPersonas.includes(persona.id);
          return (
            <Tooltip key={persona.id} content={persona.desc} position="top">
              <button
                onClick={() => onTogglePersona(persona.id)}
                disabled={disabled}
                className={`
                  flex items-center p-2 rounded-lg border transition-all duration-200 text-left min-w-[120px] flex-1 sm:flex-none
                  ${isSelected
                    ? 'bg-gradient-to-r from-brand-secondary/20 to-purple-900/20 border-brand-secondary text-brand-secondary ring-1 ring-brand-secondary/50' 
                    : 'bg-brand-gray border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-200'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className={`mr-2 p-1.5 rounded-full shrink-0 ${isSelected ? 'bg-brand-secondary text-white' : 'bg-gray-800 text-gray-500'}`}>
                  {persona.icon}
                </div>
                <span className="text-xs font-semibold whitespace-nowrap">{persona.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default PersonaSelector;
