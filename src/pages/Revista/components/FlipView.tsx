import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewModeProps } from './types';
import SpecialSection from './SpecialSection';

export default function FlipView({ edition, condo, sections, getCategoryInfo }: ViewModeProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);

  const allPages = [
    { type: 'cover' as const },
    { type: 'summary' as const },
    ...sections.map(s => ({ type: 'content' as const, section: s })),
    { type: 'back' as const },
  ];

  const totalPages = allPages.length;

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage(p => p + 1);
    }
  }, [currentPage, totalPages]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(p => p - 1);
    }
  }, [currentPage]);

  const goToPage = (idx: number) => {
    setDirection(idx > currentPage ? 1 : -1);
    setCurrentPage(idx);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const page = allPages[currentPage];

  return (
    <div className="flex-1 flex flex-col">
      {/* Magazine Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-4">
        <div className="relative w-full max-w-2xl" style={{ perspective: '1500px' }}>
          {/* Navigation Arrows */}
          <button onClick={goPrev} disabled={currentPage === 0}
            className="absolute left-0 sm:-left-16 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goNext} disabled={currentPage === totalPages - 1}
            className="absolute right-0 sm:-right-16 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          {/* Page with 3D flip */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={{
                enter: (dir: number) => ({
                  rotateY: dir > 0 ? 90 : -90,
                  opacity: 0,
                }),
                center: { rotateY: 0, opacity: 1 },
                exit: (dir: number) => ({
                  rotateY: dir > 0 ? -90 : 90,
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="w-full"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* COVER */}
              {page.type === 'cover' && (
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ minHeight: '70vh' }}>
                  <div className="relative p-8 sm:p-12 text-white flex flex-col justify-between"
                    style={{ minHeight: '70vh', background: `linear-gradient(135deg, ${condo.themeColor}, ${condo.themeColor}dd)` }}>
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)'
                    }} />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold border-2 border-white/30">
                            {condo.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="text-xs text-white/60 uppercase tracking-widest">Revista Digital</div>
                            <div className="font-bold text-lg">{condo.name}</div>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border-2 border-white/30"
                          style={{ backgroundColor: condo.accentColor }}>AR</div>
                      </div>
                    </div>
                    <div className="relative text-center flex-1 flex flex-col items-center justify-center">
                      <div className="inline-block px-4 py-1 rounded-full text-xs font-semibold mb-6 border border-white/30"
                        style={{ backgroundColor: `${condo.accentColor}33` }}>
                        Edição #{edition.editionNumber} · {edition.month} {edition.year}
                      </div>
                      <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">{edition.title}</h1>
                      <p className="text-white/70 text-lg max-w-md mx-auto">
                        Confira as novidades, realizações e tudo que aconteceu no seu condomínio
                      </p>
                      <div className="mt-8">
                        <button onClick={goNext}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                          style={{ backgroundColor: condo.accentColor, color: '#fff' }}>
                          Abrir Revista
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="relative flex items-center justify-between text-xs text-white/50 pt-6 border-t border-white/10">
                      <div>📍 {condo.address}</div>
                      <div>📞 {condo.phone}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUMMARY */}
              {page.type === 'summary' && (
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ minHeight: '70vh' }}>
                  <div className="p-2" style={{ backgroundColor: condo.themeColor }}>
                    <div className="text-center text-white text-xs font-medium py-1">{condo.name} · Edição #{edition.editionNumber}</div>
                  </div>
                  <div className="p-8 sm:p-12">
                    <h2 className="text-3xl font-bold text-[#1E293B] mb-2">Sumário</h2>
                    <div className="w-16 h-1 rounded-full mb-8" style={{ backgroundColor: condo.accentColor }} />
                    <div className="space-y-3">
                      {sections.map((section, idx) => {
                        const cat = getCategoryInfo(section.categoryId);
                        return (
                          <button key={section.id} onClick={() => goToPage(idx + 2)}
                            className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] transition-colors text-left group">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-transform group-hover:scale-110"
                              style={{ backgroundColor: cat?.color || '#6366F1' }}>{idx + 1}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#1E293B] text-sm">{section.title}</div>
                              <div className="text-xs text-[#94A3B8]">{cat?.name}</div>
                            </div>
                            <svg className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#64748B] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CONTENT */}
              {page.type === 'content' && 'section' in page && (() => {
                const section = page.section;
                const cat = getCategoryInfo(section.categoryId);
                return (
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ minHeight: '70vh' }}>
                    <div className="p-2" style={{ backgroundColor: condo.themeColor }}>
                      <div className="text-center text-white text-xs font-medium py-1">{condo.name} · {edition.month} {edition.year}</div>
                    </div>
                    <div className="p-8 sm:p-12">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: cat?.color || '#6366F1' }}>{cat?.name.charAt(0) || 'R'}</div>
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wider" style={{ color: cat?.color }}>{cat?.name}</div>
                          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E293B]">{section.title}</h2>
                        </div>
                      </div>
                      <div className="w-full h-px bg-[#E2E8F0] mb-6" />
                      {section.images.length > 0 && (
                        <div className={`mb-6 gap-2 ${section.images.length === 1 ? 'flex' : 'grid grid-cols-2'}`}>
                          {section.images.map((img, i) => (
                            <div key={i} className={`relative rounded-xl overflow-hidden ${section.images.length === 1 ? 'w-full h-48' : 'h-36'}`}>
                              <img src={img} alt={`${section.title} - ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                      {section.richData ? (
                        <SpecialSection section={section} condo={condo} />
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          {section.content.split('\n').map((line, idx) => (
                            <p key={idx} className="text-[#475569] leading-relaxed mb-3 text-base">{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="px-8 sm:px-12 pb-6 mt-auto">
                      <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-4 border-t border-[#E2E8F0]">
                        <span>Página {currentPage + 1} de {totalPages}</span>
                        <span style={{ color: condo.accentColor }}>APP REVISTA</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* BACK COVER */}
              {page.type === 'back' && (
                <div className="rounded-2xl shadow-2xl overflow-hidden text-white flex flex-col items-center justify-center text-center p-12"
                  style={{ minHeight: '70vh', background: `linear-gradient(135deg, ${condo.themeColor}, ${condo.themeColor}dd)` }}>
                  <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mb-6 border-2 border-white/20">AR</div>
                  <h2 className="text-3xl font-bold mb-3">Obrigado pela leitura!</h2>
                  <p className="text-white/70 max-w-sm mb-8">Esta revista foi criada com carinho pela administração do {condo.name}</p>
                  <div className="space-y-2 text-sm text-white/60">
                    <div>📍 {condo.address}</div>
                    <div>📞 {condo.phone}</div>
                    <div>✉ {condo.email}</div>
                  </div>
                  <div className="mt-10 pt-6 border-t border-white/10 w-full">
                    <div className="text-xs text-white/40">Powered by <span className="font-semibold text-white/60">APP REVISTA</span> · www.apprevista.com.br</div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="flex items-center justify-center gap-1.5 pb-6">
        {allPages.map((_, idx) => (
          <button key={idx} onClick={() => goToPage(idx)}
            className={`transition-all rounded-full ${idx === currentPage ? 'w-8 h-2 bg-[#D4AF37]' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`} />
        ))}
      </div>
    </div>
  );
}
