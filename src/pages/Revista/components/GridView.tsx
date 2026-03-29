import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewModeProps } from './types';
import SpecialSection from './SpecialSection';

export default function GridView({ edition, condo, sections, getCategoryInfo }: ViewModeProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const selectedData = sections.find(s => s.id === selectedSection);
  const selectedCat = selectedData ? getCategoryInfo(selectedData.categoryId) : null;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: condo.themeColor }}>
              {condo.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="text-left">
              <div className="text-xs text-white/50 uppercase tracking-wider">Revista Digital</div>
              <div className="font-semibold text-white">{condo.name}</div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">{edition.title}</h1>
          <p className="text-white/50 text-sm">Edição #{edition.editionNumber} · {edition.month} {edition.year}</p>
        </motion.div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section, idx) => {
            const cat = getCategoryInfo(section.categoryId);
            return (
              <motion.button
                key={section.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedSection(section.id)}
                className="bg-white rounded-xl shadow-lg overflow-hidden text-left group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* Card Image */}
                {section.images.length > 0 ? (
                  <div className="relative w-full h-36 overflow-hidden">
                    <img
                      src={section.images[0]}
                      alt={section.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {section.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                        +{section.images.length - 1} foto{section.images.length > 2 ? 's' : ''}
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2">
                      <div className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white"
                        style={{ backgroundColor: `${cat?.color || '#6366F1'}cc` }}>
                        {cat?.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-2" style={{ backgroundColor: cat?.color || '#6366F1' }} />
                )}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: cat?.color || '#6366F1' }}>
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      {section.images.length === 0 && (
                        <div className="text-xs font-medium mb-0.5" style={{ color: cat?.color }}>{cat?.name}</div>
                      )}
                      <h3 className="font-bold text-[#1E293B] text-sm leading-tight">{section.title}</h3>
                    </div>
                  </div>
                  <p className="text-[#94A3B8] text-xs line-clamp-3 leading-relaxed">
                    {section.content.substring(0, 150)}...
                  </p>
                  <div className="mt-3 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{ color: cat?.color || '#6366F1' }}>
                    Ler mais
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-xs text-white/30">
          <span className="font-semibold">APP REVISTA</span> · www.apprevista.com.br
        </div>
      </div>

      {/* Expanded Card Modal */}
      <AnimatePresence>
        {selectedData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedSection(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}>

              <div className="h-2 rounded-t-2xl" style={{ backgroundColor: selectedCat?.color || '#6366F1' }} />
              <button onClick={() => setSelectedSection(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] flex items-center justify-center transition-colors z-10">
                <svg className="w-4 h-4 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: selectedCat?.color || '#6366F1' }}>{selectedCat?.name.charAt(0)}</div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider" style={{ color: selectedCat?.color }}>{selectedCat?.name}</div>
                    <h2 className="text-2xl font-bold text-[#1E293B]">{selectedData.title}</h2>
                  </div>
                </div>

                {/* Image Gallery */}
                {selectedData.images.length > 0 && (
                  <div className={`mb-6 gap-2 ${selectedData.images.length === 1 ? 'flex' : 'grid grid-cols-2'}`}>
                    {selectedData.images.map((img, i) => (
                      <button key={i} onClick={() => setLightboxImg(img)}
                        className={`relative rounded-xl overflow-hidden group/img ${selectedData.images.length === 1 ? 'w-full h-56' : 'h-40'}`}>
                        <img
                          src={img}
                          alt={`${selectedData.title} - Foto ${i + 1}`}
                          className="absolute inset-0 w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                          <svg className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-80 transition-opacity drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="w-full h-px bg-[#E2E8F0] mb-6" />
                {selectedData.richData ? (
                  <SpecialSection section={selectedData} condo={condo} />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {selectedData.content.split('\n').map((line, i) => (
                      <p key={i} className="text-[#475569] leading-relaxed mb-3 text-base">{line}</p>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-8 sm:px-10 pb-6">
                <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-4 border-t border-[#E2E8F0]">
                  <span>{condo.name} · {edition.month} {edition.year}</span>
                  <span style={{ color: condo.accentColor }}>APP REVISTA</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90"
            onClick={() => setLightboxImg(null)}>
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-[85vh]"
              onClick={e => e.stopPropagation()}>
              <img src={lightboxImg} alt="Foto ampliada" className="absolute inset-0 w-full h-full object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
