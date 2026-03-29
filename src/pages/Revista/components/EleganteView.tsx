import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewModeProps } from './types';
import SpecialSection from './SpecialSection';

export default function EleganteView({ edition, condo, sections, getCategoryInfo }: ViewModeProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const activeData = sections.find(s => s.id === activeSection);
  const activeCat = activeData ? getCategoryInfo(activeData.categoryId) : undefined;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: '#FAFAF8' }}>
      <div className="max-w-4xl mx-auto">

        {/* Cover */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
          className="relative min-h-[70vh] flex flex-col items-center justify-center text-center px-8 py-16"
          style={{ background: `linear-gradient(180deg, ${condo.themeColor}05, ${condo.themeColor}15, ${condo.themeColor}05)` }}>
          {/* Decorative lines */}
          <div className="absolute top-8 left-8 right-8 h-px bg-[#D4C5A9]/30" />
          <div className="absolute bottom-8 left-8 right-8 h-px bg-[#D4C5A9]/30" />
          <div className="absolute top-8 bottom-8 left-8 w-px bg-[#D4C5A9]/30" />
          <div className="absolute top-8 bottom-8 right-8 w-px bg-[#D4C5A9]/30" />

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="text-xs uppercase tracking-[0.5em] mb-6" style={{ color: condo.accentColor, fontFamily: 'Georgia, serif' }}>
              Edição {edition.editionNumber} · {edition.month} {edition.year}
            </div>
            <div className="w-12 h-px mx-auto mb-6" style={{ backgroundColor: condo.accentColor }} />
            <h1 className="text-4xl sm:text-6xl font-light text-[#1E293B] mb-4 leading-tight" style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}>
              {edition.title}
            </h1>
            <div className="w-12 h-px mx-auto mt-6 mb-6" style={{ backgroundColor: condo.accentColor }} />
            <p className="text-sm text-[#94A3B8] uppercase tracking-widest" style={{ fontFamily: 'Georgia, serif' }}>
              {condo.name}
            </p>
          </motion.div>
        </motion.div>

        {/* Sumário elegante */}
        <div className="px-8 py-12 border-t border-[#E2E8F0]">
          <div className="text-center mb-8">
            <div className="text-xs uppercase tracking-[0.4em] text-[#94A3B8] mb-2" style={{ fontFamily: 'Georgia, serif' }}>Nesta Edição</div>
            <div className="w-8 h-px mx-auto" style={{ backgroundColor: condo.accentColor }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {sections.map((section, idx) => {
              const cat = getCategoryInfo(section.categoryId);
              return (
                <button key={section.id} onClick={() => {
                  document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                  className="text-center p-4 rounded-lg hover:bg-[#F1F5F9] transition-colors group">
                  <div className="text-2xl mb-2 font-light text-[#CBD5E1] group-hover:text-[#94A3B8]" style={{ fontFamily: 'Georgia, serif' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="text-xs font-medium text-[#1E293B] leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {section.title}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: cat?.color }}>{cat?.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        {sections.map((section, idx) => {
          const cat = getCategoryInfo(section.categoryId);
          const hasImage = section.images.length > 0;
          const isEven = idx % 2 === 0;

          return (
            <motion.div
              key={section.id}
              id={`section-${section.id}`}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
              className="border-t border-[#E2E8F0]"
            >
              {/* Full-bleed image for sections with images */}
              {hasImage && (
                <div className="relative w-full h-64 sm:h-80 overflow-hidden">
                  <img src={section.images[0]} alt={section.title} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#FAFAF8]" />
                </div>
              )}

              <div className={`px-8 sm:px-16 ${hasImage ? 'pt-6' : 'pt-12'} pb-12`}>
                {/* Category + Number */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-light text-[#E2E8F0]" style={{ fontFamily: 'Georgia, serif' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: `${cat?.color || '#E2E8F0'}33` }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: cat?.color }}>
                    {cat?.name}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl font-light text-[#1E293B] mb-6 leading-tight" style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}>
                  {section.title}
                </h2>

                {/* Content in editorial columns */}
                {section.richData ? (
                  <SpecialSection section={section} condo={condo} />
                ) : (
                  <div className={`text-[#475569] text-[15px] leading-[1.8] ${section.content.length > 300 ? 'sm:columns-2 sm:gap-8' : ''}`}
                    style={{ fontFamily: 'Georgia, serif' }}>
                    {section.content.split('\n').map((line, i) => (
                      <p key={i} className={`mb-4 ${i === 0 ? 'first-letter:text-4xl first-letter:font-bold first-letter:float-left first-letter:mr-2 first-letter:leading-none' : ''}`}>
                        {line}
                      </p>
                    ))}
                  </div>
                )}

                {/* Additional images */}
                {section.images.length > 1 && (
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {section.images.slice(1).map((img, i) => (
                      <div key={i} className="relative h-44 rounded-lg overflow-hidden">
                        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Back Cover */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="border-t border-[#E2E8F0] text-center py-16 px-8"
          style={{ background: `linear-gradient(180deg, #FAFAF8, ${condo.themeColor}08)` }}>
          <div className="text-xs uppercase tracking-[0.5em] text-[#94A3B8] mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Obrigado pela leitura
          </div>
          <div className="w-8 h-px mx-auto mb-6" style={{ backgroundColor: condo.accentColor }} />
          <p className="text-lg font-light text-[#64748B]" style={{ fontFamily: 'Georgia, serif' }}>{condo.name}</p>
          <div className="text-xs text-[#CBD5E1] mt-4 space-y-0.5">
            <div>{condo.address}</div>
            <div>{condo.phone} · {condo.email}</div>
          </div>
          <div className="mt-8 text-[10px] text-[#E2E8F0] uppercase tracking-widest">Powered by APP REVISTA</div>
        </motion.div>
      </div>
    </div>
  );
}
