
import React, { useRef } from 'react';
import SourceTypeSelector from './SourceTypeSelector';
import ThemeSelector from './ThemeSelector';
import GenderSelector from './GenderSelector';
import VoiceInput from './VoiceInput';
import Tooltip from './Tooltip';

interface AdditionalContextProps {
  sourceType: string | null;
  setSourceType: (val: string | null) => void;
  themeMode: 'light' | 'dark' | null;
  setThemeMode: (val: 'light' | 'dark' | null) => void;
  subjectGender: 'male' | 'female' | 'non-binary' | null;
  setSubjectGender: (val: 'male' | 'female' | 'non-binary' | null) => void;
  userDescription: string;
  setUserDescription: (val: string) => void;
  ctxRefFile: File | null;
  setCtxRefFile: (file: File | null) => void;
  ctxRefBase64: string | null;
  setCtxRefBase64: (base64: string | null) => void;
  isLoading: boolean;
}

const AdditionalContext: React.FC<AdditionalContextProps> = ({
  sourceType, setSourceType,
  themeMode, setThemeMode,
  subjectGender, setSubjectGender,
  userDescription, setUserDescription,
  ctxRefFile, setCtxRefFile,
  ctxRefBase64, setCtxRefBase64,
  isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCtxRefFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setCtxRefBase64(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setCtxRefFile(null);
    setCtxRefBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVoiceInput = (text: string) => {
    setUserDescription(userDescription ? `${userDescription} ${text}` : text);
  };

  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-4 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Additional Context</h3>
        </div>
        <span className="text-[10px] text-zinc-500 font-bold px-2 py-0.5 rounded-full bg-zinc-950 border border-white/5 uppercase tracking-tighter">Optional</span>
      </div>

      <SourceTypeSelector 
        selectedType={sourceType}
        onSelectType={setSourceType}
        disabled={isLoading}
      />

      <div className="grid grid-cols-2 gap-3">
        <ThemeSelector 
          selectedMode={themeMode}
          onSelectMode={setThemeMode}
          disabled={isLoading}
        />
        <GenderSelector 
          selectedGender={subjectGender}
          onSelectGender={setSubjectGender}
          disabled={isLoading}
        />
      </div>

      {/* Attachment-style Image & Text Area */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instructions</label>
          {ctxRefBase64 && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="relative group">
                <img src={ctxRefBase64} alt="Ref" className="h-6 w-6 object-cover rounded border border-brand-primary" />
                <button 
                  onClick={handleRemoveImage}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <span className="text-[9px] text-brand-primary font-bold">IMAGE ATTACHED</span>
            </div>
          )}
        </div>

        <div className="relative group">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          <textarea
            value={userDescription}
            onChange={(e) => setUserDescription(e.target.value)}
            disabled={isLoading}
            placeholder="Describe changes or guide the AI (e.g. 'Red hair', '80s style')..."
            rows={3}
            className="w-full bg-brand-dark border border-gray-700 text-gray-300 text-sm rounded-lg pl-3 pr-16 py-3 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-all placeholder-gray-600 resize-none"
          />

          <div className="absolute right-2 bottom-2 flex items-center space-x-1 bg-brand-dark/80 backdrop-blur-sm rounded-md p-1 border border-gray-800 opacity-60 group-hover:opacity-100 transition-opacity">
            <Tooltip content="Attach Image Reference" position="top">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
            </Tooltip>
            <VoiceInput onTranscript={handleVoiceInput} disabled={isLoading} className="p-1.5" />
          </div>
        </div>
        <p className="text-[9px] text-gray-600 leading-tight italic px-1">
          Text and image instructions here will take priority over the main analysis.
        </p>
      </div>
    </div>
  );
};

export default AdditionalContext;
