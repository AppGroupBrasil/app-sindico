import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ViewModeProps } from './types';
import SpecialSection from './SpecialSection';

export default function ScrollView({ edition, condo, sections, getCategoryInfo }: ViewModeProps) {
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const scrollToSection = (id: string) => {
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-0">

        {/* COVER */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="rounded-2xl shadow-2xl overflow-hidden mb-8 text-white"
          style={{ background: `linear-gradient(135deg, ${condo.themeColor}, ${condo.themeColor}dd)` }}>
          <div className="relative p-10 sm:p-14 flex flex-col items-center text-center" style={{ minHeight: '60vh' }}>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)'
            }} />
            <div className="relative flex items-center gap-3 mb-10">
              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold border-2 border-white/30">
                {condo.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </div>
              <div className="text-left">
                <div className="text-xs text-white/60 uppercase tracking-widest">Revista Digital</div>
                <div className="font-bold text-lg">{condo.name}</div>
              </div>
            </div>
            <div className="relative flex-1 flex flex-col items-center justify-center">
              <div className="inline-block px-4 py-1 rounded-full text-xs font-semibold mb-6 border border-white/30"
                style={{ backgroundColor: `${condo.accentColor}33` }}>
                Edição #{edition.editionNumber} · {edition.month} {edition.year}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">{edition.title}</h1>
              <p className="text-white/70 text-lg max-w-md mx-auto">Confira as novidades e tudo que aconteceu no seu condomínio</p>
            </div>
            <div className="relative w-full flex items-center justify-between text-xs text-white/50 pt-6 border-t border-white/10 mt-10">
              <div>📍 {condo.address}</div>
              <div>📞 {condo.phone}</div>
            </div>
          </div>
        </motion.div>

        {/* SUMMARY (sticky sidebar on desktop) */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-2" style={{ backgroundColor: condo.themeColor }}>
            <div className="text-center text-white text-xs font-medium py-1">Sumário</div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sections.map((section, idx) => {
                const cat = getCategoryInfo(section.categoryId);
                return (
                  <button key={section.id} onClick={() => scrollToSection(section.id)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#F8FAFC] transition-colors text-left group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: cat?.color || '#6366F1' }}>{idx + 1}</div>
                    <div className="min-w-0">
                      <div className="font-medium text-[#1E293B] text-sm truncate">{section.title}</div>
                      <div className="text-xs text-[#94A3B8]">{cat?.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* SECTIONS */}
        {sections.map((section, idx) => {
          const cat = getCategoryInfo(section.categoryId);
          return (
            <motion.div
              key={section.id}
              ref={el => { if (el) sectionRefs.current.set(section.id, el); }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
            >
              <div className="h-1.5" style={{ backgroundColor: cat?.color || '#6366F1' }} />
              <div className="p-6 sm:p-10">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: cat?.color || '#6366F1' }}>{idx + 1}</div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider" style={{ color: cat?.color }}>{cat?.name}</div>
                    <h2 className="text-2xl font-bold text-[#1E293B]">{section.title}</h2>
                  </div>
                </div>
                <div className="w-full h-px bg-[#E2E8F0] mb-5" />
                {section.images.length > 0 && (
                  <div className={`mb-5 gap-2 ${section.images.length === 1 ? 'flex' : 'grid grid-cols-2'}`}>
                    {section.images.map((img, i) => (
                      <div key={i} className={`relative rounded-xl overflow-hidden ${section.images.length === 1 ? 'w-full h-56' : 'h-40'}`}>
                        <img src={img} alt={`${section.title} - ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {section.richData ? (
                  <SpecialSection section={section} condo={condo} />
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {section.content.split('\n').map((line, i) => (
                      <p key={i} className="text-[#475569] leading-relaxed mb-3 text-base">{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* BACK COVER */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-2xl shadow-2xl overflow-hidden text-white text-center p-12 mb-8"
          style={{ background: `linear-gradient(135deg, ${condo.themeColor}, ${condo.themeColor}dd)` }}>
          <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold mb-4 mx-auto border-2 border-white/20">AR</div>
          <h2 className="text-2xl font-bold mb-2">Obrigado pela leitura!</h2>
          <p className="text-white/70 max-w-sm mx-auto mb-6">Esta revista foi criada com carinho pela administração do {condo.name}</p>
          <div className="space-y-1 text-sm text-white/60">
            <div>📍 {condo.address}</div>
            <div>📞 {condo.phone} · ✉ {condo.email}</div>
          </div>
          <div className="mt-8 pt-4 border-t border-white/10 text-xs text-white/40">
            Powered by <span className="font-semibold text-white/60">APP REVISTA</span> · www.apprevista.com.br
          </div>
        </motion.div>
      </div>
    </div>
  );
}
