
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Play, 
  Trash2, 
  Download, 
  FileText, 
  Check, 
  Copy, 
  Edit2, 
  X, 
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  Layers
} from 'lucide-react';
import { generatePromptFromImage, generatePromptVariations, PromptOptions, PromptData, exportToCSV, exportToJSON } from '../services/geminiService';
import Loader from './Loader';

// Sub-component for result row with Edit/Copy actions
const PromptResultRow: React.FC<{
    text: string;
    onSave: (text: string) => void;
    label?: string;
    isVariation?: boolean;
    confidence?: number;
}> = ({ text, onSave, label, isVariation, confidence }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentText, setCurrentText] = useState(text);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(currentText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        onSave(currentText);
        setIsEditing(false);
    };

    const getConfidenceColor = (score: number) => {
        if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/20';
        if (score >= 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    };

    if (isEditing) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mt-3 ${isVariation ? 'w-full' : ''}`}
            >
                <div className="flex justify-between items-center mb-2">
                    {label && <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>}
                </div>
                <textarea 
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    className="w-full bg-brand-dark border border-brand-primary/50 rounded-xl p-3 text-xs text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 font-sans leading-relaxed min-h-[100px]"
                    autoFocus
                />
                <div className="flex justify-end gap-2 mt-3">
                    <button 
                        onClick={() => { setIsEditing(false); setCurrentText(text); }} 
                        className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-white transition-all border border-white/5 hover:bg-white/5 rounded-lg"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave} 
                        className="px-4 py-1.5 text-xs font-bold bg-brand-primary text-white rounded-lg hover:bg-blue-600 transition-all shadow-lg shadow-brand-primary/20"
                    >
                        Save Changes
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className={`group relative ${isVariation ? 'bg-white/5 p-4 rounded-xl border border-white/5' : 'mt-3'}`}>
            <div className="flex items-center justify-between mb-3">
                 {label && <span className="text-[10px] text-brand-primary font-bold uppercase tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded-full">{label}</span>}
                 {confidence !== undefined && (
                     <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getConfidenceColor(confidence)}`} title="AI Confidence Score">
                         {confidence}% Match
                     </div>
                 )}
            </div>
            
            <div className="relative bg-black/20 rounded-xl border border-white/5 p-4 font-sans text-xs text-gray-300 leading-relaxed group-hover:border-white/10 transition-all">
                <p className="whitespace-pre-wrap break-words opacity-90">
                    {text}
                </p>
                
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 bg-brand-surface rounded-lg shadow-xl border border-white/10 p-1">
                    <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors" title="Edit Prompt">
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px bg-white/5 my-1"></div>
                    <button onClick={handleCopy} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors" title="Copy to Clipboard">
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface BatchItem {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'error';
    result?: PromptData | PromptData[]; // Can handle array for variations
    errorMsg?: string;
    thumbnail?: string;
}

interface BatchProcessorProps {
    options: PromptOptions;
}

const BatchProcessor: React.FC<BatchProcessorProps> = ({ options }) => {
    const [queue, setQueue] = useState<BatchItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Variation Controls
    const [enableVariations, setEnableVariations] = useState(false);
    const [variationCount, setVariationCount] = useState(3);
    const [variationStrategy, setVariationStrategy] = useState<'style' | 'lighting' | 'emotion'>('style');

    const handleFiles = async (files: FileList | null) => {
        if (!files) return;
        const newItems: BatchItem[] = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            const thumbnailPromise = new Promise<string>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });

            const thumb = await thumbnailPromise;
            newItems.push({
                id: crypto.randomUUID(),
                file: file,
                status: 'pending',
                thumbnail: thumb
            });
        }
        setQueue(prev => [...prev, ...newItems]);
    };

    const processQueue = async () => {
        setIsProcessing(true);
        const itemsToProcess = queue.filter(item => item.status === 'pending');

        for (const item of itemsToProcess) {
            setQueue(prev => prev.map(i => i.id === item.id ? { ...i, status: 'processing' } : i));

            try {
                const reader = new FileReader();
                const base64Data = await new Promise<string>((resolve) => {
                    reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                            resolve(reader.result.split(',')[1]);
                        }
                    };
                    reader.readAsDataURL(item.file);
                });

                const imagePart = {
                    inlineData: { data: base64Data, mimeType: item.file.type }
                };

                let result;
                if (enableVariations) {
                    result = await generatePromptVariations(imagePart, options, variationStrategy, variationCount);
                } else {
                    result = await generatePromptFromImage(imagePart, options);
                }

                setQueue(prev => prev.map(i => 
                    i.id === item.id ? { ...i, status: 'completed', result: result } : i
                ));

            } catch (err: any) {
                setQueue(prev => prev.map(i => 
                    i.id === item.id ? { ...i, status: 'error', errorMsg: err.message } : i
                ));
            }
        }
        setIsProcessing(false);
    };

    const handleUpdateResult = (id: string, newText: string, variationIndex?: number) => {
        setQueue(prev => prev.map(item => {
            if (item.id !== id) return item;
            
            const currentResult = item.result;
            if (!currentResult) return item;

            if (variationIndex !== undefined && Array.isArray(currentResult)) {
                // Variations
                const newResultArray = [...currentResult];
                newResultArray[variationIndex] = { ...newResultArray[variationIndex], regular: newText };
                return { ...item, result: newResultArray };
            } else if (!Array.isArray(currentResult) && currentResult) {
                // Single
                const newResultData = { ...currentResult, regular: newText };
                return { ...item, result: newResultData };
            }
            return item;
        }));
    };

    const handleRemove = (id: string) => {
        setQueue(prev => prev.filter(i => i.id !== id));
    };

    const handleClearAll = () => {
        setQueue([]);
    };

    const handleExportCSV = () => {
        const completed = queue.filter(i => i.status === 'completed' && i.result);
        if (completed.length === 0) return;
        
        // Flatten output for CSV if variations exist
        const data: any[] = [];
        completed.forEach(i => {
            if (Array.isArray(i.result)) {
                i.result.forEach((res, idx) => {
                    data.push({
                        filename: `${i.file.name}_var${idx+1}`,
                        prompt: res.regular,
                        timestamp: new Date().toISOString()
                    });
                });
            } else if (i.result) {
                data.push({
                    filename: i.file.name,
                    prompt: (i.result as PromptData).regular,
                    timestamp: new Date().toISOString()
                });
            }
        });
        exportToCSV(data);
    };
    
    const handleExportJSON = () => {
        const completed = queue.filter(i => i.status === 'completed' && i.result);
        if (completed.length === 0) return;

        const data = completed.map(i => ({
            id: i.id,
            filename: i.file.name,
            result: i.result,
            timestamp: new Date().toISOString()
        }));
        exportToJSON(data);
    };

    return (
        <div className="flex flex-col h-full bg-brand-dark text-white p-6 overflow-hidden">
             {/* Header with Config */}
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-8 border-b border-white/5 gap-6">
                 <div>
                     <h2 className="text-2xl font-bold text-white tracking-tight">Batch Processor</h2>
                     <p className="text-gray-500 text-sm mt-1 font-medium">Generate prompts or variations for multiple images.</p>
                 </div>

                 <div className="flex flex-wrap items-center gap-4">
                     {/* Variation Settings */}
                     <div className="flex items-center space-x-4 bg-white/5 p-3 rounded-2xl border border-white/5 shadow-lg">
                         <div className="flex items-center space-x-3">
                             <div className="relative inline-flex items-center cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    id="enableVar"
                                    checked={enableVariations}
                                    onChange={(e) => setEnableVariations(e.target.checked)}
                                    className="sr-only peer"
                                 />
                                 <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                                 <label htmlFor="enableVar" className="ml-3 text-sm font-bold text-gray-300 cursor-pointer select-none">Variations</label>
                             </div>
                         </div>

                         <AnimatePresence>
                             {enableVariations && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center space-x-2"
                                >
                                    <select 
                                        value={variationStrategy}
                                        onChange={(e) => setVariationStrategy(e.target.value as any)}
                                        className="bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-brand-primary/20 text-gray-300 outline-none cursor-pointer"
                                    >
                                        <option value="style">Style</option>
                                        <option value="lighting">Lighting</option>
                                        <option value="emotion">Emotion</option>
                                    </select>
                                    <select 
                                        value={variationCount}
                                        onChange={(e) => setVariationCount(Number(e.target.value))}
                                        className="bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest rounded-lg py-1.5 px-3 focus:ring-2 focus:ring-brand-primary/20 text-gray-300 outline-none cursor-pointer"
                                    >
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                        <option value={4}>4</option>
                                    </select>
                                </motion.div>
                             )}
                         </AnimatePresence>
                     </div>

                     <div className="flex gap-3">
                         <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm font-bold text-gray-300">
                             <Plus className="w-4 h-4" />
                             Add Images
                         </button>
                         <input type="file" ref={fileInputRef} multiple accept="image/*" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                         <button onClick={processQueue} disabled={isProcessing || queue.filter(i => i.status === 'pending').length === 0} className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary hover:bg-blue-600 rounded-xl transition-all text-sm font-bold shadow-xl shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                             {isProcessing ? <Loader /> : <Play className="w-4 h-4" />}
                             {isProcessing ? 'Processing...' : 'Start Batch'}
                         </button>
                     </div>
                 </div>
             </div>

             {/* Queue List */}
             <div className="flex-1 overflow-y-auto custom-scrollbar bg-white/5 rounded-3xl border border-white/5 shadow-inner">
                 {queue.length === 0 ? (
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-full flex flex-col items-center justify-center text-gray-500 p-12 cursor-pointer border-2 border-dashed border-white/5 hover:border-white/10 hover:bg-white/5 transition-all rounded-3xl m-4 group"
                     >
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <ImageIcon className="h-10 w-10 text-gray-600" />
                        </div>
                        <p className="text-xl font-bold text-gray-400">Queue is empty</p>
                        <p className="text-sm text-gray-600 mt-2 font-medium">Click or Drag & Drop images to begin</p>
                     </div>
                 ) : (
                     <div className="p-6 grid grid-cols-1 gap-4">
                         <AnimatePresence mode="popLayout">
                             {queue.map((item) => (
                                 <motion.div 
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col bg-white/5 rounded-2xl border border-white/5 shadow-sm overflow-hidden transition-all hover:border-white/10"
                                 >
                                     {/* Item Header */}
                                     <div className="flex items-center p-4 bg-white/5 border-b border-white/5">
                                         <div className="h-14 w-14 rounded-xl bg-black flex-shrink-0 overflow-hidden border border-white/10 shadow-lg">
                                             <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                                         </div>
                                         <div className="ml-4 flex-1 min-w-0">
                                             <div className="flex justify-between items-center">
                                                 <h4 className="text-sm font-bold text-white truncate max-w-[300px]">{item.file.name}</h4>
                                                 <div className="flex items-center gap-3">
                                                     <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-widest border
                                                        ${item.status === 'pending' ? 'bg-white/5 text-gray-500 border-white/5' : ''}
                                                        ${item.status === 'processing' ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20 animate-pulse' : ''}
                                                        ${item.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : ''}
                                                        ${item.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                                     `}>{item.status}</span>
                                                     <button onClick={() => handleRemove(item.id)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                                                        <Trash2 className="h-4 w-4" />
                                                     </button>
                                                 </div>
                                             </div>
                                             <div className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-wider">{(item.file.size / 1024).toFixed(1)} KB</div>
                                         </div>
                                     </div>
                                     
                                     {/* Item Body (Results) */}
                                     <div className="px-4 pb-4">
                                         {item.status === 'completed' ? (
                                             Array.isArray(item.result) ? (
                                                 <div className="mt-4 space-y-4">
                                                     <div className="flex items-center gap-2 mb-2">
                                                         <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                                                         <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Generated {item.result.length} variations</div>
                                                     </div>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                         {item.result.map((res, idx) => (
                                                             <PromptResultRow 
                                                                key={idx}
                                                                text={res.regular}
                                                                label={`Variation ${idx + 1}`}
                                                                isVariation={true}
                                                                confidence={res.confidence}
                                                                onSave={(txt) => handleUpdateResult(item.id, txt, idx)}
                                                             />
                                                         ))}
                                                     </div>
                                                 </div>
                                             ) : (
                                                 <PromptResultRow 
                                                    text={(item.result as PromptData).regular} 
                                                    onSave={(txt) => handleUpdateResult(item.id, txt)}
                                                    confidence={(item.result as PromptData).confidence}
                                                 />
                                             )
                                         ) : item.status === 'error' ? (
                                             <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20 flex items-center gap-3">
                                                 <AlertCircle className="w-4 h-4 text-red-400" />
                                                 <p className="text-xs text-red-300 font-medium">{item.errorMsg}</p>
                                             </div>
                                         ) : item.status === 'processing' && (
                                            <div className="mt-4 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ x: '-100%' }}
                                                    animate={{ x: '100%' }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                                    className="h-full w-1/3 bg-brand-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                />
                                            </div>
                                         )}
                                     </div>
                                 </motion.div>
                             ))}
                         </AnimatePresence>
                     </div>
                 )}
             </div>

             <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                 <button onClick={handleClearAll} disabled={queue.length === 0 || isProcessing} className="text-xs font-bold text-gray-600 hover:text-white transition-colors disabled:opacity-30 uppercase tracking-widest">Clear Queue</button>
                 <div className="flex gap-3">
                     <button onClick={handleExportCSV} disabled={queue.filter(i => i.status === 'completed').length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-30 border border-white/5">
                         <FileText className="w-4 h-4" />
                         CSV
                     </button>
                     <button onClick={handleExportJSON} disabled={queue.filter(i => i.status === 'completed').length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-30 border border-white/5">
                         <Download className="w-4 h-4" />
                         JSON
                     </button>
                 </div>
             </div>
        </div>
    );
};

export default BatchProcessor;
