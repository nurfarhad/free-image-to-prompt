
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Layers, 
  Zap, 
  Download, 
  RotateCcw, 
  Linkedin, 
  Instagram,
  Sparkles,
  Settings2,
  History as HistoryIcon
} from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import PromptDisplay from './components/PromptDisplay';
import Loader from './components/Loader';
import HistoryGallery, { HistoryItem } from './components/HistoryGallery';
import ConfigurationPanel from './components/ConfigurationPanel';
import BatchProcessor from './components/BatchProcessor';
import StyleTransfer from './components/StyleTransfer';
import { generatePromptFromImage, PromptData, ModelPreset, PromptOptions, exportToJSON, base64ToImagePart, CameraSettings } from './services/geminiService';
import { PersonaType, PersonaIntensity } from './components/PersonaSelector';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AppViewMode = 'editor' | 'batch' | 'style_transfer';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<AppViewMode>('editor');
  
  // Editor State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [effectiveImageData, setEffectiveImageData] = useState<string | null>(null); // Base64 for processing (includes crop)
  
  // Background Reference State
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgBase64, setBgBase64] = useState<string | null>(null);

  // Context Reference State (The new feature)
  const [ctxRefFile, setCtxRefFile] = useState<File | null>(null);
  const [ctxRefBase64, setCtxRefBase64] = useState<string | null>(null);

  // Prompt Version History Logic
  // Initialize with an empty prompt object to allow immediate manual input
  const [promptHistory, setPromptHistory] = useState<PromptData[]>([{ regular: '', json: {}, confidence: 0 }]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);
  const generatedPromptData = promptHistory[currentHistoryIndex];

  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Configuration State
  const [aspectRatio, setAspectRatio] = useState<string | null>(null);
  const [isUniversalMode, setIsUniversalMode] = useState<boolean>(false);
  const [isCharacterBuilderMode, setIsCharacterBuilderMode] = useState<boolean>(false);
  const [userDescription, setUserDescription] = useState<string>('');
  const [modelPreset, setModelPreset] = useState<ModelPreset>('standard');
  const [cameraAngle, setCameraAngle] = useState<string | null>(null);
  const [lighting, setLighting] = useState<string | null>(null);
  const [visualStyle, setVisualStyle] = useState<string | null>(null);
  const [colorPalette, setColorPalette] = useState<string | null>(null);
  const [colorTemperature, setColorTemperature] = useState<number>(50); // 50 is Neutral
  const [texture, setTexture] = useState<string | null>(null);
  const [animationStyle, setAnimationStyle] = useState<string | null>(null);
  const [persona, setPersona] = useState<PersonaType[]>([]);
  const [personaIntensity, setPersonaIntensity] = useState<PersonaIntensity>('medium');
  const [detailWeight, setDetailWeight] = useState<number>(50);
  const [realismBalance, setRealismBalance] = useState<number>(50);
  const [sourceType, setSourceType] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | null>(null);
  const [subjectGender, setSubjectGender] = useState<'male' | 'female' | 'non-binary' | null>(null);
  
  // Camera Settings State
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
      filmType: null
  });
  
  const [showBgUploader, setShowBgUploader] = useState(false);

  const handleImageSelect = (file: File | null) => {
    if (file) {
      setImageFile(file);
      setError('');
    } else {
        setImageFile(null);
        setEffectiveImageData(null);
    }
  };

  const handleEffectiveImageChange = (base64: string) => {
      setEffectiveImageData(base64);
  };

  // Centralized options getter
  const getPromptOptions = (): PromptOptions => ({
      aspectRatio,
      isUniversal: isUniversalMode,
      isCharacterBuilder: isCharacterBuilderMode,
      userDescription,
      preset: modelPreset,
      cameraAngle,
      lighting,
      visualStyle,
      colorPalette,
      colorTemperature,
      texture,
      animationStyle,
      persona: persona,
      personaIntensity,
      detailWeight,
      realismBalance,
      cameraSettings,
      sourceType,
      themeMode,
      subjectGender,
      backgroundReference: bgBase64 ? base64ToImagePart(bgBase64, bgFile?.type) : null,
      contextReference: ctxRefBase64 ? base64ToImagePart(ctxRefBase64, ctxRefFile?.type) : null
  });

  const handleGeneratePrompt = useCallback(async () => {
    if (!effectiveImageData) {
      setError('Please select an image first.');
      return;
    }

    setIsLoadingPrompt(true);
    setError('');

    try {
      // Use effective image (cropped or full)
      const imagePart = base64ToImagePart(effectiveImageData, imageFile?.type);
      const options = getPromptOptions();
      const data = await generatePromptFromImage(imagePart, options);
      
      // Update history stack (reset future if any)
      const newHistory = [...promptHistory.slice(0, currentHistoryIndex + 1), data];
      setPromptHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);

      // Add to global gallery history
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        thumbnailUrl: effectiveImageData,
        promptData: data,
        aspectRatio: aspectRatio,
        cameraAngle: cameraAngle,
        lighting: lighting,
        visualStyle: visualStyle,
        colorPalette: colorPalette,
        colorTemperature: colorTemperature,
        texture: texture,
        animationStyle: animationStyle,
        persona: persona.length > 0 ? persona[0] : null,
        personaIntensity: personaIntensity,
        detailWeight: detailWeight,
        realismBalance: realismBalance,
        isCharacterBuilder: isCharacterBuilderMode,
        cameraSettings: cameraSettings,
        sourceType: sourceType,
        themeMode: themeMode,
        subjectGender: subjectGender,
        timestamp: Date.now(),
      };
      setHistory(prev => [newItem, ...prev]);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate prompt. ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [effectiveImageData, imageFile, promptHistory, currentHistoryIndex, aspectRatio, isUniversalMode, isCharacterBuilderMode, userDescription, modelPreset, cameraAngle, lighting, visualStyle, colorPalette, colorTemperature, texture, animationStyle, persona, personaIntensity, detailWeight, realismBalance, cameraSettings, sourceType, themeMode, subjectGender, bgBase64, bgFile, ctxRefBase64, ctxRefFile]);

  const handlePromptUpdate = (newData: PromptData) => {
      const newHistory = [...promptHistory.slice(0, currentHistoryIndex + 1), newData];
      setPromptHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
      if (currentHistoryIndex > 0) {
          setCurrentHistoryIndex(prev => prev - 1);
      }
  };

  const handleRedo = () => {
      if (currentHistoryIndex < promptHistory.length - 1) {
          setCurrentHistoryIndex(prev => prev + 1);
      }
  };

  const handleClear = () => {
    setImageFile(null);
    setEffectiveImageData(null);
    setPromptHistory([{ regular: '', json: {}, confidence: 0 }]);
    setCurrentHistoryIndex(0);
    setError('');
    setIsLoadingPrompt(false);
    
    // Reset background
    setBgFile(null);
    setBgBase64(null);

    // Reset context ref
    setCtxRefFile(null);
    setCtxRefBase64(null);
    
    // Reset configs
    setAspectRatio(null);
    setIsUniversalMode(false);
    setIsCharacterBuilderMode(false);
    setUserDescription('');
    setModelPreset('standard');
    setCameraAngle(null);
    setLighting(null);
    setVisualStyle(null);
    setColorPalette(null);
    setColorTemperature(50);
    setTexture(null);
    setAnimationStyle(null);
    setPersona([]);
    setPersonaIntensity('medium');
    setDetailWeight(50);
    setRealismBalance(50);
    setCameraSettings({ focalLength: null, aperture: null, shutterSpeed: null, iso: null, filmType: null });
    setSourceType(null);
    setThemeMode(null);
    setSubjectGender(null);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setPromptHistory([item.promptData]);
    setCurrentHistoryIndex(0);
    setAspectRatio(item.aspectRatio);
    setIsUniversalMode(item.promptData.isUniversal || false);
    setIsCharacterBuilderMode(item.isCharacterBuilder || false);
    setCameraAngle(item.cameraAngle || null);
    setLighting(item.lighting || null);
    setVisualStyle(item.visualStyle || null);
    setColorPalette(item.colorPalette || null);
    setColorTemperature(item.colorTemperature !== undefined ? item.colorTemperature : 50);
    setTexture(item.texture || null);
    setAnimationStyle(item.animationStyle || null);
    setPersona(item.persona ? [item.persona] : []);
    setPersonaIntensity(item.personaIntensity || 'medium');
    setDetailWeight(item.detailWeight !== undefined ? item.detailWeight : 50);
    setRealismBalance(item.realismBalance !== undefined ? item.realismBalance : 50);
    setCameraSettings(item.cameraSettings || { focalLength: null, aperture: null, shutterSpeed: null, iso: null, filmType: null });
    setSourceType(item.sourceType || null);
    setThemeMode(item.themeMode || null);
    setSubjectGender(item.subjectGender || null);
    
    setImageFile(null); 
    setEffectiveImageData(item.thumbnailUrl);
    setError('');
    setUserDescription('');
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };
  
  const handleDownloadProject = () => {
      if(history.length === 0) {
          alert("No history to download.");
          return;
      }
      exportToJSON(history);
  };

  return (
    <div className="h-screen bg-[#09090b] font-sans flex flex-col overflow-hidden text-zinc-100 selection:bg-blue-500/30 selection:text-blue-200">
      {/* Mode Switcher Header */}
      <header className="bg-zinc-950/50 backdrop-blur-xl border-b border-white/5 px-6 py-3 flex justify-between items-center shrink-0 z-50">
          <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 mr-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
                      <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold tracking-tight text-lg hidden sm:block">Prompt Studio <span className="text-blue-500">Pro</span></span>
              </div>
              
              <nav className="flex p-1 bg-zinc-900/50 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setViewMode('editor')} 
                    className={cn(
                        "flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all",
                        viewMode === 'editor' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Editor
                  </button>
                  <button 
                    onClick={() => setViewMode('style_transfer')} 
                    className={cn(
                        "flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all",
                        viewMode === 'style_transfer' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                      <Layers className="w-3.5 h-3.5" />
                      Style
                  </button>
                  <button 
                    onClick={() => setViewMode('batch')} 
                    className={cn(
                        "flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all",
                        viewMode === 'batch' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                      <Zap className="w-3.5 h-3.5" />
                      Batch
                  </button>
              </nav>
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={handleDownloadProject} 
                className="text-xs text-zinc-500 hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
              >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export Project</span>
              </button>
              <div className="h-4 w-px bg-zinc-800"></div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">Live Engine</span>
              </div>
          </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
            {viewMode === 'batch' ? (
                <motion.div 
                    key="batch"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                >
                    <BatchProcessor options={getPromptOptions()} />
                </motion.div>
            ) : viewMode === 'style_transfer' ? (
                <motion.div 
                    key="style"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full"
                >
                    <StyleTransfer />
                </motion.div>
            ) : (
                <motion.div 
                    key="editor"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex overflow-hidden"
                >
                    {/* Left Panel: Configuration */}
                    <aside className="w-full lg:w-[400px] xl:w-[450px] flex flex-col border-r border-white/5 bg-zinc-950 h-full">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Source Image</h3>
                                    {effectiveImageData && (
                                        <button onClick={handleClear} className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1">
                                            <RotateCcw className="w-3 h-3" /> Reset
                                        </button>
                                    )}
                                </div>
                                <ImageUploader 
                                    imageFile={imageFile} 
                                    onImageSelect={handleImageSelect} 
                                    onEffectiveImageChange={handleEffectiveImageChange}
                                    heightClass="h-64" 
                                />
                            </section>
                            
                            {/* Background Reference (Optional) */}
                            <section className="space-y-3">
                                <button 
                                    onClick={() => setShowBgUploader(!showBgUploader)}
                                    className="flex items-center justify-between w-full group"
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">Environment Ref</h3>
                                        <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-600 border border-white/5">Optional</span>
                                    </div>
                                    <span className={cn("text-zinc-600 transition-transform duration-200", showBgUploader && "rotate-90")}>▶</span>
                                </button>
                                
                                <AnimatePresence>
                                    {(showBgUploader || bgBase64) && (
                                        <motion.div 
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="h-40 pt-1">
                                                <ImageUploader 
                                                    imageFile={bgFile} 
                                                    onImageSelect={setBgFile} 
                                                    onEffectiveImageChange={setBgBase64}
                                                    heightClass="h-40"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </section>

                            <div className="h-px bg-white/5" />

                            <section className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Settings2 className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Parameters</h3>
                                </div>
                                <ConfigurationPanel 
                                    aspectRatio={aspectRatio} setAspectRatio={setAspectRatio}
                                    isUniversalMode={isUniversalMode} setIsUniversalMode={setIsUniversalMode}
                                    isCharacterBuilderMode={isCharacterBuilderMode} setIsCharacterBuilderMode={setIsCharacterBuilderMode}
                                    modelPreset={modelPreset} setModelPreset={setModelPreset}
                                    visualStyle={visualStyle} setVisualStyle={setVisualStyle}
                                    colorPalette={colorPalette} setColorPalette={setColorPalette}
                                    colorTemperature={colorTemperature} setColorTemperature={setColorTemperature}
                                    cameraAngle={cameraAngle} setCameraAngle={setCameraAngle}
                                    lighting={lighting} setLighting={setLighting}
                                    texture={texture} setTexture={setTexture}
                                    animationStyle={animationStyle} setAnimationStyle={setAnimationStyle}
                                    userDescription={userDescription} setUserDescription={setUserDescription}
                                    persona={persona} setPersona={setPersona}
                                    personaIntensity={personaIntensity} setPersonaIntensity={setPersonaIntensity}
                                    detailWeight={detailWeight} setDetailWeight={setDetailWeight}
                                    realismBalance={realismBalance} setRealismBalance={setRealismBalance}
                                    cameraSettings={cameraSettings} setCameraSettings={setCameraSettings}
                                    sourceType={sourceType} setSourceType={setSourceType}
                                    themeMode={themeMode} setThemeMode={setThemeMode}
                                    subjectGender={subjectGender} setSubjectGender={setSubjectGender}
                                    ctxRefFile={ctxRefFile} setCtxRefFile={setCtxRefFile}
                                    ctxRefBase64={ctxRefBase64} setCtxRefBase64={setCtxRefBase64}
                                    isLoading={isLoadingPrompt}
                                />
                            </section>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-zinc-950/80 backdrop-blur-md z-10 shrink-0 flex gap-3">
                            <button 
                                onClick={handleGeneratePrompt} 
                                disabled={!effectiveImageData || isLoadingPrompt} 
                                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3.5"
                            >
                                {isLoadingPrompt ? (
                                    <><Loader /><span className="animate-pulse">Analyzing Vision...</span></>
                                ) : (
                                    <><Zap className="w-4 h-4 fill-current" /> Generate Prompt</>
                                )}
                            </button>
                        </div>
                    </aside>

                    {/* Right Panel: Output & History */}
                    <div className="flex-1 flex flex-col bg-[#09090b] h-full overflow-y-auto custom-scrollbar">
                        <div className="relative flex flex-col">
                            <div className="p-6 lg:p-8 flex flex-col h-[calc(100vh-theme(spacing.4))] min-h-[800px]">
                                <AnimatePresence>
                                    {error && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-3 shadow-xl shadow-red-500/5"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            </div>
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                <div className="flex-grow w-full flex flex-col">
                                    <PromptDisplay 
                                        promptData={generatedPromptData} 
                                        isLoading={isLoadingPrompt} 
                                        onPromptChange={handlePromptUpdate}
                                        currentVersionIndex={currentHistoryIndex}
                                        totalVersions={promptHistory.length}
                                        onUndo={handleUndo}
                                        onRedo={handleRedo}
                                        targetModel={modelPreset}
                                        aspectRatio={aspectRatio}
                                    />
                                </div>
                            </div>

                            <div className="p-6 lg:p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <HistoryIcon className="w-5 h-5 text-zinc-500" />
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Generation History</h3>
                                    <div className="flex-1 h-px bg-white/5" />
                                </div>
                                <HistoryGallery history={history} onSelect={handleSelectHistory} onDelete={handleDeleteHistory} />
                                
                                {/* Social Footer */}
                                <footer className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 hover:opacity-100 transition-opacity duration-500 pb-8">
                                    <div className="flex flex-col items-center md:items-start gap-1">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Crafted with precision</div>
                                        <div className="text-xs font-medium text-zinc-400">
                                            By <a href="https://bento.me/nurfarhad" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Nur Farhad</a> • Brand Designer
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-6">
                                        <a href="https://www.linkedin.com/in/nurfarhad/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-all transform hover:scale-110" title="LinkedIn">
                                            <Linkedin className="w-5 h-5" />
                                        </a>
                                        <a href="https://www.instagram.com/nurfarhad.official/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-all transform hover:scale-110" title="Instagram">
                                            <Instagram className="w-5 h-5" />
                                        </a>
                                    </div>
                                </footer>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </main>
    </div>
  );

};

export default App;
