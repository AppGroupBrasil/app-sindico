import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './revista.css';
import { demoCondominium, demoEdition } from './data/demo';
import { categories } from './data/categories';
import { Category } from './types';
import { ViewMode, viewModeLabels, ThemePreset, themePresets } from './components/types';
import FlipView from './components/FlipView';
import ScrollView from './components/ScrollView';
import GridView from './components/GridView';
import StoriesView from './components/StoriesView';
import NewspaperView from './components/NewspaperView';
import SlidesView from './components/SlidesView';
import TimelineView from './components/TimelineView';
import EleganteView from './components/EleganteView';
import LayoutSelector from './components/LayoutSelector';
import { loadDemoClassifieds, mergeClassifiedSection } from './data/demoClassifieds';
import type { DemoClassifiedSubmission } from './data/demoClassifieds';
import { tarefas as tarefasApi, solicitacoes as solicitacoesApi } from '../../services/api';

export default function RevistaPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('stories');
  const [showSelector, setShowSelector] = useState(false);
  const [theme, setTheme] = useState<ThemePreset>(themePresets[0]);
  const [demoClassifieds, setDemoClassifieds] = useState<DemoClassifiedSubmission[]>([]);
  const [execucoes, setExecucoes] = useState<any[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);

  useEffect(() => {
    setDemoClassifieds(loadDemoClassifieds());

    // Buscar dados reais para seções especiais
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    tarefasApi.allExecucoes().then((data: any[]) => {
      const concluidas = data.filter((e: any) => {
        if (e.status !== 'concluida' && e.status !== 'concluído') return false;
        const d = new Date(e.data_execucao || e.dataExecucao);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
      });
      setExecucoes(concluidas);
    }).catch(() => {});

    solicitacoesApi.list().then((data: any[]) => {
      const resolvidas = data.filter((s: any) => {
        if (s.status !== 'resolvida' && s.status !== 'resolvido') return false;
        const d = new Date(s.respondido_em || s.respondidoEm);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
      });
      setSolicitacoes(resolvidas);
    }).catch(() => {});
  }, []);

  const condo = {
    ...demoCondominium,
    themeColor: theme.themeColor,
    accentColor: theme.accentColor,
  };

  const edition = demoEdition;

  const sections = useMemo(() => {
    // Calcular tempo médio de resolução
    const tempoMedioMs = solicitacoes.reduce((acc, s) => {
      if (!s.criado_em || !s.respondido_em) return acc;
      return acc + (new Date(s.respondido_em).getTime() - new Date(s.criado_em).getTime());
    }, 0);
    const tempoMedioHs = solicitacoes.length ? Math.round(tempoMedioMs / solicitacoes.length / 3600000) : 0;
    const tempoMedioStr = tempoMedioHs < 24
      ? `${tempoMedioHs}h`
      : `${Math.round(tempoMedioHs / 24)} dias`;

    return edition.sections
      .filter(s => s.visible)
      .map((section) => {
        if (section.categoryId === 'classificados') {
          return mergeClassifiedSection(section, demoClassifieds);
        }
        if (section.categoryId === 'equipe-em-acao') {
          return {
            ...section,
            richData: {
              type: 'equipe-em-acao' as const,
              items: execucoes,
            },
          };
        }
        if (section.categoryId === 'moradores-atendidos') {
          return {
            ...section,
            richData: {
              type: 'moradores-atendidos' as const,
              items: solicitacoes,
              resumo: {
                tempoMedio: solicitacoes.length ? tempoMedioStr : undefined,
                satisfacao: '94%',
              },
            },
          };
        }
        return section;
      });
  }, [demoClassifieds, execucoes, solicitacoes]);

  const getCategoryInfo = (catId: string): Category | undefined =>
    categories.find(c => c.id === catId);

  const viewProps = { edition, condo, sections, categories, getCategoryInfo };

  const modes: ViewMode[] = ['flip', 'scroll', 'grid', 'stories', 'newspaper', 'slides', 'timeline', 'elegante'];

  return (
    <div className="revista-root min-h-screen flex flex-col" style={{ background: theme.bgGradient }}>
      {/* Top Bar */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/5 px-4 sm:px-6 py-3">
        {/* Linha 1: Voltar + Personalizar + Painel */}
        <div className="flex items-center mb-2">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-black hover:text-black/70 transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Voltar
          </button>
          <div className="flex items-center gap-2 flex-1 justify-center">
            <button onClick={() => setShowSelector(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs">
              <span>🎨</span>
              <span>Personalizar</span>
            </button>
            <button onClick={() => navigate('/revista/painel')}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all text-xs whitespace-nowrap">
              ⚙ Painel
            </button>
          </div>
        </div>
        {/* Linha 2: View Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl flex-wrap justify-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {modes.map(mode => {
            const info = viewModeLabels[mode];
            const active = viewMode === mode;
            return (
              <button key={mode} onClick={() => setViewMode(mode)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: active ? `${condo.accentColor}33` : 'transparent',
                  border: active ? `1px solid ${condo.accentColor}55` : '1px solid transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
                title={info.label}>
                <span className="relative text-sm">{info.icon}</span>
                <span className="relative">{info.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'flip' && <FlipView {...viewProps} />}
      {viewMode === 'scroll' && <ScrollView {...viewProps} />}
      {viewMode === 'grid' && <GridView {...viewProps} />}
      {viewMode === 'stories' && <StoriesView {...viewProps} />}
      {viewMode === 'newspaper' && <NewspaperView {...viewProps} />}
      {viewMode === 'slides' && <SlidesView {...viewProps} />}
      {viewMode === 'timeline' && <TimelineView {...viewProps} />}
      {viewMode === 'elegante' && <EleganteView {...viewProps} />}

      {/* Layout Selector Modal */}
      <AnimatePresence>
        {showSelector && (
          <LayoutSelector
            currentMode={viewMode}
            currentTheme={theme}
            onSelectMode={setViewMode}
            onSelectTheme={setTheme}
            onClose={() => setShowSelector(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
