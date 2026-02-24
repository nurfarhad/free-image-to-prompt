
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  Camera, 
  Sliders, 
  User, 
  Palette, 
  Layout, 
  Zap, 
  Sparkles, 
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import AspectRatioSelector from './AspectRatioSelector';
import CameraAngleSelector from './CameraAngleSelector';
import LightingSelector from './LightingSelector';
import ModelSelector from './ModelSelector';
import StyleSelector from './StyleSelector';
import ColorPaletteSelector from './ColorPaletteSelector';
import TemperatureSlider from './TemperatureSlider';
import PersonaSelector, { PersonaType, PersonaIntensity } from './PersonaSelector';
import TemplateSelector from './TemplateSelector';
import TextureSelector from './TextureSelector';
import AnimationStyleSelector from './AnimationStyleSelector';
import ModelTuningControls from './ModelTuningControls';
import CameraControls from './CameraControls';
import Tooltip from './Tooltip';
import AdditionalContext from './AdditionalContext';
import { ModelPreset, Template, CameraSettings } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ConfigurationPanelProps {
  aspectRatio: string | null;
  setAspectRatio: (val: string | null) => void;
  isUniversalMode: boolean;
  setIsUniversalMode: (val: boolean) => void;
  isCharacterBuilderMode: boolean;
  setIsCharacterBuilderMode: (val: boolean) => void;
  modelPreset: ModelPreset;
  setModelPreset: (val: ModelPreset) => void;
  visualStyle: string | null;
  setVisualStyle: (val: string | null) => void;
  colorPalette: string | null;
  setColorPalette: (val: string | null) => void;
  colorTemperature: number;
  setColorTemperature: (val: number) => void;
  cameraAngle: string | null;
  setCameraAngle: (val: string | null) => void;
  lighting: string | null;
  setLighting: (val: string | null) => void;
  texture: string | null;
  setTexture: (val: string | null) => void;
  animationStyle: string | null;
  setAnimationStyle: (val: string | null) => void;
  userDescription: string;
  setUserDescription: (val: string) => void;
  persona: PersonaType[];
  setPersona: (val: PersonaType[]) => void;
  personaIntensity: PersonaIntensity;
  setPersonaIntensity: (val: PersonaIntensity) => void;
  detailWeight: number;
  setDetailWeight: (val: number) => void;
  realismBalance: number;
  setRealismBalance: (val: number) => void;
  cameraSettings: CameraSettings;
  setCameraSettings: (val: CameraSettings) => void;
  sourceType: string | null;
  setSourceType: (val: string | null) => void;
  themeMode: 'light' | 'dark' | null;
  setThemeMode: (val: 'light' | 'dark' | null) => void;
  subjectGender: 'male' | 'female' | 'non-binary' | null;
  setSubjectGender: (val: 'male' | 'female' | 'non-binary' | null) => void;
  ctxRefFile: File | null;
  setCtxRefFile: (file: File | null) => void;
  ctxRefBase64: string | null;
  setCtxRefBase64: (base64: string | null) => void;
  isLoading: boolean;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  aspectRatio, setAspectRatio,
  isUniversalMode, setIsUniversalMode,
  isCharacterBuilderMode, setIsCharacterBuilderMode,
  modelPreset, setModelPreset,
  visualStyle, setVisualStyle,
  colorPalette, setColorPalette,
  colorTemperature, setColorTemperature,
  cameraAngle, setCameraAngle,
  lighting, setLighting,
  texture, setTexture,
  animationStyle, setAnimationStyle,
  userDescription, setUserDescription,
  persona, setPersona,
  personaIntensity, setPersonaIntensity,
  detailWeight, setDetailWeight,
  realismBalance, setRealismBalance,
  cameraSettings, setCameraSettings,
  sourceType, setSourceType,
  themeMode, setThemeMode,
  subjectGender, setSubjectGender,
  ctxRefFile, setCtxRefFile,
  ctxRefBase64, setCtxRefBase64,
  isLoading
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    persona: false,
    tuning: false,
    style: false,
    composition: true,
    camera: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleApplyTemplate = (template: Template) => {
      const opts = template.options;
      if (opts.aspectRatio !== undefined) setAspectRatio(opts.aspectRatio);
      if (opts.preset !== undefined) setModelPreset(opts.preset);
      if (opts.visualStyle !== undefined) setVisualStyle(opts.visualStyle);
      if (opts.colorPalette !== undefined) setColorPalette(opts.colorPalette);
      if (opts.colorTemperature !== undefined) setColorTemperature(opts.colorTemperature);
      if (opts.cameraAngle !== undefined) setCameraAngle(opts.cameraAngle);
      if (opts.lighting !== undefined) setLighting(opts.lighting);
      if (opts.persona !== undefined) setPersona(opts.persona);
      if (opts.personaIntensity !== undefined) setPersonaIntensity(opts.personaIntensity);
      if (opts.isUniversal !== undefined) setIsUniversalMode(opts.isUniversal);
      if (opts.texture !== undefined) setTexture(opts.texture);
      if (opts.animationStyle !== undefined) setAnimationStyle(opts.animationStyle);
      if (opts.detailWeight !== undefined) setDetailWeight(opts.detailWeight);
      if (opts.realismBalance !== undefined) setRealismBalance(opts.realismBalance);
      if (opts.isCharacterBuilder !== undefined) setIsCharacterBuilderMode(opts.isCharacterBuilder);
      if (opts.cameraSettings !== undefined) setCameraSettings(opts.cameraSettings);
      if (opts.sourceType !== undefined) setSourceType(opts.sourceType);
      if (opts.themeMode !== undefined) setThemeMode(opts.themeMode);
      if (opts.subjectGender !== undefined) setSubjectGender(opts.subjectGender);
  };

  const handlePersonaToggle = (p: PersonaType) => {
    if (persona.includes(p)) {
      setPersona(persona.filter(id => id !== p));
    } else {
      setPersona([...persona, p]);
    }
  };

  const handleUniversalToggle = () => {
      if (!isLoading) {
          const newState = !isUniversalMode;
          setIsUniversalMode(newState);
          if (newState) setIsCharacterBuilderMode(false);
      }
  };

  const handleCharacterBuilderToggle = () => {
      if (!isLoading) {
          const newState = !isCharacterBuilderMode;
          setIsCharacterBuilderMode(newState);
          if (newState) setIsUniversalMode(false);
      }
  };

  const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
    <ChevronDown className={cn(
      "w-4 h-4 text-zinc-500 transition-transform duration-300",
      isOpen && "rotate-180 text-white"
    )} />
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel p-2">
        <TemplateSelector onApplyTemplate={handleApplyTemplate} disabled={isLoading} />
      </div>

      <div className="glass-panel p-4 space-y-4">
         <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex flex-col">
                   <span className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Master Prompt</span>
                   <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Omit age & specific identity traits</span>
                </div>
            </div>
            <Tooltip content="Generates a versatile template prompt by omitting age and specific facial details." position="left">
                <button 
                    onClick={handleUniversalToggle}
                    disabled={isLoading}
                    className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                        isUniversalMode ? "bg-blue-600" : "bg-zinc-800"
                    )}
                >
                    <span className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isUniversalMode ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </Tooltip>
         </div>

         <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col">
                   <span className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Character Builder</span>
                   <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Preserve body/hair/style</span>
                </div>
            </div>
            <Tooltip content="Preserve character traits (hair, height, outfit, age) but allow facial identity to change." position="left">
                <button 
                    onClick={handleCharacterBuilderToggle}
                    disabled={isLoading}
                    className={cn(
                        "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                        isCharacterBuilderMode ? "bg-amber-600" : "bg-zinc-800"
                    )}
                >
                    <span className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isCharacterBuilderMode ? "translate-x-5" : "translate-x-0"
                    )} />
                </button>
            </Tooltip>
         </div>

         <div className="pt-2">
            <ModelSelector 
              selectedPreset={modelPreset} 
              onSelectPreset={setModelPreset} 
              disabled={isLoading}
            />
         </div>
      </div>
      
      <div className="glass-panel overflow-hidden">
        <button 
          onClick={() => toggleSection('camera')}
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4 text-emerald-500" />
             </div>
             <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] group-hover:text-zinc-200 transition-colors">Camera Engine</h3>
          </div>
          <ChevronIcon isOpen={openSections['camera']} />
        </button>
        <AnimatePresence>
            {openSections['camera'] && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 space-y-6 border-t border-white/5 bg-zinc-950/30">
                        <CameraControls settings={cameraSettings} onChange={setCameraSettings} disabled={isLoading} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="glass-panel overflow-hidden">
        <button 
          onClick={() => toggleSection('tuning')}
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sliders className="w-4 h-4 text-orange-500" />
             </div>
             <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] group-hover:text-zinc-200 transition-colors">Advanced Tuning</h3>
          </div>
          <ChevronIcon isOpen={openSections['tuning']} />
        </button>
        <AnimatePresence>
            {openSections['tuning'] && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 space-y-6 border-t border-white/5 bg-zinc-950/30">
                        <ModelTuningControls detailWeight={detailWeight} onDetailWeightChange={setDetailWeight} realismBalance={realismBalance} onRealismBalanceChange={setRealismBalance} disabled={isLoading} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="glass-panel overflow-hidden">
        <button 
          onClick={() => toggleSection('persona')}
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User className="w-4 h-4 text-pink-500" />
             </div>
             <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] group-hover:text-zinc-200 transition-colors">Persona & Tone</h3>
          </div>
          <ChevronIcon isOpen={openSections['persona']} />
        </button>
        <AnimatePresence>
            {openSections['persona'] && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 space-y-6 border-t border-white/5 bg-zinc-950/30">
                        <PersonaSelector selectedPersonas={persona} onTogglePersona={handlePersonaToggle} intensity={personaIntensity} onSelectIntensity={setPersonaIntensity} disabled={isLoading} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="glass-panel overflow-hidden">
        <button 
          onClick={() => toggleSection('style')}
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Palette className="w-4 h-4 text-purple-500" />
             </div>
             <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] group-hover:text-zinc-200 transition-colors">Style & Color</h3>
          </div>
          <ChevronIcon isOpen={openSections['style']} />
        </button>
        <AnimatePresence>
            {openSections['style'] && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 space-y-6 border-t border-white/5 bg-zinc-950/30">
                        <StyleSelector selectedStyle={visualStyle} onSelectStyle={setVisualStyle} disabled={isLoading} />
                        <TextureSelector selectedTexture={texture} onSelectTexture={setTexture} disabled={isLoading} />
                        <AnimationStyleSelector selectedStyle={animationStyle} onSelectStyle={setAnimationStyle} disabled={isLoading} />
                        <ColorPaletteSelector selectedPalette={colorPalette} onSelectPalette={setColorPalette} disabled={isLoading} />
                        <TemperatureSlider value={colorTemperature} onChange={setColorTemperature} disabled={isLoading} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="glass-panel overflow-hidden">
        <button 
          onClick={() => toggleSection('composition')}
          className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layout className="w-4 h-4 text-teal-500" />
             </div>
             <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] group-hover:text-zinc-200 transition-colors">Composition</h3>
          </div>
          <ChevronIcon isOpen={openSections['composition']} />
        </button>
        <AnimatePresence>
            {openSections['composition'] && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                >
                    <div className="p-6 space-y-6 border-t border-white/5 bg-zinc-950/30">
                        <AspectRatioSelector selectedRatio={aspectRatio} onSelectRatio={setAspectRatio} disabled={isLoading} />
                        <CameraAngleSelector selectedAngle={cameraAngle} onSelectAngle={setCameraAngle} disabled={isLoading} />
                        <LightingSelector selectedLighting={lighting} onSelectLighting={setLighting} disabled={isLoading} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <AdditionalContext 
        sourceType={sourceType} setSourceType={setSourceType}
        themeMode={themeMode} setThemeMode={setThemeMode}
        subjectGender={subjectGender} setSubjectGender={setSubjectGender}
        userDescription={userDescription} setUserDescription={setUserDescription}
        ctxRefFile={ctxRefFile} setCtxRefFile={setCtxRefFile}
        ctxRefBase64={ctxRefBase64} setCtxRefBase64={setCtxRefBase64}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ConfigurationPanel;
