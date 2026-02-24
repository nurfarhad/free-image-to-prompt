
import React, { useState, useRef } from 'react';
import Tooltip from './Tooltip';

interface GeneratedImageProps {
  imageUrl: string | null;
  isLoading: boolean;
  onDownload: () => void;
  onGenerate?: (seed?: number, subjectRef?: string | null, styleRef?: string | null) => void;
}

const GeneratedImage: React.FC<GeneratedImageProps> = ({ imageUrl, isLoading, onDownload, onGenerate }) => {
  const [seed, setSeed] = useState<string>('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  // Reference States
  const [subjectRef, setSubjectRef] = useState<string | null>(null);
  const [styleRef, setStyleRef] = useState<string | null>(null);
  
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateClick = () => {
      if(onGenerate) {
          const seedNum = seed.trim() !== '' ? parseInt(seed) : undefined;
          onGenerate(seedNum, subjectRef, styleRef);
      }
  };

  const handleFileRead = (file: File, callback: (base64: string) => void) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          if (typeof e.target?.result === 'string') callback(e.target.result);
      };
      reader.readAsDataURL(file);
  };

  return (
    <>
        <div className="w-full h-full flex flex-col p-4 bg-black/20">
        
        {/* Advanced References Section */}
        <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Subject/Face Reference */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Face Ref.</span>
                    {subjectRef && <button onClick={() => setSubjectRef(null)} className="text-[9px] text-red-400">CLEAR</button>}
                </div>
                <div 
                    onClick={() => subjectInputRef.current?.click()}
                    className={`relative h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${subjectRef ? 'border-brand-primary bg-brand-primary/5' : 'border-gray-700 hover:border-gray-500 bg-brand-dark'}`}
                >
                    {subjectRef ? (
                        <img src={subjectRef} alt="Subject Reference" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center opacity-40">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-[9px] font-bold">IDENTITY</span>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={subjectInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => e.target.files?.[0] && handleFileRead(e.target.files[0], setSubjectRef)} 
                    />
                </div>
            </div>

            {/* Style/Vibe Reference */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Style Ref.</span>
                    {styleRef && <button onClick={() => setStyleRef(null)} className="text-[9px] text-red-400">CLEAR</button>}
                </div>
                <div 
                    onClick={() => styleInputRef.current?.click()}
                    className={`relative h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${styleRef ? 'border-brand-secondary bg-brand-secondary/5' : 'border-gray-700 hover:border-gray-500 bg-brand-dark'}`}
                >
                    {styleRef ? (
                        <img src={styleRef} alt="Style Reference" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center opacity-40">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            <span className="text-[9px] font-bold">AESTHETIC</span>
                        </div>
                    )}
                    <input 
                        type="file" 
                        ref={styleInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => e.target.files?.[0] && handleFileRead(e.target.files[0], setStyleRef)} 
                    />
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 mb-4 w-full z-10">
            <button 
                onClick={handleGenerateClick}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-brand-primary to-blue-600 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-brand-primary/20 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 flex items-center justify-center"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processing...
                    </>
                ) : (imageUrl ? 'Regenerate Image' : 'Generate Preview')}
            </button>
            
            <input 
                type="number" 
                placeholder="Seed (Optional)" 
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="w-full bg-brand-dark border border-gray-700 text-xs text-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all shadow-sm text-center placeholder-gray-600"
            />
        </div>

        {/* Main Display */}
        <div className="relative flex-1 w-full flex items-center justify-center rounded-xl overflow-hidden bg-brand-dark/50 border border-gray-800/50 shadow-inner min-h-[250px]">
            {isLoading ? (
            <div className="flex flex-col items-center space-y-4 animate-pulse">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-400 text-xs font-medium tracking-wide">Synthesizing Pixels...</p>
            </div>
            ) : imageUrl ? (
            <div className="relative w-full h-full flex items-center justify-center group bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
                <img 
                    src={imageUrl} 
                    alt="Generated by Gemini" 
                    className="max-w-full max-h-full object-contain shadow-2xl" 
                />
                
                <div 
                    onClick={() => setIsLightboxOpen(true)}
                    className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-brand-primary text-white rounded-lg cursor-pointer backdrop-blur-md shadow-lg transition-all transform hover:scale-110 z-20 border border-white/10"
                    title="View Fullscreen"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px] gap-3 pointer-events-none">
                    <div className="pointer-events-auto flex flex-col gap-3">
                        <button
                            onClick={onDownload}
                            className="inline-flex items-center px-4 py-2 bg-white text-brand-dark font-bold rounded-full shadow-2xl hover:scale-105 transition-transform text-xs"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download PNG
                        </button>
                    </div>
                </div>
            </div>
            ) : (
                <div className="text-center text-gray-600 p-4">
                    <div className="w-12 h-12 rounded-full bg-gray-800 mx-auto mb-3 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500">No Image Yet</p>
                    <p className="text-[10px] mt-1 text-gray-600 max-w-[150px] mx-auto">
                        Edit your prompt on the left, then click Generate.
                    </p>
                </div>
            )}
        </div>
        </div>

        {isLightboxOpen && imageUrl && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center animate-fade-in p-4">
                <div className="relative w-full h-full max-w-7xl max-h-screen flex items-center justify-center">
                    <button 
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-4 right-4 z-50 p-3 bg-gray-800/50 hover:bg-gray-700 text-white rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img src={imageUrl} alt="Full Screen" className="max-w-full max-h-full object-contain rounded shadow-2xl" />
                    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4">
                        <button
                            onClick={onDownload}
                            className="inline-flex items-center px-6 py-3 bg-brand-primary text-white font-bold rounded-full shadow-lg hover:bg-blue-600 transition-transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download High-Res
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default GeneratedImage;
