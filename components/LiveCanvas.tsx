
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";

// --- AUDIO HELPERS ---
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveCanvas: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  
  // Refs for Audio
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null); // To hold the session object if needed, though we use closure mostly

  // Visualizer Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

  const connectToLive = async () => {
    setIsConnecting(true);
    setError(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Setup Audio Contexts
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        
        inputAudioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;
        nextStartTimeRef.current = 0;

        // Visualizer Setup (Output)
        const analyser = outputCtx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;
        const outputNode = outputCtx.createGain();
        outputNode.connect(analyser);
        analyser.connect(outputCtx.destination);

        // Get User Media
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Connect Gemini Live
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    console.log("Live session opened");
                    setIsConnected(true);
                    setIsConnecting(false);

                    // Setup Input Stream
                    const source = inputCtx.createMediaStreamSource(stream);
                    const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then(session => {
                             session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    // Handle Audio Output
                    const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio) {
                        setIsSpeaking(true);
                        try {
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                outputCtx,
                                24000,
                                1
                            );
                            
                            // Schedule playback
                            const source = outputCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);

                            const currentTime = outputCtx.currentTime;
                            if (nextStartTimeRef.current < currentTime) {
                                nextStartTimeRef.current = currentTime;
                            }
                            
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            
                            sourcesRef.current.add(source);
                            source.onended = () => {
                                sourcesRef.current.delete(source);
                                if (sourcesRef.current.size === 0) {
                                    setIsSpeaking(false);
                                }
                            };

                        } catch (e) {
                            console.error("Audio decoding error", e);
                        }
                    }

                    // Handle Interruption
                    if (msg.serverContent?.interrupted) {
                        console.log("Interrupted");
                        sourcesRef.current.forEach(source => {
                            try { source.stop(); } catch(e) {}
                        });
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                        setIsSpeaking(false);
                    }
                },
                onclose: () => {
                    console.log("Live session closed");
                    cleanup();
                },
                onerror: (e) => {
                    console.error("Live session error", e);
                    setError("Connection error.");
                    cleanup();
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                }
            }
        });

        // Keep sessionRef to close later if needed, although cleanUp mainly handles contexts
        sessionRef.current = sessionPromise;

    } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to connect");
        cleanup();
    }
  };

  const cleanup = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);

    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (inputAudioContextRef.current) {
        inputAudioContextRef.current.close();
        inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleDisconnect = () => {
      // Just cleanup, the server will close eventualy or we can assume it's done
      // The SDK doesn't expose a clean .close() on the promise easily in this pattern without await, 
      // but closing the socket via AudioContext destruction usually triggers cleanup.
      // Ideally we would call session.close() if we stored the resolved session.
      cleanup();
  };

  // Visualizer Animation
  useEffect(() => {
    if (!isConnected || !analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Circular Visualization
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 80;
        
        // Calculate average volume for pulse
        let sum = 0;
        for(let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const scale = 1 + (average / 256) * 0.5;

        // Draw Glow
        const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * scale * 1.5);
        gradient.addColorStop(0, "rgba(161, 66, 244, 0.2)"); // brand-secondary
        gradient.addColorStop(1, "rgba(161, 66, 244, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * scale * 1.5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw Base Circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * scale, 0, 2 * Math.PI);
        ctx.strokeStyle = '#A142F4'; // brand-secondary
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw Waveform dots around
        const bars = 30;
        const step = (Math.PI * 2) / bars;
        
        for (let i = 0; i < bars; i++) {
             // Map some frequency data to bars
             const value = dataArray[i % bufferLength] / 2; 
             const angle = i * step;
             const x1 = centerX + Math.cos(angle) * (radius * scale + 10);
             const y1 = centerY + Math.sin(angle) * (radius * scale + 10);
             const x2 = centerX + Math.cos(angle) * (radius * scale + 10 + value);
             const y2 = centerY + Math.sin(angle) * (radius * scale + 10 + value);
             
             ctx.beginPath();
             ctx.moveTo(x1, y1);
             ctx.lineTo(x2, y2);
             ctx.strokeStyle = `rgba(66, 133, 244, ${value / 100})`; // brand-primary
             ctx.lineWidth = 3;
             ctx.stroke();
        }
    };

    draw();

    return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isConnected]);

  // Handle unmount
  useEffect(() => {
      return () => cleanup();
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-brand-dark p-6 relative overflow-hidden">
        
        {/* Background Ambient Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[100px] transition-all duration-1000 ${isSpeaking ? 'scale-125 opacity-30' : 'scale-100 opacity-10'}`}></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-secondary/10 rounded-full blur-[80px] transition-all duration-1000 ${isConnected ? 'scale-110' : 'scale-90'}`}></div>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full backdrop-blur-md border border-gray-800">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : isConnecting ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
            <span className="text-xs font-mono text-gray-300">
                {isConnecting ? 'CONNECTING...' : isConnected ? 'GEMINI LIVE' : 'DISCONNECTED'}
            </span>
        </div>

        {/* Main Interface */}
        <div className="relative z-10 flex flex-col items-center">
            
            {!isConnected ? (
                <div className="text-center">
                     <button 
                        onClick={connectToLive}
                        disabled={isConnecting}
                        className={`
                            relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 group
                            ${isConnecting ? 'bg-gray-800 cursor-not-allowed' : 'bg-gradient-to-br from-brand-secondary to-blue-600 hover:scale-105 shadow-2xl hover:shadow-brand-secondary/40'}
                        `}
                     >
                        {isConnecting ? (
                            <div className="w-12 h-12 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin"></div>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                        
                        {/* Ripple Effect hint */}
                        {!isConnecting && (
                            <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20"></div>
                        )}
                     </button>
                     <p className="mt-6 text-gray-400 font-medium">
                         {isConnecting ? 'Establishing connection...' : 'Tap to Start Conversation'}
                     </p>
                     {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
                        <canvas 
                            ref={canvasRef} 
                            width={300} 
                            height={300} 
                            className="absolute inset-0 w-full h-full"
                        />
                        {/* Center Icon */}
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 transition-colors duration-300 ${isSpeaking ? 'text-white' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                         </div>
                    </div>
                    
                    <button 
                        onClick={handleDisconnect}
                        className="mt-8 px-8 py-2 bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-200 rounded-full border border-gray-700 transition-colors text-sm font-medium"
                    >
                        End Session
                    </button>
                </div>
            )}
        </div>
        
        {/* Info Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center text-[10px] text-gray-600">
            Powered by Gemini 2.5 Flash Native Audio
        </div>
    </div>
  );
};

export default LiveCanvas;
