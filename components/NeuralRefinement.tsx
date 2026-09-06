
import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Paperclip, Send } from 'lucide-react';
import VoiceInput from './VoiceInput';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NeuralRefinementProps {
  chatInput: string;
  setChatInput: (val: string) => void;
  refineImageFile: File | null;
  refineImageDataUrl: string | null;
  onRemoveImage: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onVoiceInput: (text: string) => void;
  isRefining: boolean;
  isLoading: boolean;
  error?: string | null;
}

const NeuralRefinement: React.FC<NeuralRefinementProps> = ({
  chatInput,
  setChatInput,
  refineImageFile,
  refineImageDataUrl,
  onRemoveImage,
  onFileSelect,
  onSubmit,
  onVoiceInput,
  isRefining,
  isLoading,
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className={cn(
        "p-4 lg:p-6 transition-all duration-500",
        isLoading && "opacity-50 pointer-events-none"
    )}>
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Neural Refinement</span>
            </div>

            <AnimatePresence>
                {refineImageDataUrl && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mb-4 inline-flex relative group"
                    >
                        <img src={refineImageDataUrl} alt="Ref" className="h-20 w-20 object-cover rounded-xl border border-white/10 shadow-2xl" />
                        <button 
                            onClick={onRemoveImage} 
                            className="absolute -top-2 -right-2 bg-zinc-900 text-white rounded-full p-1.5 border border-white/10 shadow-xl hover:bg-red-600 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={onSubmit} className="relative group">
                <input type="file" ref={fileInputRef} onChange={onFileSelect} accept="image/*" className="hidden" />
                <div className="relative">
                    <textarea 
                        value={chatInput} 
                        onChange={(e) => setChatInput(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        disabled={isRefining} 
                        placeholder="Describe changes or upload a reference..."
                        rows={1} 
                        className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-sm rounded-2xl pl-12 pr-28 py-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:opacity-50 min-h-[56px] transition-all placeholder-zinc-600" 
                    />
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="absolute left-4 top-4 text-zinc-500 hover:text-blue-500 transition-colors"
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="absolute right-3 top-3 flex items-center gap-2">
                        <VoiceInput onTranscript={onVoiceInput} disabled={isRefining} />
                        <button 
                            type="submit" 
                            disabled={(!chatInput.trim() && !refineImageFile) || isRefining} 
                            className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-30 transition-all shadow-lg shadow-blue-600/20"
                        >
                            {isRefining ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </div>
            </form>
            {error && (
                <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-3 ml-1"
                >
                    {error}
                </motion.p>
            )}
        </div>
    </div>
  );
};

export default NeuralRefinement;
