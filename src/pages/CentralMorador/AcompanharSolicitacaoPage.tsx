import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { central } from '../../services/api';
import styles from './CentralMoradorPage.module.css';

const STATUS_LABEL: Record<string, { label: string; cor: string; bg: string }> = {
  aberto: { label: 'Aberto', cor: '#1E40AF', bg: '#dbeafe' },
  em_analise: { label: 'Em execução', cor: '#92400e', bg: '#fef3c7' },
  resolvido: { label: 'Finalizado', cor: '#166534', bg: '#dcfce7' },
};

const AcompanharSolicitacaoPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [r, setR] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resposta, setResposta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const carregar = async () => {
    try { setR(await central.getProtocolo(token!)); }
    catch { setR(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); const iv = setInterval(carregar, 15000); return () => clearInterval(iv); }, [token]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [r?.mensagens?.length]);

  const enviar = async () => {
    if (!resposta.trim()) return;
    setEnviando(true);
    try {
      await central.responderMorador(token!, { texto: resposta, nome: r?.nome_morador });
      setResposta('');
      carregar();
    } catch (e: any) { alert(e.message); }
    finally { setEnviando(false); }
  };

  const encerrar = async () => {
    if (!confirm('Tem certeza que deseja encerrar esta solicitação?')) return;
    try { await central.encerrar(token!); carregar(); }
    catch (e: any) { alert(e.message); }
  };

  if (loading) return <div className={styles.page}>Carregando...</div>;
  if (!r) return <div className={styles.page}><div className={styles.container}>Solicitação não encontrada.</div></div>;

  const st = STATUS_LABEL[r.status] || STATUS_LABEL.aberto;

  return (
    <div className={styles.page}>
      <div className={styles.container} style={{ maxWidth: 720 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>Protocolo</div>
            <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: st.bg, color: st.cor }}>{st.label}</span>
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#0D47A1', letterSpacing: 2 }}>{r.protocolo}</div>
          <div style={{ marginTop: 10, color: '#475569', fontSize: 14, whiteSpace: 'pre-wrap' }}>{r.descricao}</div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          {(r.mensagens || []).length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>Aguardando resposta do síndico…</div>
          ) : (
            (r.mensagens || []).map((m: any) => (
              <div key={m.id} style={{
                display: 'flex',
                justifyContent: m.autor_tipo === 'morador' ? 'flex-end' : 'flex-start',
                marginBottom: 10,
              }}>
                <div style={{
                  maxWidth: '78%',
                  background: m.autor_tipo === 'morador' ? '#dcfce7' : '#dbeafe',
                  padding: '10px 14px',
                  borderRadius: 14,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    {m.autor_nome || (m.autor_tipo === 'morador' ? 'Você' : 'Síndico')}
                  </div>
                  <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{m.texto}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'right' }}>
                    {new Date(m.criado_em).toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
          <textarea
            value={resposta}
            onChange={e => setResposta(e.target.value)}
            placeholder="Responder..."
            style={{ width: '100%', padding: 12, border: '1.5px solid #cbd5e1', borderRadius: 10, minHeight: 70, fontFamily: 'inherit', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button onClick={encerrar} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '10px 16px', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
              ✓ Encerrar solicitação
            </button>
            <button onClick={enviar} disabled={enviando || !resposta.trim()} className={styles.btnPrimary}>
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcompanharSolicitacaoPage;
