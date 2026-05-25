import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, BookOpen, ScrollText, Layers } from 'lucide-react';
import { revistas as revistasApi, condominios as condominiosApi } from '../../services/api';
import { categories } from './data/categories';
import styles from './RevistaPage.module.css';

interface Pagina { id: string; categoria: string; ordem: number; titulo: string; texto: string; fotos: string[]; }
interface Revista { id: string; titulo: string; subtitulo: string | null; capa_url: string | null; cor_capa: string; efeitos: string[]; paginas: Pagina[]; }
type Modo = 'stories' | 'scroll' | 'elegante';

const RevistaPage: React.FC = () => {
  const [revista, setRevista] = useState<Revista | null>(null);
  const [loading, setLoading] = useState(true);
  const [modo, setModo] = useState<Modo>('elegante');

  useEffect(() => {
    (async () => {
      try {
        const conds = await condominiosApi.list();
        const first = (conds as any[])[0];
        if (first) setRevista(await revistasApi.getByCondominio(first.id));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className={styles.center}>Carregando revista...</div>;
  if (!revista) return <div className={styles.center}>Revista não encontrada.</div>;

  return (
    <div className={styles.viewer}>
      <div className={styles.modeBar}>
        <button className={`${styles.modeBtn} ${modo === 'elegante' ? styles.active : ''}`} onClick={() => setModo('elegante')}>
          <BookOpen size={16} /> Folhear
        </button>
        <button className={`${styles.modeBtn} ${modo === 'scroll' ? styles.active : ''}`} onClick={() => setModo('scroll')}>
          <ScrollText size={16} /> Rolagem
        </button>
        <button className={`${styles.modeBtn} ${modo === 'stories' ? styles.active : ''}`} onClick={() => setModo('stories')}>
          <Layers size={16} /> Stories
        </button>
      </div>

      {modo === 'elegante' && <EleganteView revista={revista} />}
      {modo === 'scroll' && <ScrollView revista={revista} />}
      {modo === 'stories' && <StoriesView revista={revista} />}
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

export default RevistaPage;
