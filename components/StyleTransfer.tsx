
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Image as ImageIcon, 
  Palette, 
  ChevronRight, 
  ChevronDown,
  ShieldCheck,
  Trash2,
  AlertCircle,
  Wand2,
  History as HistoryIcon
} from 'lucide-react';
import ImageUploader from './ImageUploader';
import PromptDisplay from './PromptDisplay';
import HistoryGallery, { HistoryItem } from './HistoryGallery';
import AspectRatioSelector from './AspectRatioSelector';
import ModelSelector from './ModelSelector';
import Loader from './Loader';
import Tooltip from './Tooltip';
import AdditionalContext from './AdditionalContext';
import { PromptData, generateStyleTransferPrompt, base64ToImagePart, ModelPreset } from '../services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const StyleTransfer: React.FC = () => {
    const [subjectFile, setSubjectFile] = useState<File | null>(null);
    const [subjectBase64, setSubjectBase64] = useState<string | null>(null);
    const [styleFile, setStyleFile] = useState<File | null>(null);
    const [styleBase64, setStyleBase64] = useState<string | null>(null);
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgBase64, setBgBase64] = useState<string | null>(null);
    
    // Additional Context States
    const [userDescription, setUserDescription] = useState<string>('');
    const [sourceType, setSourceType] = useState<string | null>(null);
    const [themeMode, setThemeMode] = useState<'light' | 'dark' | null>(null);
    const [subjectGender, setSubjectGender] = useState<'male' | 'female' | 'non-binary' | null>(null);
    const [ctxRefFile, setCtxRefFile] = useState<File | null>(null);
    const [ctxRefBase64, setCtxRefBase64] = useState<string | null>(null);

    const [aspectRatio, setAspectRatio] = useState<string | null>(null);
    const [modelPreset, setModelPreset] = useState<ModelPreset>('standard');
    const [styleStrength, setStyleStrength] = useState<number>(50);
    const [showBgUploader, setShowBgUploader] = useState(false);
    const [isUniversalMode, setIsUniversalMode] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // Initialize with empty prompt
    const [promptHistory, setPromptHistory] = useState<PromptData[]>([{ regular: '', json: {}, confidence: 0 }]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(0);
    const [galleryHistory, setGalleryHistory] = useState<HistoryItem[]>([]);

    const generatedPromptData = promptHistory[currentHistoryIndex];

    const handleGenerate = async () => {
        if (!subjectBase64 || !styleBase64) {
            setError("Please upload both a Subject and a Style image.");
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const subjectPart = base64ToImagePart(subjectBase64, subjectFile?.type);
            const stylePart = base64ToImagePart(styleBase64, styleFile?.type);
            const bgPart = bgBase64 ? base64ToImagePart(bgBase64, bgFile?.type) : null;
            
            const data = await generateStyleTransferPrompt(subjectPart, stylePart, { 
                aspectRatio, 
                userDescription: userDescription,
                backgroundReference: bgPart,
                preset: modelPreset,
                styleStrength: styleStrength,
                isUniversal: isUniversalMode,
                sourceType: sourceType
            });
            const newHistory = [...promptHistory.slice(0, currentHistoryIndex + 1), data];
            setPromptHistory(newHistory);
            setCurrentHistoryIndex(newHistory.length - 1);
            const newItem: HistoryItem = {
                id: crypto.randomUUID(),
                thumbnailUrl: subjectBase64,
                promptData: data,
                aspectRatio: aspectRatio,
                sourceType: sourceType,
                themeMode,
                subjectGender,
                timestamp: Date.now(),
            };
            setGalleryHistory(prev => [newItem, ...prev]);
        } catch (e: any) {
            setError(e.message || "Style transfer failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePromptUpdate = (newData: PromptData) => {
        const newHistory = [...promptHistory.slice(0, currentHistoryIndex + 1), newData];
        setPromptHistory(newHistory);
        setCurrentHistoryIndex(newHistory.length - 1);
    };

    // Fix: Added handleUndo to resolve "Cannot find name 'handleUndo'" error
    const handleUndo = () => {
        if (currentHistoryIndex > 0) {
            setCurrentHistoryIndex(prev => prev - 1);
        }
    };

    // Fix: Added handleRedo to resolve "Cannot find name 'handleRedo'" error
    const handleRedo = () => {
        if (currentHistoryIndex < promptHistory.length - 1) {
            setCurrentHistoryIndex(prev => prev + 1);
        }
    };

    const handleClear = () => {
        setSubjectFile(null); setSubjectBase64(null);
        setStyleFile(null); setStyleBase64(null);
        setBgFile(null); setBgBase64(null);
        setUserDescription(''); setAspectRatio(null);
        setPromptHistory([{ regular: '', json: {}, confidence: 0 }]); setCurrentHistoryIndex(0);
        setError(''); setStyleStrength(50);
        setModelPreset('standard'); setIsUniversalMode(false);
        setSourceType(null); setThemeMode(null); setSubjectGender(null);
        setCtxRefFile(null); setCtxRefBase64(null);
    };

    const handleSelectHistory = (item: HistoryItem) => {
        setPromptHistory([item.promptData]);
        setCurrentHistoryIndex(0);
        setAspectRatio(item.aspectRatio);
        setSubjectBase64(item.thumbnailUrl);
        setIsUniversalMode(item.promptData.isUniversal || false);
        setSourceType(item.sourceType || null);
        setThemeMode(item.themeMode || null);
        setSubjectGender(item.subjectGender || null);
    };

    const isStyleModified = styleStrength !== 50;

    return (
        <div className="flex h-full bg-zinc-950 text-zinc-100 overflow-hidden">
            <aside className="w-full lg:w-[400px] xl:w-[450px] flex flex-col border-r border-white/5 bg-zinc-900/20 h-full max-h-full">
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <header className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                            <Layers className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Style Engine</h2>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Neural Style Fusion</p>
                        </div>
                    </header>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subject Source</label>
                        </div>
                        <ImageUploader imageFile={subjectFile} onImageSelect={setSubjectFile} onEffectiveImageChange={setSubjectBase64} heightClass="h-44" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Palette className="w-3.5 h-3.5 text-zinc-500" />
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Style Source</label>
                        </div>
                        <ImageUploader imageFile={styleFile} onImageSelect={setStyleFile} onEffectiveImageChange={setStyleBase64} heightClass="h-44" />
                    </div>

                    <div className="space-y-4">
                        <button 
                            onClick={() => setShowBgUploader(!showBgUploader)} 
                            className="flex items-center justify-between w-full p-4 bg-zinc-900/50 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <ImageIcon className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-200">Background Reference</span>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", showBgUploader && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                            {(showBgUploader || bgBase64) && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="h-40 pt-2">
                                         <ImageUploader imageFile={bgFile} onImageSelect={setBgFile} onEffectiveImageChange={setBgBase64} heightClass="h-40" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="glass-panel p-4 space-y-6">
                         <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Master Prompt</span>
                                   <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Omit identity traits</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsUniversalMode(!isUniversalMode)} 
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
                         </div>

                        <ModelSelector selectedPreset={modelPreset} onSelectPreset={setModelPreset} disabled={isLoading} />
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-zinc-500" />
                                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Style Intensity</label>
                                </div>
                                <span className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-lg border uppercase tracking-widest",
                                    isStyleModified ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : "text-zinc-500 bg-zinc-900 border-white/5"
                                )}>{styleStrength}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={styleStrength} 
                                onChange={(e) => setStyleStrength(Number(e.target.value))} 
                                disabled={isLoading} 
                                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                            />
                        </div>
                    </div>

                    <div className="glass-panel p-4">
                        <AspectRatioSelector selectedRatio={aspectRatio} onSelectRatio={setAspectRatio} disabled={isLoading} />
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

                <footer className="p-6 border-t border-white/5 bg-zinc-950/50 backdrop-blur-xl z-10 shrink-0 flex gap-3">
                    <button 
                        onClick={handleGenerate} 
                        disabled={isLoading || !subjectBase64 || !styleBase64} 
                        className="btn-primary flex-1 py-4 flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="uppercase tracking-widest text-xs font-bold">Synthesizing...</span>
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                <span className="uppercase tracking-widest text-xs font-bold">Generate Vision</span>
                            </>
                        )}
                    </button>
                    {(subjectBase64 || styleBase64) && (
                        <button 
                            onClick={handleClear} 
                            disabled={isLoading} 
                            className="p-4 bg-zinc-900 text-zinc-400 rounded-2xl border border-white/5 hover:text-white hover:bg-zinc-800 transition-all"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    )}
                </footer>
            </aside>

            <main className="flex-1 flex flex-col bg-zinc-950 h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-8 relative flex flex-col custom-scrollbar">
                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 shadow-2xl"
                            >
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <div className="flex-grow w-full flex flex-col gap-12">
                        <PromptDisplay 
                            promptData={generatedPromptData} 
                            isLoading={isLoading} 
                            onPromptChange={handlePromptUpdate} 
                            currentVersionIndex={currentHistoryIndex} 
                            totalVersions={promptHistory.length} 
                            onUndo={handleUndo} 
                            onRedo={handleRedo} 
                            targetModel={modelPreset} 
                            aspectRatio={aspectRatio} 
                        />
                        
                        <section className="mt-8">
                            <div className="flex items-center gap-3 mb-6">
                                <HistoryIcon className="w-5 h-5 text-zinc-500" />
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Generation History</h3>
                            </div>
                            <HistoryGallery 
                                history={galleryHistory} 
                                onSelect={handleSelectHistory} 
                                onDelete={(id) => setGalleryHistory(prev => prev.filter(i => i.id !== id))} 
                            />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StyleTransfer;
