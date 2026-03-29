import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewModeProps } from './types';
import SpecialSection from './SpecialSection';

export default function NewspaperView({ edition, condo, sections, getCategoryInfo }: ViewModeProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const mainStory = sections[0];
  const secondaryStories = sections.slice(1, 3);
  const restStories = sections.slice(3);
  const mainCat = mainStory ? getCategoryInfo(mainStory.categoryId) : undefined;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: '#FDF6E3' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Newspaper Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center border-b-4 border-double border-[#2C1810] pb-4 mb-1">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#8B7355] mb-1">{today}</div>
          <h1 className="text-4xl sm:text-6xl font-black text-[#2C1810] tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            {condo.name}
          </h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-[#8B7355] uppercase tracking-widest">
            <span>Edição Nº {edition.editionNumber}</span>
            <span>·</span>
            <span>{edition.month} {edition.year}</span>
            <span>·</span>
            <span>Revista Digital</span>
          </div>
        </motion.div>

        <div className="border-b-2 border-[#2C1810] mb-4" />

        {/* Main Headline */}
        {mainStory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mb-6 cursor-pointer" onClick={() => setExpandedId(expandedId === mainStory.id ? null : mainStory.id)}>
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: mainCat?.color || '#8B7355' }}>
              ★ {mainCat?.name || 'Destaque'}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C1810] leading-tight mb-3" style={{ fontFamily: 'Georgia, serif' }}>
              {mainStory.title}
            </h2>
            <div className="flex gap-6">
              {mainStory.images.length > 0 && (
                <div className="relative w-1/2 h-56 rounded-sm overflow-hidden shrink-0 border border-[#D4C5A9]">
                  <img src={mainStory.images[0]} alt={mainStory.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1" style={{ fontFamily: 'Georgia, serif' }}>
                <p className="text-[#4A3728] leading-relaxed text-sm first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-none"
                  style={{ columnCount: mainStory.images.length > 0 ? 1 : 2, columnGap: '1.5rem' }}>
                  {mainStory.content}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="border-t border-[#D4C5A9] mb-4" />

        {/* Secondary Stories - 2 columns */}
        {secondaryStories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {secondaryStories.map((section, idx) => {
              const cat = getCategoryInfo(section.categoryId);
              return (
                <motion.div key={section.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}
                  className="cursor-pointer group" onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: cat?.color || '#8B7355' }}>
                    {cat?.name}
                  </div>
                  <h3 className="text-xl font-bold text-[#2C1810] leading-tight mb-2 group-hover:underline" style={{ fontFamily: 'Georgia, serif' }}>
                    {section.title}
                  </h3>
                  {section.images.length > 0 && (
                    <div className="relative w-full h-36 rounded-sm overflow-hidden mb-2 border border-[#D4C5A9]">
                      <img src={section.images[0]} alt={section.title} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-[#4A3728] text-xs leading-relaxed line-clamp-4" style={{ fontFamily: 'Georgia, serif' }}>
                    {section.content}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}

        {secondaryStories.length > 0 && <div className="border-t border-[#D4C5A9] mb-4" />}

        {/* Rest of stories - 3 columns newspaper style */}
        {restStories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            {restStories.map((section, idx) => {
              const cat = getCategoryInfo(section.categoryId);
              return (
                <motion.div key={section.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className="cursor-pointer group border-b border-[#D4C5A9] pb-4"
                  onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: cat?.color || '#8B7355' }}>
                    {cat?.name}
                  </div>
                  <h4 className="text-sm font-bold text-[#2C1810] leading-tight mb-1.5 group-hover:underline" style={{ fontFamily: 'Georgia, serif' }}>
                    {section.title}
                  </h4>
                  <p className="text-[#4A3728] text-[11px] leading-relaxed line-clamp-3" style={{ fontFamily: 'Georgia, serif' }}>
                    {section.content}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-4 border-double border-[#2C1810] text-center">
          <div className="text-[10px] text-[#8B7355] uppercase tracking-widest">
            {condo.name} · {condo.address} · {condo.phone}
          </div>
          <div className="text-[10px] text-[#B8A88A] mt-1">Powered by APP REVISTA</div>
        </div>
      </div>

      {/* Expanded Article Modal */}
      <AnimatePresence>
        {expandedId && (() => {
          const section = sections.find(s => s.id === expandedId);
          if (!section) return null;
          const cat = getCategoryInfo(section.categoryId);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setExpandedId(null)}>
              <div className="absolute inset-0 bg-[#2C1810]/60 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30 }}
                className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-sm shadow-2xl"
                style={{ backgroundColor: '#FDF6E3' }}
                onClick={e => e.stopPropagation()}>
                <button onClick={() => setExpandedId(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#2C1810]/10 hover:bg-[#2C1810]/20 flex items-center justify-center z-10">
                  ✕
                </button>
                <div className="p-8 sm:p-10">
                  <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: cat?.color }}>
                    {cat?.name}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#2C1810] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                    {section.title}
                  </h2>
                  {section.images.length > 0 && (
                    <div className="mb-4 gap-2 grid grid-cols-2">
                      {section.images.map((img, i) => (
                        <div key={i} className="relative h-40 rounded-sm overflow-hidden border border-[#D4C5A9] bg-white">
                          <img src={img} alt="" className="absolute inset-0 w-full h-full object-contain p-1" />
                        </div>
                      ))}
                    </div>
                  )}
                  {section.richData ? (
                    <SpecialSection section={section} condo={condo} />
                  ) : (
                    <div style={{ fontFamily: 'Georgia, serif', columnCount: 2, columnGap: '1.5rem' }} className="text-[#4A3728] text-sm leading-relaxed">
                      {section.content.split('\n').map((line, i) => (
                        <p key={i} className="mb-3">{line}</p>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
