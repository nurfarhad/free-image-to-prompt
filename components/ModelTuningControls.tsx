
import React from 'react';
import Tooltip from './Tooltip';

interface ModelTuningControlsProps {
  detailWeight: number;
  onDetailWeightChange: (val: number) => void;
  realismBalance: number;
  onRealismBalanceChange: (val: number) => void;
  disabled?: boolean;
}

const ModelTuningControls: React.FC<ModelTuningControlsProps> = ({ 
    detailWeight, onDetailWeightChange, 
    realismBalance, onRealismBalanceChange, 
    disabled 
}) => {

    const renderSlider = (
        label: string, 
        tooltip: string, 
        value: number, 
        onChange: (val: number) => void,
        labels: [string, string, string],
        defaultValue: number = 50
    ) => {
        const isModified = value !== defaultValue;

        return (
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Tooltip content={tooltip} position="top">
                        <label className="text-xs font-semibold text-gray-300 cursor-help">{label}</label>
                    </Tooltip>
                    <div className="flex items-center gap-2">
                        {isModified && (
                            <button 
                                onClick={() => onChange(defaultValue)}
                                disabled={disabled}
                                className="text-[9px] text-red-400 hover:text-red-300 uppercase tracking-wider font-bold transition-colors"
                            >
                                Reset
                            </button>
                        )}
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${isModified ? 'text-brand-primary bg-brand-primary/10 border-brand-primary/20' : 'text-gray-500 bg-gray-800 border-gray-700'}`}>
                            {value}%
                        </span>
                    </div>
                </div>
                
                <input 
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    disabled={disabled}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125
                        focus:outline-none disabled:opacity-50"
                />
                
                <div className="flex justify-between text-[9px] text-gray-500 uppercase font-medium tracking-wide">
                    <span>{labels[0]}</span>
                    <span>{labels[1]}</span>
                    <span>{labels[2]}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full space-y-5">
            {renderSlider(
                "Detail Weight",
                "Controls the density and verbosity of the prompt. High values produce exhaustive descriptions.",
                detailWeight,
                onDetailWeightChange,
                ["Concise", "Balanced", "Exhaustive"]
            )}
            
            <div className="h-px bg-gray-800/50 w-full"></div>

            {renderSlider(
                "Realism vs. Creativity",
                "Controls how strictly the model adheres to visual reality versus artistic interpretation.",
                realismBalance,
                onRealismBalanceChange,
                ["Strict Realism", "Balanced", "High Creativity"]
            )}
        </div>
    );
};

export default ModelTuningControls;
