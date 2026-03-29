import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewModeProps } from './types';
import SpecialSection from './SpecialSection';

export default function SlidesView({ edition, condo, sections, getCategoryInfo }: ViewModeProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const allSlides = [
    { type: 'cover' as const },
    { type: 'summary' as const },
    ...sections.map(s => ({ type: 'content' as const, section: s })),
    { type: 'end' as const },
  ];

  const total = allSlides.length;

  const goNext = useCallback(() => {
    if (current < total - 1) { setDirection(1); setCurrent(p => p + 1); }
  }, [current, total]);

  const goPrev = useCallback(() => {
    if (current > 0) { setDirection(-1); setCurrent(p => p - 1); }
  }, [current]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev]);

  const slide = allSlides[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0B1A]">
      {/* Slide Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-4 relative overflow-hidden">
        {/* Nav arrows */}
        <button onClick={goPrev} disabled={current === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all disabled:opacity-0">
          ‹
        </button>
        <button onClick={goNext} disabled={current === total - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all disabled:opacity-0">
          ›
        </button>

        <div className="relative w-full max-w-4xl aspect-[16/9] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/5">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              {/* COVER SLIDE */}
              {slide.type === 'cover' && (
                <div className="w-full h-full flex flex-col items-center justify-center text-white text-center p-8 sm:p-14"
                  style={{ background: `linear-gradient(135deg, ${condo.themeColor}, ${condo.themeColor}aa, #0B0B1A)` }}>
                  <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold mb-6 mx-auto border border-white/20">AR</div>
                    <div className="inline-block px-4 py-1 rounded-full text-xs font-semibold mb-4 border border-white/20 bg-white/5">
                      Edição #{edition.editionNumber} · {edition.month} {edition.year}
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-bold mb-3">{edition.title}</h1>
                    <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto">{condo.name}</p>
                  </motion.div>
                </div>
              )}

              {/* SUMMARY SLIDE */}
              {slide.type === 'summary' && (
                <div className="w-full h-full flex flex-col p-8 sm:p-12 text-white"
                  style={{ background: `linear-gradient(160deg, #0B0B1A, ${condo.themeColor}33)` }}>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-6">Sumário</h2>
                  <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
                    {sections.map((s, idx) => {
                      const cat = getCategoryInfo(s.categoryId);
                      return (
                        <button key={s.id} onClick={() => { setDirection(1); setCurrent(idx + 2); }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: cat?.color || '#6366F1' }}>{idx + 1}</div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-white truncate">{s.title}</div>
                            <div className="text-xs text-white/40">{cat?.name}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CONTENT SLIDE */}
              {slide.type === 'content' && 'section' in slide && (() => {
                const section = slide.section;
                const cat = getCategoryInfo(section.categoryId);
                return (
                  <div className="w-full h-full flex text-white"
                    style={{ background: `linear-gradient(135deg, #0B0B1A, ${cat?.color || '#6366F1'}22)` }}>
                    {/* Left - Content */}
                    <div className="flex-1 flex flex-col justify-center p-8 sm:p-12">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white mb-4 self-start"
                        style={{ backgroundColor: `${cat?.color || '#6366F1'}66` }}>
                        {cat?.name}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">{section.title}</h2>
                      <div className="text-white/60 text-sm leading-relaxed line-clamp-[8] overflow-hidden">
                        {section.richData ? (
                          <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)' }}>
                            <SpecialSection section={section} condo={condo} />
                          </div>
                        ) : section.content.split('\n').slice(0, 4).map((line, i) => (
                          <p key={i} className="mb-2">{line}</p>
                        ))}
                      </div>
                    </div>
                    {/* Right - Image */}
                    {section.images.length > 0 && (
                      <div className="hidden sm:block w-2/5 relative">
                        <img src={section.images[0]} alt={section.title} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B1A] via-transparent to-transparent" />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* END SLIDE */}
              {slide.type === 'end' && (
                <div className="w-full h-full flex flex-col items-center justify-center text-white text-center p-8"
                  style={{ background: `linear-gradient(135deg, ${condo.themeColor}, #0B0B1A)` }}>
                  <div className="text-4xl mb-4">🙌</div>
                  <h2 className="text-3xl font-bold mb-2">Obrigado!</h2>
                  <p className="text-white/50 text-sm max-w-sm mb-4">{condo.name}</p>
                  <div className="text-xs text-white/30 space-y-0.5">
                    <div>{condo.address}</div>
                    <div>{condo.phone} · {condo.email}</div>
                  </div>
                  <div className="mt-6 text-[10px] text-white/20">Powered by APP REVISTA</div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Slide Progress */}
      <div className="flex items-center justify-center gap-3 pb-4 px-4">
        <span className="text-white/30 text-xs font-mono">{String(current + 1).padStart(2, '0')}</span>
        <div className="flex gap-1">
          {allSlides.map((_, idx) => (
            <button key={idx} onClick={() => { setDirection(idx > current ? 1 : -1); setCurrent(idx); }}
              className={`transition-all rounded-full ${idx === current
                ? 'w-6 h-1.5'
                : 'w-1.5 h-1.5 hover:bg-white/30'}`}
              style={{ backgroundColor: idx === current ? condo.accentColor : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>
        <span className="text-white/30 text-xs font-mono">{String(total).padStart(2, '0')}</span>
      </div>
    </div>
  );
}
