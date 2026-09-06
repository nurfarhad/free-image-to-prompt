
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
  History as HistoryIcon,
  ShieldAlert,
  Split
} from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import PromptDisplay from './components/PromptDisplay';
import ControllersPanel from './components/ControllersPanel';
import NeuralRefinement from './components/NeuralRefinement';
import Loader from './components/Loader';
import HistoryGallery, { HistoryItem } from './components/HistoryGallery';
import ConfigurationPanel from './components/ConfigurationPanel';
import BatchProcessor from './components/BatchProcessor';
import StyleTransfer from './components/StyleTransfer';
import { 
  generatePromptFromImage, 
  refinePromptWithGemini,
  PromptData, 
  ModelPreset, 
  PromptOptions, 
  exportToJSON, 
  base64ToImagePart, 
  CameraSettings,
  resizeBase64
} from './services/geminiService';
import { PersonaType, PersonaIntensity } from './components/PersonaSelector';
import { auth, db, storage, signInWithGoogle } from './services/firebaseConfig';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, orderBy, deleteDoc, doc, limit } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import GeneratedImage from './components/GeneratedImage';
import CharacterConsistencyPanel from './components/CharacterConsistencyPanel';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AppViewMode = 'editor' | 'batch' | 'style_transfer';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<AppViewMode>('editor');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
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
  
  // New Professional Features State
  const [coreTraits, setCoreTraits] = useState<string>('');
  const [enableNegative, setEnableNegative] = useState<boolean>(false);
  const [enableABMode, setEnableABMode] = useState<boolean>(false);

  // Neural Refinement State
  const [chatInput, setChatInput] = useState('');
  const [refineImageFile, setRefineImageFile] = useState<File | null>(null);
  const [refineImageDataUrl, setRefineImageDataUrl] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  // Camera Settings State
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
      focalLength: null,
      aperture: null,
      shutterSpeed: null,
      iso: null,
      filmType: null
  });
  
  const [showBgUploader, setShowBgUploader] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch history from Firestore when user is signed in
  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const historyQuery = query(
      collection(db, 'history'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
      const items: HistoryItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as HistoryItem));
      setHistory(items);
    }, (err) => {
      console.warn("Firestore history subscription warning:", err);
    });

    return () => unsubscribe();
  }, [user]);

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
      contextReference: ctxRefBase64 ? base64ToImagePart(ctxRefBase64, ctxRefFile?.type) : null,
      coreTraits,
      enableNegative,
      enableABMode
  });

  const handleGeneratePrompt = useCallback(async () => {
    if (!effectiveImageData) {
      setError('Please select an image first.');
      return;
    }

    setIsLoadingPrompt(true);
    setError('');

    try {
      // Create empty placeholder entry in history for streaming
      const placeholder: PromptData = { regular: '', json: {}, confidence: 0 };
      
      let nextIndex = 0;
      setPromptHistory(prev => {
          const historySnapshot = [...prev.slice(0, currentHistoryIndex + 1), placeholder];
          nextIndex = historySnapshot.length - 1;
          return historySnapshot;
      });
      setCurrentHistoryIndex(prev => {
          // We need to be careful with indexing if history is large
          return prev + 1;
      });

      // Use effective image (cropped or full)
      const imagePart = base64ToImagePart(effectiveImageData, imageFile?.type);
      const options = getPromptOptions();
      
      const data = await generatePromptFromImage(imagePart, options, (partial) => {
          setPromptHistory(prev => {
              const updated = [...prev];
              const idx = updated.length - 1; // Assuming it's the last one we just added
              updated[idx] = { ...updated[idx], ...partial };
              return updated;
          });
      });
      
      // Update with final data
      setPromptHistory(prev => {
          const updated = [...prev];
          const idx = updated.length - 1;
          updated[idx] = data;
          return updated;
      });

      // KEY FIX: Release UI lock as soon as prompt is generated
      setIsLoadingPrompt(false);

      // Add to global gallery history
      const newItem: Omit<HistoryItem, 'id'> = {
        thumbnailUrl: effectiveImageData, // Placeholder
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

      if (user) {
        try {
          // Upload to Storage
          const fileName = `user-uploads/${user.uid}/${Date.now()}.png`;
          const storageRef = ref(storage, fileName);
          await uploadString(storageRef, effectiveImageData, 'data_url');
          const downloadUrl = await getDownloadURL(storageRef);
          
          // Save to Firestore
          await addDoc(collection(db, 'history'), {
            ...newItem,
            userId: user.uid,
            thumbnailUrl: downloadUrl // Store URL instead of base64
          });
        } catch (syncErr) {
          console.warn("Could not sync history to cloud, falling back to local history:", syncErr);
          setHistory(prev => [{ ...newItem, id: crypto.randomUUID() } as HistoryItem, ...prev]);
        }
      } else {
        // Local history for guests
        setHistory(prev => [{ ...newItem, id: crypto.randomUUID() } as HistoryItem, ...prev]);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate prompt. ${errorMessage}`);
      console.error(err);
    } finally {
      // Ensure it's false in case of error, but it's redundant if we set it earlier in success path
      setIsLoadingPrompt(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveImageData, imageFile, currentHistoryIndex, aspectRatio, isUniversalMode, isCharacterBuilderMode, userDescription, modelPreset, cameraAngle, lighting, visualStyle, colorPalette, colorTemperature, texture, animationStyle, persona, personaIntensity, detailWeight, realismBalance, cameraSettings, sourceType, themeMode, subjectGender, bgBase64, bgFile, ctxRefBase64, ctxRefFile, coreTraits, enableNegative, enableABMode]);

  const handleRefinePrompt = async (instruction: string, referenceImage?: string | null) => {
    if (!generatedPromptData || !generatedPromptData.regular) return;
    
    setIsRefining(true);
    setRefineError(null);
    try {
        let referencePart = null;
        if (referenceImage) {
            const resized = await resizeBase64(referenceImage, 1024);
            referencePart = base64ToImagePart(resized);
        }

        const refined = await refinePromptWithGemini(generatedPromptData, instruction, referencePart || undefined);
        handlePromptUpdate(refined);
        setChatInput('');
        setRefineImageFile(null);
        setRefineImageDataUrl(null);
    } catch (e: any) {
        setRefineError(e.message || "Failed to refine prompt.");
    } finally {
        setIsRefining(false);
    }
  };

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !refineImageDataUrl) return;
    handleRefinePrompt(chatInput, refineImageDataUrl);
  };

  const handleRefineFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRefineImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setRefineImageDataUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveRefineImage = () => {
    setRefineImageFile(null);
    setRefineImageDataUrl(null);
  };

  const handleRefineVoiceInput = (text: string) => {
    setChatInput(text);
    handleRefinePrompt(text, refineImageDataUrl);
  };

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

  const handleDeleteHistory = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'history', id));
      } catch (err) {
        console.error("Error deleting document:", err);
      }
    } else {
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };
  
  const handleDownloadProject = () => {
      if(history.length === 0) {
          setError("No history to download.");
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
              {isAuthLoading ? (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
              ) : user ? (
                  <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end hidden sm:flex">
                          <span className="text-[10px] font-bold text-white leading-none">{user.displayName}</span>
                          <button onClick={() => signOut(auth)} className="text-[9px] text-zinc-500 hover:text-red-400 transition-colors uppercase tracking-widest font-bold mt-1">Logout</button>
                      </div>
                      <img src={user.photoURL || ''} alt="User" className="w-8 h-8 rounded-full border border-white/10" />
                  </div>
              ) : (
                  <button 
                    onClick={signInWithGoogle}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-all active:scale-95"
                  >
                      Sign In
                  </button>
              )}
              <div className="h-4 w-px bg-zinc-800"></div>
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
                    className="flex-1 flex overflow-hidden lg:flex-row flex-col"
                >
                    {/* Left Panel: Configuration */}
                    <aside className="w-full lg:w-[450px] flex flex-col border-r border-white/5 bg-zinc-950 h-full shrink-0">
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
                                    heightClass="h-56" 
                                />
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Professional Tools</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setEnableNegative(!enableNegative)}
                                        className={cn(
                                            "flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left group",
                                            enableNegative ? "bg-red-500/10 border-red-500/20" : "bg-zinc-900/50 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <ShieldAlert className={cn("w-5 h-5", enableNegative ? "text-red-500" : "text-zinc-600 group-hover:text-zinc-400")} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-100">Negative</span>
                                            <span className="text-[8px] text-zinc-500 uppercase font-bold">Auto-Gen</span>
                                        </div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => setEnableABMode(!enableABMode)}
                                        className={cn(
                                            "flex flex-col gap-2 p-4 rounded-2xl border transition-all text-left group",
                                            enableABMode ? "bg-purple-500/10 border-purple-500/20" : "bg-zinc-900/50 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <Split className={cn("w-5 h-5", enableABMode ? "text-purple-500" : "text-zinc-600 group-hover:text-zinc-400")} />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-100">A/B Mode</span>
                                            <span className="text-[8px] text-zinc-500 uppercase font-bold">Variations</span>
                                        </div>
                                    </button>
                                </div>
                            </section>

                            <CharacterConsistencyPanel 
                                coreTraits={coreTraits}
                                onTraitsChange={setCoreTraits}
                                disabled={isLoadingPrompt}
                            />
                            
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
                                    <><Loader /><span className="animate-pulse">Analyzing...</span></>
                                ) : (
                                    <><Zap className="w-4 h-4 fill-current" /> Generate Prompt</>
                                )}
                            </button>
                        </div>
                    </aside>                    {/* Middle Column: Canvas & Refinement */}
                    <div className="flex-1 flex flex-col bg-[#09090b] relative h-full overflow-hidden">
                        <div className="flex-1 flex lg:flex-row flex-col overflow-hidden">
                            {/* Main Editor Canvas */}
                            <div className="flex-1 flex flex-col border-r border-white/5 relative h-full overflow-hidden">
                                <div className="flex-1 p-6 lg:p-8 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
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
                                    
                                    <div className="h-[75vh] min-h-[550px] flex flex-col shrink-0">
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
                                            chatInput={chatInput}
                                            setChatInput={setChatInput}
                                            refineImageFile={refineImageFile}
                                            refineImageDataUrl={refineImageDataUrl}
                                            onRemoveImage={handleRemoveRefineImage}
                                            onFileSelect={handleRefineFileSelect}
                                            onRefineSubmit={handleRefineSubmit}
                                            onVoiceInput={handleRefineVoiceInput}
                                            isRefining={isRefining}
                                            refineError={refineError}
                                        />
                                    </div>

                                    <section className="mt-8 space-y-6 shrink-0 pb-10 flex-1">
                                        <div className="flex items-center gap-3">
                                            <HistoryIcon className="w-5 h-5 text-zinc-500" />
                                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Generation History</h3>
                                            <div className="flex-1 h-px bg-white/5" />
                                        </div>
                                        <HistoryGallery history={history} onSelect={handleSelectHistory} onDelete={handleDeleteHistory} />
                                    </section>
                                </div>
                            </div>

                            {/* Right: Controllers & Visualizer */}
                            <aside className="w-full lg:w-[450px] bg-zinc-950/30 p-6 overflow-y-auto custom-scrollbar h-full hidden lg:block shrink-0">
                                <ControllersPanel 
                                    promptData={generatedPromptData}
                                    isLoading={isLoadingPrompt}
                                    targetModel={modelPreset}
                                    aspectRatio={aspectRatio}
                                    onRefinePrompt={handleRefinePrompt}
                                />
                            </aside>
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
