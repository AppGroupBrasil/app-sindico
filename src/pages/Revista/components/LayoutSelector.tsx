import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ViewMode, viewModeLabels, ThemePreset, themePresets } from './types';

interface LayoutSelectorProps {
  currentMode: ViewMode;
  currentTheme: ThemePreset;
  onSelectMode: (mode: ViewMode) => void;
  onSelectTheme: (theme: ThemePreset) => void;
  onClose: () => void;
}

// Mini-preview mockups for each layout
function LayoutMiniPreview({ mode, theme }: { mode: ViewMode; theme: ThemePreset }) {
  const base = 'rounded-sm';
  const bar = `${base} bg-current opacity-30`;
  const block = `${base} bg-current opacity-15`;

  const previews: Record<ViewMode, React.ReactNode> = {
    flip: (
      <div className="flex items-center justify-center h-full">
        <div className="w-[55%] h-[80%] rounded-md border-2 border-current/20 flex flex-col p-2 gap-1" style={{ backgroundColor: `${theme.themeColor}11` }}>
          <div className={`h-2 w-3/4 ${bar}`} />
          <div className={`flex-1 ${block}`} />
          <div className={`h-1 w-1/2 ${bar}`} />
        </div>
      </div>
    ),
    scroll: (
      <div className="flex flex-col h-full p-1.5 gap-1 overflow-hidden">
        <div className={`h-6 w-full rounded-md ${block}`} />
        <div className={`h-1.5 w-2/3 ${bar}`} />
        <div className={`h-1 w-full ${bar}`} />
        <div className={`h-1 w-4/5 ${bar}`} />
        <div className={`h-4 w-full rounded-md ${block}`} />
        <div className={`h-1.5 w-1/2 ${bar}`} />
        <div className={`h-1 w-full ${bar}`} />
      </div>
    ),
    grid: (
      <div className="grid grid-cols-2 gap-1 h-full p-1.5">
        {[0,1,2,3].map(i => (
          <div key={i} className={`rounded-md ${block} flex flex-col justify-end p-1`}>
            <div className={`h-0.5 w-2/3 ${bar}`} />
          </div>
        ))}
      </div>
    ),
    stories: (
      <div className="flex items-center justify-center h-full">
        <div className="w-[50%] h-[85%] rounded-lg border-2 border-current/20 flex flex-col" style={{ backgroundColor: `${theme.themeColor}11` }}>
          <div className="flex gap-px p-1">
            {[0,1,2,3].map(i => <div key={i} className={`h-0.5 flex-1 rounded-full ${bar}`} />)}
          </div>
          <div className={`flex-1 ${block} mx-1 mb-1 rounded-md`} />
        </div>
      </div>
    ),
    newspaper: (
      <div className="flex flex-col h-full p-1.5 gap-0.5" style={{ fontFamily: 'serif' }}>
        <div className={`h-1.5 w-full ${bar} mx-auto`} />
        <div className="border-b border-current/10 mb-0.5" />
        <div className="flex gap-1 flex-1">
          <div className="flex-1 flex flex-col gap-0.5">
            <div className={`h-5 ${block} rounded-sm`} />
            <div className={`h-0.5 w-full ${bar}`} />
            <div className={`h-0.5 w-3/4 ${bar}`} />
          </div>
          <div className="flex-1 flex flex-col gap-0.5">
            <div className={`h-1 w-full ${bar}`} />
            <div className={`h-0.5 w-full ${bar}`} />
            <div className={`h-3 ${block} rounded-sm`} />
            <div className={`h-0.5 w-2/3 ${bar}`} />
          </div>
        </div>
      </div>
    ),
    slides: (
      <div className="flex items-center justify-center h-full">
        <div className="w-[80%] aspect-[16/9] rounded-md border-2 border-current/20 flex items-center px-2" style={{ backgroundColor: `${theme.themeColor}11` }}>
          <div className="flex-1 flex flex-col gap-0.5">
            <div className={`h-1.5 w-2/3 ${bar}`} />
            <div className={`h-0.5 w-full ${bar}`} />
            <div className={`h-0.5 w-1/2 ${bar}`} />
          </div>
          <div className={`w-1/3 h-[70%] ml-1 rounded-sm ${block}`} />
        </div>
      </div>
    ),
    timeline: (
      <div className="flex flex-col h-full p-1.5 relative">
        <div className="absolute left-3 top-1 bottom-1 w-px bg-current/15" />
        {[0,1,2].map(i => (
          <div key={i} className="flex items-start gap-1 mb-1.5 ml-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-current/30 mt-0.5 flex-shrink-0" />
            <div className={`flex-1 ${block} rounded-md p-1 h-5`}>
              <div className={`h-0.5 w-2/3 ${bar}`} />
            </div>
          </div>
        ))}
      </div>
    ),
    elegante: (
      <div className="flex flex-col h-full items-center justify-center text-center p-2 gap-1">
        <div className="w-4 h-px bg-current/20" />
        <div className={`h-1.5 w-2/3 ${bar}`} />
        <div className="w-3 h-px bg-current/20" />
        <div className={`h-0.5 w-1/2 ${bar}`} />
        <div className={`h-4 w-full ${block} rounded-sm mt-1`} />
        <div className={`h-0.5 w-full ${bar}`} />
        <div className={`h-0.5 w-3/4 ${bar}`} />
      </div>
    ),
  };

  return <>{previews[mode]}</>;
}

export default function LayoutSelector({ currentMode, currentTheme, onSelectMode, onSelectTheme, onClose }: LayoutSelectorProps) {
  const [tab, setTab] = useState<'layouts' | 'temas'>('layouts');
  const modes: ViewMode[] = ['flip', 'scroll', 'grid', 'stories', 'newspaper', 'slides', 'timeline', 'elegante'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#0F172A] rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">Personalizar Revista</h2>
            <p className="text-xs text-white/40 mt-0.5">Escolha o layout e o tema de cores</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mx-6 p-1 bg-white/5 rounded-xl border border-white/5">
          {(['layouts', 'temas'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}>
              {t === 'layouts' ? '🎨 Layouts (8)' : '🎭 Temas de Cores (8)'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <AnimatePresence mode="wait">
            {tab === 'layouts' ? (
              <motion.div key="layouts" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {modes.map((mode, idx) => {
                  const info = viewModeLabels[mode];
                  const isActive = currentMode === mode;
                  return (
                    <motion.button
                      key={mode}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => onSelectMode(mode)}
                      className={`relative flex flex-col rounded-xl border overflow-hidden transition-all group ${isActive
                        ? 'border-white/30 bg-white/10 ring-2 ring-white/20 shadow-lg'
                        : 'border-white/5 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10'
                      }`}
                    >
                      {/* Active badge */}
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                          style={{ backgroundColor: currentTheme.accentColor }}>
                          ✓
                        </div>
                      )}

                      {/* Preview */}
                      <div className="h-24 sm:h-28 w-full relative" style={{ color: currentTheme.themeColor }}>
                        <LayoutMiniPreview mode={mode} theme={currentTheme} />
                      </div>

                      {/* Label */}
                      <div className="px-2.5 py-2.5 border-t border-white/5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{info.icon}</span>
                          <span className="text-[11px] font-bold text-white/90 truncate">{info.label}</span>
                        </div>
                        <p className="text-[9px] text-white/35 leading-tight line-clamp-2">{info.description}</p>
                        <div className="mt-1.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/5 text-white/25 inline-block">
                          {info.style}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div key="temas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themePresets.map((preset, idx) => {
                  const isActive = currentTheme.id === preset.id;
                  return (
                    <motion.button
                      key={preset.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => onSelectTheme(preset)}
                      className={`relative flex flex-col rounded-xl border overflow-hidden transition-all ${isActive
                        ? 'border-white/30 ring-2 ring-white/20 shadow-lg'
                        : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}

                      {/* Color swatches */}
                      <div className="h-20 relative overflow-hidden" style={{ background: preset.bgGradient }}>
                        <div className="absolute inset-0 flex items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full shadow-lg border-2 border-white/20" style={{ backgroundColor: preset.themeColor }} />
                          <div className="w-7 h-7 rounded-full shadow-lg border-2 border-white/20 -ml-3" style={{ backgroundColor: preset.accentColor }} />
                        </div>
                        {/* Card preview */}
                        <div className="absolute bottom-1 left-1 right-1 h-5 rounded-t-md flex items-center px-2"
                          style={{ backgroundColor: preset.cardBg }}>
                          <div className="h-1 w-8 rounded-full" style={{ backgroundColor: preset.textPrimary, opacity: 0.3 }} />
                        </div>
                      </div>

                      {/* Name */}
                      <div className="px-2.5 py-2 border-t border-white/5 bg-white/[0.03]">
                        <div className="text-[11px] font-bold text-white/90">{preset.name}</div>
                        <div className="flex gap-1 mt-1">
                          {[preset.themeColor, preset.accentColor, preset.textPrimary, preset.textSecondary].map((c, i) => (
                            <div key={i} className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with current selection */}
        <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span className="text-sm">{viewModeLabels[currentMode].icon}</span>
              <span className="font-medium text-white/60">{viewModeLabels[currentMode].label}</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: currentTheme.themeColor }} />
              <span className="text-xs text-white/40">{currentTheme.name}</span>
            </div>
          </div>
          <button onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-bold text-white transition-all hover:brightness-110"
            style={{ backgroundColor: currentTheme.themeColor }}>
            Aplicar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
