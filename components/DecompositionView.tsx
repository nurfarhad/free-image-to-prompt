
import React from 'react';

interface DecompositionViewProps {
  data: any;
}

const DecompositionView: React.FC<DecompositionViewProps> = ({ data }) => {
  if (!data) return <div className="text-gray-500 italic p-6 text-center">No structured data available to visualize.</div>;

  const renderSection = (title: string, content: any, colorClass: string, icon?: React.ReactNode) => (
    <div className={`bg-brand-surface border border-gray-700/50 rounded-xl p-4 mb-4 ${colorClass} hover:bg-gray-800/50 transition-colors`}>
      <div className="flex items-center mb-3 pb-2 border-b border-gray-700/50">
        {icon && <div className="mr-2 text-gray-400">{icon}</div>}
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-300">{title}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(content).map(([key, value]) => (
          <div key={key} className="bg-black/30 rounded-lg p-3 border border-gray-800">
            <span className="text-[10px] uppercase text-gray-500 font-bold block mb-1.5 tracking-wide">{key.replace(/_/g, ' ')}</span>
            <div className="text-sm text-gray-200">
               {Array.isArray(value) ? (
                   <div className="flex flex-wrap gap-1.5">
                       {value.map((v: string, i: number) => (
                           <span key={i} className="px-2 py-0.5 bg-brand-dark border border-gray-700 rounded text-xs text-gray-300">{v}</span>
                       ))}
                   </div>
               ) : (
                   <span className="leading-relaxed">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full h-full overflow-y-auto p-4 custom-scrollbar space-y-2">
       <div className="mb-6 flex items-center justify-between">
           <div>
               <h3 className="text-brand-primary font-bold text-lg flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                   </svg>
                   Scene Decomposition
               </h3>
               <p className="text-xs text-gray-500 mt-1">Structured semantic breakdown of the analysis.</p>
           </div>
           <div className="px-2 py-1 bg-brand-surface rounded text-xs font-mono text-gray-500 border border-gray-800">JSON VIEW</div>
       </div>

       {data.subject && renderSection('Subject Layer', data.subject, 'border-l-2 border-l-blue-500', 
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
       )}
       
       {data.environment && renderSection('Environment Layer', data.environment, 'border-l-2 border-l-green-500',
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
       )}
       
       {data.lighting && renderSection('Lighting Layer', data.lighting, 'border-l-2 border-l-yellow-500',
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
       )}
       
       {data.style && renderSection('Style Layer', data.style, 'border-l-2 border-l-purple-500',
           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
       )}
       
       {/* Fallback for other keys */}
       {Object.keys(data).filter(k => !['subject', 'environment', 'lighting', 'style'].includes(k)).map(k => (
           renderSection(k, data[k], 'border-l-2 border-l-gray-500')
       ))}
    </div>
  );
};

export default DecompositionView;
