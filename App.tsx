
import React, { useState, useRef } from 'react';
import { EbookData, EbookState, CoverTemplateId } from './types.ts';
import { generateEbook } from './services/geminiService.ts';
import { CoverRenderer, ModernCover, BoldCover, ElegantCover } from './components/CoverTemplates.tsx';
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

  const formRef = useRef<HTMLDivElement>(null);
  const whyRef = useRef<HTMLElement>(null);
  const samplesRef = useRef<HTMLElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);

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
      console.error("Catch block error:", err);
      setError(`Generation failed: ${err.message || 'The AI service is temporarily unavailable.'}`);
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleDownloadPDF = async () => {
    if (!state.data || !coverRef.current) return;
    setIsDownloading(true);

    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      const canvas = await html2canvas(coverRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.text('Table of Contents', margin, 40);
      doc.setDrawColor(99, 102, 241);
      doc.line(margin, 45, margin + 40, 45);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      let tocY = 60;
      doc.text('Introduction', margin, tocY);
      tocY += 10;
      state.data.chapters.forEach((ch, i) => {
        doc.text(`${i + 1}. ${ch.title}`, margin, tocY);
        tocY += 8;
        if (tocY > pageHeight - margin) {
          doc.addPage();
          tocY = margin;
        }
      });

      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('Introduction', margin, 35);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const introLines = doc.splitTextToSize(state.data.introduction, contentWidth);
      doc.text(introLines, margin, 50, { lineHeightFactor: 1.5 });

      doc.setTextColor(0, 0, 0);
      state.data.chapters.forEach((chapter, index) => {
        doc.addPage();
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(`Chapter ${index + 1}: ${chapter.title}`, margin, 35);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, 40, margin + 20, 40);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(chapter.content, contentWidth);
        
        let cursorY = 55;
        lines.forEach((line: string) => {
          if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.text(line, margin, cursorY);
          cursorY += 6.5;
        });
      });

      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Conversion Boosters', margin, 35);
      
      let bonusY = 55;
      state.data.bonuses.forEach((bonus) => {
        if (bonusY > pageHeight - 60) {
          doc.addPage();
          bonusY = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`${bonus.title} (${bonus.type})`, margin, bonusY);
        bonusY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const descLines = doc.splitTextToSize(bonus.description, contentWidth);
        doc.text(descLines, margin, bonusY);
        bonusY += (descLines.length * 5) + 8;
        
        if (bonus.items) {
          doc.setTextColor(50, 50, 50);
          bonus.items.forEach(item => {
            doc.text(`• ${item}`, margin + 5, bonusY);
            bonusY += 6;
          });
          bonusY += 10;
        }
        doc.setTextColor(0, 0, 0);
      });

      const pageCount = doc.internal.pages.length;
      for (let i = 2; i < pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i - 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      }

      doc.save(`${state.data.title.replace(/\s+/g, '_')}_Ebook.pdf`);
    } catch (err) {
      console.error("PDF download error:", err);
      alert("Something went wrong generating your PDF.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadZip = async () => {
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

        const readme = `EbookMaker.AI Asset Pack\nGenerated on: ${new Date().toLocaleDateString()}\nTopic: ${form.topic}\nNiche: ${form.niche}\nTone: ${form.tone}\n\nThank you for using EbookMaker.AI.`;
        root.file("GENERATION_INFO.txt", readme);
      }

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${folderName}_pack.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to package the files.");
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
            EbookMaker.AI is generating your expert asset. This may take a few seconds as we craft multiple high-quality chapters.
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
      <header className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-white/5 bg-[#030712]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={reset}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/30">E</div>
          <span className="text-xl font-bold tracking-tight">EbookMaker<span className="text-indigo-500">.AI</span></span>
        </div>
        {!state.data ? (
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-400">
            <button onClick={() => scrollTo(whyRef)} className="hover:text-white transition-colors">Why Authority?</button>
            <button onClick={() => scrollTo(samplesRef)} className="hover:text-white transition-colors">Samples</button>
            <button 
              onClick={() => scrollTo(formRef)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-lg shadow-indigo-600/20"
            >
              Get Started
            </button>
          </nav>
        ) : (
          <button 
            onClick={reset}
            className="text-sm font-bold text-indigo-400 hover:text-indigo-300 px-6 py-2.5 rounded-full bg-indigo-500/5 border border-indigo-500/20"
          >
            + Create New
          </button>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6">
        {error && (
          <div className="mt-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-center font-medium">
            <span className="mr-2">⚠️</span> {error}
          </div>
        )}

        {!state.data ? (
          <>
            <div className="mt-12 md:mt-24 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  Premium AI Platform
                </div>
                <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-8 tracking-tight">
                  Create <span className="gradient-text">expert</span> ebooks — <span className="text-white">instantly.</span>
                </h1>
                <p className="text-xl text-zinc-400 mb-12 leading-relaxed max-w-xl">
                  The web's smartest engine for lead magnets. Generate 15 chapters of professional prose designed to position you as a market leader.
                </p>
                <div className="grid sm:grid-cols-2 gap-6 mb-12">
                  {["15 Expert Chapters", "Professional Tone", "Instant Assets", "Custom Branding"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-zinc-300 font-medium">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div ref={formRef} className="glass p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
                <form onSubmit={handleGenerate} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Topic or Niche</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g., Digital Marketing Strategies"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 transition-all text-white outline-none"
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
                        placeholder="e.g., Alex Rivers"
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 transition-all text-white outline-none"
                        value={form.brandName}
                        onChange={(e) => setForm({...form, brandName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Tone</label>
                      <select 
                        className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 transition-all text-white outline-none appearance-none"
                        value={form.tone}
                        onChange={(e) => setForm({...form, tone: e.target.value})}
                      >
                        {Tones.map(tone => <option key={tone} value={tone} className="bg-zinc-900">{tone}</option>)}
                      </select>
                    </div>
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                  >
                    Build My Ebook
                  </button>
                </form>
              </div>
            </div>

            <section ref={whyRef} className="mt-32 pt-20">
              <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Generate <span className="text-indigo-500">Authority</span></h2>
                <p className="text-zinc-400 text-lg">We don't just give you a list. We generate high-quality prose that builds trust with your readers.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { title: "Deep Content", desc: "15 chapters of substantial information, not just bullet points.", icon: "📚" },
                  { title: "Ready to Use", desc: "Download in PDF or ZIP format for immediate distribution.", icon: "🚀" },
                  { title: "Expert Tone", desc: "Engineered to sound authoritative and professional.", icon: "💎" }
                ].map((feature, idx) => (
                  <div key={idx} className="glass p-10 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all">
                    <div className="text-4xl mb-6">{feature.icon}</div>
                    <h3 className="text-2xl font-black mb-4">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <div className="mt-8 grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="glass p-8 rounded-3xl border border-white/5 sticky top-24">
                <div className="flex flex-col gap-3 mb-10">
                  <button 
                    onClick={() => setActiveTab('cover')}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'cover' ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    Cover Design
                  </button>
                  <button 
                    onClick={() => setActiveTab('content')}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    Full Manuscript
                  </button>
                  <button 
                    onClick={() => setActiveTab('bonuses')}
                    className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold ${activeTab === 'bonuses' ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-white/5 text-zinc-400'}`}
                  >
                    Bonus Package
                  </button>
                </div>
                <div className="space-y-4 pt-6 border-t border-white/5">
                  <button 
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                    className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all"
                  >
                    {isDownloading ? "..." : "Download PDF"}
                  </button>
                  <button 
                    onClick={handleDownloadZip}
                    disabled={isDownloading}
                    className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-zinc-300 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all"
                  >
                    Download ZIP
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              {activeTab === 'cover' && (
                <div className="flex flex-col items-center">
                  <div ref={coverRef} className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden">
                    <CoverRenderer 
                      id={state.selectedCoverId} 
                      title={state.data.title} 
                      subtitle={state.data.subtitle} 
                      author={state.data.author} 
                    />
                  </div>
                  <div className="mt-12 w-full glass p-8 rounded-[2rem]">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                      {CoverTemplates.map((template) => (
                        <button 
                          key={template}
                          onClick={() => setState(prev => ({ ...prev, selectedCoverId: template }))}
                          className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${state.selectedCoverId === template ? 'border-indigo-500 scale-105' : 'border-transparent opacity-50'}`}
                        >
                          <div className="scale-[0.4] origin-top-left w-[250%] h-[250%] pointer-events-none">
                             <CoverRenderer id={template} title={state.data!.title} subtitle={state.data!.subtitle} author={state.data!.author} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-12 pb-20">
                  <div className="glass p-10 md:p-16 rounded-[3rem] shadow-2xl">
                    <h2 className="text-5xl font-black mb-4">{state.data.title}</h2>
                    <p className="text-2xl text-indigo-400 mb-12">{state.data.subtitle}</p>
                    <div className="prose prose-invert max-w-none">
                      <div className="mb-20 italic text-zinc-400 text-xl border-l-4 border-indigo-500 pl-8">
                        {state.data.introduction}
                      </div>
                      <div className="space-y-20">
                        {state.data.chapters.map((chapter, idx) => (
                          <div key={idx} className="relative pt-12">
                             <h4 className="text-3xl font-black mb-6 text-white">Chapter {idx + 1}: {chapter.title}</h4>
                             <div className="text-zinc-400 leading-relaxed whitespace-pre-line text-lg">
                                {chapter.content}
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
                    <div key={idx} className="glass p-10 rounded-[2.5rem] border-l-8 border-emerald-500">
                      <h3 className="text-3xl font-black mb-4">{bonus.title}</h3>
                      <p className="text-zinc-400 text-lg mb-8 leading-relaxed">{bonus.description}</p>
                      {bonus.items && (
                        <ul className="grid sm:grid-cols-2 gap-4">
                          {bonus.items.map((item, i) => (
                            <li key={i} className="flex items-center gap-3 text-zinc-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
