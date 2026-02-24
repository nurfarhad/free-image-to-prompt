
import React, { useState } from 'react';
import { PromptData, CameraSettings } from '../services/geminiService';
import { PersonaType, PersonaIntensity } from './PersonaSelector';

export interface HistoryItem {
  id: string;
  thumbnailUrl: string;
  promptData: PromptData;
  aspectRatio: string | null;
  cameraAngle?: string | null;
  lighting?: string | null;
  visualStyle?: string | null;
  colorPalette?: string | null;
  colorTemperature?: number;
  texture?: string | null;
  animationStyle?: string | null;
  persona?: PersonaType | null; 
  personaIntensity?: PersonaIntensity;
  detailWeight?: number;
  realismBalance?: number;
  isCharacterBuilder?: boolean;
  cameraSettings?: CameraSettings;
  sourceType?: string | null;
  themeMode?: 'light' | 'dark' | null;
  subjectGender?: 'male' | 'female' | 'non-binary' | null;
  timestamp: number;
}

interface HistoryGalleryProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, onSelect, onDelete }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (history.length === 0) return null;

  const handleCopy = (e: React.MouseEvent, text: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="mt-12 w-full border-t border-gray-800 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Recent Prompts
        </h3>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{history.length} Saved</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group relative bg-brand-surface rounded-xl overflow-hidden border border-gray-800 hover:border-brand-primary/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-brand-primary/10 flex flex-col h-full"
            onClick={() => onSelect(item)}
          >
            {/* Header: Thumbnail and Info */}
            <div className="flex p-3 border-b border-gray-800 bg-black/20">
                <div className="h-12 w-12 flex-shrink-0 rounded overflow-hidden border border-gray-700">
                    <img 
                        src={item.thumbnailUrl} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="ml-3 flex flex-col justify-center">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {item.aspectRatio && (
                            <span className="text-[9px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded border border-brand-primary/20">
                                {item.aspectRatio}
                            </span>
                        )}
                        {item.sourceType && (
                            <span className="text-[9px] font-bold text-gray-300 bg-gray-700/50 px-1.5 py-0.5 rounded border border-gray-600">
                                {item.sourceType}
                            </span>
                        )}
                        {item.persona && (
                             <span className="text-[9px] font-bold text-pink-400 bg-pink-400/10 px-1.5 py-0.5 rounded border border-pink-400/20 capitalize">
                                {item.persona}
                             </span>
                        )}
                        {item.promptData.isUniversal && (
                             <span className="text-[9px] font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded border border-gray-600">
                                Univ.
                             </span>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>
            
            {/* Body: Prompt Snippet */}
            <div className="p-3 flex-grow bg-brand-surface/50">
                <p className="text-xs text-gray-300 line-clamp-4 leading-relaxed font-mono opacity-90">
                    {item.promptData.regular}
                </p>
            </div>

            {/* Actions overlay */}
            <div className="absolute top-2 right-2 flex space-x-2">
                <button
                    onClick={(e) => handleCopy(e, item.promptData.regular, item.id)}
                    className="p-1.5 bg-black/60 backdrop-blur-sm hover:bg-brand-primary/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="Copy prompt"
                >
                     {copiedId === item.id ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                         </svg>
                     ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                     )}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(item.id);
                    }}
                    className="p-1.5 bg-black/60 backdrop-blur-sm hover:bg-red-500/90 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-200 delay-75"
                    title="Remove from history"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryGallery;
