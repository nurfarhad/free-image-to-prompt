import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import PromptDisplay from './components/PromptDisplay';
import Loader from './components/Loader';
import AspectRatioSelector from './components/AspectRatioSelector';
import HistoryGallery, { HistoryItem } from './components/HistoryGallery';
import { generatePromptFromImage, PromptData } from './services/geminiService';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  // Change generatedPrompt from string to PromptData object or null
  const [generatedPrompt, setGeneratedPrompt] = useState<PromptData | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]);
        }
      };
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          const maxWidth = 300;
          const scaleFactor = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scaleFactor;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = (file: File | null) => {
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setGeneratedPrompt(null);
      setError('');
    }
  };

  const handleGeneratePrompt = useCallback(async () => {
    if (!imageFile) {
      setError('Please select an image first.');
      return;
    }

    setIsLoadingPrompt(true);
    setError('');
    setGeneratedPrompt(null);

    try {
      const imagePart = await fileToGenerativePart(imageFile);
      const promptData = await generatePromptFromImage(imagePart, aspectRatio);
      setGeneratedPrompt(promptData);

      // Add to history
      const thumbnail = await createThumbnail(imageFile);
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        thumbnailUrl: thumbnail,
        prompts: promptData,
        aspectRatio: aspectRatio,
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
  }, [imageFile, aspectRatio]);

  const handleClear = () => {
    setImageFile(null);
    setImageDataUrl(null);
    setGeneratedPrompt(null);
    setError('');
    setIsLoadingPrompt(false);
    setAspectRatio('1:1');
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setGeneratedPrompt(item.prompts);
    setAspectRatio(item.aspectRatio);
    setImageDataUrl(item.thumbnailUrl);
    setImageFile(null); // Clear file as we are viewing history
    setError('');
    
    // Scroll to top to see the result
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-brand-dark font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <Header />
        <main className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="flex flex-col space-y-6">
              <ImageUploader imageDataUrl={imageDataUrl} onImageSelect={handleImageSelect} />
              
              <div className="bg-brand-surface p-4 rounded-xl border border-gray-800">
                <AspectRatioSelector 
                  selectedRatio={aspectRatio} 
                  onSelectRatio={setAspectRatio} 
                  disabled={isLoadingPrompt}
                />
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleGeneratePrompt}
                  disabled={!imageFile || isLoadingPrompt}
                  className="w-full flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-brand-primary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {isLoadingPrompt ? (
                    <>
                      <Loader />
                      Analyzing...
                    </>
                  ) : (
                    'Generate Prompt'
                  )}
                </button>
                {imageDataUrl && (
                  <button
                    onClick={handleClear}
                    disabled={isLoadingPrompt}
                    className="px-6 py-3 border border-gray-700 text-base font-medium rounded-full shadow-sm text-white bg-brand-surface hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 disabled:opacity-50 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="relative flex flex-col h-full">
              {error && <div className="mb-4 p-4 bg-red-900/30 border border-red-800 text-red-200 rounded-lg text-sm">{error}</div>}
              
              <PromptDisplay 
                promptData={generatedPrompt} 
                isLoading={isLoadingPrompt} 
                onPromptChange={setGeneratedPrompt}
              />
            </div>
          </div>
          
          <HistoryGallery 
            history={history} 
            onSelect={handleSelectHistory} 
            onDelete={handleDeleteHistory} 
          />
        </main>
      </div>
    </div>
  );
};

export default App;