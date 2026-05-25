import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Pause, BookOpen, ScrollText, Layers } from 'lucide-react';
import { revistas as revistasApi, condominios as condominiosApi } from '../../services/api';
import { categories } from './data/categories';
import { demoRevista } from './data/demoRevista';
import styles from './RevistaPage.module.css';

interface Pagina { id: string; categoria: string; ordem: number; titulo: string; texto: string; fotos: string[]; }
interface Revista { id: string; titulo: string; subtitulo: string | null; capa_url: string | null; cor_capa: string; efeitos: string[]; paginas: Pagina[]; }
type Modo = 'classica' | 'scroll' | 'mosaico' | 'stories' | 'jornal' | 'apresentacao' | 'timeline' | 'elegante';

const MODOS: { id: Modo; label: string; icon: string }[] = [
  { id: 'classica', label: 'Revista Clássica', icon: '📖' },
  { id: 'scroll', label: 'Rolagem Elegante', icon: '📜' },
  { id: 'mosaico', label: 'Mosaico de Cards', icon: '🃏' },
  { id: 'stories', label: 'Stories', icon: '📱' },
  { id: 'jornal', label: 'Jornal', icon: '📰' },
  { id: 'apresentacao', label: 'Apresentação', icon: '🎴' },
  { id: 'timeline', label: 'Linha do Tempo', icon: '📋' },
  { id: 'elegante', label: 'Editorial Premium', icon: '🖼️' },
];

const RevistaPage: React.FC = () => {
  const [params] = useSearchParams();
  const { slug } = useParams<{ slug?: string }>();
  const isDemo = params.get('demo') === '1';
  const [revista, setRevista] = useState<Revista | null>(isDemo ? (demoRevista as Revista) : null);
  const [loading, setLoading] = useState(!isDemo);
  const [modo, setModo] = useState<Modo>('elegante');

  useEffect(() => {
    if (isDemo) return;
    (async () => {
      try {
        if (slug) {
          setRevista(await revistasApi.getPublic(slug));
        } else {
          const conds = await condominiosApi.list();
          const first = (conds as any[])[0];
          if (first) setRevista(await revistasApi.getByCondominio(first.id));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [isDemo, slug]);

  if (loading) return <div className={styles.center}>Carregando revista...</div>;
  if (!revista) return <div className={styles.center}>Revista não encontrada.</div>;

  return (
    <div className={styles.viewer}>
      {isDemo && (
        <div className={styles.demoBadge}>
          🎬 Você está vendo uma <strong>revista de demonstração</strong> — explore os 3 modos abaixo
        </div>
      )}
      <div className={styles.modeBar}>
        {MODOS.map(m => (
          <button key={m.id} className={`${styles.modeBtn} ${modo === m.id ? styles.active : ''}`} onClick={() => setModo(m.id)}>
            <span style={{ fontSize: 16 }}>{m.icon}</span> {m.label}
          </button>
        ))}
      </div>

      {modo === 'classica' && <ClassicaView revista={revista} />}
      {modo === 'scroll' && <ScrollView revista={revista} />}
      {modo === 'mosaico' && <MosaicoView revista={revista} />}
      {modo === 'stories' && <StoriesView revista={revista} />}
      {modo === 'jornal' && <JornalView revista={revista} />}
      {modo === 'apresentacao' && <ApresentacaoView revista={revista} />}
      {modo === 'timeline' && <TimelineView revista={revista} />}
      {modo === 'elegante' && <EleganteView revista={revista} />}
    </div>
  );
};

const EleganteView: React.FC<{ revista: Revista }> = ({ revista }) => {
  const [idx, setIdx] = useState(-1);
  const total = revista.paginas.length;
  return (
    <div className={styles.eleganteWrap}>
      <div className={styles.elegantePage}>
        {idx === -1 ? <Capa revista={revista} /> : <PaginaContent pagina={revista.paginas[idx]} />}
      </div>
      <div className={styles.eleganteNav}>
        <button onClick={() => setIdx(i => Math.max(-1, i - 1))} disabled={idx === -1} className={styles.navArrow}>
          <ChevronLeft size={22} />
        </button>
        <div className={styles.eleganteCount}>
          {idx === -1 ? 'Capa' : `${idx + 1} / ${total}`}
        </div>
        <button onClick={() => setIdx(i => Math.min(total - 1, i + 1))} disabled={idx === total - 1} className={styles.navArrow}>
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
};

const ScrollView: React.FC<{ revista: Revista }> = ({ revista }) => (
  <div className={styles.scrollWrap}>
    <div className={styles.scrollItem}><Capa revista={revista} /></div>
    {revista.paginas.map(p => (
      <div key={p.id} className={styles.scrollItem}><PaginaContent pagina={p} /></div>
    ))}
  </div>
);

const StoriesView: React.FC<{ revista: Revista }> = ({ revista }) => {
  const itens = [{ kind: 'capa' as const }, ...revista.paginas.map(p => ({ kind: 'pagina' as const, p }))];
  const [idx, setIdx] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [pausado, setPausado] = useState(false);
  const DURACAO = 7000;
  const TICK = 60;
  const timerRef = useRef<number | null>(null);

  const proximo = useCallback(() => {
    setIdx(i => Math.min(itens.length - 1, i + 1));
    setProgresso(0);
  }, [itens.length]);
  const anterior = useCallback(() => {
    setIdx(i => Math.max(0, i - 1));
    setProgresso(0);
  }, []);

  useEffect(() => {
    if (pausado) return;
    timerRef.current = window.setInterval(() => {
      setProgresso(p => {
        const np = p + (TICK / DURACAO) * 100;
        if (np >= 100) { proximo(); return 0; }
        return np;
      });
    }, TICK);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pausado, idx, proximo]);

  const atual = itens[idx];
  return (
    <div className={styles.storiesWrap}>
      <div className={styles.storiesBars}>
        {itens.map((_, i) => (
          <div key={i} className={styles.barBg}>
            <div className={styles.barFill} style={{ width: i < idx ? '100%' : i === idx ? `${progresso}%` : '0%' }} />
          </div>
        ))}
      </div>
      <button onClick={() => setPausado(p => !p)} className={styles.storyPause}>
        {pausado ? <Play size={16} /> : <Pause size={16} />}
      </button>
      <div
        className={styles.storiesStage}
        onTouchStart={(e) => { (e.currentTarget as any)._x = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const start = (e.currentTarget as any)._x;
          const dx = e.changedTouches[0].clientX - start;
          if (dx < -40) proximo();
          else if (dx > 40) anterior();
        }}
      >
        <div className={styles.storyZoneLeft} onClick={anterior} />
        <div className={styles.storyZoneRight} onClick={proximo} />
        {atual.kind === 'capa'
          ? <Capa revista={revista} fullscreen />
          : <PaginaContent pagina={atual.p} fullscreen />}
      </div>
    </div>
  );
};

const Capa: React.FC<{ revista: Revista; fullscreen?: boolean }> = ({ revista, fullscreen }) => {
  const efeitos = revista.efeitos || [];
  const bg = revista.capa_url ? `url(${revista.capa_url}) center/cover no-repeat` : revista.cor_capa;
  return (
    <div className={`${styles.capa} ${fullscreen ? styles.capaFull : ''}`} style={{ background: bg }}>
      {efeitos.includes('faixa-topo') && (
        <div className={styles.faixaTopo} style={{ background: revista.cor_capa }} />
      )}
      <div className={styles.capaOverlay} style={{
        background: efeitos.includes('gradiente')
          ? 'linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0) 60%)'
          : efeitos.includes('filtro-escuro') ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.3)',
      }} />
      <div className={styles.capaContent}>
        <h1 className={styles.capaTitulo} style={{
          textShadow: efeitos.includes('sombra-titulo') ? '2px 3px 14px rgba(0,0,0,0.75)' : 'none',
          fontWeight: efeitos.includes('negrito-caps') ? 900 : 800,
          textTransform: efeitos.includes('negrito-caps') ? 'uppercase' : 'none',
          border: efeitos.includes('borda') ? '3px solid #fff' : 'none',
          padding: efeitos.includes('borda') ? '8px 14px' : 0,
          borderRadius: efeitos.includes('borda') ? 8 : 0,
          display: efeitos.includes('borda') ? 'inline-block' : 'block',
        }}>{revista.titulo}</h1>
        {revista.subtitulo && <p className={styles.capaSub}>{revista.subtitulo}</p>}
      </div>
    </div>
  );
};

const PaginaContent: React.FC<{ pagina: Pagina; fullscreen?: boolean }> = ({ pagina, fullscreen }) => {
  const cat = categories.find(c => c.id === pagina.categoria);
  return (
    <div className={`${styles.pagina} ${fullscreen ? styles.paginaFull : ''}`}>
      <div className={styles.paginaTag} style={{ background: cat?.color, color: '#fff' }}>{cat?.name || pagina.categoria}</div>
      {pagina.titulo && <h2 className={styles.paginaTitulo}>{pagina.titulo}</h2>}
      {pagina.fotos.length > 0 && (
        <div className={styles.paginaFotos}>
          {pagina.fotos.map((url, i) => <img key={i} src={url} alt="" />)}
        </div>
      )}
      {pagina.texto && <p className={styles.paginaTexto}>{pagina.texto}</p>}
    </div>
  );
};

/* ───── REVISTA CLÁSSICA (livro com 2 páginas lado a lado) ───── */
const ClassicaView: React.FC<{ revista: Revista }> = ({ revista }) => {
  const [spread, setSpread] = useState(0); // 0 = capa+pagina0 ; 1 = pagina1+pagina2 ; etc.
  // Spread 0: [capa, página 0]. Próximos: [2k-1, 2k]
  const totalSpreads = Math.ceil((revista.paginas.length + 1) / 2);
  const renderSlot = (idx: number) => {
    if (idx === 0) return <Capa revista={revista} />;
    const p = revista.paginas[idx - 1];
    return p ? <PaginaContent pagina={p} /> : <div className={styles.classicaBlank} />;
  };
  const leftIdx = spread === 0 ? 0 : spread * 2 - 1;
  const rightIdx = spread === 0 ? 1 : spread * 2;
  return (
    <div className={styles.classicaWrap}>
      <div className={styles.classicaBook}>
        <div className={styles.classicaPage}>{renderSlot(leftIdx)}</div>
        <div className={styles.classicaPage}>{renderSlot(rightIdx)}</div>
      </div>
      <div className={styles.eleganteNav}>
        <button onClick={() => setSpread(s => Math.max(0, s - 1))} disabled={spread === 0} className={styles.navArrow}><ChevronLeft size={22} /></button>
        <div className={styles.eleganteCount}>{spread + 1} / {totalSpreads}</div>
        <button onClick={() => setSpread(s => Math.min(totalSpreads - 1, s + 1))} disabled={spread === totalSpreads - 1} className={styles.navArrow}><ChevronRight size={22} /></button>
      </div>
    </div>
  );
};

/* ───── MOSAICO DE CARDS (grid clicável) ───── */
const MosaicoView: React.FC<{ revista: Revista }> = ({ revista }) => {
  const [aberta, setAberta] = useState<number | null>(null);
  if (aberta !== null) {
    return (
      <div className={styles.mosaicoOpen}>
        <button onClick={() => setAberta(null)} className={styles.navArrow} style={{ marginBottom: 14 }}><ChevronLeft size={22} /></button>
        <PaginaContent pagina={revista.paginas[aberta]} />
      </div>
    );
  }
  return (
    <div className={styles.mosaicoGrid}>
      <div className={styles.mosaicoCard} onClick={() => {}} style={{ background: revista.capa_url ? `url(${revista.capa_url}) center/cover` : revista.cor_capa }}>
        <div className={styles.mosaicoOverlay}>
          <div className={styles.mosaicoTitle}>{revista.titulo}</div>
          <div className={styles.mosaicoSub}>Capa</div>
        </div>
      </div>
      {revista.paginas.map((p, i) => {
        const cat = categories.find(c => c.id === p.categoria);
        const bg = p.fotos[0] ? `url(${p.fotos[0]}) center/cover` : cat?.color || '#1E88E5';
        return (
          <div key={p.id} className={styles.mosaicoCard} onClick={() => setAberta(i)} style={{ background: bg }}>
            <div className={styles.mosaicoOverlay}>
              <div className={styles.mosaicoSub}>{cat?.name}</div>
              <div className={styles.mosaicoTitle}>{p.titulo || `Página ${i + 1}`}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ───── JORNAL (colunas estilo jornal antigo) ───── */
const JornalView: React.FC<{ revista: Revista }> = ({ revista }) => (
  <div className={styles.jornalWrap}>
    <div className={styles.jornalHead}>
      <div className={styles.jornalMasthead}>{revista.titulo.toUpperCase()}</div>
      {revista.subtitulo && <div className={styles.jornalSub}>{revista.subtitulo}</div>}
      <div className={styles.jornalRule} />
    </div>
    <div className={styles.jornalCols}>
      {revista.paginas.map(p => {
        const cat = categories.find(c => c.id === p.categoria);
        return (
          <article key={p.id} className={styles.jornalArt}>
            <div className={styles.jornalCat} style={{ color: cat?.color }}>{cat?.name}</div>
            {p.titulo && <h3 className={styles.jornalTitulo}>{p.titulo}</h3>}
            {p.fotos[0] && <img src={p.fotos[0]} alt="" className={styles.jornalImg} />}
            {p.texto && <p className={styles.jornalTexto}>{p.texto}</p>}
          </article>
        );
      })}
    </div>
  </div>
);

/* ───── APRESENTAÇÃO (slides cinematográficos, 1 por vez, fundo escuro) ───── */
const ApresentacaoView: React.FC<{ revista: Revista }> = ({ revista }) => {
  const itens = [{ kind: 'capa' as const }, ...revista.paginas.map(p => ({ kind: 'pagina' as const, p }))];
  const [idx, setIdx] = useState(0);
  const total = itens.length;
  const atual = itens[idx];
  return (
    <div className={styles.apresWrap}>
      <div className={styles.apresStage}>
        {atual.kind === 'capa' ? <Capa revista={revista} /> : <PaginaContent pagina={atual.p} />}
      </div>
      <div className={styles.apresNav}>
        <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0} className={styles.navArrow}><ChevronLeft size={22} /></button>
        <div className={styles.eleganteCount}>Slide {idx + 1} de {total}</div>
        <button onClick={() => setIdx(i => Math.min(total - 1, i + 1))} disabled={idx === total - 1} className={styles.navArrow}><ChevronRight size={22} /></button>
      </div>
    </div>
  );
};

/* ───── LINHA DO TEMPO (timeline vertical) ───── */
const TimelineView: React.FC<{ revista: Revista }> = ({ revista }) => (
  <div className={styles.tlWrap}>
    <Capa revista={revista} />
    <div className={styles.tlLine}>
      {revista.paginas.map((p, i) => {
        const cat = categories.find(c => c.id === p.categoria);
        return (
          <div key={p.id} className={styles.tlItem}>
            <div className={styles.tlBullet} style={{ background: cat?.color || '#1E88E5' }}>{i + 1}</div>
            <div className={styles.tlCard}>
              <PaginaContent pagina={p} />
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default RevistaPage;
