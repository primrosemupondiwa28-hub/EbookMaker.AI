
import React from 'react';
import { CoverTemplateId } from '../types';

interface CoverProps {
  title: string;
  subtitle: string;
  author: string;
  className?: string;
}

export const ModernCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-indigo-600 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden ${className}`}>
    <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20"></div>
    <div className="z-10 flex flex-col h-full items-center justify-between py-12">
      <div className="w-12 h-1 bg-white mb-4"></div>
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-4">{title}</h1>
        <p className="text-sm font-medium text-indigo-100 italic">{subtitle}</p>
      </div>
      <p className="text-xs tracking-widest uppercase font-bold text-white border-t border-white/30 pt-4 w-full">{author}</p>
    </div>
    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
  </div>
);

export const BoldCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-zinc-900 flex flex-col p-10 justify-end border-l-8 border-yellow-400 ${className}`}>
    <h1 className="text-5xl font-black text-white leading-tight mb-6">{title}</h1>
    <div className="h-0.5 w-16 bg-yellow-400 mb-6"></div>
    <p className="text-lg text-zinc-400 font-semibold mb-12">{subtitle}</p>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-zinc-900 font-bold text-xs">AI</div>
      <p className="text-sm font-bold text-white uppercase tracking-widest">{author}</p>
    </div>
  </div>
);

export const GradientCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700 flex flex-col items-center justify-center p-12 text-center ${className}`}>
    <div className="bg-white/10 backdrop-blur-md p-8 border border-white/20 rounded-2xl w-full h-full flex flex-col justify-center shadow-2xl">
      <h1 className="text-4xl font-extrabold text-white mb-6 drop-shadow-lg">{title}</h1>
      <p className="text-indigo-50 text-base mb-8 font-light leading-relaxed">{subtitle}</p>
      <div className="mt-auto pt-6 border-t border-white/10">
        <p className="text-xs text-white/70 uppercase tracking-[0.2em]">Written By</p>
        <p className="text-sm font-bold text-white mt-1">{author}</p>
      </div>
    </div>
  </div>
);

export const MinimalCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-white flex flex-col p-12 border border-zinc-200 ${className}`}>
    <div className="flex-1 border-2 border-zinc-900 p-8 flex flex-col items-center text-center">
      <span className="text-[10px] tracking-[0.5em] text-zinc-400 uppercase mb-12">Private Edition</span>
      <h1 className="text-3xl font-serif text-zinc-900 mb-6 leading-tight italic">{title}</h1>
      <p className="text-xs text-zinc-500 uppercase tracking-widest leading-relaxed px-4">{subtitle}</p>
      <div className="mt-auto">
        <p className="text-sm font-serif italic text-zinc-900">{author}</p>
      </div>
    </div>
  </div>
);

export const ElegantCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-[#1a1a1a] flex flex-col items-center justify-center p-10 text-center relative border-[12px] border-emerald-900/20 ${className}`}>
    <div className="absolute top-8 left-8 right-8 bottom-8 border border-emerald-500/30"></div>
    <div className="z-10 bg-[#1a1a1a] px-4 py-8">
      <h1 className="text-3xl font-serif text-emerald-400 mb-4">{title}</h1>
      <div className="w-12 h-px bg-emerald-500 mx-auto mb-6"></div>
      <p className="text-sm text-emerald-100/60 font-medium italic max-w-[200px] mx-auto">{subtitle}</p>
    </div>
    <div className="z-10 mt-auto pb-12">
      <p className="text-xs text-emerald-500 tracking-widest uppercase font-semibold">Volume 01 &bull; {author}</p>
    </div>
  </div>
);

export const DarkCover: React.FC<CoverProps> = ({ title, subtitle, author, className = "" }) => (
  <div className={`aspect-[3/4] bg-black flex flex-col justify-between p-12 overflow-hidden ${className}`}>
    <div className="relative">
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500 rounded-full blur-[80px] opacity-40"></div>
      <h1 className="text-4xl font-black text-white leading-none tracking-tight uppercase relative z-10">{title}</h1>
    </div>
    <div className="relative z-10">
      <p className="text-zinc-500 text-sm mb-6 max-w-[80%]">{subtitle}</p>
      <div className="flex justify-between items-end border-t border-zinc-800 pt-6">
        <div>
          <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Mastery Series</p>
          <p className="text-lg font-bold text-white">{author}</p>
        </div>
        <div className="w-10 h-10 border border-zinc-800 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-rose-500 rotate-45"></div>
        </div>
      </div>
    </div>
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
