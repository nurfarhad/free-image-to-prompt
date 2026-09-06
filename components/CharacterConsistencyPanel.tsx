
import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Info } from 'lucide-react';
import Tooltip from './Tooltip';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CharacterConsistencyPanelProps {
  coreTraits: string;
  onTraitsChange: (traits: string) => void;
  disabled?: boolean;
}

const CharacterConsistencyPanel: React.FC<CharacterConsistencyPanelProps> = ({
  coreTraits,
  onTraitsChange,
  disabled
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-panel p-5 space-y-4 border-blue-500/10 transition-all",
        coreTraits.trim() && "border-blue-500/30 animate-gemini-glow"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Character Consistency</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Global Constraints</p>
          </div>
        </div>
        <Tooltip text="These traits will be injected into every prompt to maintain character features across different scenes.">
          <Info className="w-4 h-4 text-zinc-600 hover:text-zinc-400 cursor-help transition-colors" />
        </Tooltip>
      </div>

      <div className="relative group">
        <textarea
          value={coreTraits}
          onChange={(e) => onTraitsChange(e.target.value)}
          disabled={disabled}
          placeholder="e.g., Red bob hair, wearing a high-tech tactical suit, hazel eyes, cyberpunk aesthetic..."
          className={cn(
            "w-full h-24 bg-zinc-950/50 rounded-2xl p-4 text-sm text-zinc-300 placeholder:text-zinc-600 border border-white/5",
            "focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/30 transition-all resize-none",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
      </div>

      <div className="flex items-center gap-2 px-1">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Active Injection</span>
      </div>
    </motion.div>
  );
};

export default CharacterConsistencyPanel;
