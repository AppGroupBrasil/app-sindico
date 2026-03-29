import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewModeProps } from './types';
import SpecialSection from './SpecialSection';

export default function StoriesView({ edition, condo, sections, getCategoryInfo }: ViewModeProps) {
  const [currentStory, setCurrentStory] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const STORY_DURATION = 8000; // 8s per story
  const TICK = 50;

  const allStories = [
    { type: 'cover' as const },
    ...sections.map(s => ({ type: 'content' as const, section: s })),
    { type: 'back' as const },
  ];

  const totalStories = allStories.length;

  const goNext = useCallback(() => {
    if (currentStory < totalStories - 1) {
      setCurrentStory(p => p + 1);
      setProgress(0);
    }
  }, [currentStory, totalStories]);

  const goPrev = useCallback(() => {
    if (currentStory > 0) {
      setCurrentStory(p => p - 1);
      setProgress(0);
    }
  }, [currentStory]);

  // Auto-advance timer
  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (TICK / STORY_DURATION) * 100;
        if (next >= 100) {
          goNext();
          return 0;
        }
        return next;
      });
    }, TICK);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, currentStory, goNext]);

  // Reset progress on story change
  useEffect(() => { setProgress(0); }, [currentStory]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) goPrev();
    else if (x > rect.width * 0.7) goNext();
  };

  const story = allStories[currentStory];

  return (
    <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-md mx-auto bg-black rounded-2xl overflow-hidden shadow-2xl"
        style={{ height: 'min(85vh, 750px)', maxHeight: '85vh' }}>

        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2 px-3">
          {allStories.map((_, idx) => (
            <div key={idx} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all"
                style={{
                  width: idx < currentStory ? '100%' : idx === currentStory ? `${progress}%` : '0%',
                  transition: idx === currentStory ? 'none' : 'width 0.3s'
                }} />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-5 left-0 right-0 z-20 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/30"
              style={{ backgroundColor: condo.themeColor }}>
              {condo.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div>
              <div className="text-white text-xs font-semibold">{condo.name}</div>
              <div className="text-white/50 text-[10px]">Ed. #{edition.editionNumber} · {edition.month} {edition.year}</div>
            </div>
          </div>
          <button onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors">
            {isPaused ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
            )}
          </button>
        </div>

        {/* Touch Areas */}
        <div className="absolute inset-0 z-10 flex"
          onClick={handleTap}
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}>
        </div>

        {/* Story Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col"
          >
            {/* COVER STORY */}
            {story.type === 'cover' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-white text-center"
                style={{ background: `linear-gradient(180deg, ${condo.themeColor}, ${condo.themeColor}bb, #000)` }}>
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.2) 0%, transparent 60%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.15) 0%, transparent 50%)'
                }} />
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mb-6 mx-auto border-2 border-white/20">AR</div>
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-white/30"
                    style={{ backgroundColor: `${condo.accentColor}44` }}>
                    Edição #{edition.editionNumber}
                  </div>
                  <h1 className="text-3xl font-bold mb-3 leading-tight">{edition.title}</h1>
                  <p className="text-white/60 text-sm max-w-xs">Toque para navegar pelas matérias desta edição</p>
                </motion.div>
                <div className="absolute bottom-12 left-0 right-0 flex justify-center">
                  <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-white/40 text-xs flex flex-col items-center gap-1">
                    <span>Toque para avançar</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </motion.div>
                </div>
              </div>
            )}

            {/* CONTENT STORY */}
            {story.type === 'content' && 'section' in story && (() => {
              const section = story.section;
              const cat = getCategoryInfo(section.categoryId);
              return (
                <div className="flex-1 flex flex-col relative"
                  style={{ background: `linear-gradient(180deg, ${cat?.color || '#6366F1'}22, #0F172A)` }}>
                  {/* Background image if available */}
                  {section.images.length > 0 && (
                    <>
                      <img src={section.images[0]} alt={section.title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    </>
                  )}
                  {/* Category badge */}
                  <div className="relative pt-16 pb-4 px-6 z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: `${cat?.color || '#6366F1'}88` }}>
                      <span>{cat?.name}</span>
                    </div>
                  </div>
                  {/* Article content */}
                  <div className="relative flex-1 flex flex-col justify-end px-6 pb-20 z-10">
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                      <h2 className="text-2xl font-bold text-white mb-3 leading-tight">{section.title}</h2>
                      <div className="text-white/70 text-sm leading-relaxed line-clamp-6 overflow-hidden">
                        {section.richData ? (
                          <div style={{ background: 'rgba(0,0,0,0.45)', borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)' }}>
                            <SpecialSection section={section} condo={condo} />
                          </div>
                        ) : section.content.split('\n').slice(0, 3).map((line, i) => (
                          <p key={i} className="mb-2">{line}</p>
                        ))}
                      </div>
                    </motion.div>
                    <div className="mt-4 text-xs text-white/30">
                      {currentStory} de {totalStories - 1}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* BACK STORY */}
            {story.type === 'back' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-white text-center"
                style={{ background: `linear-gradient(180deg, ${condo.themeColor}, #000)` }}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                  className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold mb-4 mx-auto border-2 border-white/20">AR</div>
                  <h2 className="text-2xl font-bold mb-2">Obrigado! 🙌</h2>
                  <p className="text-white/60 text-sm max-w-xs mb-6">
                    Essa edição foi preparada com carinho pelo {condo.name}
                  </p>
                  <div className="space-y-1 text-xs text-white/40">
                    <div>📍 {condo.address}</div>
                    <div>📞 {condo.phone}</div>
                  </div>
                  <div className="mt-8 text-xs text-white/25">
                    Powered by <span className="font-semibold text-white/40">APP REVISTA</span>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
