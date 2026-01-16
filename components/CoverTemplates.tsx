
import React from 'react';
import { CoverTemplateId } from '../types.ts';

interface CoverProps {
  title: string;
  subtitle: string;
  author: string;
  className?: string;
}

// Layout helper for professional grouping and strict spacing
const TitleBlock: React.FC<CoverProps & { light?: boolean }> = ({ title, subtitle, author, light = false }) => (
  <div className="flex flex-col items-center justify-center w-full px-12 -translate-y-[15%]">
    {/* Title block positioned slightly above the vertical center */}
    <div className="flex flex-col items-center gap-1 mb-4">
      <h1 className={`text-4xl font-black uppercase tracking-tight leading-[1.05] text-center max-w-[340px] ${light ? 'text-white' : 'text-zinc-900'}`}>
        {title}
      </h1>
      {/* Reduced vertical gap between title and author name as per spacing standards */}
      <p className={`text-[10px] font-black tracking-[0.4em] uppercase mt-2 ${light ? 'text-white/70' : 'text-zinc-600'}`}>
        {author}
      </p>
    </div>
    
    <div className={`h-[2px] w-8 mb-6 ${light ? 'bg-white/20' : 'bg-zinc-900/10'}`}></div>
    
    <p className={`text-[13px] font-medium italic max-w-[280px] leading-relaxed text-center ${light ? 'text-indigo-100/60' : 'text-zinc-500'}`}>
      {subtitle}
    </p>
  </div>
);

export const ModernCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-indigo-700 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent"></div>
    <TitleBlock title={title} subtitle={subtitle} author={author} light />
    <div className="absolute top-10 left-10 w-6 h-6 border-t-2 border-l-2 border-white/20"></div>
    <div className="absolute bottom-10 right-10 w-6 h-6 border-b-2 border-r-2 border-white/20"></div>
  </div>
);

export const BoldCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden ${className}`}>
    <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/10 -translate-y-24 translate-x-24 rotate-45"></div>
    <TitleBlock title={title} subtitle={subtitle} author={author} light />
  </div>
);

export const GradientCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-8 text-center ${className}`}>
    <div className="border border-white/5 w-full h-full rounded-sm flex items-center justify-center">
      <TitleBlock title={title} subtitle={subtitle} author={author} light />
    </div>
  </div>
);

export const MinimalCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-[#fdfdfd] flex flex-col items-center justify-center relative ${className}`}>
    <TitleBlock title={title} subtitle={subtitle} author={author} />
    <div className="absolute bottom-16 h-px w-10 bg-zinc-200"></div>
  </div>
);

export const ElegantCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-[#08100d] flex flex-col items-center justify-center relative border-[16px] border-emerald-950/10 ${className}`}>
    <TitleBlock title={title} subtitle={subtitle} author={author} light />
    <div className="absolute top-6 left-6 right-6 bottom-6 border border-emerald-500/5 pointer-events-none"></div>
  </div>
);

export const DarkCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-zinc-900 flex flex-col items-center justify-center overflow-hidden relative ${className}`}>
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-950"></div>
    <TitleBlock title={title} subtitle={subtitle} author={author} light />
  </div>
);

export const CoverRenderer: React.FC<{ id: CoverTemplateId; title: string; subtitle: string; author: string; className?: string }> = ({ id, ...props }) => {
  switch (id) {
    case 'modern': return <ModernCover {...props} />;
    case 'bold': return <BoldCover {...props} />;
    case 'gradient': return <GradientCover {...props} />;
    case 'minimal': return <MinimalCover {...props} />;
    case 'elegant': return <ElegantCover {...props} />;
    case 'dark': return <DarkCover {...props} />;
    default: return <ModernCover {...props} />;
  }
};
