
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Link as LinkIcon, 
  Target, 
  Info, 
  X, 
  Copy, 
  Check,
  Image as ImageIcon,
  MousePointer2
} from 'lucide-react';
import Tooltip from './Tooltip';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ImageUploaderProps {
  imageFile: File | null;
  onImageSelect: (file: File | null) => void;
  onEffectiveImageChange: (base64Data: string) => void;
  heightClass?: string;
}

// Simple PNG metadata parser
const extractPngMetadata = async (file: File): Promise<string | null> => {
    if (file.type !== 'image/png') return null;
    
    try {
        const buffer = await file.arrayBuffer();
        const view = new DataView(buffer);
        const uint8 = new Uint8Array(buffer);
        
        // PNG Signature
        if (view.getUint32(0) !== 0x89504E47) return null;
        
        let offset = 8;
        let metadata = '';
        
        while (offset < buffer.byteLength) {
            const length = view.getUint32(offset);
            const type = String.fromCharCode(
                uint8[offset + 4], uint8[offset + 5], uint8[offset + 6], uint8[offset + 7]
            );
            
            if (type === 'tEXt') {
                // Keyword + null + text
                let i = offset + 8;
                let keyword = '';
                while (uint8[i] !== 0 && i < offset + 8 + length) {
                    keyword += String.fromCharCode(uint8[i]);
                    i++;
                }
                i++; // skip null
                let text = '';
                while (i < offset + 8 + length) {
                    text += String.fromCharCode(uint8[i]);
                    i++;
                }
                // Common AI parameter key is 'parameters' or 'Description'
                if (keyword === 'parameters' || keyword === 'Description' || keyword === 'Comment') {
                   metadata += `[${keyword}]:\n${text}\n\n`;
                }
            }
            
            offset += 12 + length; // Length(4) + Type(4) + Data(Length) + CRC(4)
        }
        return metadata || null;
    } catch (e) {
        console.error("Error reading PNG metadata", e);
        return null;
    }
};

const ImageUploader: React.FC<ImageUploaderProps> = ({ imageFile, onImageSelect, onEffectiveImageChange, heightClass = 'h-64' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<string | null>(null);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  
  // ROI / Crop State
  const [isROIActive, setIsROIActive] = useState(false);
  const [selection, setSelection] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (imageFile) {
        // Create preview
        const url = URL.createObjectURL(imageFile);
        setPreviewUrl(url);
        
        // Extract Metadata
        extractPngMetadata(imageFile).then(setMetadata);
        
        // Initial Effective Image (Full Image) - Triggered via the imgRef onload/effect below
        // We do not set it here immediately to ensure we use the resize logic
        
        return () => URL.revokeObjectURL(url);
    } else {
        setPreviewUrl(null);
        setMetadata(null);
        setSelection(null);
        setIsROIActive(false);
    }
  }, [imageFile]);

  // Handle Cropping / Effective Image generation with RESIZING
  useEffect(() => {
      if (previewUrl && imgRef.current) {
          const processImage = () => {
             const img = imgRef.current;
             if (!img) return;

             const canvas = document.createElement('canvas');
             const ctx = canvas.getContext('2d');
             if (!ctx) return;

             const MAX_DIMENSION = 1536; // Limit to prevent massive payloads

             // Determine output format. Force convert AVIF to JPEG.
             let outputType = imageFile?.type || 'image/png';
             if (outputType === 'image/avif') {
                 outputType = 'image/jpeg';
             }

             if (selection && isROIActive) {
                 // Crop Logic
                 const scaleX = img.naturalWidth / img.width;
                 const scaleY = img.naturalHeight / img.height;

                 const sx = selection.x * scaleX;
                 const sy = selection.y * scaleY;
                 const sWidth = selection.w * scaleX;
                 const sHeight = selection.h * scaleY;

                 if (sWidth > 0 && sHeight > 0) {
                    // Resize logic for crop
                    let targetWidth = sWidth;
                    let targetHeight = sHeight;

                    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
                        const ratio = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
                        targetWidth *= ratio;
                        targetHeight *= ratio;
                    }

                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    
                    // High quality scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);
                    const croppedData = canvas.toDataURL(outputType, 0.9);
                    onEffectiveImageChange(croppedData);
                 }
             } else {
                 // Full Image Logic with Resize
                 let targetWidth = img.naturalWidth;
                 let targetHeight = img.naturalHeight;

                 if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
                     const ratio = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
                     targetWidth *= ratio;
                     targetHeight *= ratio;
                 }

                 canvas.width = targetWidth;
                 canvas.height = targetHeight;

                 ctx.imageSmoothingEnabled = true;
                 ctx.imageSmoothingQuality = 'high';

                 ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                 const fullData = canvas.toDataURL(outputType, 0.9);
                 onEffectiveImageChange(fullData);
             }
          };

          // If the image is already loaded, process immediately, else wait for load
          if (imgRef.current.complete) {
              processImage();
          } else {
              imgRef.current.onload = processImage;
          }
      }
  }, [selection, isROIActive, previewUrl, imageFile]); // Added dependencies


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onImageSelect(event.target.files[0]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      onImageSelect(event.dataTransfer.files[0]);
    }
  };

  // ROI Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
      if (!isROIActive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setStartPos({ x, y });
      setSelection({ x, y, w: 0, h: 0 });
      setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!isDragging || !isROIActive || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      
      const width = currentX - startPos.x;
      const height = currentY - startPos.y;

      setSelection({
          x: width > 0 ? startPos.x : currentX,
          y: height > 0 ? startPos.y : currentY,
          w: Math.abs(width),
          h: Math.abs(height)
      });
  };

  const handleMouseUp = () => {
      setIsDragging(false);
  };

  // Paste & URL Handling
  const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile();
              if (file) onImageSelect(file);
              return;
          } else if (items[i].type === 'text/plain') {
               items[i].getAsString(async (text) => {
                   if (text.match(/^https?:\/\/.*/)) {
                       setUrlInput(text);
                       setShowUrlInput(true);
                   }
               });
          }
      }
  };

  const fetchImageFromUrl = async () => {
      if (!urlInput) return;
      setIsLoadingUrl(true);
      try {
          const response = await fetch(urlInput);
          if (!response.ok) throw new Error('Failed to fetch');
          const blob = await response.blob();
          const file = new File([blob], "imported_image.png", { type: blob.type });
          onImageSelect(file);
          setShowUrlInput(false);
          setUrlInput('');
      } catch (e) {
          alert("Could not load image. If the URL is correct, the server might block direct access (CORS). Try saving the image and uploading it.");
      } finally {
          setIsLoadingUrl(false);
      }
  };

  return (
    <div className="w-full relative group">
      <div
        ref={containerRef}
        className={cn(
            "w-full rounded-2xl border-2 relative overflow-hidden transition-all duration-500",
            heightClass,
            isROIActive 
                ? "cursor-crosshair border-blue-500 ring-4 ring-blue-500/10" 
                : "cursor-default border-zinc-800 border-dashed hover:border-blue-500/50 hover:bg-zinc-900/50"
        )}
        onDrop={!isROIActive ? handleDrop : undefined}
        onDragOver={(e) => e.preventDefault()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onPaste={handlePaste}
        tabIndex={0}
      >
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
        />
        
        {previewUrl ? (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 w-full h-full"
            >
                <img 
                    ref={imgRef}
                    src={previewUrl} 
                    alt="Uploaded preview" 
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none p-2" 
                />
                
                {/* ROI Selection Overlay */}
                {isROIActive && selection && selection.w > 0 && (
                    <div 
                        className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
                        style={{
                            left: selection.x,
                            top: selection.y,
                            width: selection.w,
                            height: selection.h
                        }}
                    >
                        <div className="absolute -top-7 left-0 bg-blue-600 text-white text-[10px] px-2 py-1 rounded-md font-bold shadow-lg flex items-center gap-1.5">
                            <Target className="w-3 h-3" />
                            FOCUS REGION
                        </div>
                    </div>
                )}
            </motion.div>
        ) : (
            <div 
                className="absolute inset-0 flex flex-col items-center justify-center p-8 cursor-pointer outline-none"
                onClick={() => !showUrlInput && fileInputRef.current?.click()}
            >
                <AnimatePresence mode="wait">
                    {showUrlInput ? (
                        <motion.div 
                            key="url-input"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-sm bg-zinc-900/90 p-6 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl" 
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <LinkIcon className="w-4 h-4 text-blue-500" />
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Import from URL</label>
                            </div>
                            <input 
                                type="text" 
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://images.unsplash.com/..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white mb-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button 
                                    onClick={fetchImageFromUrl}
                                    disabled={isLoadingUrl}
                                    className="flex-1 btn-primary py-2 text-xs"
                                >
                                    {isLoadingUrl ? 'Fetching...' : 'Import Image'}
                                </button>
                                <button 
                                    onClick={() => setShowUrlInput(false)}
                                    className="px-4 btn-secondary py-2 text-xs"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="upload-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 border border-white/5 group-hover:scale-110 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-500">
                                <Upload className="w-8 h-8 text-zinc-600 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <p className="text-sm text-zinc-400 max-w-[200px] leading-relaxed">
                                <span className="font-bold text-zinc-200">Drop image here</span> or click to browse files
                            </p>
                            <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                <span>PNG</span>
                                <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                                <span>JPG</span>
                                <div className="w-1 h-1 bg-zinc-800 rounded-full" />
                                <span>AVIF</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {previewUrl ? (
            <>
              <Tooltip content="Replace Image" position="left">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 bg-zinc-900/80 backdrop-blur-md rounded-xl text-zinc-400 hover:text-white hover:bg-blue-600 transition-all shadow-xl border border-white/5"
                 >
                    <Upload className="w-4 h-4" />
                 </button>
              </Tooltip>

              <Tooltip content={isROIActive ? "Exit Focus Mode" : "Focus Region"} position="left">
                 <button 
                    onClick={() => {
                        setIsROIActive(!isROIActive);
                        if(isROIActive) setSelection(null);
                    }}
                    className={cn(
                        "p-2.5 backdrop-blur-md rounded-xl transition-all shadow-xl border border-white/5",
                        isROIActive ? "bg-blue-600 text-white" : "bg-zinc-900/80 text-zinc-400 hover:text-white"
                    )}
                 >
                    <Target className="w-4 h-4" />
                 </button>
              </Tooltip>

              {metadata && (
                <Tooltip content="Image Metadata" position="left">
                    <button 
                        onClick={() => setShowMetadata(true)}
                        className="p-2.5 bg-zinc-900/80 backdrop-blur-md rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all shadow-xl border border-white/5"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                </Tooltip>
              )}
            </>
          ) : (
              !showUrlInput && (
                  <Tooltip content="Import from URL" position="left">
                    <button 
                        onClick={() => setShowUrlInput(true)}
                        className="p-2.5 bg-zinc-900/80 backdrop-blur-md rounded-xl text-zinc-400 hover:text-white hover:bg-blue-600 transition-all shadow-xl border border-white/5"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                  </Tooltip>
              )
          )}
      </div>

      {/* ROI Hint */}
      <AnimatePresence>
        {isROIActive && !selection && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none bg-blue-600 text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-2xl flex items-center gap-2"
            >
                <MousePointer2 className="w-3 h-3" />
                DRAG TO SELECT FOCUS AREA
            </motion.div>
        )}
      </AnimatePresence>

      {/* Metadata Modal */}
      <AnimatePresence>
        {showMetadata && metadata && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
                >
                    <div className="flex justify-between items-center p-6 border-b border-white/5 bg-zinc-950">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Info className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Image Metadata</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Embedded AI Parameters</p>
                            </div>
                        </div>
                        <button onClick={() => setShowMetadata(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                            <X className="w-5 h-5 text-zinc-500" />
                        </button>
                    </div>
                    <div className="p-6 overflow-y-auto custom-scrollbar font-mono text-xs text-zinc-400 whitespace-pre-wrap bg-zinc-950/50 leading-relaxed">
                        {metadata}
                    </div>
                    <div className="p-6 border-t border-white/5 bg-zinc-950 flex justify-end gap-3">
                        <button 
                            onClick={() => setShowMetadata(false)}
                            className="btn-secondary px-6"
                        >
                            Close
                        </button>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(metadata);
                                // Show success state briefly if needed
                            }}
                            className="btn-primary px-6 flex items-center gap-2"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Metadata
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageUploader;
