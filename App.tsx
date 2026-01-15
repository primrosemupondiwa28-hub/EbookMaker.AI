
import React, { useState, useRef } from 'react';
import { EbookData, EbookState, CoverTemplateId } from './types';
import { generateEbook } from './services/geminiService';
import { CoverRenderer, ModernCover, BoldCover, ElegantCover } from './components/CoverTemplates';
import JSZip from 'jszip';

const Tones = ['Professional', 'Inspirational', 'Casual', 'Action-Oriented', 'Empathetic', 'Authoritative'];
const CoverTemplates: CoverTemplateId[] = ['modern', 'bold', 'gradient', 'minimal', 'elegant', 'dark'];

export default function App() {
  const [state, setState] = useState<EbookState>({
    isGenerating: false,
    data: null,
    selectedCoverId: 'modern',
  });

  const [form, setForm] = useState({
    topic: '',
    niche: '',
    brandName: '',
    tone: 'Professional'
  });

  const [activeTab, setActiveTab] = useState<'content' | 'bonuses' | 'cover'>('cover');
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for smooth scrolling
  const formRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLElement>(null);
  const samplesRef = useRef<HTMLElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic || !form.brandName) return;

    setState(prev => ({ ...prev, isGenerating: true }));
    setError(null);

    try {
      const ebookData = await generateEbook(
        form.topic, 
        form.niche, 
        form.brandName, 
        form.tone
      );
      setState(prev => ({
        ...prev,
        data: ebookData,
        isGenerating: false
      }));
      setActiveTab('cover');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setError("The generation failed due to a network or API error. Please try again with a different topic.");
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleDownload = async () => {
    if (!state.data) return;
    setIsDownloading(true);

    try {
      const zip = new JSZip();
      const folderName = state.data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const root = zip.folder(folderName);

      if (root) {
        root.file("00_Introduction.txt", state.data.introduction);
        const chaptersFolder = root.folder("Chapters");
        if (chaptersFolder) {
          state.data.chapters.forEach((chapter, index) => {
            const fileName = `Chapter_${(index + 1).toString().padStart(2, '0')}_${chapter.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
            chaptersFolder.file(fileName, chapter.content);
          });
        }

        let bonusText = `BONUS ASSETS FOR: ${state.data.title}\n\n`;
        state.data.bonuses.forEach((bonus, index) => {
          bonusText += `${index + 1}. ${bonus.title} (${bonus.type})\n`;
          bonusText += `${bonus.description}\n`;
          if (bonus.items) {
            bonusText += `Items:\n${bonus.items.map(item => `- ${item}`).join('\n')}\n`;
          }
          bonusText += `\n-------------------\n\n`;
        });
        root.file("Bonuses.txt", bonusText);

        let fullContent = `${state.data.title.toUpperCase()}\n`;
        fullContent += `${state.data.subtitle}\n`;
        fullContent += `By: ${state.data.author}\n\n`;
        fullContent += `INTRODUCTION\n\n${state.data.introduction}\n\n`;
        state.data.chapters.forEach((chapter, index) => {
          fullContent += `CHAPTER ${index + 1}: ${chapter.title}\n\n`;
          fullContent += `${chapter.content}\n\n`;
        });
        root.file("Full_Ebook_Draft.txt", fullContent);

        const readme = `EbookMaker.AI Asset Pack\nGenerated on: ${new Date().toLocaleDateString()}\nTopic: ${form.topic}\nNiche: ${form.niche}\nTone: ${form.tone}\n\nThank you for using EbookMaker.AI to build your authority asset.`;
        root.file("GENERATION_INFO.txt", readme);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${folderName}_authority_pack.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to package the files. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const reset = () => {
    setState({
      isGenerating: false,
      data: null,
      selectedCoverId: 'modern'
    });
    setForm({ topic: '', niche: '', brandName: '', tone: 'Professional' });
    setError(null);
  };

  if (state.isGenerating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#030712]">
        <div className="relative mb-12">
          <div className="w-32 h-32 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-32 h-32 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-[0_0_50px_rgba(99,102,241,0.3)]"></div>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-indigo-400">AI</div>
        </div>
        <h2 className="text-4xl font-black mb-4 gradient-text tracking-tight">Writing Expert Content...</h2>
        <div className="max-w-md space-y-6">
          <p className="text-zinc-400 text-lg leading-relaxed animate-pulse">
            EbookMaker.AI is currently generating 15 detailed chapters of expert-level prose. This process ensures the highest quality content for your authority positioning.
          </p>
          <div className="flex justify-center items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
            <span>Researching</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
            <span>Drafting</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full"></span>
            <span>Refining</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 pb-20 selection:bg-indigo-500/30">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-white/5 bg-[#030712]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={reset}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">E</div>
          <span className="text-xl font-bold tracking-tight">EbookMaker<span className="text-indigo-500 group-hover:text-indigo-400 transition-colors">.AI</span></span>
        </div>
        {!state.data ? (
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <button onClick={() => scrollTo(whyRef)} className="hover:text-white transition-colors">Why Authority?</button>
            <button onClick={() => scrollTo(samplesRef)} className="hover:text-white transition-colors">Samples</button>
            <button 
              onClick={() => scrollTo(formRef)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              Get Started
            </button>
          </nav>
        ) : (
          <button 
            onClick={reset}
            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 px-6 py-2.5 rounded-full bg-indigo-500/5 border border-indigo-500/20 transition-all hover:bg-indigo-500/10"
          >
            + Create New Asset
          </button>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {error && (
          <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-center font-medium animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {!state.data ? (
          <>
            {/* Hero Section */}
            <div className="mt-12 md:mt-24 grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-[120px]"></div>
                
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  Premium Authority Platform
                </div>
                
                <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-8 tracking-tight">
                  Create <span className="gradient-text">authority-level</span> ebooks with AI — <span className="text-white">fully written, client-ready.</span>
                </h1>
                
                <p className="text-xl text-zinc-400 mb-12 leading-relaxed max-w-xl">
                  The web's smartest engine for high-ticket lead magnets. Generate 15 chapters of expert prose designed to position you as a market leader in seconds.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-6 mb-12">
                  {[
                    "15 Expert-Level Chapters",
                    "Ready for Commercial Use",
                    "Pure Authority Prose",
                    "3 High-Value Bonuses"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div ref={formRef} className="glass p-8 md:p-10 rounded-[2.5rem] border border-white/10 relative shadow-2xl transition-all hover:border-white/20">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 rounded-full blur-[100px]"></div>
                
                <form onSubmit={handleGenerate} className="space-y-8 relative z-10">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Target Niche or Topic</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g., Scaling Saas Marketing in 2025"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder:text-zinc-600 text-lg"
                      value={form.topic}
                      onChange={(e) => setForm({...form, topic: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Author Name</label>
                      <input 
                        required
                        type="text"
                        placeholder="e.g., Mark Thompson"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder:text-zinc-600"
                        value={form.brandName}
                        onChange={(e) => setForm({...form, brandName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Brand Voice</label>
                      <select 
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white appearance-none cursor-pointer"
                        value={form.tone}
                        onChange={(e) => setForm({...form, tone: e.target.value})}
                      >
                        {Tones.map(tone => <option key={tone} value={tone} className="bg-zinc-900">{tone}</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-6 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-lg rounded-2xl shadow-2xl shadow-indigo-600/30 transform hover:-translate-y-1 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Build My Expert Asset
                  </button>

                  <p className="text-center text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    100% Unique Expert Content Guaranteed
                  </p>
                </form>
              </div>
            </div>

            {/* Why Authority Section */}
            <section ref={whyRef} className="mt-32 pt-20">
              <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Why <span className="text-indigo-500">Authority</span> Matters?</h2>
                <p className="text-zinc-400 text-lg">In a world of thin AI content, deep authority stands out. We don't just "generate text"—we build expert reputations.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    title: "15-Chapter Depth",
                    desc: "Most tools give you an outline. We give you a complete, substantial manuscript that deep-dives into your niche.",
                    icon: "📚"
                  },
                  {
                    title: "Expert Prose",
                    desc: "Our engine uses advanced reasoning to write in-depth paragraphs, case studies, and practical insights.",
                    icon: "✍️"
                  },
                  {
                    title: "Pre-Sell High Ticket",
                    desc: "Every sentence is optimized to build trust and position your high-ticket offers as the logical next step.",
                    icon: "💎"
                  }
                ].map((feature, idx) => (
                  <div key={idx} className="glass p-10 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all duration-300 group">
                    <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">{feature.icon}</div>
                    <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Samples Section */}
            <section ref={samplesRef} className="mt-32 pt-20">
              <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Real-World <span className="gradient-text">Samples.</span></h2>
                <p className="text-zinc-400 text-lg">See the professional grade output our users are using to close high-ticket clients every day.</p>
              </div>

              <div className="grid md:grid-cols-3 gap-10">
                <div className="group cursor-pointer">
                  <div className="rounded-2xl overflow-hidden shadow-2xl mb-6 transform group-hover:-translate-y-2 transition-all">
                    <ModernCover title="SaaS Growth Engine" subtitle="Scaling to $10M ARR" author="John Doe" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Modern Enterprise Style</h4>
                  <p className="text-zinc-500 text-sm">Perfect for B2B tech and consultancy assets.</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="rounded-2xl overflow-hidden shadow-2xl mb-6 transform group-hover:-translate-y-2 transition-all">
                    <BoldCover title="The 7-Figure Agency" subtitle="Authority Blueprint" author="Sarah Smith" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Bold High-Impact Style</h4>
                  <p className="text-zinc-500 text-sm">Best for coaching and high-energy marketing.</p>
                </div>
                <div className="group cursor-pointer">
                  <div className="rounded-2xl overflow-hidden shadow-2xl mb-6 transform group-hover:-translate-y-2 transition-all">
                    <ElegantCover title="Minimalist Wealth" subtitle="The Future of Finance" author="Alex Reed" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Elegant Authority Style</h4>
                  <p className="text-zinc-500 text-sm">Ideal for finance, luxury, and high-end services.</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Result View (Dashboard) */
          <div className="mt-8 grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass p-8 rounded-3xl border border-white/5 sticky top-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">Expert Dashboard</h3>
                </div>
                
                <div className="flex flex-col gap-3 mb-10">
                  <button 
                    onClick={() => setActiveTab('cover')}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'cover' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Expert Brand Covers
                  </button>
                  <button 
                    onClick={() => setActiveTab('content')}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Full Manuscript
                  </button>
                  <button 
                    onClick={() => setActiveTab('bonuses')}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'bonuses' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                    Bonus Package
                  </button>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98]"
                  >
                    {isDownloading ? (
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    )}
                    {isDownloading ? "Packaging Assets..." : "Download Expert Assets"}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {activeTab === 'cover' && (
                <div className="flex flex-col items-center">
                  <div className="w-full max-w-md shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] rounded-3xl overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                    <CoverRenderer 
                      id={state.selectedCoverId} 
                      title={state.data.title} 
                      subtitle={state.data.subtitle} 
                      author={state.data.author} 
                    />
                  </div>
                  
                  <div className="mt-12 w-full glass p-8 rounded-[2rem]">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-6">Select Brand Style</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {CoverTemplates.map((template) => (
                        <button 
                          key={template}
                          onClick={() => setState(prev => ({ ...prev, selectedCoverId: template }))}
                          className={`group relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${state.selectedCoverId === template ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20' : 'border-transparent opacity-50 hover:opacity-100 hover:border-white/20'}`}
                        >
                          <div className="scale-[0.4] origin-top-left w-[250%] h-[250%] pointer-events-none">
                             <CoverRenderer 
                                id={template} 
                                title={state.data!.title} 
                                subtitle={state.data!.subtitle} 
                                author={state.data!.author} 
                              />
                          </div>
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors"></div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-12 pb-20">
                  <div className="glass p-10 md:p-16 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8">
                       <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">Client-Ready Version</div>
                    </div>
                    
                    <h2 className="text-5xl font-black mb-4 tracking-tight leading-none">{state.data.title}</h2>
                    <p className="text-2xl text-indigo-400 mb-12 font-medium tracking-tight">{state.data.subtitle}</p>
                    
                    <div className="prose prose-invert max-w-none">
                      <div className="mb-20">
                        <h3 className="text-3xl font-black mb-8 text-white flex items-center gap-4">
                          <span className="w-12 h-px bg-indigo-500"></span>
                          Introduction
                        </h3>
                        <div className="text-zinc-400 leading-relaxed text-xl font-light italic border-l-4 border-indigo-500/40 pl-8 bg-indigo-500/5 py-8 rounded-r-2xl">
                          {state.data.introduction}
                        </div>
                      </div>
                      
                      <div className="space-y-24">
                        {state.data.chapters.map((chapter, idx) => (
                          <div key={idx} className="relative pt-12 group">
                             <div className="absolute top-0 left-0 text-[100px] font-black text-white/[0.03] select-none leading-none">
                              {(idx + 1).toString().padStart(2, '0')}
                             </div>
                             <div className="relative z-10">
                               <h4 className="text-3xl font-black mb-8 text-white flex items-center gap-4">
                                  <span className="text-indigo-500 text-sm font-bold uppercase tracking-[0.3em] bg-indigo-500/10 px-3 py-1 rounded">Chapter {idx + 1}</span>
                                  {chapter.title}
                               </h4>
                               <div className="text-zinc-400 leading-relaxed whitespace-pre-line text-lg font-normal font-sans tracking-wide">
                                {chapter.content}
                               </div>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bonuses' && (
                <div className="grid grid-cols-1 gap-8">
                  {state.data.bonuses.map((bonus, idx) => (
                    <div key={idx} className="glass p-10 rounded-[2.5rem] border-l-8 border-emerald-500 group hover:bg-white/5 transition-all duration-300 shadow-xl">
                      <div className="flex justify-between items-start mb-6">
                        <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase rounded-full border border-emerald-500/20 tracking-[0.2em]">
                          {bonus.type}
                        </div>
                      </div>
                      <h3 className="text-3xl font-black mb-4 tracking-tight">{bonus.title}</h3>
                      <p className="text-zinc-400 text-lg mb-8 leading-relaxed font-light">{bonus.description}</p>
                      {bonus.items && (
                        <div className="bg-black/30 rounded-3xl p-8 border border-white/5">
                           <ul className="grid sm:grid-cols-2 gap-4">
                              {bonus.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-4 text-zinc-300 font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 flex-shrink-0"></div>
                                  <span className="leading-tight">{item}</span>
                                </li>
                              ))}
                           </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="mt-40 border-t border-white/5 py-16 bg-black/30">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 items-center gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-bold text-zinc-400">E</div>
              <span className="text-zinc-500 font-bold tracking-tight text-xl">EbookMaker.AI</span>
            </div>
            <p className="text-zinc-600 font-medium max-w-sm">The world's premium authority asset engine for high-ticket creators, consultants, and agencies.</p>
          </div>
          <div className="flex md:justify-end gap-12 text-sm font-bold uppercase tracking-widest text-zinc-500">
            <button onClick={() => scrollTo(whyRef)} className="hover:text-indigo-400 transition-colors">Why Authority?</button>
            <button onClick={() => scrollTo(samplesRef)} className="hover:text-indigo-400 transition-colors">Samples</button>
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/[0.02] text-center text-[10px] font-bold text-zinc-700 uppercase tracking-[0.5em]">
          EbookMaker.AI &bull; Authority by Default &bull; 2024
        </div>
      </footer>
    </div>
  );
}

