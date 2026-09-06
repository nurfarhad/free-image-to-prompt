
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  Wand2, 
  Undo2, 
  Redo2, 
  Code, 
  FileJson, 
  ShieldAlert, 
  BarChart3, 
  ChevronRight,
  Split,
  Sparkles
} from 'lucide-react';
import { PromptData, ModelPreset } from '../services/geminiService';
import DecompositionView from './DecompositionView';
import { useDebounce } from '../hooks/useDebounce';
import Loader from './Loader';
import NeuralRefinement from './NeuralRefinement';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PromptDisplayProps {
  promptData: PromptData | null;
  isLoading: boolean;
  onPromptChange: (newData: PromptData) => void;
  currentVersionIndex: number;
  totalVersions: number;
  onUndo: () => void;
  onRedo: () => void;
  targetModel?: ModelPreset;
  aspectRatio?: string | null;
  // Neural Refinement Props
  chatInput: string;
  setChatInput: (val: string) => void;
  refineImageFile: File | null;
  refineImageDataUrl: string | null;
  onRemoveImage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRefineSubmit: (e: React.FormEvent) => void;
  onVoiceInput: (text: string) => void;
  isRefining: boolean;
  refineError?: string | null;
}

type ViewMode = 'regular' | 'json' | 'negative' | 'decomposition' | 'grade' | 'variation-a' | 'variation-b';

const PromptDisplay: React.FC<PromptDisplayProps> = ({ 
    promptData, isLoading, onPromptChange,
    currentVersionIndex, totalVersions, onUndo, onRedo,
    targetModel = 'standard', aspectRatio,
    chatInput, setChatInput, refineImageFile, refineImageDataUrl,
    onRemoveImage, onFileSelect, onRefineSubmit, onVoiceInput,
    isRefining, refineError
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [viewMode, setViewMode] = useState<ViewMode>('regular');
  const [manualText, setManualText] = useState('');
  const debouncedManualText = useDebounce(manualText, 500);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (copyStatus === 'copied') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  useEffect(() => {
      setManualText(getCurrentText());
      // Reset view mode if we move to a prompt without A/B
      if ((viewMode === 'variation-a' || viewMode === 'variation-b') && !promptData?.abVariations) {
          setViewMode('regular');
      }
  }, [currentVersionIndex, viewMode, promptData]);

  useEffect(() => {
      const currentText = getCurrentText();
      if (debouncedManualText !== currentText && promptData) {
          const baseData = { ...promptData };
          if (viewMode === 'regular') onPromptChange({ ...baseData, regular: debouncedManualText });
          else if (viewMode === 'negative') onPromptChange({ ...baseData, negative: debouncedManualText });
          else if (viewMode === 'variation-a') {
              if (baseData.abVariations) {
                  onPromptChange({ 
                      ...baseData, 
                      abVariations: { ...baseData.abVariations, regular: debouncedManualText } 
                  });
              }
          }
          else if (viewMode === 'variation-b') {
              if (baseData.abVariations) {
                  onPromptChange({ 
                      ...baseData, 
                      abVariations: { ...baseData.abVariations, creative: debouncedManualText } 
                  });
              }
          }
          else if (viewMode === 'json') {
              try {
                  const parsed = JSON.parse(debouncedManualText);
                  onPromptChange({ ...baseData, json: parsed });
              } catch (e) {}
          }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedManualText]);

  const getCurrentText = () => {
    if (!promptData) return '';
    if (viewMode === 'regular') return promptData.regular;
    if (viewMode === 'variation-a') return promptData.abVariations?.regular || promptData.regular;
    if (viewMode === 'variation-b') return promptData.abVariations?.creative || "";
    if (viewMode === 'negative') return promptData.negative || "";
    if (viewMode === 'json') return promptData.json && Object.keys(promptData.json).length > 0 ? JSON.stringify(promptData.json, null, 2) : "";
    return '';
  };

  const handleCopy = () => {
    const text = getCurrentText();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopyStatus('copied');
    }
  };

  if (isLoading && (!promptData || !promptData.regular)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 p-12 text-zinc-500">
        <div className="relative">
          <Loader size="xl" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"
          />
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300">Neural Synthesis</p>
          <p className="text-xs text-zinc-500">Applying professional prompt engineering...</p>
        </div>
      </div>
    );
  }

  if (!promptData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
          <ImageIcon className="w-10 h-10 text-zinc-700" />
        </div>
        <h2 className="text-xl font-bold text-zinc-200 mb-2">Ready to Engineer</h2>
        <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
          Upload an image to extract its professional prompt parameters and artistic DNA.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between mb-6 shrink-0">
         <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-white/5">
            {promptData.abVariations ? (
                <>
                    <button 
                    onClick={() => setViewMode('variation-a')}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                        viewMode === 'variation-a' ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    >
                    <Split className="w-3.5 h-3.5" /> Variation A
                    </button>
                    <button 
                    onClick={() => setViewMode('variation-b')}
                    className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                        viewMode === 'variation-b' ? "bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    >
                    <Sparkles className="w-3.5 h-3.5" /> Variation B
                    </button>
                </>
            ) : (
                <button 
                onClick={() => setViewMode('regular')}
                className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    viewMode === 'regular' ? "bg-zinc-800 text-white shadow-lg ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"
                )}
                >
                <Wand2 className="w-3.5 h-3.5" /> Normal
                </button>
            )}
            <button 
              onClick={() => setViewMode('json')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                viewMode === 'json' ? "bg-zinc-800 text-white shadow-lg ring-1 ring-white/10" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <FileJson className="w-3.5 h-3.5" /> Structured
            </button>
            {promptData.negative && (
               <button 
                onClick={() => setViewMode('negative')}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                  viewMode === 'negative' ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/30" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> Negative
              </button>
            )}
            <button 
              onClick={() => setViewMode('decomposition')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                viewMode === 'decomposition' ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Code className="w-3.5 h-3.5" /> Decompose
            </button>
         </div>

         <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-white/5 mr-2">
                <button onClick={onUndo} disabled={currentVersionIndex <= 0} className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors">
                    <Undo2 className="w-4 h-4" />
                </button>
                <div className="w-px h-3 bg-white/5 mx-1" />
                <button onClick={onRedo} disabled={currentVersionIndex >= totalVersions - 1} className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 transition-colors">
                    <Redo2 className="w-4 h-4" />
                </button>
            </div>
            <button 
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xl",
                copyStatus === 'copied' ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white text-black hover:bg-zinc-200"
              )}
            >
              {copyStatus === 'copied' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>}
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-zinc-900/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-0">
          {viewMode === 'decomposition' ? (
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <DecompositionView promptData={promptData} />
              </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 relative">
               {isLoading && (
                   <div className="absolute top-2 right-2 flex items-center gap-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md border border-white/10 z-10">
                       <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                       <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Streaming</span>
                   </div>
               )}
               <textarea
                  ref={textareaRef}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={viewMode === 'json' ? "Structured data..." : "Prompt text..."}
                  className={cn(
                    "w-full flex-1 p-8 bg-transparent text-lg lg:text-xl font-medium leading-relaxed resize-none focus:outline-none custom-scrollbar overflow-y-auto",
                    viewMode === 'json' ? "font-mono text-sm text-blue-400/90" : "text-white/90",
                    isLoading && "opacity-60"
                  )}
               />
               
               <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Target Model</span>
                            <span className="text-[11px] font-bold text-zinc-300">{targetModel.toUpperCase()}</span>
                        </div>
                        {aspectRatio && (
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Aspect Ratio</span>
                                <span className="text-[11px] font-bold text-zinc-300">{aspectRatio}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                         <span className="text-[10px] text-zinc-500 font-medium">
                            Ver {currentVersionIndex + 1}/{totalVersions}
                         </span>
                    </div>
               </div>

               {/* Integrated Neural Refinement */}
               <div className="shrink-0 bg-zinc-950/40">
                    <NeuralRefinement 
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        refineImageFile={refineImageFile}
                        refineImageDataUrl={refineImageDataUrl}
                        onRemoveImage={onRemoveImage}
                        onFileSelect={onFileSelect}
                        onSubmit={onRefineSubmit}
                        onVoiceInput={onVoiceInput}
                        isRefining={isRefining}
                        isLoading={isLoading}
                        error={refineError}
                    />
               </div>
            </div>
          )}
      </div>

      {/* A/B Variations - Removed since they are now in tabs */}
    </div>
  );
};

import { Image as ImageIcon } from 'lucide-react';

export default PromptDisplay;
