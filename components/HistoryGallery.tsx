
import React, { useState } from 'react';
import { PromptData, CameraSettings } from '../services/geminiService';
import { PersonaType, PersonaIntensity } from './PersonaSelector';
import { Copy, FileJson, Trash2, Check, Clock } from 'lucide-react';
import Tooltip from './Tooltip';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  const [copyType, setCopyType] = useState<'regular' | 'json' | null>(null);

  if (history.length === 0) return null;

  const handleCopy = (e: React.MouseEvent, text: string, id: string, type: 'regular' | 'json') => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopyType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopyType(null);
    }, 2000);
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
                        {item.promptData?.isUniversal && (
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
                    {item.promptData?.regular || ''}
                </p>
            </div>

            {/* Actions overlay */}
            <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                <Tooltip text="Copy Prompt" position="left">
                    <button
                        onClick={(e) => handleCopy(e, item.promptData?.regular || '', item.id, 'regular')}
                        className={cn(
                          "p-2 bg-zinc-900/80 backdrop-blur-md rounded-xl text-zinc-400 group-hover:opacity-100 transition-all duration-200 border border-white/5 hover:text-white hover:border-blue-500/50",
                          copiedId === item.id && copyType === 'regular' ? "opacity-100 text-blue-500 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]" : "opacity-0"
                        )}
                    >
                        {copiedId === item.id && copyType === 'regular' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                </Tooltip>

                <Tooltip text="Copy JSON" position="left">
                    <button
                        onClick={(e) => handleCopy(e, JSON.stringify(item.promptData?.json || {}, null, 2), item.id, 'json')}
                        className={cn(
                          "p-2 bg-zinc-900/80 backdrop-blur-md rounded-xl text-zinc-400 group-hover:opacity-100 transition-all duration-200 border border-white/5 hover:text-white hover:border-purple-500/50",
                          copiedId === item.id && copyType === 'json' ? "opacity-100 text-purple-500 border-purple-500/50 shadow-[0_0_10px_rgba(139,92,246,0.3)]" : "opacity-0"
                        )}
                    >
                        {copiedId === item.id && copyType === 'json' ? <Check className="h-3.5 w-3.5" /> : <FileJson className="h-3.5 w-3.5" />}
                    </button>
                </Tooltip>

                <Tooltip text="Delete History" position="left">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="p-2 bg-zinc-900/80 backdrop-blur-md rounded-xl text-zinc-400 group-hover:opacity-100 transition-all duration-200 opacity-0 border border-white/5 hover:text-red-500 hover:border-red-500/50"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryGallery;
