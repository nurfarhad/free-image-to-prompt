
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  Wand2, 
  History as HistoryIcon, 
  Undo2, 
  Redo2, 
  Sparkles, 
  Mic, 
  Paperclip, 
  Send, 
  X, 
  Eye, 
  Code, 
  FileJson, 
  ShieldAlert, 
  BarChart3, 
  ChevronRight,
  Maximize2,
  Minimize2,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { refinePromptWithGemini, compressPrompt, predictModelOutcome, ImagePart, PromptData, ModelPreset, generateImage, gradePrompt, editImage, resizeBase64, base64ToImagePart } from '../services/geminiService';
import Tooltip from './Tooltip';
import ViewpointSelector from './ViewpointSelector';
import GazeSelector from './GazeSelector';
import DecompositionView from './DecompositionView';
import VoiceInput from './VoiceInput';
import GeneratedImage from './GeneratedImage';
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
  versionHistory?: PromptData[]; 
  onSelectVersion?: (index: number) => void;
  targetModel?: ModelPreset;
  aspectRatio?: string | null;
}

type ViewMode = 'regular' | 'json' | 'negative' | 'decomposition' | 'preview' | 'grade';

const PromptDisplay: React.FC<PromptDisplayProps> = ({ 
    promptData, isLoading, onPromptChange,
    currentVersionIndex, totalVersions, onUndo, onRedo,
    versionHistory, onSelectVersion, targetModel = 'standard', aspectRatio
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('regular');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isWeightingMode, setIsWeightingMode] = useState(false);
  const [showMagicTools, setShowMagicTools] = useState(false);
  
  const [predictionText, setPredictionText] = useState<string>('');
  const [isPredicting, setIsPredicting] = useState(false);
  
  const [isGrading, setIsGrading] = useState(false);
  const [gradeData, setGradeData] = useState<PromptData['grade'] | null>(null);

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null); 
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState<number>(currentVersionIndex > 0 ? currentVersionIndex - 1 : 0);
  
  const [refineImageFile, setRefineImageFile] = useState<File | null>(null);
  const [refineImageDataUrl, setRefineImageDataUrl] = useState<string | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (copyStatus === 'copied') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  useEffect(() => {
      if (viewMode === 'grade' && promptData?.regular && !gradeData) {
          handleGradePrompt();
      }
      if (viewMode === 'preview' && promptData?.regular && !predictionText) {
          handlePredict();
      }
  }, [viewMode, promptData]);

  useEffect(() => {
      setGradeData(null);
  }, [promptData]);

  const handlePredict = async () => {
    if (!promptData?.regular) return;
    setIsPredicting(true);
    try {
        const text = await predictModelOutcome(promptData.regular, targetModel as ModelPreset);
        setPredictionText(text);
    } catch (e) {
        setPredictionText("Could not generate prediction.");
    } finally {
        setIsPredicting(false);
    }
  };
  
  const handleGradePrompt = async () => {
      if (!promptData?.regular) return;
      setIsGrading(true);
      try {
          const result = await gradePrompt(promptData.regular);
          setGradeData(result);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGrading(false);
      }
  };

  const handleGenerateImage = async (seed?: number, subjectRef?: string | null, styleRef?: string | null) => {
      if (!promptData?.regular) return;
      setIsGeneratingImage(true);
      try {
          const ar = aspectRatio || "1:1";
          
          let subjectPart: ImagePart | null = null;
          if (subjectRef) {
              const resized = await resizeBase64(subjectRef, 1280);
              subjectPart = base64ToImagePart(resized);
          }

          let stylePart: ImagePart | null = null;
          if (styleRef) {
              const resized = await resizeBase64(styleRef, 1280);
              stylePart = base64ToImagePart(resized);
          }

          const imageUrl = await generateImage(promptData.regular, { 
              aspectRatio: ar, 
              seed,
              subjectReference: subjectPart,
              styleReference: stylePart
          });
          setGeneratedImageUrl(imageUrl);
          setOriginalImageUrl(imageUrl);
      } catch (e) {
          console.error("Failed to generate image", e);
      } finally {
          setIsGeneratingImage(false);
      }
  };
  
  const handleImageEdit = async (instruction: string) => {
      if (!generatedImageUrl) return;
      setIsGeneratingImage(true);
      setRefineError('');
      try {
          const newImageUrl = await editImage(generatedImageUrl, instruction);
          setGeneratedImageUrl(newImageUrl);
          setChatInput('');
      } catch (e: any) {
          setRefineError(e.message || "Image edit failed.");
      } finally {
          setIsGeneratingImage(false);
      }
  };
  
  const handleDownloadImage = () => {
      if (generatedImageUrl) {
          const link = document.createElement('a');
          link.href = generatedImageUrl;
          link.download = `generated_image_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (!isLoading && viewMode !== 'decomposition') {
        adjustTextareaHeight();
    }
  }, [promptData, viewMode, isLoading, compareMode, isWeightingMode]);

  const getCurrentText = () => {
    if (!promptData) return '';
    if (viewMode === 'regular') return promptData.regular;
    if (viewMode === 'negative') return promptData.negative || "";
    if (viewMode === 'json') return promptData.json && Object.keys(promptData.json).length > 0 ? JSON.stringify(promptData.json, null, 2) : "";
    return '';
  };
  
  const getTokenCount = () => {
      const text = getCurrentText();
      if (!text) return 0;
      return Math.ceil(text.trim().split(/\s+/).length * 1.3);
  };

  const handleCopy = () => {
    const text = getCurrentText();
    if (text) {
      navigator.clipboard.writeText(text);
      setCopyStatus('copied');
    }
  };
  
  const handleDebloat = () => {
      if(!promptData) return;
      const text = promptData.regular;
      const clean = text.replace(/(An image of|A photo of|There is|Picture of|captured in|features|depicts)\s*/gi, "");
      onPromptChange({...promptData, regular: clean.charAt(0).toUpperCase() + clean.slice(1)});
      setShowMagicTools(false);
  };
  
  const handleFormatMidjourney = () => {
      if(!promptData) return;
      let text = promptData.regular;
      if(aspectRatio && !text.includes('--ar')) {
          text += ` --ar ${aspectRatio.replace(':', ':')}`;
      }
      if(!text.includes('--v')) {
          text += ` --v 6.0`;
      }
      onPromptChange({...promptData, regular: text});
      setShowMagicTools(false);
  };

  const handleCompress = async () => {
      if (!promptData?.regular) return;
      setIsCompressing(true);
      try {
          const compressed = await compressPrompt(promptData.regular);
          onPromptChange({ ...promptData, regular: compressed });
      } catch (e) {
          console.error(e);
      } finally {
          setIsCompressing(false);
      }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // If promptData is missing, we initialize it on first type
    const baseData = promptData || { regular: '', json: {}, confidence: 0 };
    const newValue = e.target.value;
    
    if (viewMode === 'regular') {
        onPromptChange({ ...baseData, regular: newValue });
    } else if (viewMode === 'negative') {
        onPromptChange({ ...baseData, negative: newValue });
    } else if (viewMode === 'json') {
        try {
            const parsed = JSON.parse(newValue);
            onPromptChange({ ...baseData, json: parsed });
        } catch (err) { 
             onPromptChange({ ...baseData, regular: baseData.regular }); // Just trigger update to keep state in sync
        }
    }
  };

  const executeRefinement = async (overrideInstruction?: string) => { 
    const instruction = overrideInstruction || chatInput;
    if ((!instruction.trim() && !refineImageFile)) return;
    setIsRefining(true);
    setRefineError('');
    try {
      let imagePart: ImagePart | undefined;
      if (refineImageFile) {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => { if (typeof reader.result === 'string') resolve(reader.result); };
            reader.readAsDataURL(refineImageFile);
        });
        const rawBase64 = await base64EncodedDataPromise;
        const resizedBase64 = await resizeBase64(rawBase64);
        
        const data = resizedBase64.split(',')[1];
        imagePart = { inlineData: { data: data, mimeType: 'image/jpeg' } };
      }
      
      const baseData = promptData || { regular: '', json: {}, confidence: 0 };
      const refinedData = await refinePromptWithGemini(baseData, instruction, imagePart);
      onPromptChange(refinedData);
      if (!overrideInstruction) setChatInput('');
      setRefineImageFile(null);
      setRefineImageDataUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) { 
        console.error(err);
        setRefineError(err.message || 'Failed to refine.'); 
    } finally { setIsRefining(false); }
  };
  
  const handleRefineSubmit = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      await executeRefinement(); 
  };

  const handleVoiceInput = (text: string) => { setChatInput(prev => (prev ? `${prev} ${text}` : text)); };
  
  const handleViewpointChange = async (view: string) => { 
      executeRefinement(`Update to "${view}" angle.`); 
      if (originalImageUrl) {
          setIsGeneratingImage(true);
          try {
              const instruction = `Rotate the camera to a ${view} perspective. Keep the character, lighting, environment, and style exactly the same as the input image.`;
              const newImageUrl = await editImage(originalImageUrl, instruction);
              setGeneratedImageUrl(newImageUrl);
          } catch (e) {
              console.error("Failed to rotate 3D view", e);
          } finally {
              setIsGeneratingImage(false);
          }
      }
  };

  const handleGazeChange = async (gaze: string) => {
      executeRefinement(`Make the subject ${gaze}.`);
      if (originalImageUrl) {
          setIsGeneratingImage(true);
          try {
              const instruction = `Make the subject ${gaze}. Keep facial features, lighting, and style exactly the same as the input image. Only change the eye direction.`;
              const newImageUrl = await editImage(originalImageUrl, instruction);
              setGeneratedImageUrl(newImageUrl);
          } catch (e) {
              console.error("Failed to change gaze", e);
          } finally {
              setIsGeneratingImage(false);
          }
      }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefineSubmit(e); } };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRefineImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setRefineImageDataUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };
  const handleRemoveImage = () => {
    setRefineImageFile(null);
    setRefineImageDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleWordClick = (clickedIndex: number, parts: string[]) => {
      if (!promptData) return;
      const part = parts[clickedIndex];
      const weightRegex = /^\((.+):(\d+(\.\d+)?)\)$/;
      const match = part.match(weightRegex);
      let newPart = part;
      if (match) {
          const word = match[1];
          const weight = parseFloat(match[2]);
          if (weight >= 1.5) newPart = word;
          else newPart = `(${word}:${(weight + 0.2).toFixed(1)})`;
      } else {
          if (part.trim().length > 0 && !/^[.,;:!?]+$/.test(part)) newPart = `(${part}:1.1)`;
      }
      if (newPart !== part) {
          const newParts = [...parts];
          newParts[clickedIndex] = newPart;
          onPromptChange({ ...promptData, regular: newParts.join('') });
      }
  };

  const renderWeightedText = () => {
      if (!promptData?.regular) return <div className="p-4 text-gray-500 italic">No text to weight.</div>;
      const parts = promptData.regular.split(/([\s,.;:!?]+)/);
      return (
          <div className="w-full h-full p-4 font-sans text-lg text-gray-200 bg-transparent overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {parts.map((part, i) => {
                  const isWeighted = /^\(.+:\d+(\.\d+)?\)$/.test(part);
                  const isDelimiter = /^[\s,.;:!?]+$/.test(part);
                  if (isDelimiter || part.trim() === '') return <span key={i}>{part}</span>;
                  let weightVal = 0;
                  if (isWeighted) {
                      const match = part.match(/:(\d+(\.\d+)?)\)$/);
                      if(match) weightVal = parseFloat(match[1]);
                  }
                  return (
                      <span key={i} onClick={() => handleWordClick(i, parts)}
                          className={`cursor-pointer rounded px-0.5 transition-colors select-none ${isWeighted ? 'bg-brand-primary/30 text-brand-primary border border-brand-primary/50' : 'hover:bg-gray-700 hover:text-white'}`}
                          title={isWeighted ? `Weight: ${weightVal}` : "Click to add weight"}
                      >{part}</span>
                  );
              })}
          </div>
      );
  };

  const TABS = [
      { id: 'regular', label: 'Prompt', icon: <Code className="w-3.5 h-3.5" />, tooltip: 'Main generation prompt.' },
      { id: 'json', label: 'JSON', icon: <FileJson className="w-3.5 h-3.5" />, tooltip: 'Structured prompt data.' },
      { id: 'negative', label: 'Negative', icon: <ShieldAlert className="w-3.5 h-3.5" />, tooltip: 'Excluded elements.' },
      { id: 'decomposition', label: 'Analysis', icon: <BarChart3 className="w-3.5 h-3.5" />, tooltip: 'Visual breakdown.' },
      { id: 'grade', label: 'Audit', icon: <Check className="w-3.5 h-3.5" />, tooltip: 'Quality assessment.' },
      { id: 'preview', label: 'Predict', icon: <Eye className="w-3.5 h-3.5" />, tooltip: 'AI outcome simulation.' },
  ];

  return (
    <div className="flex flex-col h-full gap-6 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/40 backdrop-blur-md rounded-2xl p-2 border border-white/5 shrink-0">
            <nav className="flex items-center p-1 bg-zinc-950 rounded-xl border border-white/5 overflow-x-auto max-w-full custom-scrollbar">
                {TABS.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setViewMode(tab.id as ViewMode)} 
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                            viewMode === tab.id ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </nav>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {viewMode === 'regular' && promptData && (
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
                        <Tooltip content="Magic Tools" position="bottom">
                            <div className="relative">
                                <button 
                                    onClick={() => setShowMagicTools(!showMagicTools)} 
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        showMagicTools ? "bg-blue-500/10 text-blue-500" : "text-zinc-500 hover:text-white"
                                    )}
                                >
                                    <Wand2 className="w-4 h-4" />
                                </button>
                                <AnimatePresence>
                                    {showMagicTools && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                            className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 p-2 flex flex-col gap-1"
                                        >
                                            <button onClick={handleDebloat} className="text-[10px] font-bold uppercase tracking-widest text-left px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">De-bloat Text</button>
                                            <button onClick={handleCompress} className="text-[10px] font-bold uppercase tracking-widest text-left px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Compress Keywords</button>
                                            <button onClick={handleFormatMidjourney} className="text-[10px] font-bold uppercase tracking-widest text-left px-4 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">Midjourney Format</button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </Tooltip>
                        
                        <Tooltip content={isWeightingMode ? "Exit Weighting" : "Visual Weighting"} position="bottom">
                            <button 
                                onClick={() => setIsWeightingMode(!isWeightingMode)} 
                                className={cn(
                                    "p-2 rounded-lg transition-all",
                                    isWeightingMode ? "bg-blue-500/10 text-blue-500" : "text-zinc-500 hover:text-white"
                                )}
                            >
                                <BarChart3 className="w-4 h-4" />
                            </button>
                        </Tooltip>
                    </div>
                )}

                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/5">
                    <button onClick={onUndo} disabled={currentVersionIndex === 0} className="p-2 text-zinc-500 hover:text-white disabled:opacity-20 transition-all">
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <div 
                        onClick={() => setShowHistorySidebar(!showHistorySidebar)} 
                        className="px-3 py-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer hover:text-white transition-all bg-white/5 rounded-lg"
                    >
                        v{currentVersionIndex + 1}
                    </div>
                    <button onClick={onRedo} disabled={currentVersionIndex === totalVersions - 1} className="p-2 text-zinc-500 hover:text-white disabled:opacity-20 transition-all">
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>

                {promptData && !isLoading && (
                    <button 
                        onClick={handleCopy} 
                        className="btn-primary flex items-center gap-2 py-2 px-4 text-xs"
                    >
                        {copyStatus === 'copied' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copyStatus === 'copied' ? 'Copied' : 'Copy'}
                    </button>
                )}
            </div>
      </header>
      
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">
        <div className="flex-1 flex flex-col glass-panel overflow-hidden relative">
            {viewMode === 'regular' && promptData && (
                <div className="absolute top-4 right-6 z-10 px-3 py-1.5 bg-zinc-950/80 backdrop-blur-md rounded-full border border-white/5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest pointer-events-none">
                    {getTokenCount()} Tokens
                </div>
            )}

            <div className={cn(
                "flex-grow bg-zinc-950/20 relative flex overflow-y-auto custom-scrollbar",
                compareMode ? "flex-row" : "flex-col"
            )}>
                <AnimatePresence>
                    {isLoading && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 space-y-6 z-20 bg-zinc-950/80 backdrop-blur-xl"
                        >
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
                                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-500 animate-pulse" />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="font-bold uppercase tracking-[0.3em] text-xs text-zinc-200">Synthesizing Vision</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Applying Neural Filters</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {viewMode === 'grade' && (
                     <div className="w-full h-full p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                <Check className="w-5 h-5 text-green-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Prompt Audit Report</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Quality & Compliance Check</p>
                            </div>
                        </div>

                        {isGrading ? (
                            <div className="flex flex-col gap-4">
                                <div className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-40 bg-zinc-900/50 rounded-2xl animate-pulse" />
                                    <div className="h-40 bg-zinc-900/50 rounded-2xl animate-pulse" />
                                </div>
                            </div>
                        ) : gradeData ? (
                            <div className="space-y-8">
                                <div className="flex items-center gap-6 bg-zinc-900/50 p-6 rounded-2xl border border-white/5">
                                    <div className={cn(
                                        "text-5xl font-black tracking-tighter",
                                        gradeData.score >= 8 ? "text-green-500" : gradeData.score >= 5 ? "text-yellow-500" : "text-red-500"
                                    )}>
                                        {gradeData.score}<span className="text-xl text-zinc-600">/10</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Overall Quality</span>
                                        <div className="w-48 h-2 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${gradeData.score * 10}%` }}
                                                className={cn(
                                                    "h-full rounded-full",
                                                    gradeData.score >= 8 ? "bg-green-500" : gradeData.score >= 5 ? "bg-yellow-500" : "bg-red-500"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-green-500/5 border border-green-500/10 p-6 rounded-2xl">
                                        <h4 className="text-green-500 font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                                            <Check className="w-4 h-4" /> Strengths
                                        </h4>
                                        <ul className="space-y-3">
                                            {gradeData.feedback.map((f, i) => (
                                                <li key={i} className="text-sm text-zinc-300 flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl">
                                        <h4 className="text-blue-500 font-bold mb-4 text-xs uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" /> Suggestions
                                        </h4>
                                        <ul className="space-y-3">
                                            {gradeData.suggestions.map((s, i) => (
                                                <li key={i} className="text-sm text-zinc-300 flex items-start gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                     </div>
                )}

                {viewMode === 'preview' && (
                    <div className="w-full h-full p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">AI Outcome Simulation</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Predicting {targetModel} engine results</p>
                            </div>
                        </div>
                        {isPredicting ? (
                            <div className="space-y-4">
                                <div className="h-4 bg-zinc-900/50 rounded-full w-3/4 animate-pulse" />
                                <div className="h-4 bg-zinc-900/50 rounded-full w-1/2 animate-pulse" />
                                <div className="h-4 bg-zinc-900/50 rounded-full w-2/3 animate-pulse" />
                            </div>
                        ) : (
                            <div className="bg-zinc-900/50 p-6 rounded-2xl border border-white/5 text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium italic">
                                "{predictionText}"
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'decomposition' && promptData && (
                    <DecompositionView data={promptData.json} />
                )}

                {(viewMode === 'regular' || viewMode === 'negative' || viewMode === 'json') && (
                    <div className="flex-1 flex flex-col">
                    {viewMode === 'regular' && isWeightingMode ? (
                        renderWeightedText()
                    ) : (
                        <textarea
                            ref={textareaRef}
                            value={getCurrentText()}
                            onChange={handleManualChange}
                            placeholder="Type or generate a prompt..."
                            className={cn(
                                "w-full p-8 focus:ring-0 focus:outline-none placeholder-zinc-700 overflow-hidden resize-none leading-relaxed bg-transparent min-h-[300px] transition-all",
                                viewMode === 'json' ? "font-mono text-sm text-blue-400" : "font-sans text-xl font-medium text-zinc-100",
                                compareMode && "w-1/2 border-r border-white/5"
                            )}
                            spellCheck="false"
                        />
                    )}
                    {compareMode && versionHistory && versionHistory[compareIndex] && viewMode === 'regular' && (
                        <div className="w-1/2 h-full bg-zinc-950/50 p-8 border-l border-white/5 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-2 mb-4">
                                <HistoryIcon className="w-3.5 h-3.5 text-zinc-500" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Comparing with Version {compareIndex + 1}</span>
                            </div>
                            <p className="text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                                {versionHistory[compareIndex].regular}
                            </p>
                        </div>
                    )}
                    </div>
                )}

                <AnimatePresence>
                    {showHistorySidebar && versionHistory && (
                        <motion.aside 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute right-0 top-0 bottom-0 w-72 bg-zinc-900 border-l border-white/10 shadow-2xl z-30 flex flex-col"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-950">
                                <div className="flex items-center gap-2">
                                    <HistoryIcon className="w-4 h-4 text-zinc-500" />
                                    <span className="font-bold text-xs uppercase tracking-widest text-zinc-200">Version History</span>
                                </div>
                                <button onClick={() => setShowHistorySidebar(false)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                                    <X className="w-4 h-4 text-zinc-500" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                {versionHistory.map((v, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => { if (onSelectVersion) onSelectVersion(idx); if (compareMode) setCompareIndex(idx); }} 
                                        className={cn(
                                            "w-full p-4 rounded-xl text-left transition-all border mb-1 group",
                                            idx === currentVersionIndex 
                                                ? "bg-blue-500/10 border-blue-500/20" 
                                                : "bg-transparent border-transparent hover:bg-white/5"
                                        )}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest",
                                                idx === currentVersionIndex ? "text-blue-500" : "text-zinc-600"
                                            )}>Version {idx + 1}</span>
                                            {idx === currentVersionIndex && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                                        </div>
                                        <p className={cn(
                                            "text-[11px] leading-relaxed line-clamp-2",
                                            idx === currentVersionIndex ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                                        )}>{v.regular}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="p-4 border-t border-white/5 bg-zinc-950">
                                <button 
                                    onClick={() => setCompareMode(!compareMode)} 
                                    className={cn(
                                        "w-full py-3 text-[10px] font-bold rounded-xl uppercase tracking-widest transition-all border",
                                        compareMode 
                                            ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20" 
                                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                                    )}
                                >
                                    {compareMode ? 'Exit Comparison' : 'Compare Versions'}
                                </button>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {viewMode !== 'decomposition' && viewMode !== 'preview' && viewMode !== 'grade' && (
            <footer className={cn(
                "bg-zinc-900/50 p-6 border-t border-white/5 shrink-0 transition-all duration-500",
                (isLoading || isGeneratingImage) && "opacity-50 pointer-events-none"
            )}>
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
                                onClick={handleRemoveImage} 
                                className="absolute -top-2 -right-2 bg-zinc-900 text-white rounded-full p-1.5 border border-white/10 shadow-xl hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleRefineSubmit} className="relative group">
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" disabled={isLoading || isGeneratingImage} />
                    <div className="relative">
                        <textarea 
                            value={chatInput} 
                            onChange={(e) => setChatInput(e.target.value)} 
                            onKeyDown={handleKeyDown} 
                            disabled={isLoading || isRefining || isGeneratingImage} 
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
                            <VoiceInput onTranscript={handleVoiceInput} disabled={isLoading || isRefining || isGeneratingImage} />
                            <button 
                                type="submit" 
                                disabled={(!chatInput.trim() && !refineImageFile) || isRefining || isGeneratingImage} 
                                className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-30 transition-all shadow-lg shadow-blue-600/20"
                            >
                                {isRefining || isGeneratingImage ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>
                </form>
                {refineError && (
                    <motion.p 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-[10px] font-bold uppercase tracking-widest mt-3 ml-1"
                    >
                        {refineError}
                    </motion.p>
                )}
            </footer>
            )}
        </div>

        <aside className="w-full lg:w-[400px] xl:w-[450px] flex flex-col gap-6">
            <div className="flex-1 glass-panel overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-white/5 bg-zinc-950/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Visualizer Engine</span>
                    </div>
                    <div className="px-2 py-0.5 bg-zinc-900 rounded text-[9px] font-bold text-zinc-600 border border-white/5 uppercase tracking-widest">
                        {aspectRatio || '1:1'}
                    </div>
                </div>
                <div className="flex-1 relative min-h-[350px]">
                    <GeneratedImage 
                        imageUrl={generatedImageUrl} 
                        isLoading={isGeneratingImage} 
                        onDownload={handleDownloadImage}
                        onGenerate={handleGenerateImage}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ opacity: isLoading || isRefining || isGeneratingImage ? 0.5 : 1, pointerEvents: isLoading || isRefining || isGeneratingImage ? 'none' : 'auto' }}>
                <div className="glass-panel p-4 flex flex-col items-center shadow-xl">
                    <ViewpointSelector onSelect={handleViewpointChange} disabled={isLoading || isRefining || isGeneratingImage} />
                </div>
                <div className="glass-panel p-4 flex flex-col items-center shadow-xl">
                    <GazeSelector onSelect={handleGazeChange} disabled={isLoading || isRefining || isGeneratingImage} />
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
};

export default PromptDisplay;
