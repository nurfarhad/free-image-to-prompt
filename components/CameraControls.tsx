
import React from 'react';
import { CameraSettings } from '../services/geminiService';

interface CameraControlsProps {
  settings: CameraSettings;
  onChange: (settings: CameraSettings) => void;
  disabled?: boolean;
}

const CameraControls: React.FC<CameraControlsProps> = ({ settings, onChange, disabled }) => {
  
  const updateSetting = (key: keyof CameraSettings, value: string | null) => {
    onChange({ ...settings, [key]: value });
  };

  const focalLengths = [
      { label: '14mm', value: '14mm', desc: 'Ultra-Wide' },
      { label: '24mm', value: '24mm', desc: 'Wide' },
      { label: '35mm', value: '35mm', desc: 'Street' },
      { label: '50mm', value: '50mm', desc: 'Standard' },
      { label: '85mm', value: '85mm', desc: 'Portrait' },
      { label: '200mm', value: '200mm', desc: 'Telephoto' },
      { label: 'Macro', value: 'Macro', desc: 'Close-up' }
  ];

  const apertures = [
      { label: 'f/1.2', value: 'f/1.2', size: 0.9 },
      { label: 'f/2.8', value: 'f/2.8', size: 0.7 },
      { label: 'f/8', value: 'f/8', size: 0.4 },
      { label: 'f/16', value: 'f/16', size: 0.2 }
  ];

  const shutterSpeeds = [
      { label: '1/1000s', value: '1/1000s', icon: '⚡' },
      { label: '1/60s', value: '1/60s', icon: '📷' },
      { label: '1s', value: '1s', icon: '⏳' },
      { label: 'Long Exp', value: 'Long Exposure', icon: '🌙' }
  ];

  const films = [
      { label: 'Portra 400', value: 'Kodak Portra 400', type: 'Film' },
      { label: 'Velvia 50', value: 'Fujifilm Velvia 50', type: 'Film' },
      { label: 'Ilford HP5', value: 'Ilford HP5 Plus', type: 'B&W' },
      { label: 'Polaroid', value: 'Polaroid 600', type: 'Inst' },
      { label: 'Digital', value: 'Digital Sensor', type: 'Digi' },
      { label: 'Kodachrome', value: 'Vintage Kodachrome', type: 'Film' }
  ];

  // Helper to get active aperture size for visualization
  const currentApertureSize = apertures.find(a => a.value === settings.aperture)?.size || 0.5;

  return (
    <div className="bg-brand-surface rounded-xl border border-gray-700 p-1 relative overflow-hidden font-mono text-gray-400 select-none shadow-sm group">
        
        {/* LENS SECTION */}
        <div className="relative z-10 p-3 border-b border-gray-700 bg-brand-gray/50">
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Lens System</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-brand-primary font-bold tracking-wide">{settings.focalLength || '--'}</span>
                    {settings.focalLength && (
                        <button onClick={() => updateSetting('focalLength', null)} className="text-[9px] text-red-400 hover:text-red-300 ml-1">RESET</button>
                    )}
                </div>
            </div>
            
            {/* Focal Length Wheel Visual */}
            <div className="flex overflow-x-auto pb-2 gap-1 snap-x [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {focalLengths.map((lens) => (
                    <button
                        key={lens.value}
                        onClick={() => updateSetting('focalLength', settings.focalLength === lens.value ? null : lens.value)}
                        disabled={disabled}
                        className={`
                            flex-shrink-0 w-16 h-14 flex flex-col items-center justify-center rounded border transition-all duration-200 snap-center
                            ${settings.focalLength === lens.value
                                ? 'bg-gray-700 border-brand-primary text-white shadow-md'
                                : 'bg-brand-dark border-gray-700 text-gray-500 hover:bg-gray-700 hover:border-gray-500 hover:text-gray-300'
                            }
                            ${disabled ? 'opacity-50' : ''}
                        `}
                    >
                        <span className="text-xs font-bold">{lens.label}</span>
                        <span className="text-[8px] uppercase tracking-wide opacity-60 mt-0.5 scale-90">{lens.desc}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* EXPOSURE SECTION */}
        <div className="relative z-10 grid grid-cols-2">
            
            {/* Aperture (Left) */}
            <div className="p-3 border-r border-gray-700 bg-brand-dark">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Aperture</span>
                    <span className="text-[10px] text-brand-primary font-bold">{settings.aperture || '--'}</span>
                </div>
                
                {/* Visualizer */}
                <div className="flex justify-center mb-4">
                    <div className="relative w-16 h-16 rounded-full bg-[#151516] border-2 border-gray-700 shadow-inner flex items-center justify-center overflow-hidden">
                        <div 
                            className="bg-gray-300 rounded-full transition-all duration-500 ease-out shadow-inner"
                            style={{ 
                                width: `${currentApertureSize * 100}%`, 
                                height: `${currentApertureSize * 100}%`,
                                opacity: settings.aperture ? 1 : 0.2
                            }}
                        ></div>
                        {/* Lens reflection hint */}
                        <div className="absolute top-2 left-3 w-3 h-1.5 bg-white rounded-full opacity-20 rotate-[-45deg] pointer-events-none"></div>
                        
                        {/* Aperture Blades Overlay */}
                        <div className="absolute inset-0 border-[4px] border-black/30 rounded-full pointer-events-none"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                    {apertures.map((ap) => (
                        <button
                            key={ap.value}
                            onClick={() => updateSetting('aperture', settings.aperture === ap.value ? null : ap.value)}
                            disabled={disabled}
                            className={`
                                py-1.5 text-[9px] font-bold rounded border transition-colors
                                ${settings.aperture === ap.value
                                    ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                                    : 'bg-brand-gray border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                                }
                            `}
                        >
                            {ap.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Shutter & ISO (Right) */}
            <div className="p-3 bg-brand-dark flex flex-col justify-between">
                {/* Shutter */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Shutter</span>
                        <span className="text-[10px] text-brand-primary font-bold">{settings.shutterSpeed || 'Auto'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {shutterSpeeds.map((ss) => (
                            <button
                                key={ss.value}
                                onClick={() => updateSetting('shutterSpeed', settings.shutterSpeed === ss.value ? null : ss.value)}
                                disabled={disabled}
                                className={`
                                    py-1.5 text-[9px] font-bold rounded border transition-colors flex items-center justify-center gap-1.5
                                    ${settings.shutterSpeed === ss.value
                                        ? 'bg-yellow-900/20 border-yellow-600 text-yellow-500'
                                        : 'bg-brand-gray border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300'
                                    }
                                `}
                                title={ss.label}
                            >
                                <span className="opacity-70">{ss.icon}</span>
                                {ss.label === 'Long Exposure' ? 'Long' : ss.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ISO */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">ISO</span>
                        <span className="text-[10px] text-brand-primary font-bold">{settings.iso || 'Auto'}</span>
                    </div>
                    <div className="flex bg-brand-gray rounded border border-gray-700 p-0.5">
                        {['100', '400', '800', '3200', 'Noise'].map(val => {
                            const valStr = val === 'Noise' ? 'Grainy' : val;
                            return (
                                <button
                                    key={val}
                                    onClick={() => updateSetting('iso', settings.iso === valStr ? null : valStr)}
                                    className={`
                                        flex-1 py-1 text-[8px] font-bold rounded transition-colors
                                        ${settings.iso === valStr
                                            ? 'bg-gray-600 text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }
                                    `}
                                >
                                    {val === 'Noise' ? 'GRAIN' : val}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* FILM / SENSOR */}
        <div className="relative z-10 p-3 border-t border-gray-700 bg-brand-gray/30">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Film Stock / Sensor</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-brand-primary font-bold">{settings.filmType ? settings.filmType.split(' ')[0] : ''}</span>
                    {settings.filmType && (
                        <button onClick={() => updateSetting('filmType', null)} className="text-[9px] text-red-400 hover:text-red-300 ml-1">EJECT</button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {films.map(film => (
                    <button
                        key={film.value}
                        onClick={() => updateSetting('filmType', settings.filmType === film.value ? null : film.value)}
                        disabled={disabled}
                        className={`
                            flex items-center p-2 rounded border text-left transition-all duration-200 group
                            ${settings.filmType === film.value
                                ? 'bg-brand-gray border-l-2 border-l-brand-secondary border-t-gray-600 border-r-gray-600 border-b-gray-600'
                                : 'bg-brand-dark border-gray-700 text-gray-500 hover:bg-gray-700 hover:text-gray-300'
                            }
                        `}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 flex-shrink-0 ${settings.filmType === film.value ? 'bg-brand-secondary' : 'bg-gray-700'}`}></div>
                        <div className="flex flex-col min-w-0">
                            <span className={`text-[10px] font-bold truncate ${settings.filmType === film.value ? 'text-gray-200' : 'text-gray-500 group-hover:text-gray-400'}`}>{film.label}</span>
                            <span className="text-[8px] text-gray-600 truncate">{film.type}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default CameraControls;
