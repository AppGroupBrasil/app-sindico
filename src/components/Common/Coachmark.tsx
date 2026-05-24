import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Balão de dica contextual ("coachmark").
 * Renderizado via portal em document.body, ancorado ao elemento pai
 * (que deve ter `position: relative`). Escapa de containers com
 * overflow:hidden / overflow:auto sem ser cortado.
 *
 * Uso:
 *   <div style={{ position: 'relative' }}>
 *     <button>Ocultar</button>
 *     <Coachmark id="sidebar-ocultar" mensagem="..." posicao="abaixo" />
 *   </div>
 */
interface CoachmarkProps {
  id: string;
  mensagem: string | React.ReactNode;
  posicao?: 'acima' | 'abaixo' | 'direita' | 'esquerda';
  largura?: number;
  cor?: string;
  /** Alinhamento ao longo do eixo perpendicular ao posicionamento. */
  alinhamento?: 'inicio' | 'centro' | 'fim';
  delayMs?: number;
  zIndex?: number;
}

const STORAGE_PREFIX = 'coachmark:';

export function dismissCoachmark(id: string) {
  try { localStorage.setItem(STORAGE_PREFIX + id, '1'); } catch { /* ignore */ }
}
export function resetCoachmark(id: string) {
  try { localStorage.removeItem(STORAGE_PREFIX + id); } catch { /* ignore */ }
}
export function resetAllCoachmarks() {
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(STORAGE_PREFIX)) localStorage.removeItem(k);
    });
  } catch { /* ignore */ }
}

const GAP = 10;        // distância do balão até o anchor
const ARROW = 7;       // tamanho da seta
const MARGIN = 8;      // margem mínima da borda da viewport

const Coachmark: React.FC<CoachmarkProps> = ({
  id,
  mensagem,
  posicao = 'abaixo',
  largura = 260,
  cor = '#2563eb',
  alinhamento = 'centro',
  delayMs = 250,
  zIndex = 9999,
}) => {
  const key = STORAGE_PREFIX + id;
  const [visivel, setVisivel] = useState(false);
  const [naoMostrarMais, setNaoMostrarMais] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; arrow: React.CSSProperties } | null>(null);

  // Sentinela invisível no DOM, usada apenas pra descobrir o pai (anchor).
  const sentinelRef = useRef<HTMLSpanElement | null>(null);
  const balloonRef = useRef<HTMLDivElement | null>(null);

  // Decide se vai aparecer
  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(key) === '1'; } catch { /* ignore */ }
    if (dismissed) return;
    const t = setTimeout(() => setVisivel(true), delayMs);
    return () => clearTimeout(t);
  }, [key, delayMs]);

  // Calcula posição relativa ao anchor (pai do sentinel)
  const reposicionar = () => {
    const sentinel = sentinelRef.current;
    const anchor = sentinel?.parentElement;
    const ball = balloonRef.current;
    if (!anchor || !ball) return;

    const rect = anchor.getBoundingClientRect();
    const bw = ball.offsetWidth || largura;
    const bh = ball.offsetHeight || 60;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = 0;
    let left = 0;
    const arrow: React.CSSProperties = { position: 'absolute', width: 0, height: 0, borderStyle: 'solid' };

    if (posicao === 'abaixo' || posicao === 'acima') {
      // top
      if (posicao === 'abaixo') top = rect.bottom + GAP;
      else top = rect.top - bh - GAP;

      // left
      let anchorX: number;
      if (alinhamento === 'inicio')      anchorX = rect.left;
      else if (alinhamento === 'fim')    anchorX = rect.right - bw;
      else                                anchorX = rect.left + rect.width / 2 - bw / 2;

      // clamp horizontal
      left = Math.max(MARGIN, Math.min(anchorX, vw - bw - MARGIN));

      // seta apontando para o centro do anchor (mas limitada ao corpo do balão)
      const anchorCenterX = rect.left + rect.width / 2;
      const arrowLeft = Math.max(12, Math.min(bw - 12, anchorCenterX - left));
      arrow.left = arrowLeft - ARROW;
      if (posicao === 'abaixo') {
        arrow.top = -ARROW;
        arrow.borderWidth = `0 ${ARROW}px ${ARROW}px ${ARROW}px`;
        arrow.borderColor = `transparent transparent ${cor} transparent`;
      } else {
        arrow.bottom = -ARROW;
        arrow.borderWidth = `${ARROW}px ${ARROW}px 0 ${ARROW}px`;
        arrow.borderColor = `${cor} transparent transparent transparent`;
      }
    } else {
      // direita / esquerda
      if (posicao === 'direita') left = rect.right + GAP;
      else left = rect.left - bw - GAP;

      let anchorY: number;
      if (alinhamento === 'inicio')   anchorY = rect.top;
      else if (alinhamento === 'fim') anchorY = rect.bottom - bh;
      else                            anchorY = rect.top + rect.height / 2 - bh / 2;
      top = Math.max(MARGIN, Math.min(anchorY, vh - bh - MARGIN));
      left = Math.max(MARGIN, Math.min(left, vw - bw - MARGIN));

      const anchorCenterY = rect.top + rect.height / 2;
      const arrowTop = Math.max(12, Math.min(bh - 12, anchorCenterY - top));
      arrow.top = arrowTop - ARROW;
      if (posicao === 'direita') {
        arrow.left = -ARROW;
        arrow.borderWidth = `${ARROW}px ${ARROW}px ${ARROW}px 0`;
        arrow.borderColor = `transparent ${cor} transparent transparent`;
      } else {
        arrow.right = -ARROW;
        arrow.borderWidth = `${ARROW}px 0 ${ARROW}px ${ARROW}px`;
        arrow.borderColor = `transparent transparent transparent ${cor}`;
      }
    }

    setCoords({ top, left, arrow });
  };

  useLayoutEffect(() => {
    if (!visivel) return;
    // pequena espera para o balão renderizar e termos offsetWidth real
    const raf = requestAnimationFrame(reposicionar);
    const onResize = () => reposicionar();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel, posicao, alinhamento, largura]);

  // Sentinela sempre presente pra descobrir o anchor; balão só quando visivel.
  return (
    <>
      <span ref={sentinelRef} style={{ display: 'none' }} aria-hidden />
      {visivel && createPortal(
        <div
          ref={balloonRef}
          role="dialog"
          aria-label="Dica"
          style={{
            position: 'fixed',
            top: coords?.top ?? -9999,
            left: coords?.left ?? -9999,
            width: largura,
            maxWidth: `calc(100vw - ${MARGIN * 2}px)`,
            background: cor,
            color: '#ffffff',
            borderRadius: 12,
            padding: '12px 14px',
            boxShadow: '0 10px 30px rgba(15,23,42,0.25)',
            fontSize: 13,
            lineHeight: 1.45,
            zIndex,
            animation: 'coachmarkPulse 1.8s ease-in-out infinite',
            visibility: coords ? 'visible' : 'hidden',
          }}
        >
          <style>{`
            @keyframes coachmarkPulse {
              0%, 100% { box-shadow: 0 10px 30px rgba(15,23,42,0.25), 0 0 0 0 rgba(255,255,255,0.6); }
              50%      { box-shadow: 0 10px 30px rgba(15,23,42,0.25), 0 0 0 6px rgba(255,255,255,0); }
            }
          `}</style>

          {coords && <span style={coords.arrow} aria-hidden />}

          <button
            onClick={() => { if (naoMostrarMais) dismissCoachmark(id); setVisivel(false); }}
            aria-label="Fechar"
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(255,255,255,0.15)', color: '#fff', border: 0,
              borderRadius: 6, padding: 3, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={13} />
          </button>

          <div style={{ paddingRight: 18, fontWeight: 500 }}>{mensagem}</div>

          <label style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
            fontSize: 11, color: 'rgba(255,255,255,0.95)',
            cursor: 'pointer', userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={naoMostrarMais}
              onChange={e => setNaoMostrarMais(e.target.checked)}
              style={{ width: 14, height: 14, accentColor: '#ffffff', cursor: 'pointer' }}
            />
            Não ver mais esta mensagem
          </label>
        </div>,
        document.body
      )}
    </>
  );
};

export default Coachmark;
