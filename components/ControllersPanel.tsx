
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sun, 
  ChevronDown, 
  ChevronUp, 
  Image as ImageIcon 
} from 'lucide-react';
import RelightSelector, { RelightSettings } from './RelightSelector';
import ViewpointSelector from './ViewpointSelector';
import GazeSelector from './GazeSelector';
import GeneratedImage from './GeneratedImage';
import { editImage, resizeBase64, base64ToImagePart, ImagePart, generateImage } from '../services/geminiService';
import { PromptData, ModelPreset } from '../services/geminiService';

interface ControllersPanelProps {
  promptData: PromptData | null;
  isLoading: boolean;
  targetModel?: ModelPreset;
  aspectRatio?: string | null;
  onRefinePrompt: (instruction: string) => void;
}

const ControllersPanel: React.FC<ControllersPanelProps> = ({ 
    promptData, isLoading, targetModel = 'standard', aspectRatio, onRefinePrompt
}) => {
  const [isRelightCollapsed, setIsRelightCollapsed] = useState(false);
  const [isViewpointCollapsed, setIsViewpointCollapsed] = useState(false);
  const [isGazeCollapsed, setIsGazeCollapsed] = useState(false);
  
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null); 
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleGenerateImage = async (seed?: number, subjectRef?: string | null, styleRef?: string | null) => {
      if (!promptData?.regular) return;
      setIsGeneratingImage(true);
      setImageError(null);
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
      } catch (e: any) {
          console.error("Failed to generate image", e);
          setImageError(e?.message || "Failed to generate image.");
      } finally {
          setIsGeneratingImage(false);
      }
  };
  
  const handleImageEdit = async (instruction: string) => {
      if (!generatedImageUrl) return;
      setIsGeneratingImage(true);
      setImageError(null);
      try {
          const newImageUrl = await editImage(generatedImageUrl, instruction);
          setGeneratedImageUrl(newImageUrl);
      } catch (e: any) {
          console.error("Image edit failed", e);
          setImageError(e?.message || "Failed to edit image.");
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

  const handleViewpointChange = async (view: string) => { 
      onRefinePrompt(`Update to "${view}" angle.`); 
      if (originalImageUrl) {
          setIsGeneratingImage(true);
          setImageError(null);
          try {
              const instruction = `Rotate the camera to a ${view} perspective. Keep the character, lighting, environment, and style exactly the same as the input image.`;
              const newImageUrl = await editImage(originalImageUrl, instruction);
              setGeneratedImageUrl(newImageUrl);
          } catch (e: any) {
              console.error("Failed to rotate 3D view", e);
              setImageError(e?.message || "Failed to update camera view.");
          } finally {
              setIsGeneratingImage(false);
          }
      }
  };

  const handleGazeChange = async (gaze: string) => {
      onRefinePrompt(`Make the subject ${gaze}.`);
      if (originalImageUrl) {
          setIsGeneratingImage(true);
          setImageError(null);
          try {
              const instruction = `Make the subject ${gaze}. Keep facial features, lighting, and style exactly the same as the input image. Only change the eye direction.`;
              const newImageUrl = await editImage(originalImageUrl, instruction);
              setGeneratedImageUrl(newImageUrl);
          } catch (e: any) {
              console.error("Failed to change gaze", e);
              setImageError(e?.message || "Failed to update gaze direction.");
          } finally {
              setIsGeneratingImage(false);
          }
      }
  };

  const handleRelightChange = async (settings: RelightSettings) => {
      const lightDesc = `${settings.type} ${settings.direction} lighting with ${settings.brightness}% brightness and ${settings.color} color tint`;
      onRefinePrompt(`Update lighting to: ${lightDesc}.`);
      
      if (originalImageUrl) {
          setIsGeneratingImage(true);
          setImageError(null);
          try {
              const instruction = `Change the lighting to ${lightDesc}. Maintain the subject, environment, and style exactly as they are in the input image. Only adjust the light source direction, intensity, and color.`;
              const newImageUrl = await editImage(originalImageUrl, instruction);
              setGeneratedImageUrl(newImageUrl);
          } catch (e: any) {
              console.error("Failed to relight image", e);
              setImageError(e?.message || "Failed to relight image.");
          } finally {
              setIsGeneratingImage(false);
          }
      }
  };

  return (
    <aside className="w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 scroll-smooth">
        <div className="glass-panel overflow-hidden flex flex-col shadow-2xl shrink-0">
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
                    error={imageError}
                    onDownload={handleDownloadImage}
                    onGenerate={handleGenerateImage}
                />
            </div>
        </div>

        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 px-1">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Controllers</span>
                <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Relight Controller */}
            <div className="glass-panel overflow-hidden flex flex-col shadow-xl">
                <button 
                    onClick={() => setIsRelightCollapsed(!isRelightCollapsed)}
                    className="w-full p-3 flex items-center justify-between bg-zinc-950/50 hover:bg-zinc-950 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <Sun className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Relight Engine</span>
                    </div>
                    {isRelightCollapsed ? <ChevronDown className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />}
                </button>
                <AnimatePresence initial={false}>
                    {!isRelightCollapsed && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <RelightSelector onSelect={handleRelightChange} disabled={isLoading || isGeneratingImage} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-2 gap-4 shrink-0" style={{ opacity: isLoading || isGeneratingImage ? 0.5 : 1, pointerEvents: isLoading || isGeneratingImage ? 'none' : 'auto' }}>
                {/* Viewpoint Controller */}
                <div className="glass-panel overflow-hidden flex flex-col shadow-xl">
                    <button 
                        onClick={() => setIsViewpointCollapsed(!isViewpointCollapsed)}
                        className="w-full p-3 flex items-center justify-between bg-zinc-950/50 hover:bg-zinc-950 transition-colors"
                    >
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">3D View</span>
                        {isViewpointCollapsed ? <ChevronDown className="w-3 h-3 text-zinc-600" /> : <ChevronUp className="w-3 h-3 text-zinc-600" />}
                    </button>
                    <AnimatePresence initial={false}>
                        {!isViewpointCollapsed && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden p-4 flex flex-col items-center"
                            >
                                <ViewpointSelector onSelect={handleViewpointChange} disabled={isLoading || isGeneratingImage} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Gaze Controller */}
                <div className="glass-panel overflow-hidden flex flex-col shadow-xl">
                    <button 
                        onClick={() => setIsGazeCollapsed(!isGazeCollapsed)}
                        className="w-full p-3 flex items-center justify-between bg-zinc-950/50 hover:bg-zinc-950 transition-colors"
                    >
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Eye Gaze</span>
                        {isGazeCollapsed ? <ChevronDown className="w-3 h-3 text-zinc-600" /> : <ChevronUp className="w-3 h-3 text-zinc-600" />}
                    </button>
                    <AnimatePresence initial={false}>
                        {!isGazeCollapsed && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden p-4 flex flex-col items-center"
                            >
                                <GazeSelector onSelect={handleGazeChange} disabled={isLoading || isGeneratingImage} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    </aside>
  );
};

export default ControllersPanel;
