import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewModeProps } from './types';
import SpecialSection from './SpecialSection';

export default function TimelineView({ edition, condo, sections, getCategoryInfo }: ViewModeProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold border-2 border-white/20"
              style={{ backgroundColor: condo.themeColor }}>
              {condo.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="text-left">
              <div className="text-xs text-white/40 uppercase tracking-wider">Linha do Tempo</div>
              <div className="font-semibold text-white">{condo.name}</div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{edition.title}</h1>
          <p className="text-white/40 text-sm mt-1">Edição #{edition.editionNumber} · {edition.month} {edition.year}</p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/10 to-transparent sm:-translate-x-px" />

          {sections.map((section, idx) => {
            const cat = getCategoryInfo(section.categoryId);
            const isLeft = idx % 2 === 0;
            const isExpanded = expandedId === section.id;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className={`relative flex items-start mb-8 ${isLeft ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}
              >
                {/* Dot on timeline */}
                <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 z-10 flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: cat?.color || '#6366F1' }} />
                </div>

                {/* Connector line */}
                <div className={`hidden sm:block absolute top-1.5 h-px w-8 ${isLeft ? 'right-1/2 mr-1.5' : 'left-1/2 ml-1.5'}`}
                  style={{ backgroundColor: `${cat?.color || '#6366F1'}44` }} />

                {/* Content Card */}
                <div className={`ml-14 sm:ml-0 flex-1 sm:max-w-[calc(50%-2rem)] ${isLeft ? 'sm:mr-auto sm:pr-10' : 'sm:ml-auto sm:pl-10'}`}>
                  <motion.div
                    onClick={() => setExpandedId(isExpanded ? null : section.id)}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden cursor-pointer group hover:bg-white/[0.07] hover:border-white/15 transition-all"
                  >
                    {/* Category badge & number */}
                    <div className="flex items-center justify-between px-4 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: cat?.color || '#6366F1' }}>{idx + 1}</div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cat?.color || '#6366F1' }}>
                          {cat?.name}
                        </span>
                      </div>
                      <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} className="text-white/30 text-xs">▾</motion.span>
                    </div>

                    {/* Title */}
                    <div className="px-4 py-2">
                      <h3 className="text-white font-bold text-sm leading-tight group-hover:text-white/90">{section.title}</h3>
                    </div>

                    {/* Preview image */}
                    {section.images.length > 0 && (
                      <div className="relative w-full h-32 overflow-hidden">
                        <img src={section.images[0]} alt={section.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    )}

                    {/* Preview text */}
                    <div className="px-4 py-3">
                      <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{section.content}</p>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-white/5 pt-3">
                            {section.images.length > 1 && (
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {section.images.slice(1).map((img, i) => (
                                  <div key={i} className="relative h-28 rounded-lg overflow-hidden">
                                    <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                            {section.richData ? (
                              <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)', padding: 12 }}>
                                <SpecialSection section={section} condo={condo} />
                              </div>
                            ) : (
                              <div className="text-white/60 text-xs leading-relaxed">
                                {section.content.split('\n').map((line, i) => (
                                  <p key={i} className="mb-2">{line}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>
            );
          })}

          {/* End dot */}
          <div className="absolute left-6 sm:left-1/2 sm:-translate-x-1/2 bottom-0 z-10">
            <div className="w-4 h-4 rounded-full border-2 border-white/20" style={{ backgroundColor: condo.accentColor }} />
          </div>
        </div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="mt-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-lg font-bold mx-auto mb-3 text-white/30 border border-white/10">AR</div>
          <div className="text-xs text-white/20">Powered by APP REVISTA</div>
        </motion.div>
      </div>
    </div>
  );
}
