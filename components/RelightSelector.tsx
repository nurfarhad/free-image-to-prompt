
import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Sun, Zap, Palette, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export interface RelightSettings {
  type: 'soft' | 'hard';
  direction: string;
  brightness: number;
  color: string;
  position: { x: number; y: number };
}

interface RelightSelectorProps {
  onSelect: (settings: RelightSettings) => void;
  disabled: boolean;
}

const RelightSelector: React.FC<RelightSelectorProps> = ({ onSelect, disabled }) => {
  const [type, setType] = useState<'soft' | 'hard'>('soft');
  const [brightness, setBrightness] = useState(50);
  const [color, setColor] = useState('#FFFFFF');
  const [direction, setDirection] = useState('Front');
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleQuickSelect = (dir: string) => {
    setDirection(dir);
    // Map direction to position for the sphere
    const posMap: Record<string, { x: number, y: number }> = {
      'Top': { x: 0, y: -40 },
      'Front': { x: 0, y: 0 },
      'Right': { x: 40, y: 0 },
      'Left': { x: -40, y: 0 },
      'Back': { x: 0, y: 80 }, 
      'Bottom': { x: 0, y: 40 },
    };
    const newPos = posMap[dir] || { x: 0, y: 0 };
    setPosition(newPos);
  };

  const handleSubmit = () => {
    onSelect({
      type,
      direction,
      brightness,
      color,
      position,
    });
  };

  const handleDrag = (_event: any, info: any) => {
    const newPos = { x: position.x + info.delta.x, y: position.y + info.delta.y };
    // Constrain to sphere bounds
    const dist = Math.sqrt(newPos.x * newPos.x + newPos.y * newPos.y);
    if (dist <= 60) {
      setPosition(newPos);
      setDirection('Custom');
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3 w-full bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <Sun className="w-4 h-4 text-zinc-500" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Re-light</span>
      </div>

      <div className="space-y-3">
        {/* Quick Select */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Quick select</span>
          <div className="grid grid-cols-3 gap-1.5">
            {['Top', 'Front', 'Right', 'Left', 'Back', 'Bottom'].map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => handleQuickSelect(dir)}
                disabled={disabled}
                className={`
                  py-1.5 px-2 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all
                  ${direction === dir 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-zinc-950 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Sphere Interaction */}
        <div className="relative aspect-square w-full max-w-[200px] mx-auto bg-zinc-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-3">
          <span className="absolute top-3 text-[8px] font-bold text-zinc-600 uppercase tracking-widest text-center leading-tight">
            Hold and drag to change<br/>light direction
          </span>
          
          <div className="relative w-24 h-24 mt-4">
            {/* Wireframe Sphere */}
            <div className="absolute inset-0 rounded-full border border-white/10 flex items-center justify-center">
               <div className="absolute w-full h-px bg-white/5 top-1/2"></div>
               <div className="absolute h-full w-px bg-white/5 left-1/2"></div>
               <div className="absolute inset-2 rounded-full border border-white/5"></div>
            </div>

            {/* Light Source Indicator */}
            <motion.div
              drag
              dragConstraints={{ left: -45, right: 45, top: -45, bottom: 45 }}
              dragElastic={0.1}
              onDrag={handleDrag}
              animate={{ x: position.x, y: position.y }}
              className="absolute top-1/2 left-1/2 -mt-2.5 -ml-2.5 w-5 h-5 bg-blue-500 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.8)] cursor-grab active:cursor-grabbing z-10 flex items-center justify-center"
            >
              <Zap className="w-2.5 h-2.5 text-white" />
            </motion.div>

            {/* Light Beam Effect */}
            <motion.div 
              animate={{ 
                x: position.x, 
                y: position.y,
                rotate: Math.atan2(position.y, position.x) * (180 / Math.PI) + 90,
                opacity: 0.3
              }}
              className="absolute top-1/2 left-1/2 w-1 h-16 bg-gradient-to-t from-blue-500 to-transparent origin-top pointer-events-none"
            />
          </div>

          <div className="absolute bottom-4 flex gap-4 text-zinc-700">
            <ChevronUp className="w-3 h-3" />
            <ChevronDown className="w-3 h-3" />
            <ChevronLeft className="w-3 h-3" />
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Light Settings */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Light settings</span>
          
          {/* Soft/Hard Toggle */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setType('soft')}
              disabled={disabled}
              className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${type === 'soft' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}
            >
              Soft
            </button>
            <button
              type="button"
              onClick={() => setType('hard')}
              disabled={disabled}
              className={`flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg transition-all ${type === 'hard' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}
            >
              Hard
            </button>
          </div>

          {/* Brightness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Brightness</span>
              <span className="text-[9px] font-bold text-zinc-300">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              disabled={disabled}
              onChange={(e) => setBrightness(parseInt(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-30"
            />
          </div>

          {/* Color Picker */}
          <div className="flex items-center justify-between bg-zinc-950 p-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <Palette className="w-3 h-3 text-zinc-500" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Color</span>
            </div>
            <div className="flex items-center gap-2">
              <div 
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner" 
                style={{ backgroundColor: color }}
              />
              <span className="text-[9px] font-mono text-zinc-400 uppercase">{color}</span>
              <input
                type="color"
                value={color}
                disabled={disabled}
                onChange={(e) => setColor(e.target.value)}
                className="w-6 h-6 bg-transparent border-none cursor-pointer p-0 overflow-hidden rounded-full"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
          >
            <Zap className="w-3 h-3 group-hover:animate-pulse" />
            Apply Lighting
          </button>
        </div>
      </div>
    </div>
  );
};

export default RelightSelector;
