
import React, { useState, useEffect } from 'react';
import { EbookData, EbookState, CoverTemplateId, Chapter } from './types.ts';
import { generateEbook, generateAdditionalChapter } from './services/geminiService.ts';
import { CoverRenderer } from './components/CoverTemplates.tsx';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const CoverTemplates: CoverTemplateId[] = ['modern', 'bold', 'gradient', 'minimal', 'elegant', 'dark'];

export default function App() {
  // Initial check for a key in the environment (e.g., set via Vercel dashboard)
  const isKeyInEnv = !!process.env.API_KEY && process.env.API_KEY !== 'undefined' && process.env.API_KEY !== '';
  const [hasKey, setHasKey] = useState<boolean>(isKeyInEnv);
  
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
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTopic, setNewChapterTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const checkStudioStatus = async () => {
      // If no env key, check if a key was previously selected in this session
      const studio = (window as any).aistudio;
      if (!hasKey && studio?.hasSelectedApiKey) {
        try {
          const selected = await studio.hasSelectedApiKey();
          if (selected) setHasKey(true);
        } catch (e) {
          console.debug("Studio key check skipped");
        }
      }
    };
    checkStudioStatus();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasKey]);

  const handleConnectKey = async () => {
    const studio = (window as any).aistudio;
    if (studio?.openSelectKey) {
      try {
        await studio.openSelectKey();
        // As per SDK guidelines: assume success and proceed to avoid race conditions
        setHasKey(true);
        setError(null);
      } catch (err) {
        console.error("Key selection failed:", err);
        setError("Failed to open the key selection dialog. Please try again.");
      }
    } else {
      // Fallback for environments where the object isn't available
      setError("To use this tool, please ensure you are in a supported AI Studio environment or have configured the API_KEY environment variable.");
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic || !form.brandName) return;

    setState(prev => ({ ...prev, isGenerating: true }));
    setError(null);

    try {
      const ebookData = await generateEbook(form.topic, form.niche, form.brandName, form.tone);
      setState(prev => ({ ...prev, data: ebookData, isGenerating: false }));
      setActiveTab('cover');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Generation failed:", err);
      
      // If the error suggests a missing or invalid entity, reset the key state
      if (err.message === "API_KEY_MISSING" || err.message?.includes("not found")) {
        setHasKey(false);
        setError("API Key verification failed. Please re-connect your key to continue.");
      } else {
        setError(err.message || 'Generation failed. Please check your topic and try again.');
      }
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.data || !newChapterTopic || isAddingChapter) return;

    setIsAddingChapter(true);
    setError(null);

    try {
      const newChapter = await generateAdditionalChapter(
        state.data.title,
        state.data.chapters,
        newChapterTopic,
        form.tone
      );
      
      setState(prev => ({
        ...prev,
        data: prev.data ? {
          ...prev.data,
          chapters: [...prev.data.chapters, newChapter]
        } : null
      }));
      setNewChapterTopic('');
    } catch (err: any) {
      setError(err.message || "Could not add additional chapter.");
    } finally {
      setIsAddingChapter(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!state.data) return;
    setIsDownloading(true);
    
    try {
      const coverEl = document.getElementById('pdf-export-cover-capture');
      if (!coverEl) throw new Error("Capture element not found");

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 25; 
      const contentWidth = pageWidth - (margin * 2);
      const lineHeight = 7;

      const canvas = await html2canvas(coverEl, { 
        scale: 3, 
        useCORS: true,
        logging: false,
        backgroundColor: '#000000'
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(0, 0, 0);
      doc.text(state.data.title, margin, 45, { maxWidth: contentWidth });
      
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text(state.data.subtitle, margin, 58, { maxWidth: contentWidth });
      
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 68, margin + 15, 68);

      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      let cursorY = 82;
      const paragraphs = state.data.introduction.split('\n').filter(p => p.trim() !== '');
      paragraphs.forEach(p => {
        const lines = doc.splitTextToSize(p, contentWidth);
        if (cursorY + (lines.length * lineHeight) > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }
        doc.text(lines, margin, cursorY);
        cursorY += (lines.length * lineHeight) + lineHeight;
      });

      state.data.chapters.forEach((ch, idx) => {
        doc.addPage();
        cursorY = margin + 14; 
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`CHAPTER 0${idx + 1}`, margin, cursorY - 10);
        
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text(ch.title, margin, cursorY, { maxWidth: contentWidth });
        
        cursorY += 18; 
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(50, 50, 50);

        const chParagraphs = ch.content.split('\n').filter(p => p.trim() !== '');
        chParagraphs.forEach(p => {
          const lines = doc.splitTextToSize(p, contentWidth);
          if (cursorY + (lines.length * lineHeight) > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.text(lines, margin, cursorY);
          cursorY += (lines.length * lineHeight) + lineHeight;
        });
      });

      doc.save(`${state.data.title.replace(/\s+/g, '_')}_Manuscript.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("PDF building failed. Please ensure your browser supports canvas capture.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (state.isGenerating) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-8 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
          <div className="relative w-24 h-24 mx-auto mb-10">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-4 border-t-indigo-500 rounded-full"></motion.div>
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">Writing Your Manuscript</h2>
          <p className="text-slate-400 leading-relaxed text-sm">Gemini 3 Pro is architecting expert-level chapters. This may take a minute.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {state.data && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <div id="pdf-export-cover-capture" style={{ width: '800px', height: '1131px' }}>
            <CoverRenderer id={state.selectedCoverId} title={state.data.title} subtitle={state.data.subtitle} author={state.data.author} />
          </div>
        </div>
      )}

      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-slate-800 py-4' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setState({ ...state, data: null })}>
            <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center font-black text-white shadow-lg">E</div>
            <span className="text-lg font-black tracking-tighter">EbookMaker<span className="text-indigo-500">.AI</span></span>
          </div>
          {!state.data && hasKey && (
            <button className="px-5 py-2.5 bg-white text-black text-xs font-black rounded-full hover:bg-slate-200 transition-all shadow-xl">Creator Studio</button>
          )}
        </div>
      </header>

      <main>
        {!state.data ? (
          <div className="pt-32 md:pt-48 pb-20">
            <div className="max-w-7xl mx-auto px-6 text-center mb-24">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Authority Engine Active
              </motion.div>
              
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-8 max-w-4xl mx-auto">
                Authority, <span className="text-indigo-500">Instantly.</span>
              </motion.h1>
              
              {!hasKey ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto glass-panel p-12 rounded-[3rem] border-indigo-500/20 shadow-2xl">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-8 mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L22 22m-5-5l4-4"/></svg>
                  </div>
                  <h3 className="text-2xl font-black mb-3 tracking-tight">Connect Your API Key</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-8">
                    To use the high-performance Gemini 3 Pro model, please select a valid paid API key from your project.
                  </p>
                  <button onClick={handleConnectKey} className="w-full py-4 premium-gradient text-white font-black text-sm rounded-2xl shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-3">
                    Connect API Key
                  </button>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block mt-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">
                    Billing Documentation ↗
                  </a>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto glass-panel p-2 rounded-[2.5rem] indigo-glow">
                  <form onSubmit={handleGenerate} className="grid md:grid-cols-[1fr_auto] gap-2 p-2">
                    <div className="grid md:grid-cols-2 gap-4 p-4 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Core Topic</label>
                        <input required type="text" placeholder="e.g. Modern Sales" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all" value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Brand Name</label>
                        <input required type="text" placeholder="Your Name" className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none transition-all" value={form.brandName} onChange={(e) => setForm({...form, brandName: e.target.value})} />
                      </div>
                    </div>
                    <button type="submit" className="h-full px-10 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-[1.8rem] transition-all flex items-center justify-center shadow-lg">Generate Ebook</button>
                  </form>
                </motion.div>
              )}
              
              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 p-6 glass-panel border-rose-500/30 rounded-2xl max-w-xl mx-auto text-left">
                   <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
                   <button onClick={() => { setHasKey(false); setError(null); }} className="mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">Switch Key</button>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          <div className="pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[300px_1fr] gap-12">
              <aside className="space-y-8">
                <div className="glass-panel p-6 rounded-3xl sticky top-28 border-slate-800">
                  <div className="space-y-1 mb-8">
                    <button onClick={() => setActiveTab('cover')} className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'cover' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>Cover Design</button>
                    <button onClick={() => setActiveTab('content')} className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>Manuscript</button>
                    <button onClick={() => setActiveTab('bonuses')} className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === 'bonuses' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-900'}`}>Bonus Assets</button>
                  </div>
                  <div className="pt-6 border-t border-slate-800 space-y-3">
                    <button onClick={handleDownloadPDF} disabled={isDownloading} className="w-full py-4 bg-white text-black font-black text-sm rounded-2xl hover:bg-slate-100 transition-all disabled:opacity-50">{isDownloading ? 'Building PDF...' : 'Export Final PDF'}</button>
                    <button onClick={() => setState({ ...state, data: null })} className="w-full py-3 bg-slate-900 text-slate-400 font-bold text-xs rounded-2xl hover:bg-slate-800 transition-all">Start Over</button>
                  </div>
                </div>
              </aside>

              <div className="min-h-[80vh]">
                <AnimatePresence mode="wait">
                  {activeTab === 'cover' && (
                    <motion.div key="cover" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center">
                      <div className="w-full max-w-sm shadow-2xl rounded-2xl overflow-hidden border border-white/5 indigo-glow">
                        <CoverRenderer id={state.selectedCoverId} title={state.data.title} subtitle={state.data.subtitle} author={state.data.author} />
                      </div>
                      <div className="mt-12 w-full grid grid-cols-3 md:grid-cols-6 gap-4">
                        {CoverTemplates.map((template) => (
                          <button key={template} onClick={() => setState({ ...state, selectedCoverId: template })} className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${state.selectedCoverId === template ? 'border-indigo-500 scale-105 shadow-xl' : 'border-transparent opacity-40 hover:opacity-100'}`}>
                            <div className="scale-[0.3] origin-top-left w-[333%] h-[333%] pointer-events-none">
                              <CoverRenderer id={template} title={state.data!.title} subtitle={state.data!.subtitle} author={state.data!.author} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'content' && (
                    <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-12">
                      <div className="glass-panel p-12 md:p-20 rounded-[3rem] border-slate-800/50">
                        <div className="mb-16">
                          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">{state.data.title}</h2>
                          <p className="text-xl text-indigo-400 font-medium italic mb-12">{state.data.subtitle}</p>
                          <div className="text-slate-300 leading-relaxed text-lg whitespace-pre-line italic border-l-4 border-slate-800 pl-8">{state.data.introduction}</div>
                        </div>
                        <div className="space-y-24">
                          {state.data.chapters.map((ch, idx) => (
                            <div key={idx} className="relative">
                              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/50 mb-4">Chapter 0{idx + 1}</div>
                              <h3 className="text-2xl font-black mb-6 text-white tracking-tight">{ch.title}</h3>
                              <div className="text-slate-400 leading-relaxed text-lg whitespace-pre-line font-light">{ch.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="glass-panel p-10 rounded-[2.5rem] border-slate-800/50 border-dashed border-2 bg-slate-900/10">
                        <div className="flex flex-col items-center text-center space-y-6">
                          <div className="space-y-2">
                            <h4 className="text-xl font-black text-white">Extend Your Manuscript</h4>
                            <p className="text-slate-400 text-sm">Add custom chapters before exporting.</p>
                          </div>
                          <form onSubmit={handleAddChapter} className="w-full max-w-lg flex flex-col md:flex-row gap-3">
                            <input type="text" placeholder="e.g. Case Studies..." className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-3 text-sm outline-none transition-all" value={newChapterTopic} onChange={(e) => setNewChapterTopic(e.target.value)} disabled={isAddingChapter} />
                            <button type="submit" disabled={!newChapterTopic || isAddingChapter} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-lg min-w-[140px]">
                              {isAddingChapter ? 'Generating...' : 'Add Chapter'}
                            </button>
                          </form>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'bonuses' && (
                    <motion.div key="bonuses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-6">
                      {state.data.bonuses.map((bonus, idx) => (
                        <div key={idx} className="glass-panel p-10 rounded-[2.5rem] border-slate-800 group hover:border-indigo-500/20 transition-all">
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full mb-4 inline-block">{bonus.type}</span>
                          <h3 className="text-3xl font-black tracking-tight mb-4">{bonus.title}</h3>
                          <p className="text-slate-400 text-lg leading-relaxed">{bonus.description}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
