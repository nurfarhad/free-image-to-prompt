import React, { useState, useEffect, useRef } from 'react';
import { refinePromptWithGemini, PromptData } from '../services/geminiService';

interface PromptDisplayProps {
  promptData: PromptData | null;
  isLoading: boolean;
  onPromptChange: (newPromptData: PromptData) => void;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({ promptData, isLoading, onPromptChange }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState('');
  const [viewMode, setViewMode] = useState<'regular' | 'html'>('regular');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (copyStatus === 'copied') {
      const timer = setTimeout(() => setCopyStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyStatus]);

  const currentPromptText = promptData ? promptData[viewMode] : '';

  // Auto-resize textarea to fit content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset to auto to calculate new height correctly
      // Set to scrollHeight but enforce a minimum of 300px (or whatever visual min-height you prefer)
      const newHeight = Math.max(textarea.scrollHeight, 300);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Adjust height whenever text or view mode changes
  useEffect(() => {
    if (!isLoading) {
        adjustTextareaHeight();
    }
  }, [currentPromptText, viewMode, isLoading]);

  // Adjust height on window resize (e.g. mobile orientation change)
  useEffect(() => {
    window.addEventListener('resize', adjustTextareaHeight);
    return () => window.removeEventListener('resize', adjustTextareaHeight);
  }, []);

  const handleCopy = () => {
    if (currentPromptText) {
      navigator.clipboard.writeText(currentPromptText);
      setCopyStatus('copied');
    }
  };

  const handleManualChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (promptData) {
      onPromptChange({
        ...promptData,
        [viewMode]: e.target.value
      });
    }
  };

  const executeRefinement = async () => {
    if (!chatInput.trim() || !promptData) return;

    setIsRefining(true);
    setRefineError('');

    try {
      const refinedPrompts = await refinePromptWithGemini(promptData, chatInput);
      onPromptChange(refinedPrompts);
      setChatInput('');
    } catch (err) {
      setRefineError('Failed to refine prompt. Try again.');
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeRefinement();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeRefinement();
    }
  };

  const CopyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const SparkleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );

  return (
    <div className="min-h-full flex flex-col bg-brand-gray rounded-lg p-4 shadow-lg border border-brand-surface">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-200">Prompt</h2>
            
            {/* Toggle Switch */}
            <div className="bg-brand-surface rounded-lg p-1 flex items-center border border-gray-700">
               <button 
                  onClick={() => setViewMode('regular')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'regular' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
               >
                 Regular
               </button>
               <button 
                  onClick={() => setViewMode('html')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'html' ? 'bg-brand-primary text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
               >
                 HTML
               </button>
            </div>
        </div>
        
        {promptData && !isLoading && (
          <button
            onClick={handleCopy}
            className="flex items-center px-3 py-1.5 bg-gray-700 text-sm text-gray-300 rounded-md hover:bg-brand-primary transition-colors"
          >
            {copyStatus === 'copied' ? <CheckIcon/> : <CopyIcon/>}
            {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      <div className="flex-grow flex flex-col min-h-[300px] relative">
        <div className="flex-grow bg-brand-dark rounded-t-md p-4 relative">
             {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[300px] text-gray-400">
                    <span>Generating your creative prompts...</span>
                </div>
            ) : (
            <textarea
                ref={textareaRef}
                value={currentPromptText}
                onChange={handleManualChange}
                placeholder={viewMode === 'html' ? "Structured code (JSON/HTML) will appear here." : "Regular text prompt will appear here."}
                className={`w-full bg-transparent border-none text-gray-300 text-lg leading-relaxed focus:ring-0 focus:outline-none placeholder-gray-600 overflow-hidden ${viewMode === 'html' ? 'font-mono text-sm' : 'font-sans'}`}
                spellCheck="false"
                style={{ minHeight: '300px' }}
            />
            )}
        </div>

        {/* Gemini Refine Chat Section */}
        {promptData && !isLoading && (
          <div className="bg-brand-dark rounded-b-md p-3 border-t border-gray-800">
             <div className="flex items-center mb-2">
                 <div className="bg-brand-secondary/20 p-1 rounded-full mr-2">
                     <SparkleIcon />
                 </div>
                 <span className="text-xs font-medium text-brand-secondary uppercase tracking-wide">Refine with Gemini</span>
             </div>
             
             <form onSubmit={handleRefineSubmit} className="relative group">
                <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isRefining}
                    placeholder="Ask Gemini to change something (updates both Regular and HTML versions)..."
                    rows={1}
                    className="w-full bg-brand-surface border border-gray-700 text-gray-300 text-sm rounded-lg pl-4 pr-12 py-3 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-all placeholder-gray-500 disabled:opacity-50 resize-y min-h-[50px] scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                />
                <button
                    type="submit"
                    disabled={!chatInput.trim() || isRefining}
                    className="absolute right-2 top-2 p-1.5 bg-brand-primary text-white rounded-md hover:brightness-110 disabled:opacity-50 disabled:bg-gray-700 transition-all shadow-sm"
                >
                    {isRefining ? (
                         <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>
             </form>
             {refineError && (
                 <p className="text-red-400 text-xs mt-2 ml-1">{refineError}</p>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptDisplay;